# 前端异常监控系统实践

在看一些前端监控相关的文章时，经常看到评论中提到业界成熟的方案，没有必要自己造轮子。我这里做前端监控相关的研究，主要就是为了熟悉整个流程，本文记录了一些关键技术点，从异常采集、到上报、存储、查看的方案，内容较为跳跃，仅供参考。另外由于个人精力和水平制约，未实现分库分表、异常报警、错误分析定位等进阶功能。

整个采集系统技术方面分为采集SDK，展示平台、后端服务三部分，采集SDK使用Typescript开发，使用Rollup打包；日志相关服务使用Docker快速部署，后端使用Egg框架快速开发。

![image-20210314150012105](/Users/apsp/Library/Application Support/typora-user-images/image-20210314150012105.png)

## 数据采集SDK

数据采集部分，主要采集了异常信息，坏境信息，性能信息，和部分行为信息。

### 异常采集

#### 前端JS错误

JS的错误信息采集有`window.onerror ` 和 `window.addEventLisenter('error',function(){})`两种方法，`window.onerror`是一个标准的错误捕获接口，它可以拿到对应的JavaScript运行时错误。`window.onerror`只能订阅一个，后面的会覆盖前面的。

`window.onerror` 无法获取到资源加载失败的情况，资源加载error事件不会向上冒泡到window，需要使用 `window.addEventLisenter（'error'）`来捕获资源加载失败。

```javascript
window.onerror = fucntion(message, source, lineno, colno,error){ ... }
```

```javascript
window.addEventListener('error', function(errorEvent) {
    const { message, filename, lineno, colno, error } = errorEvent
    ...
}, true)
```

运行错误信息

| 属性            | 含义              | 说明                                               |
| --------------- | ----------------- | -------------------------------------------------- |
| message         | 错误信息          | 错误描述                                           |
| filename/source | 发生错误的脚本URL | `ErrorEvent`中是`filename`,在`onError`中是`source` |
| lineno          | 错误行            |                                                    |
| colno           | 发生错误的列号    |                                                    |
| error           | Error 对象        | `error.message error.stack` 是很重要的信息         |

js中常见的几种Error类型

- SyntaxError 语法错误

- Uncaught ReferenceError 引用错误

- RangeError 范围错误

- TypeError 类型错误

* URIError URL错误

* EvalError eval()函数执行错误

#### 资源加载错误

资源如`<img>` `<script>`等加载失败，如上所述，需要使用 window.addEventLisenter('error')，获取到 `errorEvent`。对于JS运行时错误，`errorEvent.target`指向window ，而对于资源加载错误，则指向相应的标签。通过taget的nodeName或tagName进行判断类型，可筛选或排除资源类型。

#### Promise异常捕获

onError和错误事件侦听，都无法获取`new Promise()` 里的报错，`.catch()`可以捕获到异常，但是需要每个Primise都添加.catch，理论上监控逻辑不应该侵入业务代码，可以将unhandledrejection抛出的错误再次抛出，就可以在addEventListener中捕获。

```javascript
// 打印e的内容，错误信息挂在reason上，包含message,stack
window.addEventListener("unhandledrejection", e => {
  throw e.reason
})
```

#### async/await异常捕获

async异常可以被上层try catch捕获，如果没有，就只能通过unhandledrejection事件捕获了。

#### 跨域JS错误

script 标签引入的跨域脚本，如果出现异常，window 下的 error 事件都只能得到 `Script error`，没有详细的错误信息，这里有两种解决方案。

1. 使用 crossOrigin 

   给`<script>`标签添加crossorigin属性， 并在服务器端设置 `Access-Control-Allow-Origins`响应头，允许脚本被跨域访问，
    就可以获取更详细的日志信息。

   | crossorigin属性的取值 |                                                              |      |
   | --------------------- | ------------------------------------------------------------ | ---- |
   | anonymous             | 依赖CROS，不带cookie，当AS设置不等于origin或不是*时，js不加载 |      |
   | use-credentials       | 需要`Access-Control-Allow-Credentials` 返回 true，此时浏览器`Access-Control-Allow-Origins:domian.com`必须设置具体域名，不支持通配符*，AC不等于origin时js不再加载 |      |

    如果给 <script> 标签添加了`crossorigin`属性，但是服务器端没有设置`Access-Control-Allow-Origins`，则会报跨域错误。

