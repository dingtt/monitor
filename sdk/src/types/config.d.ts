export interface AppConfig extends required<AttrType>, required<MethodType> {}
export interface UserOptions extends AttrType, MethodType {}
type partial<T> = { [K in keyof T]?: T[K] }
type required<T> = { [K in keyof T]: T[K] }
export type voidFun = () => void
// export type returnStringFun = () => string

export interface AttrType {
  version: string
  appkey: string
  reportUrl: string // 暂时只支持gif图片url
  uuid?: string
  uid?: string
  sid?: string
  ext?: string
  isTest?: boolean
  autoReport?: boolean
  rate?: number
  delay?: number
  repeat?: number
  error?: boolean
  errorConfig?: ListenTypes
  ignore?: ignoreType
  behavior?:boolean
  performance?: boolean | perfConfigType
  // perfConfig?: perfConfigType
  _Vue?: unknown
}
export interface MethodType {
  submit?(): void // 自定义上报方式，传入log
  getRealUrl?(url: string): string
}
export interface ListenTypes {
  errorJS?: boolean
  errorResource?: boolean
  errorAjax?: boolean
  errorSocket?: boolean
  errorVue?: boolean
  errorReact?: boolean
  errorTry?: boolean
}

export interface perfConfigType {
  // false 不在前端采集ip，true利用默认方法采集ip，string符合ip格式直接使用，function 采集ip函数
  getIp?: boolean | string | (() => string)
}

export interface ignoreType {
  ignoreErrors: Array<voidFun | RegExp | string>
  ignoreUrls: Array<voidFun | RegExp | string>
}

