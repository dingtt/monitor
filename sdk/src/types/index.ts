export type None = null | undefined | false

export type LOAD_HTML_TYPE =
  | HTMLImageElement
  | HTMLLinkElement
  | HTMLScriptElement
  | HTMLStyleElement
  | HTMLAudioElement
  | HTMLVideoElement
  | HTMLMediaElement

export type voidFunc = (any) => void

// 侦听事件
export enum LISTEN_EVENTS {
  LOAD = 'load',
  ERROR = 'error',
  UNHANDLEDREJECTION = 'unhandledrejection',
  POPSTATE = 'popstate',
  PUSHSTATE = 'pushstate',
  REPLACESTATE = 'replacestate',
  HASHCHANGE = 'hashchange',
  CLICK = 'click',
  INPUT = 'input',
}

// 日志分类
export enum LOG_TYPES {
  ERROR = 'error',
  ENV = 'env',
  PERFORMANCE = 'perf',
  BEHAVIOR = 'behavior',
  EXT = 'ext',
}
// 原始数据项
export interface OriginalData {
  type?: string
  time?: number
}

// 日志数据项
export interface LogItem {
  appkey: string
  vv: string // 版本
  uuid: string // 唯一设备id
  uid: string // 用户id
  sid?: string // session id
  // ua: string
  // url: string
  // title?: string
  // logtype: string
  env: Ienv // ua  src
  perf?: PerfData
  error?: unknown
  ext?: unknown
  bh?: unknown
  logtime: number
}
// 异常大类
export const ERROR_TYPE = {
  JS: 'js',
  LOAD: 'load',
  AJAX: 'ajax',
}

// 资源异常分类
export enum ERROR_LOAD {
  SCRIPT = 1,
  LINK, // CSS
  IMAGE,
  AUDIO,
  VIDEO,
}

// 资源加载错误
export interface ResourceError {
  outerHTML: string
  src: string
  tagName: string
  id: string
  className: string
  name: string
  type: string
}
// JS运行错误
export interface RuntimeError {
  msg: string
  lineno: number
  colno: number
  error: unknown
  src: string
  time: number
  type: string
}

// 性能扩展
export interface PerfExt {
  fp: number
  fcp: number
  markFp?: number
  markFcp?: number
  markPd?: number
  longImgLoad?: number
}

export interface PerfData extends PerformanceTiming, PerfExt {
  // type:'perf'
  beginTime?: number
}

// 环境
export interface Ienv {
  userAgent: string
  platform: string
  language: string
  url: string
  net: string
}

// 行为类型
export enum BEHAVIORTYPES {}

// 行为事件
// export enum BEHAVIOR_EVENTS {
//   CLICK = 'click',
//   INPUT = 'input',
// }
// 行为数据项
export interface BehaviorData {
  type: LISTEN_EVENTS
  data: any
}