2. `try...catch`

   该方案的弊端是需要包裹，只适合于被监控应用使用自定义上报方法主动上报。并且在 `try` 中发生的错误，浏览器不会把错误打在 `console` 里，也不会触发 `error` 事件，需要在 `catch` 里，把错误打在 `console.error` 里面，并手动包装 `ErrorEvent`，丢给 `window` 下的 `error` 事件捕获。
   
   ```js
   try {
       JSON.stringify(apiData)
   } catch (error) {
       console.error(error)
       if (ErrorEvent) {
           window.dispatchEvent(new ErrorEvent('error', { error, message: error.message })) // 这里也会触发window.onerror
       } else {
           window.onerror && window.onerror(null, null, null, null, error)
       }
   }
   ```

#### 数据接口异常

数据接口常见异常，一是由于接口不可用导致前端出现问题，二数据字段导致缺失导致出现的JS错误，第二种错误往往可以在`error`中捕获的到，而对于数据接口的状态，基于`XMLHttpRequest`发起的数据请求，可以使用面向切片编程，劫持原型链上的方法，获取`xhr`实例，绑定事件监听。

```js
const orignalEvents = [
    'abort',
    'error',
    'load',
    'timeout',
    'onreadystatechange',
  ]
const method = 'open'
const originalXhrProto = window.XMLHttpRequest.prototype
const original = originalXhrProto[method]
 originalXhrProto[method] = function (...args) {
    // 获取xhr实例  绑定事件
    const xhr = this
    orignalEvents.forEach((eType) => {
      xhr.addEventListener(eType, function (e) {
        // ...
      })
    })
    original.apply(this, args)
  }
```

#### Vue异常

对于Vue中发生的异常，需要利用vue提供的handleError，一旦Vue发生异常都会调用这个方法。

```js
Vue.config.errorHandler = function (err, vm, info) {
  console.log('errorHandle:', err)
}
```

同样我们使用面向切片编程的方式，对`errorHandler`进行劫持。

```js
export function listenVueError(_Vue): void {
  if (!_Vue || !_Vue.config) {
    return
  }
  const oldErrorHandler = _Vue.config.errorHandler
  _Vue.config.errorHandler = function (err, vm, info) {
    console.log(err, vm, info)
    // errorHandler方法自己又报错了生产环境下会使用 console.error 在控制台中输出
    // 继续抛出到控制台
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error(err)
    }
    eventEmitter.emit(LISTEN_EVENTS.VUE,err)
    if (typeof oldErrorHandler === 'function') {
      oldErrorHandler.call(this, err, vm, info)
    }
  }
}
```

另外还有涉及小程序、`React`、`ReactNative` 、`console`中一些异常捕获方案，需要在被监控端添加少量代码，未在SDK中验证，不再详细列出。

| 异常类型           | 同步方法 | 异步方法 | 资源加载 | Promise | async/await |
| ------------------ | -------- | -------- | -------- | ------- | ----------- |
| try/catch          | √        |          |          |         | √           |
| onerror            | √        | √        |          |         |             |
| error事件监听      | √        | √        | √        |         |             |
| unhandledrejection |          |          |          | √       | √           |

### 性能采集

#### performance

性能采集，首先是收集`window.performance.timing`，以下是部分指标的计算。

```js
// 测试输出
function calculateTiming(perf) {
  log('perf', perf)
  log('重定向耗时', perf.redirectEnd - perf.redirectStart)
  log('DNS查询耗时', perf.domainLookupEnd - perf.domainLookupStart)
  log('TCP链接耗时', perf.connectEnd - perf.connectStart)
  log('HTTP请求耗时 ', perf.responseEnd - perf.responseStart)
  log('解析dom树耗时', perf.domComplete - perf.domInteractive)
  log('首包时间（~<白屏时间） ', perf.domLoading - perf.navigationStart)
  log(
    'domready可操作时间',
    perf.domContentLoadedEventEnd - perf.navigationStart
  )
  // 需在onload里调用时，perf.loadEventEnd 未结束时值为0
  log('onload总下载时间', perf.loadEventEnd - perf.navigationStart)
}
```

