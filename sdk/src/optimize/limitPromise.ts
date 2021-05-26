import { voidFun } from '../types/config'

export default class LimitPromise {
  _max: number
  _count: number
  _taskQueue: unknown[]
  constructor(max: number) {
    // "并发上限"
    this._max = max
    // 当前正在执行的任务数量
    this._count = 0
    this._taskQueue = []
  }
  call(caller: voidFun, ...args: unknown[]): Promise<Event> {
    return new Promise((resolve, reject) => {
      const task = this.createTask(caller, args, resolve, reject)
      if (this._count > this._max) {
        this._taskQueue.push(task)
      }
    })
  }
  createTask(caller: voidFun, args: unknown[], resolve: unknown, reject: unknown) {
    return (): void => {
      this._count++
    }
  }
}
