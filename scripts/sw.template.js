// Gerado pelo scripts/pwa.js a cada build. A versão muda sozinha quando qualquer arquivo muda.
const CACHE = 'bjj-app-__VERSION__';
const ASSETS = __ASSETS__;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', ...ASSETS])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Páginas: abre na hora com a cópia guardada desta versão, sem esperar a internet (sinal fraco no tatame).
// A versão nova chega pelo próprio sw.js: ela se instala ao fundo e a página recarrega uma vez (fora do treino).
// Scripts, imagens, sons e fontes: guardados (os nomes mudam a cada versão).
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(caches.match('/', { cacheName: CACHE }).then(hit => hit || fetch(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
