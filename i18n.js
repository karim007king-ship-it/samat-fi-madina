/* ===== i18n.js — اللغات =====
   يختار اللغة من localStorage ثم المتصفح، وإلا التونسية.
   ملفات lang_*.js تُحمَّل من index.html قبل story.js (لا document.write).
   صيغة الملف: LNG.xx = { t:{مفتاح:نص}, rx:{...} }
   الواجهة: TR(مفتاح) | RX.اسم | D(رقم) | setLang(رمز) */
var LNG = window.LNG || (window.LNG = {});
var LANGS = [['tn', 'تونسي', 'rtl'], ['ar', 'العربية الفصحى', 'rtl'], ['fr', 'Français', 'ltr'], ['en', 'English', 'ltr']];
var LANG = (function () {
  try {
    var q = new URLSearchParams(location.search).get('lang');
    if (q && LANGS.some(function (x) { return x[0] === q; })) {
      try { localStorage.setItem('lang', q); } catch (e2) { }
      return q;
    }
  } catch (e) { }
  try {
    var l = localStorage.getItem('lang');
    if (LANGS.some(function (x) { return x[0] === l; })) return l;
  } catch (e) { }
  var n = (navigator.language || 'ar').slice(0, 2);
  return n === 'fr' ? 'fr' : n === 'en' ? 'en' : 'tn';
})();
(function () {
  var d = LANGS.filter(function (x) { return x[0] === LANG; })[0] || LANGS[0];
  var h = document.documentElement;
  h.lang = LANG === 'tn' ? 'ar' : LANG;
  h.dir = d[2];
})();

function _lg() {
  return (LNG[LANG] && LNG[LANG].t) ? LNG[LANG] : (LNG.tn || { t: {}, rx: {} });
}
function TR(k) {
  var a = (_lg().t) || {};
  var b = (LNG.tn && LNG.tn.t) || {};
  return k in a ? a[k] : (k in b ? b[k] : k);
}
var TXT = new Proxy({}, {
  has: function (_, k) { return k in ((_lg().t) || {}) || k in ((LNG.tn && LNG.tn.t) || {}); },
  get: function (_, k) { return TR(k); }
});
var RX = new Proxy({}, {
  get: function (_, k) {
    var r = _lg().rx;
    return (r && r[k]) || (LNG.tn && LNG.tn.rx && LNG.tn.rx[k]);
  }
});
function D(n) {
  var g = TR('ui.digits') || '0123456789';
  return String(n).replace(/\d/g, function (d) { return g[+d] || d; });
}
var LOC = LANG === 'fr' ? 'fr' : LANG === 'en' ? 'en' : 'ar';
function setLang(c) {
  try { localStorage.setItem('lang', c); } catch (e) { }
  // إعادة تحميل مع كسر الكاش حتى لا تبقى الإعدادات باللغة القديمة
  var u = location.href.split('#')[0].split('?')[0];
  location.replace(u + '?lang=' + encodeURIComponent(c) + '&t=' + Date.now());
}
