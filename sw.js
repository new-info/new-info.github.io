// Service Worker for PWA functionality
const CACHE_NAME = 'live-analysis-platform-v3';
const DYNAMIC_CACHE = 'dynamic-resources-v1';

// 存储用户首选项
let userPreferences = {
    showNotifications: true // 默认显示通知
};

// 核心资源 - 这些资源始终会被缓存
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/css/main.css',
    '/assets/css/mobile.css',
    '/assets/js/main.js',
    '/assets/js/notes-data.js',
    '/assets/js/score-patches.js',
    '/assets/js/files-list.js',
    '/assets/js/missing-files.js',
    '/assets/js/file-monitor.js',
    '/assets/js/sw-updater.js' // 添加sw-updater.js到核心资源列表
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] 安装中...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] 缓存核心资源');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] 激活中...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                        console.log('[Service Worker] 删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] 声明控制权');
            return self.clients.claim();
        })
    );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // 如果是API请求或其他域的请求，直接使用网络
    if (url.origin !== self.location.origin) {
        event.respondWith(fetch(event.request));
        return;
    }
    
    // 处理页面导航请求
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match('/index.html');
                })
        );
        return;
    }
    
    // 处理资源请求 - 缓存优先，网络回退，并更新缓存
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // 返回缓存的响应，同时在后台更新缓存
                const fetchPromise = fetch(event.request)
                    .then((networkResponse) => {
                        // 检查是否是有效响应
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            
                            // 根据资源类型选择缓存
                            const cacheName = CORE_ASSETS.includes(url.pathname) ? 
                                CACHE_NAME : DYNAMIC_CACHE;
                            
                            caches.open(cacheName)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                    console.log('[Service Worker] 更新缓存:', url.pathname);
                                });
                        }
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.log('[Service Worker] 网络请求失败:', error);
                        // 如果网络请求失败，返回null，这样会继续使用缓存
                        return null;
                    });
                
                // 如果有缓存则返回缓存，否则等待网络请求
                return cachedResponse || fetchPromise;
            })
    );
});

// 向所有客户端发送消息（如果允许通知）
function notifyClients(message) {
    // 仅在用户允许通知时发送
    if (userPreferences.showNotifications) {
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage(message);
            });
        });
    } else {
        console.log('[Service Worker] 通知已禁用，不发送消息:', message);
    }
}

// 自动校准 - 从files-list.js获取文件列表并更新缓存
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'CACHE_DYNAMIC_ASSETS') {
        console.log('[Service Worker] 收到缓存动态资源请求');
        
        const { assets } = event.data;
        if (!assets || !Array.isArray(assets)) {
            console.error('[Service Worker] 无效的资产列表');
            return;
        }
        
        // 缓存动态资源
        caches.open(DYNAMIC_CACHE).then((cache) => {
            console.log(`[Service Worker] 缓存 ${assets.length} 个动态资源`);
            
            // 分批缓存，避免一次缓存太多资源
            const batchSize = 10;
            let batchPromises = [];
            
            for (let i = 0; i < assets.length; i += batchSize) {
                const batch = assets.slice(i, i + batchSize);
                
                const batchPromise = Promise.all(
                    batch.map(asset => {
                        return fetch(asset)
                            .then(response => {
                                if (response && response.status === 200) {
                                    return cache.put(asset, response);
                                }
                                return Promise.resolve();
                            })
                            .catch(error => {
                                console.log(`[Service Worker] 缓存资源失败: ${asset}`, error);
                                return Promise.resolve();
                            });
                    })
                );
                
                batchPromises.push(batchPromise);
            }
            
            // 顺序执行批次
            return batchPromises.reduce((p, batch) => 
                p.then(() => batch), Promise.resolve());
        }).then(() => {
            console.log('[Service Worker] 动态资源缓存完成');
            // 通知客户端缓存完成（如果允许通知）
            notifyClients({
                action: 'CACHE_COMPLETE',
                timestamp: new Date().getTime()
            });
        });
    }
    // 处理通知设置消息
    else if (event.data && event.data.action === 'SET_NOTIFICATION_PREFERENCE') {
        const { showNotifications } = event.data;
        userPreferences.showNotifications = showNotifications;
        
        console.log(`[Service Worker] 设置通知偏好: ${showNotifications ? '显示' : '隐藏'}`);
        
        // 响应客户端，确认收到设置
        if (event.source) {
            event.source.postMessage({
                action: 'NOTIFICATION_PREFERENCE_SET',
                success: true
            });
        }
    }
});

// 定期清理过期的动态缓存
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'clean-caches') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE).then(cache => {
                // 获取所有缓存的请求
                return cache.keys().then(requests => {
                    // 获取当前时间
                    const now = Date.now();
                    
                    // 过滤出超过7天的缓存
                    const oldRequests = requests.filter(request => {
                        // 尝试从请求URL中获取时间戳
                        // 如果没有时间戳，假设缓存是新的
                        const url = new URL(request.url);
                        const timestamp = parseInt(url.searchParams.get('timestamp') || '0', 10);
                        
                        // 如果时间戳为0或时间小于7天，保留缓存
                        return timestamp !== 0 && (now - timestamp) > 7 * 24 * 60 * 60 * 1000;
                    });
                    
                    // 删除过期的缓存
                    return Promise.all(oldRequests.map(request => {
                        console.log('[Service Worker] 删除过期缓存:', request.url);
                        return cache.delete(request);
                    }));
                });
            })
        );
    }
}); 