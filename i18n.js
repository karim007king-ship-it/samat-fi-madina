/* ===== i18n.js — اللغات (يُحمَّل أولا) =====
   • يختار اللغة: localStorage.lang ثم لغة المتصفح (fr/en) وإلا التونسية.
   • يحمّل lang_tn.js (الأصل والاحتياط) ثم lang_<اللغة>.js؛ أي مفتاح ناقص يُعرض بالتونسية.
   • صيغة ملف اللغة: LNG.<رمز> = { t:{مفتاح:نص}, rx:{قواعد كشف المشاعر والكاميرا} }.
   • لإضافة لغة: ملف lang_xx.js جديد + سطر في LANGS أدناه (رمز، اسم العرض، الاتجاه rtl/ltr) + إضافته إلى sw.js.
   الواجهة: TR(مفتاح) نص | RX.<اسم> قاعدة لغوية | D(رقم) أرقام اللغة | setLang(رمز) تبديل اللغة وإعادة التحميل. */
var LNG = window.LNG || (window.LNG = {});
var LANGS = [['tn', 'تونسي', 'rtl'], ['ar', 'العربية الفصحى', 'rtl'], ['fr', 'Français', 'ltr'], ['en', 'English', 'ltr']];
var LANG = (function () {
  try { var l = localStorage.getItem('lang'); if (LANGS.some(function (x) { return x[0] === l; })) return l; } catch (e) { }
  var n = (navigator.language || 'ar').slice(0, 2);
  return n === 'fr' ? 'fr' : n === 'en' ? 'en' : 'tn';
})();
(function () {
  var d = LANGS.filter(function (x) { return x[0] === LANG; })[0], h = document.documentElement;
  h.lang = LANG === 'tn' ? 'ar' : LANG;
  h.dir = d[2];
})();
document.write('<script src="lang_tn.js"><\/script>');
if (LANG !== 'tn') document.write('<script src="lang_' + LANG + '.js"><\/script>');

function _lg() { return LNG[LANG] || LNG.tn; }
function TR(k) { var a = _lg().t, b = LNG.tn.t; return k in a ? a[k] : (k in b ? b[k] : k); }
document.title = TR('game.homeTitle').split('<br>').join(' ').split('<br/>').join(' ');
var TXT = new Proxy({}, { has: function (_, k) { return k in _lg().t || k in LNG.tn.t; }, get: function (_, k) { return TR(k); } });
var RX = new Proxy({}, { get: function (_, k) { var r = _lg().rx; return (r && r[k]) || LNG.tn.rx[k]; } });
function D(n) { var g = TR('ui.digits'); return String(n).replace(/\d/g, function (d) { return g[+d]; }); }
var LOC = LANG === 'fr' ? 'fr' : LANG === 'en' ? 'en' : 'ar';
function setLang(c) { try { localStorage.setItem('lang', c); } catch (e) { } location.reload(); }
