// import isDate from 'lodash-es/isDate'
import isObject from 'lodash-es/isObject'
import { ua, testUa, testVs } from './broswer'

const urlLengthLimit = {
  ie: 2000,
  chrome: 8000,
  aliyun: 16000,
  default: 8000,
}

const toString = Object.prototype.toString

export function isDate(val: any): val is Date {
  return toString.call(val) === '[object Date]'
}

export function encode(val: string): string {
  return (
    encodeURIComponent(val)
      .replace(/%40/g, '@')
      .replace(/%3A/gi, ':')
      .replace(/%24/g, '$')
      .replace(/%2C/gi, ',')
      // .replace(/%20/g, '+')
      .replace(/%5B/gi, '[')
      .replace(/%5D/gi, ']')
  )
}

export function bulidURL(url: string, params?: unknown): string {
  if (!params) {
    return url
  }

  const parts: string[] = []

  Object.keys(params).forEach((key) => {
    const val = params[key]
    if (val === null || typeof val === 'undefined') {
      return
    }
    let values: string[]
    if (Array.isArray(val)) {
      values = val
      key += '[]'
    } else {
      values = [val]
    }
    values.forEach((val) => {
      if (isDate(val)) {
        val = val.toISOString()
      } else if (isObject(val)) {
        val = JSON.stringify(val)
      }
      parts.push(`${encode(key)}=${encode(val)}`)
    })
  })

  const serializedParams = parts.join('&')
  // 如果url过长 设置的最大值略少于实际值 忽略了domain
  if (isUrlLong(serializedParams)) {
    // todo抛弃一部分
  }

  if (serializedParams) {
    const markIndex = url.indexOf('#')
    if (markIndex !== -1) {
      url = url.slice(0, markIndex)
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams
  }
  // console.log('buildURl', serializedParams, url, url.length)
  return url
}

// todo 计算url长度
// 判断浏览器
export function isUrlLong(url: string) {
  let limit = 2000
  // ie内核
  if (testUa(/trident|compatible|msie/g)) {
    limit = urlLengthLimit.ie
  } else {
    limit = urlLengthLimit.default
  }
  if (url.length > limit) {
    return true
  } else {
    return false
  }
}

export function getParam(url  = window.location.href):unknown {
  const obj = {}
  const allargs = url.split('?')[1]
  const args = allargs.split('&')
  for (let i = 0; i < args.length; i++) {
    const arg = args[i].split('=')
    obj[arg[0]] = arg[1]
  }
  return obj
}

export function getHash(href:string):string{
  if(!href)return ''
  const arr = href.split('#')
   if(typeof arr[1] !== 'undefined'){
     return "#" + arr[1]
   }else{
     return ''
   }
}