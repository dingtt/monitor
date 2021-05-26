import {
  None,
  ERROR_TYPE,
  ERROR_LOAD,
  LOAD_HTML_TYPE,
  RuntimeError,
  ResourceError,
  AjaxError,
  OriginalData,
} from '../types/index'
import SparkMD5 from '../../node_modules/spark-md5/spark-md5'
import report from '../report'

export function handleError(errorEvent: ErrorEvent): void {
  // const { message } = errorEvent
  // const msg = message.toLowerCase()
  // const script_error = 'script error'
  // if (msg.indexOf(script_error) > -1) {
  //   // todo判断是否监听了第三方js错误，移交给专门的处理
  //   return
  // }
  const target = errorEvent.target || errorEvent.srcElement
  // 资源加载错误  target非window  cancelable为false
  if (target !== window) {
    if (!target['localName']) return // nodeName tagName 为大写 localName小写
    if (!isElementTarget(target)) return
    // if (!isMonitorLoadType((target as HTMLElement).nodeName)) return
    report.add('error', formatError(errorEvent, ERROR_TYPE.LOAD))
  } else {
    // js错误 target为window  cancelable 为true
    report.add('error', formatError(errorEvent, ERROR_TYPE.JS))
  }
}

function sparkArr(arr: Array<string | number>) {
  if (!arr || !arr.length) return
  const spark = new SparkMD5()
  arr.forEach((item) => {
    if (typeof item == 'number') {
      item = String(item)
    }
    item && spark.append(item)
  })
  return spark.end(false)
}

export function handleVueError(err, vm, info) {
  const stackInfo = getStackInfo(err.stack)
  const detail = {
    msg: err.message as string,
    ...stackInfo,
  } as RuntimeError
  detail.md5 = sparkArr([detail.msg, detail.lineno, detail.colno, detail.src])
  detail.time = Date.now()
  detail.type = 'js'
  report.add('error', detail as OriginalData)
}
// net::ERR_CONNECTION_REFUSED 无详细信息
export function handleAJAX(e: ProgressEvent, lType: string) {
  const xhr = e.target as XMLHttpRequest
  if (xhr.readyState !== 4) {
  } else {
    if (xhr.status > 400 || xhr.status === 0) {
      report.add('error', formatError(xhr, lType))
    }
  }
}

// 抹平不同的错误类型
export function formatError<T extends Event | ErrorEvent | XMLHttpRequest>(
  obj: T,
  str: string
) {
  // js运行错误
  const formatJsError = (errObj: ErrorEvent): RuntimeError => {
    if (errObj instanceof ErrorEvent) {
      const detail = {} as RuntimeError
      ;({
        message: detail.msg,
        filename: detail.src,
        lineno: detail.lineno,
        colno: detail.colno,
        // error: detail.error,
      } = errObj)
      detail.md5 = sparkArr([
        detail.msg,
        detail.src,
        detail.lineno,
        detail.colno,
      ])
      detail.time = Date.now()
      detail.type = ERROR_TYPE.JS
      return detail
    }
  }
  // 资源加载错误
  const formatresourceError = (errObj: Event): ResourceError => {
    if (errObj instanceof Event) {
      const target = errObj.target as HTMLElement //  LOAD_HTML_TYPE srcElement  EventTarget
      const { outerHTML, tagName, id, className } = target
      const src = target['src']
      const name = target['name']
      const detail = {
        outerHTML,
        src: src,
        tagName,
        id,
        className,
        name: name,
      } as ResourceError
      const spark = new SparkMD5()
      for (let k in detail) {
        if (!detail[k]) {
          spark.append(detail[k])
        }
      }
      detail.md5 = sparkArr([detail.src, detail.outerHTML, detail.id])
      detail.type = ERROR_TYPE.LOAD
      detail.time = Date.now()
      return detail
    }
  }
  const formatAjaxError = (xhr: XMLHttpRequest, lType: string): AjaxError => {
    const { responseURL, status, response, statusText } = xhr
    let msg = lType === 'ajax_error' ? 'ajax_error' : 'ajax_load'
    let stack = ''
    let name = ''
    if (response && JSON.parse(response)) {
      const res = JSON.parse(response)
      name = res.name
      msg = res.message
    }
    const detail = {
      src: responseURL,
      status,
      msg: statusText || msg,
    } as AjaxError
    const spark = new SparkMD5()
    for (let k in detail) {
      if (!detail[k]) {
        spark.append(detail[k])
      }
    }
    detail.md5 = sparkArr([detail.src, detail.status, detail.msg])
    detail.type = ERROR_TYPE.AJAX
    detail.time = Date.now()
    return detail
  }
  switch (str) {
    case ERROR_TYPE.LOAD:
      if (obj instanceof Event) {
        return formatresourceError(obj)
      }
      break
    case ERROR_TYPE.JS:
      if (obj instanceof ErrorEvent) {
        return formatJsError(obj)
      }
      break
    case 'ajax_error':
      if (obj instanceof XMLHttpRequest) {
        return formatAjaxError(obj, str)
      }
      break
    case 'ajax_load':
      if (obj instanceof XMLHttpRequest) {
        return formatAjaxError(obj, str)
      }
      break
    default:
      break
  }
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
// 监控的资源加载类型,和config配置对应
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
  const stacklist = stack.split('\n')
  const s = stacklist[stacklist.length - 1]
  const sp = stackReg.exec(s) || stackReg2.exec(s)
  const data = {}
  if (sp && sp.length === 5) {
    data['src'] = sp[2]
    data['lineno'] = sp[3]
    data['colno'] = sp[4]
  }
  return data
}
// 计算错误指纹
