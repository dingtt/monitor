import { getParam, delay, log } from '../util/index'
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
  // const originalPerfTiming = performance.timing.toJSON()
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
  calculateTiming(perf)
  const perfExt = handleEntry()
  const mergePerf = {
    ...perf,
    ...perfExt,
    time: Date.now(),
  }
  // 采样率
  if (Math.random() <= config.rate) {
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

export function handleEntry(): PerfExt {
  // window.performance.getEntries()
  let fp, // 白屏时间
    fcp, // 首屏时间
    markFp, // 打点近似白屏时间
    markFcp, // 打点首屏
    markPd = 0 // 打点onload
  log('entries in onload', performance.getEntries())
  // 首屏计算
  let longImgLoad = 0
  // 首屏时间(FCP) VS 白屏时间(FP)
  const entries = performance.getEntries()
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const metricName = entry.name
    const time = Math.round(entry.startTime + entry.duration)
    // 官方API
    // PerformancePaintTiming  只支持 chrome60 opera47
    // FP和FCP时间一致，FP时间不准
    if (metricName === 'first-paint') {
      fp = time
    }
    if (metricName === 'first-contentful-paint') {
      fcp = time
    }
    if (
      entry.entryType === 'resource' &&
      (entry as PerformanceResourceTiming).initiatorType === 'img'
    ) {
      // todo需要排除 上报图片
      log('entry img', entry)
      longImgLoad = time > longImgLoad ? time : longImgLoad
    }
    // 自定义埋点
    // 需要客户端于</head>前自行埋点
    if (metricName === 'first-paint-script') {
      markFp = time
    }
    // onload perAPI中添加了埋点， 这个时间也可以在performance中计算得到
    if (metricName === 'monitor-page-loaded') {
      markPd = time
    }
    // 需要客户端自行埋点
    if (metricName === 'first-contentful-paint-custom') {
      markFcp = time
    }
    //
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
    markPd,
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
    markPd,
    longImgLoad,
  }
  //图片时间
  // 计算最长图片加载时间  判断是不是本站图片  排除上报gif
  // chrome initiatorType: "img"  entryType: "resource"
  // foxire initiatorType: "other"  entryType: "resource"   script initiatorType
}

// domObserver.disconnect()

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
  // onload 里调用时，perf.loadEventEnd 未结束值为0
  log('onload总下载时间', perf.loadEventEnd - perf.navigationStart)
}
