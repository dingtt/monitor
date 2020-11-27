import { defaultConfig as config } from '../config'

export function log(...args: any[]): void {
  const isStop = false
  if (isStop) return
  if (!config.isTest) return
  console.log(...args)
}