#### 其他指标

过`performance.getEntries()`，此方法返回 `PerformanceEntry` 对象数组，每个数组成员均是一个`PerformanceResourceTiming`对象。

```js
// 取全部
const entries = window.performance.getEntries();
// 取特定
const entries = performance.getEntries({name: "entry_name", entryType: "mark"});
```

![image-20210307215254327](/Users/apsp/Library/Application Support/typora-user-images/image-20210307215254327.png)

**白屏时间(FP)**与**首屏时间(FCP)**

其中name为`first-paint`的对象，`startTime`和`duration`的值，即为白屏时间(FP)，`name`为`first-contentful-paint`，即为**首屏时间(FCP)** ，需要注意的是`PerformancePaintTiming`只支持chrome60、opera47以上版本，其他的Chrome 最新性能指标，可以自行查阅资料。

##### 打点时间

另外通过`performance.mark()`可以自行记录打点时间，例如在`</head>`前自行埋点`performance.mark('first-paint-script’)`，然后在获取`name`属性为`first-paint-script`的`entry`，获取对应的时间，这一时间近似白屏时间。

SDK中可以约定一些常见的性能指标，被监控端选择合适的位置自行埋点，用于补充性能监控数据。

##### 起始时间

`performance.timing.navigationStart || query('_t')` ，可约定URL中存在 _t 时，作为页面统计起始点时间。

#### 图片加载时间

MutationObserver侦听DOM变化，在5秒内到最后一个变化的稳定时间点，作为时间点得到时间点T1，再用ResoucereTiming得到T1时间内加载的所有的图片Img，判断是不是本站（需统计的）图片，排除上报gif图片，得到图片资源加载完成时间T2。

`ResoucereTiming`的`entryType`值为`resource`，chrome浏览器中`initiatorType`为 `img`  ，firefox中`initiatorType` 为`other` 。

#### 首次加载或刷新

在收集性能的同时，记录页面是首次刷新还是加载，可利用给window.name属性赋值，在页面刷新时不会重置来判断

如果是单网页应用的首屏时间计算，更精准的时间计算，还需要根据业务需要自行打点记录。

### 环境信息采集

环境信息主要通过采集UA信息，进行上报，后台通过计算，获取浏览器分布等信息。

```js
export function getEnv(): Ienv {
  if (typeof window === 'undefined') return
  const navigator = window.navigator
  const connection = navigator['connection']
  const envData = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    url: window.location.href,
    net: connection ? connection.effectiveType : null, // 网络类型
    screenW:window.screen.width,
    screenH:window.screen.height
  }
  return envData
}
```

地域分布首先通过上报Nginx服务器获取ip，再通过系统服务端，利用第三方IP解析服务，获取用户地域分布。

### 行为采集

#### 点击输入行为

使用addEventListener全局监听点击事件，将用户行为（click,input）和dom元素相关信息，存入行为栈，当错误发生将错误和行为一并上报。

```js
export function handleBehaviorEvent(
  e: Event | MouseEvent,
  type: LISTEN_EVENTS
): void {
  const target = Array.isArray(e) ? e[0].target : e.target
  //   todo Xpath  outerHTML  offsetX pageX
  const { tagName, className,id ,innerText } = target
  behaviorCache.directPush({
    type,
    data: {
      tagName,
      className,
      id,
      innerText:innerText.substr(0,10),
      xpath : xpath(target), // 可选
      name : target.name || target.src || target.href 
    },
  })
}
```

#### 发送请求行为

参考异常采集，数据异常一段中，收集请求相关数据。

#### 页面跳转

页面跳转通过监听`hashchange`和`history.pushState` 和`history.replaceState`实现。需要注意的是，带hash的页面加载，会同时触发popstate

