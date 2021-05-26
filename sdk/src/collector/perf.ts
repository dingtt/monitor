import { getParam, log } from '../util/index'
import { PerfData, PerfExt } from '../types/index'
import report from '../report'
import { defaultConfig as config } from '../config'

// 性能
export async function handlePerformance(): Promise<PerfData> {
  const performance = window.performance
  if (!performance) {
    log('当前浏览器不支持performance')
    return
  }
  performance.mark('monitor-page-loaded')

  const perf = (await getPerformance()) as PerfData
  // 约定起始时间
  if (config['benginkey']) {
    const timeFlag = config['benginkey']
    if (window.location.href.indexOf(timeFlag) > -1) {
      const params = getParam()
      if (params[timeFlag]) {
        perf['beginTime'] = params[timeFlag]
      }
    }
  }

  // 首次加载或刷新  方案二  利用给window.name属性赋值，在页面刷新时不会重置判断
  if (performance.navigation) {
    perf['isRefresh'] =
      performance.navigation.type === (performance.navigation.TYPE_RELOAD || 1)
        ? 1
        : 0
  } else {
    perf['isRefresh'] = window.name === 'monitor' ? 1 : 0
  }
  // 测试输出
  config.isTest && calculateTiming(perf)
  const perfExt = handleEntry()
  const mergePerf = {
    ...perf,
    ...perfExt,
    time: Date.now(),
  }
  // 采样率
  if (Math.random() <= 0.3) {
    // config.rate
    report.add('perf', mergePerf)
  }
  // calculateImageLoadTime() // 计算图片加载时间
}

async function getPerformance(): Promise<PerformanceTiming> {
  return new Promise((resolve, reject) => {
    if (window.performance && window.performance.timing) {
      setTimeout(() => {
        const timing = window.performance.timing
        resolve(timing.toJSON())
      })
    } else {
      reject()
    }
  })
}

function getTimeFromEntry(entry: PerformanceEntry): number {
  if (!entry) return 0
  return entry.startTime + entry.duration
}

export function handleEntry(): PerfExt {
  let fp, // 白屏时间
    fcp, // 首屏时间
    markFp, // 打点近似白屏时间
    markFcp, // 打点首屏
    markLoad = 0 // 打点onload
  log('entries in onload', performance.getEntries())
  let longImgLoad = 0
  // 官方API
  // PerformancePaintTiming  只支持 chrome60 opera47
  // FP和FCP时间一致，FP时间不准
  fp = getTimeFromEntry(performance.getEntriesByName('first-paint')[0])
  fcp = getTimeFromEntry(
    performance.getEntriesByName('first-contentful-paint')[0]
  )
 
  // 首屏时间(FCP) VS 白屏时间(FP)
  const entries = performance.getEntries()
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const metricName = entry.name
    const time = Math.round(entry.startTime + entry.duration)
    if (
      entry.entryType === 'resource' &&
      (entry as PerformanceResourceTiming).initiatorType === 'img'
    ) {
      if (entry.name.indexOf(config.reportUrl) == -1) {
        log('entry img', entry)
        longImgLoad = time > longImgLoad ? time : longImgLoad
      }
    }
    // 获取打点数据进行步骤
    // 需要客户端于</head>前自行埋点
    if (metricName === 'first-paint-script') {
      markFp = time
    }
    // onload perAPI中添加了埋点， 这个时间也可以在performance中计算得到
    if (metricName === 'monitor-page-loaded') {
      markLoad = time
    }
    // 需要客户端自行埋点
    if (metricName === 'first-contentful-paint-custom') {
      markFcp = time
    }
    // Firefox  type 为initiatorTypeother
    // "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0"
    // safari 无FP FCP
    // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Safari/604.1.38" =
  }

  log('raw perf', {
    fp,
    fcp,
    markFp,
    markFcp,
    markLoad,
    longImgLoad,
  })
  // api 不存在使用埋点数据
  // fp = fp > 0 ? fp : markFp || 0
  // // fcp 和 fp一致,且埋点数据存在，使用埋点点数据
  // if (fcp > 0 && fp === fcp && markFp) {
  //   fp = markFp
  // }
  return {
    fp,
    markFp,
    fcp,
    markFcp,
    markLoad,
    longImgLoad,
  }
}

export function perfObserver() {
  // FID
  const observerInput = new PerformanceObserver(
    (list: PerformanceObserverEntryList, observer) => {
      const firstInput = list.getEntries()[0]
      const inputDelay = firstInput['processingStart'] - firstInput.startTime
      observerInput.disconnect()
    }
  )
  observerInput.observe({ type: 'first-input', buffered: true })
  // slow frame
  const slowFrameObserver = new PerformanceObserver(
    (list: PerformanceObserverEntryList) => {
      const perEntries = list.getEntries()
      for (let i = 0; i < perEntries.length; i++) {
      }
      slowFrameObserver.disconnect()
    }
  )
  slowFrameObserver.observe({ entryTypes: ['frame'] })
  // longtask 需要用观察者  只有chrome支持
  let num = 0
  const longTaskObserver = new PerformanceObserver(
    (list: PerformanceObserverEntryList) => {
      num++
      const perEntries = list.getEntries()
      for (let i = 0; i < perEntries.length; i++) {
      }
    }
  )
  longTaskObserver.observe({
    entryTypes: ['longtask']
  })
  // LCP
  const lcpFrameObserver = new PerformanceObserver(
    (list: PerformanceObserverEntryList) => {
      const perEntries = list.getEntries()
      for (let i = 0; i < perEntries.length; i++) {
      }
      slowFrameObserver.disconnect()
    }
  )
  lcpFrameObserver.observe({ type: 'largest-contentful-paint', buffered: true })
  // CLS
  let cls = 0
  const clsObserver = new PerformanceObserver(
    (list: PerformanceObserverEntryList) => {
      const perEntries = list.getEntries()
      for (let i = 0; i < perEntries.length; i++) {
        if(!perEntries[i]['hadRecentInput']){
          cls += perEntries[i]['value']
        }
      }
      slowFrameObserver.disconnect()
    }
  )
  clsObserver.observe({ type: 'layout-shift', buffered: true })
}

// 测试输出
function calculateTiming(perf) {
  log('perf', perf)
  log('重定向耗时', perf.redirectEnd - perf.redirectStart)
  log('DNS查询耗时', perf.domainLookupEnd - perf.domainLookupStart)
  log('TCP链接耗时', perf.connectEnd - perf.connectStart)
  log('HTTP请求耗时 ', perf.responseEnd - perf.responseStart)
  log('解析dom树耗时', perf.domComplete - perf.domInteractive)
  log('首包时间（~<白屏时间） ', perf.domLoading - perf.navigationStart)
  log(
    'domready可操作时间',
    perf.domContentLoadedEventEnd - perf.navigationStart
  )
  // 需在onload里调用时，perf.loadEventEnd 未结束时值为0
  log('onload总下载时间', perf.loadEventEnd - perf.navigationStart)
}
