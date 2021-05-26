import { AppConfig, UserOptions } from './types/config'
import { initConfig } from './config'
import { initCallback } from './collector/index'
import {
  listenError,
  listenAjax,
  listenVueError,
  listenRouter,
  listenBehavior,
  listtenPerformance,
} from './listenEvents'

class Monitor {
  options: UserOptions
  config: AppConfig
  constructor(options: UserOptions) {
    // 合并配置 debug
    this.config = initConfig(options)
    this.init()
  }
  init(): void {
    initCallback()
    this.initEvents()
  }
  initEvents(): void {
    if (this.config.error) {
      const {
        errorJS,
        errorVue,
        errorAjax,
        errorResource,
      } = this.config.errorConfig
      console.log('init err')
      errorJS && listenError()
      errorAjax && listenAjax()
      if (errorVue && this.config._Vue) {
        listenVueError(this.config._Vue)
      }
    }
    if (this.config.behavior) {
      listenRouter()
      listenBehavior()
    }
    if (this.config.performance) {
      listtenPerformance()
    }
  }
}

export default Monitor