```js
let oldURL =  window.location.href
/**
 * historychange
 * 带hash的页面加载会触发popstate
 * 带hash回车 不管开始有没有hash 会触发俩事件
 * chrome 火狐 浏览器前进，从无到有hash，同时触发hashchange，从有到无不触发
 * chrome 火狐 浏览器后退，从无hash到有不触发，从有到无，同时触发hashchange
 *
 * @export
 * @param {PopStateEvent} e
 * @param {LISTEN_EVENTS} type
 */
export function handleHistoryChange(
  e: PopStateEvent,
  type: LISTEN_EVENTS
): void {
  const oldHash = getHash(oldURL)
  const newURL = (e.target as Window).location.href
  const newHash = (e.target as Window).location.hash
  // 缓存旧url用于数据处理
  const tempOldURL = oldURL
  oldURL = newURL // 更新URL
  if (oldHash || newHash) {
    // 这种情况,交由hashchange处理
    return
  }
  behaviorCache.directPush({
    type,
    data: {
      oldURL:tempOldURL,
      newURL,
    },
  })
}

export function handleHashChange(
  e: HashChangeEvent,
  type: LISTEN_EVENTS
): void {
  const {oldURL, newURL } = e
  behaviorCache.directPush({
    type,
    data: {
      newURL,
      oldURL,
    },
  })
}
```

## 日志上报

### 上报方式

日志上报采用`new Image()`请求Nginx服务器上1像素gif图片的方式，将日志数据转化为`key=value`字符串格式，附在图片的src之后，这样便解决了上报跨域的问题。之所以使用1px的gif图片，是因为同为1px的图片，gif格式的数据量最小。

```js
export function imgLoadPromise(url: string): Promise<Event> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = (res) => {
      resolve(res)
    }
    img.onerror = (err) => {
       reject(err) //  防止上报地址错误造成死循环
    }
    img.src = url
  })
}
```

#### 上报数据

##### 错误信息

| 属性名称        | 含义                  | 类型   |
| --------------- | --------------------- | ------ |
| message         | 错误信息              | String |
| filename/source | 异常的资源URL或文件名 | String |
| lineno          | 异常行号              | Number |
| colno           | 异常列号              | Number |
| error           | 错误对象              | Object |
| error.message   | 错误信息              | String |
| err.stack       | 错误信息              | String |

将错误信息和其他信息等，存入一个JSON对象。

```js
// 上传的数据  尽量简化字符
const logData = {
  appkey: '',
  vv: '', // 应用版本
  uuid: '', // 设备id
  uid: '', // 用户id
  sid: '', // session id
  ua: '', // userAgent
  url: '', // 页面url
  title: '', //  字符串超长优先省略该项
  type: '', // 日志类型  错误 性能 行为
  ext: {}, // 扩展参数
  bh: {}, // 行为数据
  env: {}, // 环境信息
  perf: {}, // 性能数据
  errType: '', // 宽范围的错误类型，可以使用数字标识，只区分 jsError resourceError httpErr
  error: {
    // js错误对应
    type: '', // js错误类型 ，如果堆栈中存在可以去掉
    msg: '',
    source: '',
    lineno: 0,
    colno: 0,
    stack: '',
    // 资源错误
    outerHTML: '<img src="test.jpg">', // target.outerHTML
    src: 'https://www.test.com/test.jpg', // target.src  currentSrc
    tagName: 'IMG', // target.nodeName tagName 'IMG'
    id: '', //  target.id
    className: '', // target.className
    name: 'jpg', //  target.name
    // "XPath": "/html/body/img[1]",
    //       "selector": "HTML > BODY:nth-child(2) > IMG:nth-child(2)",
    //       "status": 404,
    //       "statusText": "Not Found"
  }, // 错误数据
  time: '', // 上传时间，错误捕获时间
}
```

#### SDK配置

