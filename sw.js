// 卜卜WithYou 离线缓存:成功打开一次后,断网/网络被阻断也能正常游玩
// 策略:缓存优先+后台更新(stale-while-revalidate)——秒开,新版本在后台悄悄拉取,下次启动生效
const CACHE = 'bubu-v2';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './assets/audio-btn.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // ignoreSearch:让 ?v7 之类的缓存穿透参数也命中缓存
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => hit);
      return hit || net; // 有缓存立即用(后台仍更新);无缓存走网络(BGM等首次播放时顺手缓存)
    })
  );
});
