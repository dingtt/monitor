export const ua = navigator.userAgent.toLowerCase()

export const testUa = (regexp) => regexp.test(ua)
export const testVs = (regexp) =>
  ua
    .match(regexp)
    .toString()
    .replace(/[^0-9|_.]/g, '')
    .replace(/_/g, '.')
    
export function getCustomEvent() {
  if (typeof window.CustomEvent === 'function') return window.CustomEvent

  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined }
    const evt = document.createEvent('CustomEvent')
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
    return evt
  }
  CustomEvent.prototype = window.Event.prototype
  return CustomEvent
}