```js
export let defaultConfig: AppConfig = {
  // 基础数据
  version: '', // 所监控应用版本
  appkey: '', // 应用id，来自平台
  reportUrl: '', // 图片上报地址 1像素gif，可跨域，末尾不带&
  uuid: '', // 设备唯一id 默认自动生成
  uid: '', // 用户id
  sid: '', // session id
  ext: '', // 扩展参数，JSON.stringify()
  // 设置相关
  isTest: false, // 是否为测试数据，测试数据
  autoReport: true, // 是否开启自动上报，默认为true
  rate: 1, // 抽样率(0~1) 默认为1
  // delay: 0, // 延时上报 时间为毫秒
  // submit: null, // 自定义上报方式
  repeat: 20, // 同一错误上报次数
  error: true, // 是否上报js错误，默认为true
  // 配置错误监控详细信息，仅在开启js上报时有效
  errorConfig: {
    errorJS: true, // 大类 js运行错误
    errorResource: true, // 大类 资源加载错误
    // 以下细分 仅在资源加载错误为true时有效
    // errorScript: true, // js脚本加载错误
    // errorImage: true, // 图片加载错误
    // errorCSS: true, // 样式文件加载错误
    // errorAudio: true, // 音频加载错误
    // errorVideo: true, // 视频加载错误
    // 以上仅在资源加载错误为true时有效
    errorAjax: true, // 大类 ajax请求错误
    errorSocket: true, // socket 连接错误
    errorVue: true, // Vue运行报错
    errorTry: true, // try未catch报错
  },
  // 忽略某种错误
  ignore: {
    ignoreErrors: [], // 忽略某种错误，对照error stack，支持Regexp和Function
    ignoreUrls: [], // 忽略某页面url或文件url或接口报错，支持单条或数组
  },
  behavior: true, // 是否监控用户行为，默认为true, 可为json
  performance: true, // 是否监控页面性能，默认为true, 可配置为json
}
```

SDK初始化

```js
 var dm = new Monitor({
      version: '1.0.0', // 所监控应用版本
      appkey: '4749fb30-3562-11eb-bf47-5d73b473057a', // 应用id，来自平台
      reportUrl: 'http://118.190.***.***:8091/track.gif',
      isTest: true,
      uuid: '', // 设备唯一id 默认自动生成
      uid: localStorage.getItem('uid') ? localStorage.getItem('uid') : ('user_' + Date.now())
    }
  )
```



#### 性能优化

##### 并发控制

上报尽量不影响业务主体请求，将上报信息推入上报队列，控制上传的并发。

##### requestIdleCallback

`requestIdleCallback`可以检测浏览器的空闲状态，可以在空闲时发送上报请求。

##### 上报失败处理

上报失败进行重试，重试失败存到indexDB，作为本地日志，等到用户下一次进入的时候，再一并上报。

##### 服务端

服务端直接返回204，提高速度。

##### 重复上报次数限制

利用错误信息的路径，行号等信息，排除同一种错误的不同特性信息，不同系统版本的差异信息，校验md5是否一样，同类型错误数量大于N条（可配置）不再上传。后续可只记录错误出现的次数，更新错误最后出现的时间。

##### 采样率

在初始化SDK时，设置采样率，在上传时按采样率`const randomIgnore = Math.random() >= (config.rate || 1)`采样入库。

### 上报工程

#### nginx配置

修改nginx配置文件http块中的log_format为json格式，日志中记录ip/time/referer/UA等。

```shell
 # 对日志格式化成json
    log_format json '{"@timestamp":"$time_iso8601",'
                    '"@version":1,'
                    '"host":"$server_addr",'
                    '"client":"$remote_addr",'
                    '"size":$body_bytes_sent,'
                    '"responsetime":$request_time,'
                    '"domain":"$host",'
                    '"url":"$uri",'
                    '"status":"$status"}';
```

#### 读取nginx日志入库

#### Filebeat

Filebeat是本地文件的日志数据采集器，可监控日志目录或特定日志文件（tail file），并将它们转发给Elasticsearch、Logstatsh或kafka等，Filebeat可以一次读取某个文件夹下的所有后缀名为log的文件，也可以读取指定的某一个后缀名为log的文件。

filebeat.yml文件配置，`paths：`指定要监控的日志，filebeat收集日志后发往Logstatsh，配置如下：

