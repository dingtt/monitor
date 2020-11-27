// import { getTimestamp } from './util/index'
import {
  None,
  ERROR_TYPE,
  ERROR_LOAD,
  LOAD_HTML_TYPE,
  RuntimeError,
  ResourceError,
} from '../types/index'
// import report from '../report'

// SyntaxError：语法错误
//  Uncaught ReferenceError：引用错误
// RangeError：范围错误
// TypeError类型错误
// URIError，URL错误
//EvalError eval()函数执行错误
// Promise异常
// async/await异常捕获

export function handleError(errorEvent: ErrorEvent): void {
  // const { message } = errorEvent
  // const msg = message.toLowerCase()
  // const script_error = 'script error'
  // if (msg.indexOf(script_error) > -1) {
  //   // 判断是否监听了第三方js错误，移交给专门的处理
  //   return
  // }
  const target = errorEvent.target || errorEvent.srcElement
  // 资源加载错误  target非window  cancelable为false
  if (target !== window) {
    if (!target['localName']) return // nodeName tagName 为大写 localName小写
    if (!isElementTarget(target)) return
    if (!isMonitorLoadType((target as HTMLElement).nodeName)) return
    // handleError(dm, formatError(errorEvent, ERROR_TYPE.LOAD))
    // report.directReport('error', formatError(errorEvent, ERROR_TYPE.LOAD))
  } else {
    // js错误 target为window  cancelable 为true
    // const runtimeErrorJson = formatError(errorEvent, 'ajax')
    // handleError(dm, formatError(errorEvent, ERROR_TYPE.JS))
  }
}

export function handleVueError(err, vm, info) {
  // err message stack  stack需要正则提取 (http://dingm.com/src/bad.js:98:7)
  // 参考 bj-report 170
  const stackInfo = getStackInfo(err.stack)
  return {
    message: err.message,
    ...stackInfo,
  }
  // 上报
}

export function handleHttp(type, data) {
  console.log(type, data)
  if (data.readyState !== 4) {
    //
  } else {
    if (data.status > 400 || data.status === 0) {
      //
    }
  }
}

// 抹平不同的错误类型
export const formatStrategies = {
  // js运行错误
  [ERROR_TYPE.JS]: (errObj: ErrorEvent): RuntimeError => {
    if (errObj instanceof ErrorEvent) {
      const detail = {} as RuntimeError
      ;({
        message: detail.msg,
        filename: detail.src,
        lineno: detail.lineno,
        colno: detail.colno,
        error: detail.error,
      } = errObj)
      detail.time = Date.now()
      detail.type = ERROR_TYPE.JS
      console.log(ERROR_TYPE.JS, detail)
      return detail
    }
  },
  // 资源加载错误
  [ERROR_TYPE.LOAD]: (errObj: ErrorEvent): ResourceError | void => {
    if (errObj instanceof Event) {
      const target = errObj.target as HTMLElement //  LOAD_HTML_TYPE srcElement  EventTarget
      const { outerHTML, tagName, id, className } = target
      const src = target['src']
      const name = target['name']
      // const { outerHTML, src, tagName, id, className, name } = target
      const detail = {
        outerHTML,
        src: src,
        tagName,
        id,
        className,
        name: name,
        type: ERROR_TYPE.LOAD,
      }
      console.log(ERROR_TYPE.LOAD, detail)
      return detail
    }
  },
  [ERROR_TYPE.AJAX]: (): void => {
    console.log('AJAX...')
  },
}
// 错误格式统一
export function formatError(errObj: ErrorEvent, type: string): any {
  return formatStrategies[type](errObj)
}

// 资源加载目标元素
function isElementTarget(target: EventTarget): boolean {
  const isElementTarget =
    target instanceof HTMLScriptElement ||
    target instanceof HTMLLinkElement ||
    target instanceof HTMLImageElement ||
    target instanceof HTMLStyleElement ||
    target instanceof HTMLAudioElement ||
    target instanceof HTMLVideoElement ||
    target instanceof HTMLMediaElement
  return isElementTarget
}
// 监控的资源加载类型   todo  和config对应
function isMonitorLoadType(nodeName: string): boolean {
  if (!nodeName) return
  if (ERROR_LOAD[nodeName]) {
    return true
  } else {
    return false
  }
}

// 提取stack
function getStackInfo(stack) {
  const stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/i
  const stackReg2 = /at\s+()(.*):(\d*):(\d*)/i
  const stacklist = stack.split('\n').slice(3)
  const s = stacklist[0]
  const sp = stackReg.exec(s) || stackReg2.exec(s)
  const data = {}
  if (sp && sp.length === 5) {
    data['path'] = sp[2]
    data['lineno'] = sp[3]
    data['colno'] = sp[4]
  }
  return data
}
// 计算错误指纹

// 错误集合
