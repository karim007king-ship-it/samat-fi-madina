// Service Worker — الاستراتيجية: يخدم الملفات من الذاكرة فورا ثم يحدّثها في الخلفية (stale-while-revalidate).
// عند تغيير أي ملف من اللعبة، غيّر رقم النسخة V ليُنظَّف القديم ويصل إشعار التحديث للاعب.
const V = 'smm-v12-i18n-ch1-5';
const FILES = ['./', 'index.html', 'images.js', 'images2.js', 'i18n.js', 'lang_tn.js', 'lang_ar.js', 'lang_fr.js', 'lang_en.js', 'story.js', 'audio.js', 'studio.js', 'engine.js', 'fx.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const old = (await caches.keys()).filter(k => k !== V);
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    // أعلم الصفحات المفتوحة بوجود نسخة جديدة (فقط إن كان هناك نسخة قديمة)
    if (old.length) (await self.clients.matchAll()).forEach(c => c.postMessage('upd'));
  })());
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cached = await caches.match(r);
    const fresh = fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => cached);
    return cached || fresh;
  })());
});
