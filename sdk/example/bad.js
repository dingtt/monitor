// console引起错误
// console.log(hun)

// 资源加载错误
// 动态加载图片（常用于懒加载） ，new Image() 无法捕捉到错误
const errImg = new Image()
// // errImg.src = "https://avatar.csdnimg.cn/3/8/3/3_weixin_34367846.jpg"
// errImg.src = "https://wx1.sinaimg.cn/thumb180/005vnhZYgy1ghevgfblcej30go0m8n1v2.jpg"
// errImg.onload = (e) => {
//   console.log(e)
// }
// errImg.onerror = (err) => {
//   console.log('img src',err)
// }
// 图床可能会有http403错误
// 解决方案  劫持

// img标签加载本地图片加载错误 加载错误
// add 可以捕捉到
// img标签加载远程图片

// 异步错误
function fun1() {
  throw new Error('this is the error happened in settimeout')
}

setTimeout(() => {
  Math.random() < 0.8 ? fun1() : void 0
}, 1000)

// 均可捕获系列

// SyntaxError：语法错误

if (Math.random() < 0.8) {
  //  var 1       // Uncaught SyntaxError: Unexpected number
  //  var 1a       // Uncaught SyntaxError: Invalid or unexpected token
  // 1.2 给关键字赋值
  //  function = 5
}

//  Uncaught ReferenceError：引用错误
if (Math.random() < 0.8) {
  // console.log('abc') = 1
  // a()
}

// RangeError：范围错误
if (Math.random() < 0.8) {
  var num = new Number(12.34)
  var arr = []
  arr.length = -5
}

// TypeError类型错误
if (Math.random() < 0.8) {
  123()
  var p = new 456()
}

// URIError，URL错误
if (Math.random() < 0.8) {
  decodeURI('%')
}

// EvalError eval()函数执行错误
if (Math.random() < 0.8) {
  var myEval = eval
  myEval("alet('call eval')")
}

// Promise异常
if (Math.random() < 0.8) {
  new Promise((resolve, reject) => {
    abcxxx()
  })
}

// async/await异常捕获
const asyncFunc = () =>
  new Promise((resolve) => {
    // error
    throw new Error('this is the error happened in await')
  })
setTimeout(async () => {
  try {
    await asyncFunc()
  } catch (e) {
    console.log('catch:', e)
  }
})

const asyncFunc2 = async () =>
  new Promise((resolve) => {
    // error
    throw new Error('this is the error happened in await')
  })

// SyntaxError: await is only valid in async function
if (Math.random() < 0.8) {
  // await asyncFunc2()
}
if (Math.random() < 0.8) {
  ;(async () => {
    await asyncFunc2()
  })()
}

// vue错误

if(Math.random() < 0.8){ const vm = new Vue({
  el: "#app",
  data: {
    message: "Hello Vue.js!",
  },
  mounted(){
    // catchVue('kk', Vue)
    // this.reverseMessag()
    // this.reverseMessage()

    // setTimeout(function(){
    //    err
    // },1000)
  },
  methods: {
    reverseMessage: function () {
      this.message = this.message.split("").reverse().join("")
      // error
    },
  },
})}
