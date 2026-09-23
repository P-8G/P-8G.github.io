/* 天气小组件 — Open-Meteo 免费API（无需key）
 * 数据源: https://open-meteo.com  |  免费 1万次/天, 支持CORS
 * 用法: 页面放一个 <div id="weather-widget"></div>, 引入本脚本即可
 */
(function () {
  'use strict';

  /* ===== 配置区（按需修改）===== */
  // 默认城市：定位失败/拒绝授权时显示。改成你自己的城市坐标
  var FALLBACK_CITY = { name: '苏州', lat: 31.2989, lon: 120.5853 };
  // 缓存时长（分钟），避免频繁请求API
  var CACHE_MINUTES = 30;
  // 是否尝试浏览器定位（访客会收到授权提示）
  var USE_GEOLOCATION = true;

  var CACHE_KEY = 'weather_widget_cache_v2';

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

  function fetchWeather(lat, lon, name, cb) {
    var url = 'https://api.open-meteo.com/v1/forecast' +
      '?latitude=' + lat + '&longitude=' + lon +
      '&current=temperature_2m,weather_code' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
      '&timezone=auto&forecast_days=1';
    fetch(url).then(function (r) { return r.json(); })
      .then(function (j) { cb(null, j, name); })
      .catch(function (e) { cb(e); });
  }

  function render(j, cityName) {
    var cur = j.current, daily = j.daily;
    var box = document.getElementById('weather-widget');
    if (!box) return;

    box.innerHTML =
      '<div class="ww-city">' + cityName + ' · ' + desc(cur.weather_code) + '</div>' +
      '<div class="ww-temp">' + Math.round(cur.temperature_2m) + '°</div>' +
      '<div class="ww-today">今天 ' + Math.round(daily.temperature_2m_min[0]) + '° / ' + Math.round(daily.temperature_2m_max[0]) + '°</div>';
  }

  function fail(msg) {
    var box = document.getElementById('weather-widget');
    if (box) box.innerHTML = '<div class="ww-err">天气不可用</div>';
    console.warn('[weather-widget]', msg);
  }

  function start(lat, lon, name) {
    var cached = loadCache();
    if (cached) { render(cached.d, cached.n); return; }
    fetchWeather(lat, lon, name, function (err, j, n) {
      if (err) { fail(err.message || 'fetch error'); return; }
      saveCache(j);
      render(j, n);
    });
  }

  function init() {
    if (USE_GEOLOCATION && navigator.geolocation) {
      var done = false;
      navigator.geolocation.getCurrentPosition(function (pos) {
        if (done) return; done = true;
        start(pos.coords.latitude, pos.coords.longitude, '本地');
      }, function () {
        if (done) return; done = true;
        start(FALLBACK_CITY.lat, FALLBACK_CITY.lon, FALLBACK_CITY.name);
      }, { timeout: 4000 });
      setTimeout(function () {
        if (!done) { done = true; start(FALLBACK_CITY.lat, FALLBACK_CITY.lon, FALLBACK_CITY.name); }
      }, 4500);
    } else {
      start(FALLBACK_CITY.lat, FALLBACK_CITY.lon, FALLBACK_CITY.name);
    }
  }

  // 注入样式（右上角悬浮卡片，使用主题 CSS 变量以适配明暗模式）
  var css = document.createElement('style');
  css.textContent =
    '#weather-widget{position:fixed;top:76px;right:24px;z-index:100;padding:10px 16px;border-radius:10px;background:var(--board-bg-color);border:1px solid var(--line-color);box-shadow:0 2px 12px rgba(0,0,0,.08);font-size:14px;line-height:1.6;color:var(--text-color);text-align:left}' +
    '.ww-city{font-size:12px;color:var(--sec-text-color)}' +
    '.ww-temp{font-size:28px;font-weight:600}' +
    '.ww-today{font-size:13px;color:var(--sec-text-color)}' +
    '@media (max-width: 767.98px){#weather-widget{top:64px;right:12px;padding:8px 12px}}' +
    '@media (prefers-reduced-motion: reduce){#weather-widget *{transition:none!important}}';
  document.head.appendChild(css);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
