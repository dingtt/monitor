interface IEeventData {
  eventType: string
  func: string
}

class EventCenter {
  protected list: IEeventData[] = []
  // constructor() {}
  reset(): void {
    this.list = []
  }
  push(data: IEeventData): void {
    // console.log('event push')
    this.list.push(data)
    console.log('eventCenter', this.list)
  }
  // get(): IEeventData[] {
  //   return this.list
  // }
}
export default new EventCenter()