```shell
filebeat:
  prospectors:
    - input_type: log
      paths:  # 这里是容器内的path  和nginx的log挂载同一目录
          - /tmp/access.log
      tags: ["nginx-access"]
  registry_file: /usr/share/filebeat/data/registry/registry  # 这个文件记录日志读取的位置，如果容器重启，可以从记录的位置开始取日志

output:
  logstash:  
    hosts: ["logstash:5044"] 
```

如果是海量数据，可以选择推到Kafka，而不是直接推到Logstatsh。

#### Logstatsh

可以设置对日志进行过滤，指定输出到Elasticsearch。

```shell
input {
  beats {
    port => 5044
    codec => json
    client_inactivity_timeout => 36000
  }
}
filter {
if 'nginx-access' in [tags]{
  grok {
        match =>{ 
          "message" => "^%{IPV4:remote_addr} \[%{HTTPDATE:timestamp}\] \"%{WORD:verb} %{DATA:request} HTTP/%{NUMBER:httpversion}\" %{INT:status} %{INT:body_bytes_sent} \"%{NOTSPACE:http_referer}\" %{NUMBER:request_time} \"%{IPV4:upstream_addr}:%{POSINT:upstream_port}\" %{NUMBER:upstream_response_time} \"%{DATA:http_user_agent}\" \"%{NOTSPACE:http_x_forwarded_for}\""
          }
        remove_field => ["message"]   
    }
}    
}
output {
  elasticsearch {
    hosts => ["elasticsearch:9200"] #  elasticsearch docker
    index => "wwfmac-nginx" # 索引
  }
}
```

##### ElasticSearch

将Logstash消费的数据推送到ElasticSearch

```javascript

```

## Egg

后台服务使用egg开发，首先定时从ElasticSearch获取原始日志数据，存储到MySQL数据库。再利用定时任务，按照不同的时间周期，对入库的数据进行计算存储。

egg读取ElasticSearch，安装 `egg-es` 依赖

```js
// config.js 配置
 exports.elasticsearch = {
    host: 'http://**.**.**.**:9200',
    apiVersion: '7.x'
  };
```

```js
// pulgin.js 中配置
exports.elasticsearch = {
  enable: true,
  package: 'egg-es', 
};
```

```js
// 查询数据
async queryES(query = { match_all: {} }) {
    // 相关文档：https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/7.x/search_examples.html
    // const ctx = this.ctx
    let result = await this.app.elasticsearch.search({
      index: ES_INDEX, // es索引
      size: 200,
      sort: ['@timestamp:asc'], //按时间戳降序排序 
      body: {
        query: query
        //   match: {
        //   }
      }
    });
    const arr = result.hits.hits;
    return arr;
  }
}
```



## 监控控制台



### 数据查看

| 功能点                 | 描述                                         |      |
| ---------------------- | -------------------------------------------- | ---- |
| 用户数据               | 按月、日、年统计新增用户，使用折线图呈现     |      |
| 设备、系统、浏览器数据 | 按月统计数据分布，使用饼图呈现               |      |
| 性能数据数据           | 按分钟、日、月计算平均值，使用区间条形图呈现 |      |



| 错误列表 | 可检索   | 可拍续   | 错误信息 |        |
| -------- | -------- | -------- | -------- | ------ |
| 错误详情 | 错误堆栈 | 用户行为 | 特征信息 | 可检索 |
| 趋势     | 错误趋势 | 事件趋势 |          |        |

页面规划

| 错误列表页 | 错误趋势                              | 检索区域 （多条件检索） | 错误列表（各维度拍续：错误数，错误用户数，时间排序，24小时内新增错误按时间排序） |          |                                             |
| ---------- | ------------------------------------- | ----------------------- | ------------------------------------------------------------ | -------- | ------------------------------------------- |
| 错误详情页 | 检索区域（时间 版本等简单的检索条件） | 事件趋势                | 事件信息                                                     | 特征信息 | 事件列表 聚合错误后错误的每一个具体错误事件 |







### 

