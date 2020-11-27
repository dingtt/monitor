import { AppConfig, UserOptions } from './types/config'
import {initConfig } from './config'
import {
  listenError,
  listenPromiseError,
  // listenXMLHttpRequest,
  listenVueError,
  listenRouter,
  listenBehavior,
  listtenPerformance,
} from './listenEvents'

class Monitor {
  options: UserOptions
  config: AppConfig
  // eventE: EventEmitter
  constructor(options: UserOptions) {
    // 合并配置 debug
    this.config = initConfig(options)
    // this.eventE = new EventEmitter()
    this.init()
  }
  init(): void {
    console.log('config', this.config)
    this.initEvents()
  }

  initEvents(): void {
    console.log('this in initListen', this)
    this.config._Vue && listenVueError(this.config._Vue)
    if (this.config.error) {
      listenPromiseError()
      listenError()
      // listenXMLHttpRequest()
    }
    if (this.config.behavior) {
      listenRouter()
      listenBehavior()
    }
    if (this.config.performance) {
      listtenPerformance()
    }

    // console.log('this in initListen', this)
    // this.config.error && listenError()
    // this.config._Vue && listenVueError(this.config._Vue)
    // this.config.error &&
    //   this.config.errorConfig.errorAjax &&
    //   listenXMLHttpRequest()
    // this.config.performance && listtenPerformance()
    // this.config.behavior && listenRouter()
    // this.config.behavior && listenBehavior()
  }
}

export default Monitor

// 返回 type 和 数据
