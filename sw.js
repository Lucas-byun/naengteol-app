// 냉털 Service Worker v1.1
// 캐시 버전 — 업데이트 시 이 값을 올리면 기존 캐시가 자동 교체됩니다
const CACHE_VERSION = 'naengteol-v12';

// 앱 셸: 설치 즉시 캐시할 핵심 파일 목록
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/app_icon_192.png',
  '/icons/app_icon_512.png',
  '/icons/icon-48.png',
  '/icons/splash_fridge.png',
];

// ── 설치 이벤트: 앱 셸 사전 캐시 ──────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return cache.addAll(SHELL_ASSETS);
    }).then(function() {
      // 새 SW가 즉시 활성화되도록 대기 건너뜀
      return self.skipWaiting();
    })
  );
});

// ── 활성화 이벤트: 구버전 캐시 정리 ──────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_VERSION;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      // 모든 열린 탭에 즉시 적용
      return self.clients.claim();
    })
  );
});

// ── Fetch 이벤트: 요청 유형별 캐싱 전략 ─────────────────────
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // 1) Firebase / Google API / Apps Script → 항상 네트워크 우선 (캐시 안 함)
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('firebaseio') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('google.com') ||
    url.hostname.includes('script.google') ||
    url.hostname.includes('gstatic')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2) 이미지 파일 (icons/ 폴더) → 캐시 우선, 없으면 네트워크
  if (url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        return fetch(event.request).then(function(response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_VERSION).then(function(cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        }).catch(function() {
          // 이미지 오프라인 시 캐시된 fallback 이미지 반환
          return caches.match('/icons/app_icon_192.png').then(function(cached) {
            if (cached) return cached;
            // Fallback: 1x1 투명 PNG (base64)
            var transparentPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
            return new Response(transparentPng, { headers: { 'Content-Type': 'image/png' } });
          });
        });
      })
    );
    return;
  }

  // 3) 앱 셸 (index.html, manifest.json 등) → 네트워크 우선, 실패 시 캐시
  //    → 항상 최신 앱 코드를 받아오되, 오프라인이면 캐시 제공
  //    → 캐시도 없으면 offline.html 표시
  event.respondWith(
    fetch(event.request).then(function(response) {
      if (response && response.status === 200 && event.request.method === 'GET') {
        var clone = response.clone();
        caches.open(CACHE_VERSION).then(function(cache) {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        // HTML 요청이 오프라인이고 캐시도 없으면 → offline.html 반환
        if (event.request.headers.get('accept') &&
            event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
      });
    })
  );
});
