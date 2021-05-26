import { AppConfig, UserOptions } from './types/config'
import { Validator, merge, log } from './util/index'
import { uuid, mergeJSON } from './util/index'

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
    // errorReact: true, // React运行报错
    errorTry: true, // try未catch报错
  },
  // 忽略某种错误
  ignore: {
    ignoreErrors: [], // 忽略某种错误，对照error stack，支持Regexp和Function
    ignoreUrls: [], // 忽略某页面url或文件url或接口报错，支持单条或数组
  },
  behavior: true, // 是否监控用户行为，默认为true, 可为json
  performance: true, // 是否监控页面性能，默认为true, 可配置为json
  // 离线相关 undo
}

function validataFunc(options: UserOptions): string {
  const validator = new Validator()
  validator.add(options.appkey, 'isNonEmpty', 'appkey不能为空')
  validator.add(options.reportUrl, 'isNonEmpty', '上报地址不能为空')
  // validator.add(
  //   options.uuid,
  //   'isNonEmpty',
  //   '未设置uuid(设备唯一标识), 无法统计设备分布数等信息'
  // )
  validator.add(
    options.uid,
    'isNonEmpty',
    '未设置uid(用户唯一标识), 无法统计新增用户数'
  )
  const errorMsg = validator.start()
  log(errorMsg)
  return errorMsg
}

export function initConfig(options: UserOptions): AppConfig {
  const errMsg = validataFunc(options)
  if (errMsg) {
    log(errMsg)
    return
  }
  // uuid
  const localUUId = window.localStorage.getItem('monitor-uuid')
  if (localUUId) {
    options.uuid = localUUId
  } else {
    if (!options.uuid) {
      options.uuid = uuid()
    }
    window.localStorage.setItem('monitor-uuid', options.uuid)
  }
  defaultConfig = merge(defaultConfig, options)
  return defaultConfig
}

// export function initConfig(options: UserOptions): AppConfig {
//   // todo 校验
//   mergeJSON(options, defaultConfig)
//   return defaultConfig
// }

export function getConfig(name: string): string | boolean {
  // todo
  return true
}
