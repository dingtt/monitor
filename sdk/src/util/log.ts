// import { defaultConfig as config } from '../config'

import { voidFun } from '@/types/config'

// export function log(...args: any[]): Console | voidFun {
//   const isStop = false
//   const f = function () {}
//   if (isStop || !window.console) {
//     return f
//   }
//   // if (!config.isTest) return
//   const log = console.log.bind(window.console)
//   return log
// }

export const log = (() => {
  const isStop = false
  const f = function () {}
  if (isStop || !window.console) {
    return f
  }
  const log = console.log.bind(window.console)
  return log
})()
