export class EventEmitter {
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
    if (this.map[name]) {
      const cbs = this.map[name]
      cbs.forEach((cb) => {
        cb(...args)
      })
    }
  }
}
