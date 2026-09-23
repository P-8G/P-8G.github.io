/* 天气小组件 — Open-Meteo 免费API（无需key）
 * 数据源: https://open-meteo.com  |  免费 1万次/天, 支持CORS
 * 用法: 在页脚放一个 <span id="weather-widget"></span>, 引入本脚本即可
 */
(function () {
  'use strict';

  /* ===== 配置区（按需修改）===== */
  // 展示的城市（固定为苏州，不请求浏览器定位）
  var CITY = { name: '苏州', lat: 31.2989, lon: 120.5853 };
  // 缓存时长（分钟），避免频繁请求API
  var CACHE_MINUTES = 30;

  var CACHE_KEY = 'weather_widget_cache_v3';

  // WMO天气代码 -> 描述
  var WMO = {
    0: '晴', 1: '大致晴', 2: '多云', 3: '阴',
    45: '雾', 48: '雾凇',
    51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨',
    61: '小雨', 63: '中雨', 65: '大雨',
    66: '冻雨', 67: '强冻雨',
    71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒',
    80: '阵雨', 81: '强阵雨', 82: '暴雨',
    85: '小阵雪', 86: '大阵雪',
    95: '雷雨', 96: '雷雨伴冰雹', 99: '强雷雨冰雹'
  };
  function desc(code) { return WMO[code] || '未知'; }

  function loadCache() {
    try {
      var c = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (c && Date.now() - c.t < CACHE_MINUTES * 60000) return c;
    } catch (e) {}
    return null;
  }
  function saveCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: data })); } catch (e) {}
  }

  function fetchWeather(cb) {
    var url = 'https://api.open-meteo.com/v1/forecast' +
      '?latitude=' + CITY.lat + '&longitude=' + CITY.lon +
      '&current=temperature_2m,weather_code' +
      '&timezone=auto';
    fetch(url).then(function (r) { return r.json(); })
      .then(function (j) { cb(null, j); })
      .catch(function (e) { cb(e); });
  }

  function render(j) {
    var box = document.getElementById('weather-widget');
    if (!box) return;
    var cur = j.current;
    box.innerHTML = CITY.name + ' · ' + desc(cur.weather_code) + ' ' + Math.round(cur.temperature_2m) + '°';
  }

  function fail(msg) {
    var box = document.getElementById('weather-widget');
    if (box) box.textContent = '天气不可用';
    console.warn('[weather-widget]', msg);
  }

  function start() {
    var cached = loadCache();
    if (cached) { render(cached.d); return; }
    fetchWeather(function (err, j) {
      if (err) { fail(err.message || 'fetch error'); return; }
      saveCache(j);
      render(j);
    });
  }

  // 注入样式（页脚内联小字，使用主题 CSS 变量以适配明暗模式）
  var css = document.createElement('style');
  css.textContent =
    '#weather-widget{display:inline;font-size:13px;color:var(--sec-text-color);margin-left:8px}' +
    '@media (prefers-reduced-motion: reduce){#weather-widget *{transition:none!important}}';
  document.head.appendChild(css);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else { start(); }
})();
