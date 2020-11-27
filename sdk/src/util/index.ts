export * from './url'
export * from './broswer'
export * from './request'
export * from './xpath'
export * from './log'
export * from './Validator'

export function getTimestamp(): number {
  return Date.now()
}
export function getLocaltionHref(): string {
  return window.location.href
}
//  判断图片onload路径是否为监控本身的gif
export function isSelfGif(url: string, reportUrl: string): boolean {
  if (url && url.indexOf(reportUrl) > -1) {
    return true
  } else {
    return false
  }
}
//  判断上报地址是否为gif图片路径
export function isGifUrl(url: string): boolean {
  if (url && url.indexOf('.gif') > -1) {
    return true
  } else {
    return false
  }
}

export function uuid(): string {
  const s = []
  const hexDigits = '0123456789abcdef'
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
  }
  s[14] = '4' // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1) // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = '-'

  const uuid = s.join('')
  return uuid
}


export function isObject (value) {
  const type = typeof value
  return value !== null && (type === 'object' || type === 'function')
}
 
// { a: [{ b: 2 }] } { a: [{ c: 2 }]} -> { a: [{b:2}, {c:2}]}
// merge({o: {a: 3}}, {o: {b:4}}) => {o: {a:3, b:4}}
export function merge (source, other) {
  if (!isObject(source) || !isObject(other)) {
    return other === undefined ? source : other
  }
  // 合并两个对象的 key，另外要区分数组的初始值为 []
  return Object.keys({
    ...source,
    ...other
  }).reduce((acc, key) => {
    // 递归合并 value
    acc[key] = merge(source[key], other[key])
    return acc
  }, Array.isArray(source) ? [] : {})
}

// 遇到相同元素级属性，以后者（main）为准
// 不返还新Object，而是main改变
export function mergeJSON(minor, main) {
  for (const key in minor) {
    if (main[key] === undefined) {
      // 不冲突的，直接赋值
      main[key] = minor[key]
      continue
    }

    // 冲突了，如果是Object，看看有么有不冲突的属性
    // 不是Object 则以main为主，忽略即可。故不需要else
    if (isJSON(minor[key])) {
      // arguments.callee 递归调用，并且与函数名解耦
      arguments.callee(minor[key], main[key])
    }
  }
}

// 附上工具
function isJSON(target) {
  return typeof target == 'object' && target.constructor == Object
}
function isArray(arr) {
  return Object.prototype.toString.call(arr) == '[object Array]'
}



// 延迟
export function delay(fn, interval: number): Promise<void> {
  return new Promise((resolve) => {
    const requestIdleCallback = (window as Window)['requestIdleCallback']
    if (interval || (!interval && !requestIdleCallback)) {
      setTimeout(() => {
        fn()
        resolve()
      }, interval)
    } else {
      requestIdleCallback(fn)
    }
  })
}