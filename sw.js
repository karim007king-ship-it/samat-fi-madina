// Service Worker — network-first لملفات التطبيق لضمان وصول الترجمات الجديدة، مع fallback للعمل دون اتصال.
// نطاق التخزين خاص باللعبة فقط؛ لا نحذف مخازن تطبيقات أخرى على النطاق نفسه.
const V = 'smm-v25-cache-scope';
const PREFIX = 'smm-';
const FILES = ['./', 'index.html', 'images.js', 'images2.js', 'i18n.js', 'lang_tn.js', 'lang_ar.js', 'lang_fr.js', 'lang_en.js', 'story.js', 'audio.js', 'studio.js', 'engine.js', 'fx.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const old = (await caches.keys()).filter(k => k.startsWith(PREFIX) && k !== V);
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    if (old.length) (await self.clients.matchAll()).forEach(c => c.postMessage('upd'));
  })());
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(V);
    const url = new URL(r.url);
    const appCode = r.mode === 'navigate' || /\\.(?:html|js|css)$/.test(url.pathname);

    if (appCode) {
      try {
        const fresh = await fetch(new Request(r, { cache: 'no-store' }));
        if (fresh.ok) await cache.put(r, fresh.clone());
        return fresh;
      } catch (error) {
        const cached = await cache.match(r);
        if (cached) return cached;
        throw error;
      }
    }

    const cached = await cache.match(r);
    const fresh = fetch(r).then(res => {
      if (res.ok) cache.put(r, res.clone()).catch(() => {});
      return res;
    }).catch(() => cached);
    return cached || fresh;
  })());
});
