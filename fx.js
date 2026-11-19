/* ===== fx.js — مؤثرات ومشاهد سينمائية بالكود (إضافة فوق المحرك) =====
   لا يعدّل المحرك؛ يسجّل نفسه عبر Engine (راجع README ← دليل المطوّر):
   • Engine.onGate('puzzle:won') و('ending')  → مشهد سينمائي قبل المتابعة
   • Engine.on('line')    → لمسات الانفعال (وميض/خطوط سرعة)
   • Engine.on('scene')   → أجواء الخلفية (ضباب أو غبار خفيف)
   • Engine.on('card:extra') → عنوان الجزء في بطاقة الفصل
   • Engine.ops.cine      → من القصة: {x:'cine door'}
   الأنواع: door heart lock well speed pulse stars glitch burst dawn seal fade
   اللمس أو Enter يتخطى المشهد، وتُلغى المؤثرات مع «تقليل الحركة». */
(() => {
  const $ = s => document.querySelector(s);
  const wait = (ms, f) => setTimeout(f, ms);
  const RM = () => matchMedia('(prefers-reduced-motion:reduce)').matches || document.documentElement.classList.contains('rm');

  /* ───────── أدوات الرسم ───────── */
  const svg = inner => `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
  const dim = o => `<rect width="400" height="300" fill="#04070c" opacity="${o || .55}"/>`;
  const flash = '<div class="c-f0"></div><div class="c-fl"></div>';
  const ring = (r, cls, st) => `<circle class="${cls}" cx="200" cy="150" r="${r}" fill="none" ${st}/>`;
  const dust = n => `<div class="c-dust">${Array.from({ length: n }, (_, i) =>
    `<i style="left:${(i * 37) % 100}%;top:${30 + (i * 53) % 60}%;width:${2 + i % 3}px;height:${2 + i % 3}px;animation-delay:${(i * 211) % 2500}ms"></i>`).join('')}</div>`;

  /* الباب الحقيقي: نشقّ صورة الخلفية الفعلية نصفين ينزاحان ويظهر خلفهما ضوء دافئ
     SPLIT = موضع شقّ الباب أفقيا في كل خلفية (نسبة من العرض) */
  const SPLIT = { door: .55 };
  const door = warm => () => {
    const sx = SPLIT[curBg] || .5, bg = $('#bgs').innerHTML;
    return `<div class="c-door${warm ? ' warm' : ''}" style="--sx:${sx}"><div class="c-back"></div>
      <div class="c-half l"><div class="c-bgc">${bg}</div></div><div class="c-half r"><div class="c-bgc">${bg}</div></div>
      <div class="c-rays"></div>${dust(14)}</div>${flash}`;
  };

  const STARS = [[70, 100], [120, 55], [170, 85], [210, 38], [260, 72], [310, 48], [340, 98]];
  const tri = pts => `<path class="c-cn gold" pathLength="1" d="M${pts.map(p => p.join(' ')).join('L')}Z"/>`;

  /* kind → {ms المدة, hide إخفاء الشخصيات، html الرسم، snd الصوت، start/end حركة كاميرا} */
  const KINDS = {
    door: { ms: 2700, hide: 1, html: door(0), snd() { ps(58, 34, 1.7, .28); nb(1.6, 260, .22); wait(1900, () => chime(1)); } },
    heart: { ms: 2900, hide: 1, html: door(1), snd() { wait(300, () => chime(1)); wait(1500, () => chime(1)); } },
    lock: {
      ms: 1900, hide: 1,
      html: () => svg(`${dim()}${ring(74, 'c-r1', 'stroke="#35e6ff" stroke-width="4" stroke-dasharray="34 12"')}
        ${ring(54, 'c-r2', 'stroke="#ffd36a" stroke-width="4" stroke-dasharray="18 10"')}
        ${ring(34, 'c-r3', 'stroke="#35e6ff" stroke-width="3" stroke-dasharray="9 7"')}
        <circle class="c-core" cx="200" cy="150" r="9" fill="#fff"/>`) + flash,
      snd() {
        for (let i = 0; i < 9; i++) wait(i * 120, () => ps(900 + i * 40, 700, .04, .05, 'square'));
        wait(1300, () => { ps(1500, 500, .08, .12, 'square'); chime(1); });
      }
    },
    well: {
      ms: 2300, hide: 1,
      html: () => svg(`${dim(.6)}<defs><linearGradient id="wg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#7fe8ff" stop-opacity=".9"/><stop offset="1" stop-color="#7fe8ff" stop-opacity="0"/></linearGradient></defs>
        <rect class="c-col" x="168" y="30" width="64" height="170" fill="url(#wg)"/>
        ${[0, 350, 700].map(d => `<ellipse class="c-rp" style="animation-delay:${d}ms" cx="200" cy="200" rx="16" ry="5" fill="none" stroke="#bfefff" stroke-width="2"/>`).join('')}`) + dust(8),
      snd() { [0, 350, 700].forEach(d => wait(d, () => ps(1100, 400, .18, .08))); wait(900, () => ps(180, 360, 1, .07)); wait(1500, () => chime(1)); }
    },
    speed: {
      ms: 1900,
      html: () => `<div class="c-sp">${Array.from({ length: 18 }, (_, i) =>
        `<i style="top:${(i * 5.7 + 3) % 100}%;width:${40 + (i * 37) % 60}%;animation-delay:${(i * 83) % 700}ms"></i>`).join('')}</div>`,
      start: () => cam(1.1, 0, -4, 'sk'), end: () => wide(),
      snd() { steps(); wait(500, steps); wait(1000, () => chime(1)); }
    },
    pulse: {
      ms: 2300,
      html: () => svg(`${dim(.4)}<polyline class="c-wv" pathLength="1" fill="none" stroke="#ff4d6d" stroke-width="3" stroke-linejoin="round" points="0,150 70,150 90,150 100,105 112,195 124,150 190,150 210,150 222,92 236,208 250,150 400,150"/>
        ${ring(90, 'c-ring', 'stroke="#ff4d6d" stroke-width="2"')}`) + '<div class="c-redv"></div>',
      snd() { wait(300, () => thump(1)); wait(700, () => thump(1)); wait(1200, () => ps(220, 220, 1, .06)); wait(1500, () => chime(1)); }
    },
    stars: {
      ms: 2600, hide: 1,
      html: () => svg(`${dim(.3)}<path class="c-cn" pathLength="1" d="M${STARS.map(p => p.join(' ')).join('L')}"/>
        ${STARS.map((p, i) => `<circle class="c-st" style="animation-delay:${i * 220}ms" cx="${p[0]}" cy="${p[1]}" r="4" fill="#fff"/>`).join('')}`) + flash,
      snd() { STARS.forEach((_, i) => wait(i * 220, () => ps(520 + i * 90, 520 + i * 90, .5, .06))); wait(2000, () => chime(1)); }
    },
    glitch: {
      ms: 1700,
      html: () => `<div class="c-gl">${[12, 31, 47, 63, 80].map((t, i) => `<i style="top:${t}%;animation-delay:${i * 90}ms"></i>`).join('')}</div><div class="c-scan"></div>`,
      snd() { glitch(); wait(500, glitch); wait(1000, glitch); }
    },
    burst: { ms: 1600, html: () => '<div class="c-bu"></div><div class="c-fl2"></div>', start: () => cam(1.18, 0, 0, 'pu'), end: () => wide(), snd() { boom(); } },
    dawn: {
      ms: 3000,
      html: () => '<div class="c-dw"></div><div class="c-rays2"></div>',
      snd() { [392, 494, 587, 784].forEach((f, i) => wait(i * 350, () => ps(f, f, 1.4, .06))); }
    },
    seal: {
      ms: 2300, hide: 1,
      html: () => svg(`${dim()}${ring(70, 'c-cn gold', 'pathLength="1"')}${tri([[200, 70], [261, 176], [139, 176]])}${tri([[200, 230], [139, 124], [261, 124]])}`) + flash,
      snd() { ps(80, 60, 1.4, .2); wait(1700, () => chime(1)); }
    },
    secret: {
      ms: 3600,
      html: () => '<div class="c-dw"></div><div class="c-rays2"></div>' + svg(`<path class="c-cn gold" pathLength="1" d="M${STARS.map(p => p.join(' ')).join('L')}"/>${STARS.map((p, i) => `<circle class="c-st" style="animation-delay:${i * 260}ms" cx="${p[0]}" cy="${p[1]}" r="4" fill="#fff"/>`).join('')}`),
      snd() { [392, 494, 587, 784, 988].forEach((fr, i) => wait(i * 400, () => ps(fr, fr, 1.6, .06))); }
    },
    knock: {
      ms: 1600,
      html: () => svg(`${dim(.25)}${[0, 260, 520].map(d => `<ellipse class="c-kr" style="animation-delay:${d}ms" cx="200" cy="285" rx="30" ry="9" fill="none" stroke="#35e6ff" stroke-width="3"/>`).join('')}`) + '<div class="c-kv"></div>',
      start: () => cam(1.06, 0, 0, 'sk'), end: () => wide(),
      snd() { thump(1); wait(650, () => thump(.8)); }
    },
    shadow: {
      ms: 2400,
      html: () => svg('<g class="c-s4"><circle cx="42" cy="128" r="15" fill="#02040a"/><path d="M16 150q26-14 52 0l8 100h-68z" fill="#02040a"/></g>') + '<div class="c-flk"></div>',
      snd() { farHum(); wait(800, () => ps(60, 40, 1.2, .1, 'sine', .6)); }
    },
    eye: {
      ms: 2600, hide: 1,
      html: () => svg(`${dim(.6)}${ring(86, 'c-r1', 'stroke="#35e6ff" stroke-width="3" stroke-dasharray="40 14"')}${ring(64, 'c-r2', 'stroke="#ffd36a" stroke-width="2" stroke-dasharray="14 10"')}
        <ellipse class="c-iris" cx="200" cy="150" rx="40" ry="40" fill="#0b2a3a" stroke="#35e6ff" stroke-width="3"/><ellipse class="c-pup" cx="200" cy="150" rx="3" ry="34" fill="#7fe8ff"/>`),
      snd() { ps(220, 220, 1.8, .05); wait(1200, () => thump(.8)); }
    },
    scan: {
      ms: 2300,
      html: () => svg('<g fill="none" stroke="#fff" stroke-width="2" opacity=".8"><path d="M30 60V30h30M370 60V30h-30M30 240v30h30M370 240v30h-30"/></g><circle class="c-rec" cx="60" cy="52" r="5" fill="#ff3b3b"/><text x="72" y="57" fill="#fff" font-size="13" font-family="monospace">REC  03:12:47</text>') + '<div class="c-scl"></div>',
      snd() { [0, 500, 1000].forEach(d => wait(d, relay)); ps(880, 880, .1, .04); }
    },
    wave: {
      ms: 2100,
      html: () => `<div class="c-wave">${Array.from({ length: 36 }, (_, i) => `<i style="left:${i * 2.7 + 1.5}%;animation-delay:${(i * 47) % 600}ms;height:${20 + (i * 37) % 60}%"></i>`).join('')}</div>`,
      snd() { ps(320, 520, .9, .05, 'triangle', .6); wait(700, () => ps(260, 420, .9, .05, 'triangle', .6)); }
    },
    mute: {   // الصوت يُسحب: المشهد يتحوّل للرمادي والأجواء تصمت تماما
      ms: 2000, html: () => '<div class="c-mt"></div>',
      start() { $('#sc').classList.add('c-mute'); window.__mp = window.duck ? duck(0) : 1; },
      end() { $('#sc').classList.remove('c-mute'); if (window.duck) duck(window.__mp); },
      snd() { }
    },
    orb: {
      ms: 2800, hide: 1,
      html: () => `<div class="c-orb"><div class="oc"></div>${[0, 1, 2].map(k => `<div class="or or${k}">${Array.from({ length: 14 }, (_, i) => `<i style="--a:${i * 360 / 14}deg;--r:${70 + k * 38}px"></i>`).join('')}</div>`).join('')}</div>`,
      snd() { ps(110, 110, 2.6, .08, 'sine', .6); wait(1400, () => chime(1)); }
    },
    title: {   // بطاقة عنوان: {x:'title السطر الكبير|السطر الصغير'}
      ms: 3200,
      html: () => { const [a, b = ''] = (window.__ttl || '').split('|'); return `<div class="c-tt"><b>${a}</b><small>${b}</small></div>`; },
      snd() { ps(70, 50, 2.4, .08, 'sine', .7); }
    },
    fade: { ms: 2000, html: () => '<div class="c-ir"></div>', snd() { ps(110, 45, 1.8, .12); } }
  };

  /* ───────── الجدولة: أي مشهد بعد أي لغز/نهاية ───────── */
  const AFTER_PUZZLE = { 3: 'well', 4: 'door', 6: 'speed', 8: 'door', 11: 'pulse', 14: 'lock', 18: 'door', 21: 'pulse', 25: 'speed', 26: 'heart', 29: 'speed', 34: 'lock', 35: 'well', 37: 'stars', 40: 'glitch', 44: 'burst' };
  const AFTER_END = { 1: 'dawn', 2: 'seal', 3: 'burst', 4: 'fade', 5: 'glitch', 6: 'secret' };

  /* ───────── المشغّل ───────── */
  function cine(kind, done) {
    const k = KINDS[kind], sc = $('#sc');
    if (!k || !sc || RM() || $('#cine')) { if (done) done(); return; }
    const L = document.createElement('div');
    L.id = 'cine';
    L.className = 'k-' + kind;
    L.innerHTML = '<i class="cb t"></i><i class="cb b"></i>' + k.html();
    if (k.hide) sc.classList.add('cin-hide');
    if (k.start) k.start();
    sc.appendChild(L);
    k.snd();
    let over = 0;
    const end = () => {
      if (over) return;
      over = 1;
      L.classList.add('out');
      if (k.end) k.end();
      wait(350, () => { L.remove(); sc.classList.remove('cin-hide'); if (done) done(); });
    };
    L.onclick = end;
    L.skip = end;
    wait(k.ms, end);
  }
  window.cine = cine;
  // أثناء المشهد: Enter/مسافة تتخطاه ولا تتقدّم القصة، ولمس صندوق الحوار لا يفعل شيئا
  document.addEventListener('keydown', e => {
    const c = $('#cine');
    if (c && [' ', 'Enter', 'Escape'].includes(e.key)) { e.preventDefault(); e.stopImmediatePropagation(); c.skip(); }
  }, true);
  $('#dl').addEventListener('click', e => { if ($('#cine')) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);

  /* ───────── أجواء الخلفية: ضباب أو غبار خفيف حسب المشهد ───────── */
  const AMBIENT = { tunnel: 'fog', stairs: 'fog', door: 'fog', souk: 'dust', hall: 'dust', lab: 'dust', studio: 'dust', roof: 'dust' };
  function ambience(b) {
    const sc = $('#sc');
    if (!sc || RM()) return;
    let a = $('#amb');
    if (!a) { a = document.createElement('div'); a.id = 'amb'; sc.appendChild(a); }
    const k = AMBIENT[b] || 'dust';
    a.className = 'a-' + k;
    a.innerHTML = k === 'fog' ? '<i></i><i></i><i></i>' : Array.from({ length: 10 }, (_, i) =>
      `<i style="left:${(i * 41) % 100}%;top:${20 + (i * 57) % 70}%;animation-delay:${(i * 330) % 3000}ms"></i>`).join('');
  }

  /* ───────── لمسات الانفعال: وميض وخطوط سرعة بفاصل ثانية ونصف ───────── */
  let last = 0;
  function emph(e) {
    const k = { surprise: 'sp', angry: 'an', fear: 'fe' }[e], sc = $('#sc');
    if (!k || !sc || RM() || Date.now() - last < 1500) return;
    last = Date.now();
    let f = $('#fxf');
    if (!f) { f = document.createElement('div'); f.id = 'fxf'; sc.appendChild(f); }
    f.className = '';
    void f.offsetWidth;
    f.className = 'e-' + k;
  }
  const partTag = () => {
    const p = GAME.partOf(G.c);
    return G.c === 0 || p !== GAME.partOf(G.c - 1) ? `<p class="pt">${p}</p>` : '';
  };

  /* ───────── لحظة صمت: يخفت المشهد ثانية قبل المتابعة (بعد المشاهد القوية) ───────── */
  function hush(ms, done) {
    const sc = $('#sc');
    if (!ms || !sc || RM()) { if (done) done(); return; }
    sc.classList.add('hush');
    const prev = window.duck ? duck(.15) : 1;   // يخفت الصوت مع المشهد
    wait(ms, () => { sc.classList.remove('hush'); if (window.duck) duck(prev); if (done) done(); });
  }

  /* ───────── التسجيل في المحرك ───────── */
  Engine.onGate('puzzle:won', (c, go) => cine(AFTER_PUZZLE[c.chapter], () => hush(AFTER_PUZZLE[c.chapter] ? 900 : 0, go)));
  Engine.onGate('ending', (c, go) => cine(AFTER_END[c.n], go));
  Engine.on('line', s => Array.isArray(s) && emph(s[3]));
  Engine.on('scene', ambience);
  Engine.on('card:extra', partTag);
  /* نبرة كل نهاية: لون المشهد ولون العنوان (1 أمل دافئ، 2 غموض بنفسجي، 3 مأساة رمادية، 4 غموض باهت، 5 رعب أحمر، 6 إشراق) */
  Engine.on('ending:shown', n => {
    const sc = $('#sc'), card = $('#ov .card');
    sc.className = sc.className.replace(/\bend-\d\b/g, '').trim() + ' end-' + n;
    if (card) card.classList.add('e' + n);
  });
  Engine.on('chapter', () => { const sc = $('#sc'); if (sc) sc.className = sc.className.replace(/\bend-\d\b/g, '').trim(); });
  Engine.ops.cine = a => new Promise(r => cine(a, r));
  Engine.ops.title = (a, b, c) => new Promise(r => { window.__ttl = c.replace(/^title\s+/, ''); cine('title', r); });
  Engine.ops.hush = a => new Promise(r => hush(+a || 1000, r));   // {x:'hush 1200'} لحظة صمت من القصة

  /* ───────── الأنماط ───────── */
  const css = `
#cine{position:absolute;inset:0;z-index:40;overflow:hidden;animation:c-in .25s}#cine.out{opacity:0;transition:opacity .35s}
#cine::before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;box-shadow:inset 0 0 90px #000c}
#cine svg{position:absolute;inset:0;width:100%;height:100%}
@keyframes c-in{from{opacity:0}}
#sc.hush #bgs{filter:brightness(.5)}#sc.hush #ch{filter:brightness(.55)}
#sc.cin-hide #ch{opacity:0;transition:opacity .3s}
.cb{position:absolute;left:0;right:0;height:11%;background:#000;z-index:3}.cb.t{top:0;animation:c-bt .5s forwards}.cb.b{bottom:0;animation:c-bb .5s forwards}
@keyframes c-bt{from{transform:translateY(-100%)}}@keyframes c-bb{from{transform:translateY(100%)}}
.c-door,.c-half,.c-bgc,.c-back,.c-rays{position:absolute;inset:0}
.c-door{transform-origin:calc(var(--sx)*100%) 52%;animation:c-pu 2.7s ease-in forwards}@keyframes c-pu{to{transform:scale(1.07)}}
.c-bgc *{animation:none!important}.c-bgc svg{width:100%;height:100%;display:block}
.c-half.l{clip-path:inset(0 calc((1 - var(--sx))*100%) 0 0);animation:c-dl 1.7s .5s cubic-bezier(.65,0,.25,1) forwards}
.c-half.r{clip-path:inset(0 0 0 calc(var(--sx)*100%));animation:c-dr2 1.7s .5s cubic-bezier(.65,0,.25,1) forwards}
@keyframes c-dl{to{transform:translateX(calc(var(--sx)*-100%))}}@keyframes c-dr2{to{transform:translateX(calc((1 - var(--sx))*100%))}}
.c-half.l::after{content:"";position:absolute;top:0;bottom:0;right:calc((1 - var(--sx))*100%);width:10%;background:linear-gradient(90deg,transparent,#fff3c8aa)}
.c-half.r::after{content:"";position:absolute;top:0;bottom:0;left:calc(var(--sx)*100%);width:10%;background:linear-gradient(270deg,transparent,#fff3c8aa)}
.c-back{background:radial-gradient(ellipse 34% 62% at calc(var(--sx)*100%) 52%,#fffbe6 0,#ffd98a 28%,#9a5a1e 58%,#0b0603 100%)}
.warm .c-back{background:radial-gradient(ellipse 34% 62% at calc(var(--sx)*100%) 52%,#fff0f6 0,#ffb8d2 28%,#8a3a5e 58%,#0b0306 100%)}
.c-rays{background:repeating-conic-gradient(from 0deg at calc(var(--sx)*100%) 52%,#fff4cc26 0 2deg,transparent 2deg 9deg);opacity:0;animation:c-ry 2s .8s forwards}
@keyframes c-ry{to{opacity:1}}
.c-dust{position:absolute;inset:0;pointer-events:none}.c-dust i{position:absolute;border-radius:50%;background:#fff6d8;opacity:0;filter:blur(1px);animation:c-dp 3s linear infinite}
@keyframes c-dp{0%{opacity:0;transform:translate(0,10px)}20%{opacity:.75}100%{opacity:0;transform:translate(14px,-60px)}}
.c-f0{position:absolute;inset:0;background:#fff;opacity:0;animation:c-f0 .4s forwards}@keyframes c-f0{0%{opacity:.85}100%{opacity:0}}
.c-fl{position:absolute;inset:0;background:#fff;opacity:0;animation:c-flo .5s 2s forwards}.k-lock .c-fl{animation-delay:1.35s}.k-stars .c-fl{animation-delay:2s}.k-seal .c-fl{animation-delay:1.7s}
@keyframes c-flo{50%{opacity:.9}to{opacity:0}}
.k-lock svg,.k-stars svg,.k-seal svg,.k-well svg{mix-blend-mode:screen;filter:drop-shadow(0 0 5px #7fe8ff)}.k-seal svg{filter:drop-shadow(0 0 6px #ffd36a)}
.c-r1,.c-r2,.c-r3{transform-box:view-box;transform-origin:200px 150px;animation:c-sp 1.3s cubic-bezier(.2,.8,.2,1) forwards}
.c-r2{animation-name:c-sp2}.c-r3{animation-duration:1.1s}
@keyframes c-sp{from{transform:rotate(-540deg)}}@keyframes c-sp2{from{transform:rotate(700deg)}}
.c-core{transform-box:fill-box;transform-origin:center;animation:c-pop 2s 1.3s forwards;opacity:0}@keyframes c-pop{0%{opacity:1;transform:scale(1)}30%{opacity:1;transform:scale(6)}100%{opacity:0;transform:scale(9)}}
.c-col{opacity:0;animation:c-col 2s forwards}@keyframes c-col{0%{opacity:0;transform:translateY(40px)}40%{opacity:.85}100%{opacity:0;transform:translateY(-30px)}}
.c-rp{transform-box:fill-box;transform-origin:center;opacity:0;animation:c-rp 1.4s ease-out forwards}@keyframes c-rp{from{opacity:.9;transform:scale(.3)}to{opacity:0;transform:scale(5)}}
.k-speed{background:#02050a66}.c-sp i{position:absolute;right:-60%;height:2px;background:linear-gradient(270deg,#fff,transparent);opacity:0;animation:c-ln .55s linear infinite}
@keyframes c-ln{0%{transform:translateX(0);opacity:0}20%{opacity:.8}100%{transform:translateX(-260%);opacity:0}}
.c-wv{stroke-dasharray:1;stroke-dashoffset:1;transform-box:view-box;transform-origin:0 150px;animation:c-dr 1s forwards,c-fl2 .9s 1.1s forwards}
@keyframes c-dr{to{stroke-dashoffset:0}}@keyframes c-fl2{to{transform:scaleY(.04);stroke:#35e6ff}}
.c-ring{transform-box:fill-box;transform-origin:center;opacity:0;animation:c-sh 1.6s .9s forwards}@keyframes c-sh{from{opacity:.8;transform:scale(1)}to{opacity:0;transform:scale(.1)}}
.c-redv{position:absolute;inset:0;box-shadow:inset 0 0 90px #ff2a4a99;opacity:0;animation:c-rv 1.4s .2s 2}@keyframes c-rv{50%{opacity:1}}
.c-cn{fill:none;stroke:#bfe9ff;stroke-width:1.5;stroke-dasharray:1;stroke-dashoffset:1;animation:c-dr 1.6s .2s forwards}.c-cn.gold{stroke:#ffd36a;stroke-width:2.5}
.c-st{opacity:0;transform-box:fill-box;transform-origin:center;animation:c-st .5s forwards}@keyframes c-st{from{opacity:0;transform:scale(0)}60%{transform:scale(1.8)}to{opacity:1;transform:scale(1)}}
.c-gl i{position:absolute;left:0;right:0;height:9%;background:linear-gradient(90deg,#35e6ff55,#ff3aa055);mix-blend-mode:screen;animation:c-gj .25s steps(2) infinite}
@keyframes c-gj{0%{transform:translateX(-30px);opacity:.9}50%{transform:translateX(40px);opacity:.3}100%{transform:translateX(-10px);opacity:.8}}
.c-scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,#00000033 0 2px,transparent 2px 4px);animation:c-fk .2s steps(2) infinite}@keyframes c-fk{50%{opacity:.4}}
.c-bu{position:absolute;left:50%;top:50%;width:40px;height:40px;margin:-20px;border-radius:50%;background:radial-gradient(#fff,#ffd98a 40%,transparent 70%);mix-blend-mode:screen;animation:c-bx 1.3s ease-out forwards}@keyframes c-bx{to{transform:scale(18);opacity:0}}
.c-fl2{position:absolute;inset:0;background:#fff;opacity:0;animation:c-f2 .6s forwards}@keyframes c-f2{20%{opacity:.9}to{opacity:0}}
.c-dw{position:absolute;inset:0;mix-blend-mode:screen;background:radial-gradient(circle at 50% 105%,#ffe2a0 0,#ff9a4d88 30%,#ff6a3d22 55%,transparent 75%);opacity:0;transform:translateY(40%);animation:c-up 2.6s ease-out forwards}@keyframes c-up{to{opacity:1;transform:none}}
.c-rays2{position:absolute;inset:0;mix-blend-mode:screen;background:repeating-conic-gradient(from 0deg at 50% 105%,#ffffff1a 0 3deg,transparent 3deg 12deg);opacity:0;animation:c-ry2 2.6s forwards}@keyframes c-ry2{50%{opacity:1}to{opacity:.4}}
.c-ir{position:absolute;left:50%;top:50%;width:170%;height:170%;transform:translate(-50%,-50%);border-radius:50%;box-shadow:0 0 0 300vmax #000;animation:c-ir 1.8s ease-in forwards}@keyframes c-ir{to{width:0;height:0}}
#sc{transition:filter 1.6s}
#sc.end-1{filter:sepia(.25) saturate(1.2) brightness(1.05)}#sc.end-2{filter:hue-rotate(40deg) saturate(.9) brightness(.9)}
#sc.end-3{filter:grayscale(.85) brightness(.75) contrast(1.1)}#sc.end-4{filter:saturate(.7) hue-rotate(-15deg) brightness(.85)}
#sc.end-5{filter:saturate(1.4) hue-rotate(150deg) contrast(1.2) brightness(.8);animation:c-jt .4s steps(2) infinite}@keyframes c-jt{50%{transform:translateX(2px)}}
#sc.end-6{filter:brightness(1.15) saturate(1.1) contrast(.95)}
.card.e1 h2{color:#ffd36a}.card.e2 h2{color:#b9a3ff}.card.e3 h2{color:#9aa3b2}.card.e4 h2{color:#7fe8ff}.card.e5 h2{color:#ff4d6d;text-shadow:2px 0 #35e6ff}.card.e6 h2{color:#fff;text-shadow:0 0 14px #fff8}
.c-kr{transform-box:fill-box;transform-origin:center;opacity:0;animation:c-kr 1.3s ease-out forwards}@keyframes c-kr{from{opacity:.9;transform:scale(.3)}to{opacity:0;transform:scale(9)}}
.c-kv{position:absolute;inset:0;box-shadow:inset 0 0 120px #000d;animation:c-kv .8s 2}@keyframes c-kv{50%{box-shadow:inset 0 0 190px #000}}
.k-shadow svg{mix-blend-mode:multiply}.c-s4{opacity:0;animation:c-s4 2.2s forwards}@keyframes c-s4{20%{opacity:.9}70%{opacity:.9}100%{opacity:0}}
.c-flk{position:absolute;inset:0;background:#000;opacity:0;animation:c-flk .35s steps(2) 4}@keyframes c-flk{0%{opacity:.55}50%{opacity:0}100%{opacity:.4}}
.k-eye svg{filter:drop-shadow(0 0 8px #35e6ff)}.c-iris{opacity:0;animation:c-ir2 .8s .3s forwards}@keyframes c-ir2{to{opacity:1}}
.c-pup{transform-box:fill-box;transform-origin:center;animation:c-pup 1.6s .9s forwards}@keyframes c-pup{to{transform:scaleX(9)}}
.k-scan{background:repeating-linear-gradient(0deg,#00000022 0 2px,transparent 2px 4px)}.c-rec{animation:c-bl .8s steps(2) infinite}@keyframes c-bl{50%{opacity:0}}
.c-scl{position:absolute;left:0;right:0;height:14%;top:-14%;background:linear-gradient(transparent,#7fe8ff33,transparent);animation:c-sc 2s linear forwards}@keyframes c-sc{to{top:100%}}
.k-wave{background:#02050a77}.c-wave{position:absolute;inset:0}.c-wave i{position:absolute;top:50%;width:1.6%;background:linear-gradient(#7fe8ff,#fff);border-radius:2px;transform:translateY(-50%) scaleY(.1);opacity:.85;animation:c-wv2 .5s ease-in-out infinite alternate}@keyframes c-wv2{to{transform:translateY(-50%) scaleY(1)}}
#sc.c-mute{filter:grayscale(1) contrast(1.15) brightness(.8)}.c-mt{position:absolute;inset:0;box-shadow:inset 0 0 140px #000}
.c-orb{position:absolute;left:50%;top:50%;width:0;height:0}.c-orb .oc{position:absolute;width:120px;height:120px;margin:-60px;border-radius:50%;background:radial-gradient(#fff 0,#7fe8ff 30%,#1a6a9a88 60%,transparent 72%);mix-blend-mode:screen;animation:c-ob 2.8s ease-out forwards}
@keyframes c-ob{from{transform:scale(.2);opacity:0}30%{opacity:1}to{transform:scale(1.4)}}
.c-orb .or{position:absolute;animation:c-spn 6s linear infinite}.c-orb .or1{animation-duration:9s;animation-direction:reverse}.c-orb .or2{animation-duration:12s}@keyframes c-spn{to{transform:rotate(360deg)}}
.c-orb .or i{position:absolute;width:4px;height:4px;margin:-2px;border-radius:50%;background:#bfefff;box-shadow:0 0 6px #7fe8ff;transform:rotate(var(--a)) translateX(var(--r))}
.k-title{background:#000}.c-tt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:4}
.c-tt b{font-size:26px;color:#fff;opacity:0;animation:c-ti 2.4s .3s forwards}.c-tt small{color:#35e6ff;margin-top:10px;opacity:0;animation:c-ti 2.2s 1s forwards}
@keyframes c-ti{0%{opacity:0;filter:blur(8px);transform:scale(1.15)}45%{opacity:1}100%{opacity:1;filter:blur(0);transform:scale(1)}}
#amb{position:absolute;inset:0;z-index:12;pointer-events:none;overflow:hidden}
.a-fog i{position:absolute;width:70%;height:45%;border-radius:50%;background:radial-gradient(ellipse,#9fc3d433,transparent 70%);filter:blur(14px);animation:c-fg 22s ease-in-out infinite alternate}
.a-fog i:nth-child(1){left:-20%;top:45%}.a-fog i:nth-child(2){left:40%;top:55%;animation-duration:30s;animation-delay:-8s}.a-fog i:nth-child(3){left:10%;top:25%;opacity:.6;animation-duration:26s;animation-delay:-14s}
@keyframes c-fg{from{transform:translateX(-8%)}to{transform:translateX(14%)}}
.a-dust i{position:absolute;width:2px;height:2px;border-radius:50%;background:#fff;opacity:0;animation:c-dp2 7s linear infinite}
@keyframes c-dp2{0%{opacity:0;transform:translateY(0)}25%{opacity:.45}100%{opacity:0;transform:translate(16px,-70px)}}
#fxf{position:absolute;inset:0;z-index:30;pointer-events:none;opacity:0}
#fxf.e-sp{background:radial-gradient(circle,transparent 30%,#ffffffcc);animation:c-ef .35s}
#fxf.e-an{background:radial-gradient(circle,transparent 35%,#ff2a4a99);animation:c-ef .5s}
#fxf.e-fe{box-shadow:inset 0 0 80px #000;animation:c-ef .9s}
#fxf.e-sp::after,#fxf.e-an::after{content:"";position:absolute;inset:0;background:repeating-conic-gradient(#fff3 0 1.5deg,transparent 1.5deg 9deg);-webkit-mask:radial-gradient(circle,transparent 30%,#000 75%);mask:radial-gradient(circle,transparent 30%,#000 75%)}
@keyframes c-ef{0%{opacity:0}20%{opacity:1}100%{opacity:0}}
.card .pt{color:#35e6ff;font-size:13px;letter-spacing:2px;margin-bottom:4px}
@media (prefers-reduced-motion:reduce){#amb i,.c-dust i{animation:none!important}}`;
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: css }));
})();
