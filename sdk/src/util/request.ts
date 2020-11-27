const TIMEOUT = 30000

// 图片请求
export function imgLoad(src: string): void {
  let img = new Image()
  img.src = src
  img.onload = (res) => {
    img = null
  }
  img.onerror = (err) => {
    img = null
  }
}

export function imgLoadPromise(url: string): Promise<Event> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = (res) => {
      resolve(res)
    }
    img.onerror = (err) => {
      reject(err)
    }
    img.src = url
  })
}

// function loadImg(url) {
//   return new Promise((resolve, reject) => {
//       const img = new Image()
//       img.onload = function () {
//           console.log('一张图片加载完成');
//           resolve();
//       }
//       img.onerror = reject
//       img.src = url
//   })
// };

// get请求
export function xhrGet(url: string): void {
  if (!window.XMLHttpRequest) return
  const xhr = new XMLHttpRequest()
  xhr.open('GET', url)
  xhr.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8')
  xhr.withCredentials = true
  xhr.timeout = TIMEOUT || 30000
  xhr.onload = () => {
    console.log(xhr.responseText)
  }
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 400) {
        console.log(xhr.responseText)
      }
    }
  }
  xhr.send()
}

// export function xhrGetPromise(url: string): Promise<Event> | void {
//   if (!window.XMLHttpRequest) return
//   return new Promise((resolve, reject) => {
//     const xhr = new XMLHttpRequest()
//     xhr.open('GET', url)
//     xhr.setRequestHeader('C0ntent-Type', 'text/plain;charset=UTF-8')
//     xhr.onreadystatechange = () => {
//       if (xhr.readyState === 4) {
//         if(xhr.status >= 200 && xhr.status < 400){
//           resolve()
//         }else{
//           reject()
//         }
//       }
//     }
//   })
// }

// post请求
export function xhrPost(
  url: string,
  data: unknown,
  xhr?: XMLHttpRequest
): void {
  if (!window.XMLHttpRequest || !window.JSON) return
  xhr = xhr || new XMLHttpRequest()
  xhr.open('post', url)
  xhr.setRequestHeader('content-type', 'application/json;charset=utf-8')
  xhr.setRequestHeader('Accept', 'application/json')
  xhr.withCredentials = true
  xhr.timeout = TIMEOUT || 30000
  xhr.onload = function () {
    console.log(xhr.responseText)
  }
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 400) {
        console.log(xhr.responseText)
      } else {
        throw new Error('网络请求错误，请稍后再试～')
      }
    }
  }
  xhr.send(window.JSON.stringify(data))
}
