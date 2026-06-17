const CACHE_NAME = 'pomodoro-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// 安装事件 - 立即激活
self.addEventListener('install', event => {
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截 - 缓存优先，网络后备
self.addEventListener('fetch', event => {
  // 只缓存 GET 请求
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存中有，直接返回
        if (response) {
          return response;
        }
        
        // 缓存中没有，从网络获取
        return fetch(event.request).then(networkResponse => {
          // 检查响应是否有效
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          
          // 克隆响应并缓存
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return networkResponse;
        }).catch(() => {
          // 网络请求失败，返回离线页面或缓存的 index.html
          return caches.match('./index.html');
        });
      })
  );
});
