export default class EventEmitter {
  public map: { [k: string]: [any] }
  constructor() {
    this.map = {}
  }
  on(name: string, fn): void {
    if (!this.map[name]) {
      this.map[name] = [fn]
    } else {
      this.map[name].push(fn)
    }
  }
  emit(name: string, ...args): void {
    console.log('emit', name)
    if (this.map[name]) {
      const cbs = this.map[name]
      cbs.forEach((cb) => {
        cb(...args)
      })
    }
  }
  off() {}
  // 事件回调
  static instance = (() => {
    let eventEmitter = null
    return () => {
      if (!eventEmitter) {
        eventEmitter = new EventEmitter()
      }
      return eventEmitter
    }
  })()
}
