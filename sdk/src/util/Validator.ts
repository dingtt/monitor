const strategies = {
  isNonEmpty: function (value, errorMsg: string) {
    if (value === '') {
      return errorMsg
    }
  },
  minLength: function (value, length: number, errorMsg: string) {
    if (value.length < length) {
      return errorMsg
    }
  },
}

export  class Validator {
  public cache = []
  public add(value: unknown, rule: string, msg: string): void {
    const arr: any[] = rule.split(':')
    this.cache.push(function () {
      const strategy = arr.shift()
      arr.unshift(value)
      arr.push(msg)
      return strategies[strategy].apply(this, arr)
    })
  }
  public start(): string {
    for (let i = 0, validatorFunc; (validatorFunc = this.cache[i++]); ) {
      const msg = validatorFunc()
      if (msg) {
        return msg
      }
    }
  }
}
