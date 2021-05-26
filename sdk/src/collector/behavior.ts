import { LISTEN_EVENTS } from '../types/index'
import { behaviorCache } from '../behaviorcache'
import { getHash, xpath } from '../util/index'
// import { config } from './config'

// 使用addEventListener全局监听点击事件，
// 将用户行为（click,input）和dom元素名称,
// 当错误发生将错误和行为一并上报

let oldURL = window.location.href
/**
 * historychange
 * 带hash的页面加载会触发popstate
 * 带hash回车 不管开始有没有hash 会触发俩事件
 * chrome 火狐 浏览器前进，从无到有hash，同时触发hashchange，从有到无不触发
 * chrome 火狐 浏览器后退，从无hash到有不触发，从有到无，同时触发hashchange
 *
 * @export
 * @param {PopStateEvent} e
 * @param {LISTEN_EVENTS} type
 */
export function handleHistoryChange(
  e: PopStateEvent,
  type: LISTEN_EVENTS
): void {
  const oldHash = getHash(oldURL)
  const newURL = (e.target as Window).location.href
  const newHash = (e.target as Window).location.hash
  // 缓存旧url用于数据处理
  const tempOldURL = oldURL
  oldURL = newURL // 更新URL
  if (oldHash || newHash) {
    // 这种情况 hashchange也会触发
    return
  }
  behaviorCache.directPush({
    type,
    data: {
      oldURL: tempOldURL,
      newURL,
    },
  })
  console.log('hs', behaviorCache)
}

export function handleHashChange(
  e: HashChangeEvent,
  type: LISTEN_EVENTS
): void {
  const { oldURL, newURL } = e
  behaviorCache.directPush({
    type,
    data: {
      newURL,
      oldURL,
    },
  })
}

export function handleBehaviorEvent(
  e: Event | MouseEvent,
  type: LISTEN_EVENTS
): void {
  const target = Array.isArray(e) ? e[0].target : e.target
  //   todo Xpath  outerHTML  offsetX pageX
  const { tagName, className, id, innerText } = target
  behaviorCache.directPush({
    type,
    data: {
      tagName,
      className,
      id,
      innerText: innerText.substr(0, 10),
      xpath: xpath(target),
      name: target.name || target.src || target.href,
    },
  })
  console.log('h', behaviorCache)
}
