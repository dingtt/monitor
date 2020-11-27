import {
  LOG_TYPES,
  RuntimeError,
  ResourceError,
  OriginalData,
  LogItem,
} from './types/index'
import { defaultConfig as config } from './config'
import {
  imgLoad,
  imgLoadPromise,
  // xhrGetPromise,
  xhrGet,
  xhrPost,
  bulidURL,
  isGifUrl,
  log,
} from './util/index'
import { getEnv } from './collector/env'

export const inBrowser = typeof window !== 'undefined'
export const UA = inBrowser && window.navigator.userAgent.toLowerCase()

// 上传的数据  尽量简化字符
const logData: any = {
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
    src: 'https://www.fundebug.com/test.jpg', // target.src  currentSrc
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
// 格式化后错误数据的type 或其他 主体数据
// interface TrendsData {
//   type: string
//   time: number
// }

type SomeError = RuntimeError | ResourceError
interface CommonErrorData extends RuntimeError, ResourceError {}
export interface IReport {
  // logList: Array<logItem>
  reset: (unkonw) => void
  // errorList:Array<SomeError>
  // behavirList:Array<unknown>
  // pushError: (data: SomeError) => void
  // log: (logType: string, data: OriginalData) => void
}

class Report implements IReport {
  // 上传最大并发
  protected maxCount = 5
  // 当前正在执行的数量
  protected runCounts = 0
  protected xhr = new XMLHttpRequest()
  // protected errorList: Array<SomeError> = [] // 错误缓存池  性能缓存池
  // protected behavirList: Array<unknown> = [] // 行为缓存
  protected taskQueue: Array<Promise<unknown>> = [] // 上传任务队列
  protected running = false
  constructor(maxCount?: number) {
    if (maxCount) this.maxCount = maxCount
  }
  reset(maxCount: number) {
    this.maxCount = maxCount
  }
  add(logType: string, data: OriginalData) {
    const url = config.reportUrl
    const logInfo = this.warp(logType, data)
    const src = bulidURL(url, logInfo) // 计算URL长度
    if (config.reportUrl && isGifUrl(config.reportUrl)) {
      const promiseTask = imgLoadPromise(src)
      this.taskQueue.push(promiseTask)
    }
    if (!this.running) {
      this.taskStart()
    }
  }
  taskStart() {
    this.running = true
    for (let i = 0; i < this.maxCount; i++) {
      this.request()
    }
  }
  request() {
    if (
      !this.taskQueue ||
      !this.taskQueue.length ||
      this.runCounts >= this.maxCount
    )
      return
    this.runCounts++
    log('report', this.running, this.runCounts)
    const task = this.taskQueue.shift()
    if (task) {
      task.then(() => {
        this.runCounts--
        this.request()
      })
    } else {
      this.running = false
    }
  }
  // 数据包装
  warp<T extends OriginalData>(type: string, data: T): LogItem {
    const logInfo = {
      appkey: config.appkey,
      vv: config.version,
      uuid: config.uuid,
      uid: config.uid,
      sid: config.sid,
      env: getEnv(),
      url: inBrowser && window.location.href,
      title: inBrowser && window.document.title,
      // logtype: type,
      // [type]: data,  // error   perf    behavior
      logtime: Date.now(),
    }
    if (type !== LOG_TYPES.ENV) {
      logInfo[type] = data
    }
    return logInfo
  }
  // 直接上报
  directReport(logType: string, data: OriginalData, url?: string): void {
    url = url ? url : config.reportUrl
    const logInfo = this.warp(logType, data)
    const src = bulidURL(url, logInfo) // 计算URL长度
    // 判断上报类型
    if (config.reportUrl && isGifUrl(config.reportUrl)) {
      imgLoadPromise(src).then()
    } else {
      xhrGet(url)
    }
  }

  // 异步任务上报
  asyncReport(logType: string, data: OriginalData, url?: string): void {
    const logInfo = this.warp(logType, data)
    const src = bulidURL(url, logInfo) // todo计算URL长度
    // 判断上报类型
    if (config.reportUrl && isGifUrl(config.reportUrl)) {
      // this.LimitP.call(imgLoad, src)
    } else {
      // this.LimitP.call(xhrGet, src)
    }
  }
}

// todo
// 字符串超长  重复上报次数  忽略的错误
const report = new Report()
export default report
