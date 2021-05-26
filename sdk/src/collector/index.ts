import { handlePerformance } from './perf' //  性能业务逻辑   环境  行为
import {
  handleBehaviorEvent,
  handleHistoryChange,
  handleHashChange,
} from './behavior'
import { handleError, handleAJAX, handleVueError } from './error'
import { LISTEN_EVENTS } from '../types/index'
import EventEmitter from '../EventEmitter'

const eventEmitter = EventEmitter.instance()

export function initCallback() {
  eventEmitter.on(LISTEN_EVENTS.ERROR, handleError)
  eventEmitter.on(LISTEN_EVENTS.AJAX_LOAD, handleAJAX)
  eventEmitter.on(LISTEN_EVENTS.AJAX_ERROR, handleAJAX)
  eventEmitter.on(LISTEN_EVENTS.VUE, handleVueError)
  eventEmitter.on(LISTEN_EVENTS.ONLOAD, handlePerformance)
  eventEmitter.on(LISTEN_EVENTS.HISTORYCHANGE, handleHistoryChange)
  eventEmitter.on(LISTEN_EVENTS.HASHCHANGE, handleHashChange)
  eventEmitter.on(LISTEN_EVENTS.CLICK, handleBehaviorEvent)
  eventEmitter.on(LISTEN_EVENTS.INPUT, handleBehaviorEvent)
}
