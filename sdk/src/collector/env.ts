// 坏境信息采集
// 地域分布  浏览器分布
// 业务信息：通过主动上报客户端能力上报和UA上报
// 设备信息：通过客户端能力上报和UA上报
// 网络类型  navigator.connection
// 网络状态变化
// 路由变化
import { Ienv, LOG_TYPES } from '../types/index'
// import { report } from '../report'

export function handleEnv(): void {
  // report.directReport(LOG_TYPES.ENV, {})
}
// 环境
export function getEnv(): Ienv {
  if (typeof window === 'undefined') return
  const navigator = window.navigator
  const connection = navigator['connection']
  const envData = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    url: window.location.href,
    net: connection ? connection.effectiveType : null,
    // type:
  }
  return envData
}

// navigator.onLine
//window.online
//window.onoffline
// navigator.getBattery .battery
// 内存 deviceMemory
