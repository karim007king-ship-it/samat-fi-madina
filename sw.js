// Service Worker — network-first للـ JS/HTML حتى تتحدث اللغة فوراً
const V = 'smm-v15';
const FILES = ['./', 'index.html', 'images.js', 'images2.js', 'i18n.js', 'lang_tn.js', 'lang_ar.js', 'lang_fr.js', 'lang_en.js', 'story.js', 'audio.js', 'studio.js', 'engine.js', 'fx.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const old = (await caches.keys()).filter(k => k !== V);
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    if (old.length) (await self.clients.matchAll()).forEach(c => c.postMessage('upd'));
  })());
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const path = new URL(r.url).pathname;
  const isCode = /\.(js|html|json)(\?|$)/.test(path) || path.endsWith('/');
  e.respondWith((async () => {
    // ملفات الكود والنصوص: من الشبكة أولاً ثم الكاش
    if (isCode) {
      try {
        const fresh = await fetch(r);
        if (fresh && fresh.ok) {
          const copy = fresh.clone();
          caches.open(V).then(c => c.put(r, copy));
        }
        return fresh;
      } catch (err) {
        const cached = await caches.match(r);
        if (cached) return cached;
        throw err;
      }
    }
    // الصور وغيرها: كاش أولاً
    const cached = await caches.match(r);
    const fresh = fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => cached);
    return cached || fresh;
  })());
});
