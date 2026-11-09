// 首页识别：为 body 添加 is-home 类，配合 monochrome.css 隐藏签名 banner
// Detect the home page and tag <body> so CSS can strip the signature banner
(function () {
  var path = location.pathname;
  if (path === '/' || /index\.html?$/.test(path)) {
    document.body.classList.add('is-home');
  }
})();
