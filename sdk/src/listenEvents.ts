import { LISTEN_EVENTS } from './types/index'
import EventEmitter from './EventEmitter'
import { perfObserver } from '../src/collector/perf'
const eventEmitter = EventEmitter.instance()
function on(obj = window, eventType: string, flag?) {
  obj.addEventListener(
    eventType,
    (e) => {
      // 触发
      eventEmitter.emit(eventType, e, eventType)
    },
    flag
  )
}

export function listenError(): void {
  on(window, LISTEN_EVENTS.ERROR, true)
  listenPromiseError()
}

// 将unhandledrejection抛出的异常再次抛出，就可以在 addEventListener中捕获 onerror也可以
export function listenPromiseError(): void {
  window.addEventListener(LISTEN_EVENTS.UNHANDLEDREJECTION, (e) => {
    throw e.reason
  })
}

// ajax
export function listenAjax() {
  wrapXMLHttpRequest()
}

function wrapXMLHttpRequest(): void {
  // 绑定事件
  const orignalEvents = [
    'abort',
    'error',
    'load',
    'timeout',
    'onreadystatechange',
  ]
  // 劫持原型链方法
  const method = 'open'
  const originalXhrProto = window.XMLHttpRequest.prototype
  const original = originalXhrProto[method]
  originalXhrProto[method] = function (...args) {
    // 获取xhr实例  绑定事件
    const xhr = this
    orignalEvents.forEach((eType) => {
      xhr.addEventListener(eType, function (e) {
        eType = eType.toUpperCase()
        const lType = LISTEN_EVENTS[`AJAX_${eType}`]
        eventEmitter.emit(lType, e, lType)
      })
    })
    original.apply(this, args)
  }
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
    console.log(err, vm, info)
    // errorHandler方法自己又报错了生产环境下会使用 console.error 在控制台中输出
    // 继续抛出到控制台
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error(err)
    }
    eventEmitter.emit(LISTEN_EVENTS.VUE, err)
    if (typeof oldErrorHandler === 'function') {
      oldErrorHandler.call(this, err, vm, info)
    }
  }
}

// 注册路由事件
export function listenRouter(): void {
  // pushstate
  const originalPushState = window.history.pushState
  window.history.pushState = function (event, ...args) {
    eventEmitter.emit(LISTEN_EVENTS.HISTORYCHANGE)
    originalPushState && originalPushState.apply(event, args)
  }
  // replaceState
  const originalReplaceState = window.history.replaceState
  window.history.replaceState = function (event, ...args) {
    eventEmitter.emit(LISTEN_EVENTS.HISTORYCHANGE)
    originalReplaceState && originalReplaceState.apply(event, args)
  }
  //带hash的页面加载会触发popstate
  on(window, LISTEN_EVENTS.HASHCHANGE)
}

// 行为 点击计算在线时长  push行为缓存
export function listenBehavior(): void {
  on(window, LISTEN_EVENTS.CLICK)
  on(window, LISTEN_EVENTS.INPUT)
}
// 性能
export function listtenPerformance(): void {
  on(window, LISTEN_EVENTS.ONLOAD)
  perfObserver()
}
