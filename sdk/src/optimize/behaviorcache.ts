// import { BREADCRUMBTYPES, BREADCRUMBCATEGORYS } from '@/common'
// import { logger, validateOption, getTimestamp, slientConsoleScope } from 'utils'
// import { _support } from '@/utils/global'
// import { BreadcrumbPushData } from '@/types/breadcrumb'
// import { InitOptions } from '@/types/options'
import { BehaviorData } from '../types/index'
// 错误加日志数据   纯行为数据
// type CacheType =
export default class BehaviorCache {
  private maxNum = 20
  private beforePush: unknown = null
  private stack: BehaviorData[] = []
  constructor() {}
  set(options) {
    const { maxNum, beforePush } = options
    // validateOption(maxNum, 'maxNum', 'number') && (this.maxNum = maxNum)
    // validateOption(beforePush, 'beforePush', 'function') && (this.beforePush = beforePush)
  }
  // push(data: BehaviorData): void {
  //   if (typeof this.beforePush === 'function') {
  //     let result: BreadcrumbPushData = null
  //     // 如果用户输入console，并且logger是打开的会造成无限递归，
  //     // 应该加入一个开关，执行这个函数前，把监听console的行为关掉
  //     slientConsoleScope(() => {
  //       result = (this.beforePushBreadcrumb as Function)(this, data)
  //     })
  //     if (result) {
  //       this.immediatePush(result)
  //     }
  //     return
  //   }
  //   this.immediatePush(data)
  // }
  immediatePush(data: BehaviorData): void {
    // data.time = getTimestamp()
    if (this.stack.length >= this.maxNum) {
      this.shift()
    }
    this.stack.push(data)
    console.log('behaviorCache', this.stack)
  }
  shift(): boolean {
    return this.stack.shift() !== undefined
  }
  getStack(): BehaviorData[] {
    return this.stack
  }
}
// const behaviorCache = _support.breadcrumb || (_support.breadcrumb = new Breadcrumb())
// const behaviorCache = new BehaviorCache()
// export { behaviorCache }
