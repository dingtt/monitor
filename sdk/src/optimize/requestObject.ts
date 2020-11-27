export default class RequestObject {
  _type: string
  static _id = -1
  _works: Array<XMLHttpRequest | HTMLImageElement>
  _work: XMLHttpRequest | HTMLImageElement
  constructor(type: string) {
    this._type = type
  }
  get(): any {
    for (let i = 0; i < this._works.length; i++) {
      if (this._works[i]['enabled'] == false) {
        this._works[i]['enabled'] = true
        this._work = this._works[i]
        return this._works
      }
    }
    this._work = this._type === 'xhr' ? new XMLHttpRequest() : new Image()
    this._work['id'] = ++RequestObject._id
    this._work['enabled'] = true
    this._works.push(this._work)
    return this._work
  }
  able(): void {
    this._work['enabled'] = false
    for (let i = 0; i < this._works.length; i++) {
      if (this._works[i]['id'] === this._work['id']) {
        this._works[i]['enabled'] = false
      }
    }
  }
}

// public addTimer(
//   callback: voidFun,
//   timeout: number = 1,
//   onlyOnce: boolean = false,
//   data: unknown = undefined
// ): number {
//   let timer: unknown
//   let found: boolean = false
//   for(let i ; i< this.timers.length; i++){
//     if(timer.enabled === false){
//       timer.callback = callback
//       timer.callbackData = data
//       timer.timeout = timeout
//       timer.enbaled = true
//       timer.onlyOnce = onlyOnce
//       return timer.id
//     }
//   }
//   // 不存在，就new 一个新的Timer，并设置所有相关属性
//   timer = new timer(callback)
//   timer.callbackData = data
//   timer.timeout = timeout
//   timer.countdown = timeout
//   timer.enabled = true
//   timer.id = ++ this._timeId // 初始化id为-1，前 ++
//   timer.onlyOnce = onlyOnce
//   this.timers.push(timer)
//   return timer.id
// }
// addTask(callback: voidFun, data: any) {
//   let work: any
//   for (let i; i < this.works.length; i++) {
//     if (this.works[i]['enabled'] === false) {
//       work.callback = callback
//       work.data = data
//       return work.id
//     }
//   }
//   work = new Image()
//   work.data = data
//   work.enabled = true
//   work.id == ++this.workId //
//   this.works.push(work)
//   // return work.id
// }
