import { LISTEN_EVENTS } from './types/index'
// import { getCustomEvent } from './util/index'

import {
  handleError,
  handleVueError,
  handleHttp,
  handlePerformance,
  handleEnv,
  handleBehaviorEvent,
  handleHistoryChange,
  handleHashChange,
} from './collector/index' // debug 写法
import eventCenter from './eventCenter'
// 包装事件侦听
function on(obj = window, eventType: LISTEN_EVENTS, callback, flag?) {
  // 事件中心
  callback &&
    eventCenter.push({
      eventType,
      func: callback,
    })

  obj.addEventListener(
    eventType,
    (e) => {
      // 回调
      // console.log({ args })
      callback && callback.call(this, e, eventType)
    },
    flag
  )
}

export function listenError(): void {
  on(window, LISTEN_EVENTS.ERROR, handleError, true)
}

// 将unhandledrejection抛出的异常再次抛出，就可以在 addEventListener中捕获 onerror也可以
export function listenPromiseError(): void {
  window.addEventListener(LISTEN_EVENTS.UNHANDLEDREJECTION, (e) => {
    throw e.reason
  })
}

// ajax
export function listenAjax() {
  // on(window,'ajaxopen',function(){
  //   const
  // },false)
}

function wrapXMLHttpRequest(): void {
  // const orignalEvents = [
  //   'abort',
  //   'error',
  //   'load',
  //   'timeout',
  //   'onreadystatechange',
  // ]
  // function ajaxEventTrigger(event) {
  //   const ajaxEvent = new CustomEvent(event, { detail: this })
  //   window.dispatchEvent(ajaxEvent)
  // }
  // const orignalXMLHttpRequest = window.XMLHttpRequest
  // function newXHR() {
  //   const xhr = new orignalXMLHttpRequest()
  //   orignalMethods.forEach(function (method) {
  //     xhr.addEventListener(
  //       method,
  //       function () {
  //         ajaxEventTrigger.call(this, `ajax${method}`)
  //       },
  //       false
  //     )
  //   })
  //   return xhr
  // }
  // window.XMLHttpRequest = newXHR
  const orignalMethods = ['open', 'send']
  const originalXhrProto = window.XMLHttpRequest.prototype
  orignalMethods.forEach(function (method) {
    const original = originalXhrProto[method]
    //
    originalXhrProto[method] = function (...args) {
      switch (method) {
        case 'open':
          console.log('method', method, this)
          handleHttp(method, this)
          break
        case 'send':
          console.log('method', method, this)
          handleHttp(method, this)
          break
        default:
          break
      }
      original.apply(this, args)
    }
  })
}

// 跨域js引起的错误 只能捕获到script err   多一个handle
// 跨域js引起的错误  和 劫持事件里的错误
function listenCrossDomainJsError(): void {
  // 劫持跨域js的事件错误
  // 重写事件
}

// vue 错误
export function listenVueError(_Vue): void {
  if (!_Vue || !_Vue.config) {
    return
  }
  const oldErrorHandler = _Vue.config.errorHandler
  _Vue.config.errorHandler = function (err, vm, info) {
    handleVueError(err, vm, info)
    // errorHandler方法自己又报错了生产环境下会使用 console.error 在控制台中输出
    // 继续抛出到控制台
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
      // console.error(err)
    }
    if (typeof oldErrorHandler === 'function') {
      oldErrorHandler.call(this, err, vm, info)
    }
  }
}

// 行为 路由
export function listenRouter(): void {
  // popstate事件只会在浏览器某些行为下触发，比如点击后退、前进按钮
  // 或者在JavaScript中调用history.back()、history.forward()、history.go()方法
  // a标签的锚点也会触发该事件
  // 当网页加载时,各浏览器对popstate事件是否触发有不同的表现,Chrome 和 Safari会触发popstate事件, 而Firefox不会.
  on(window, LISTEN_EVENTS.POPSTATE, handleHistoryChange)
  // 调用history.pushState()或者history.replaceState()不会触发popstate事件
  // puahstate
  const originalPushState = window.history.pushState
  window.history.pushState = function (event, ...args) {
    handleHistoryChange(event, LISTEN_EVENTS.PUSHSTATE)
    originalPushState && originalPushState.apply(event, args)
  }
  // replaceState
  const originalReplaceState = window.history.replaceState
  window.history.replaceState = function (event, ...args) {
    handleHistoryChange(event, LISTEN_EVENTS.REPLACESTATE)
    originalReplaceState && originalReplaceState.apply(event, args)
  }
  //带hash的页面加载会触发popstate
  on(window, LISTEN_EVENTS.HASHCHANGE, handleHashChange)
}

// 行为 点击计算在线时长  push行为缓存
export function listenBehavior(): void {
  on(window, LISTEN_EVENTS.CLICK, handleBehaviorEvent, true)
  on(window, LISTEN_EVENTS.INPUT, handleBehaviorEvent, true)
}
// 性能
export function listtenPerformance(): void {
  function HandleOnload(...args): void {
    handlePerformance()
    handleEnv()
  }
  on(window, LISTEN_EVENTS.LOAD, HandleOnload)

  // 动态观察  longtask 需要用观察者  只有chrome支持
  // let num = 0
  // const perfObserver = new PerformanceObserver(
  //   (list: PerformanceObserverEntryList) => {
  //     // num++
  //     // console.log(num)
  //     console.log(list.getEntries().length)
  //     list.getEntries().forEach((entry) => {
  //       // console.log('观察entry对象', entry)
  //       if (entry.entryType === 'longtask') {
  //         console.log('longtask', entry)
  //       }
  //       // 调用处理entry
  //     })
  //   }
  // )
  // // 观察的类型
  // perfObserver.observe({
  //   entryTypes: ['longtask'],
  //   buffered: true,
  // })
}

// export const handleError0 = function (
//   dm,
//   errorData: RuntimeError | ResourceError
// ): void {
//   const randomIgnore = Math.random() >= (config.rate || 1)
//   if (randomIgnore) return
//   // if (config.delay || 1) {
//   //   // 延时上报  延时塞进数组  debounce   重复次数
//   //   dm._mlog.push(errorData)
//   //   // 控制并发 延时上传
//   // } else {
//   //   // 直接上报
//   // }
// }
// const limitLog = new MLog(3)
// function report(url: string, params: any) {
//   limitLog.call(imgLoadP, url, params)
// }
// 上报函数
// let flag = 0
// const timer = setInterval(() => {
//   flag++
//   report(config.imgUrl, {
//     ceshi: Math.random(),
//   })
//   if (flag > 100) {
//     clearInterval(timer)
//   }
// }, 100)

// 上报方法

// 抽样率  次数
// function composeLog(e: Event | ErrorEvent): void {
// 区分错误类型   判断是否监控改类型
// 拼接log 性能 设备
// 抽样率  重复上报次数限制
// }

// 函数  从错误里拿取堆栈信息 return
// 函数  从资源加载错误里拿取信息return
