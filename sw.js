// Service Worker for PWA functionality
const CACHE_NAME = 'live-analysis-platform-v8';
const DYNAMIC_CACHE = 'dynamic-resources-v6';

// 存储用户首选项
let userPreferences = {
    showNotifications: true, // 默认显示通知
    pushNotifications: true  // 默认启用推送通知
};

// 跟踪笔记更新
let notesCache = {
    lastChecked: Date.now(),
    knownPaths: new Set()
};

// 缓存通知控制
let cacheNotificationControl = {
    lastNotificationTime: 0,
    throttleInterval: 1000 * 15, // 15秒内最多发送一次缓存完成通知
    batchTimeout: null
};

// 核心资源 - 这些资源始终会被缓存
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/css/main.css',
    '/assets/css/mobile.css',
    '/assets/css/pwa-enhancements.css',
    '/assets/js/main.js',
    '/assets/js/notes-data.js',
    '/assets/js/unified-notification-manager.js',
    '/assets/js/score-patches.js',
    '/assets/js/files-list.js',
    '/assets/js/missing-files.js',
    '/assets/js/file-monitor.js'
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
        }).then(() => {
            // 初始化已知笔记路径，避免将现有笔记当作新笔记
            return initializeKnownPaths();
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

    // 检查是否为笔记文件 (hjf或hjm目录下的HTML文件)
    if (url.pathname.includes('/2025/hjf/') || url.pathname.includes('/2025/hjm/')) {
        // 记录请求，可能是新的笔记
        if (url.pathname.endsWith('.html')) {
            checkForNewNotes(url.pathname);
        }
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

                            // 特殊处理notes-data.js文件
                            if (url.pathname.includes('notes-data.js')) {
                                // 检测新笔记
                                networkResponse.clone().text().then(text => {
                                    checkNotesDataForUpdates(text);
                                }).catch(err => {
                                    console.log('[Service Worker] 解析notes-data.js失败:', err);
                                });
                            }

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

// 初始化已知笔记路径
async function initializeKnownPaths() {
    try {
        console.log('[Service Worker] 初始化已知笔记路径...');

        // 尝试获取notes-data.js文件
        const response = await fetch('/assets/js/notes-data.js');
        if (response && response.status === 200) {
            const text = await response.text();

            // 提取NOTES_DATA对象
            const match = text.match(/window\.NOTES_DATA\s*=\s*({[\s\S]*?});/);
            if (match) {
                const notesData = JSON.parse(match[1]);

                // 将所有现有路径添加到已知路径中
                ['hjf', 'hjm'].forEach(author => {
                    if (notesData[author] && Array.isArray(notesData[author])) {
                        notesData[author].forEach(note => {
                            if (note.path) {
                                notesCache.knownPaths.add(note.path);
                            }
                            if (note.reviewReport && note.reviewReport.path) {
                                notesCache.knownPaths.add(note.reviewReport.path);
                            }
                        });
                    }
                });

                console.log(`[Service Worker] 已初始化 ${notesCache.knownPaths.size} 个已知路径`);
            }
        }
    } catch (error) {
        console.log('[Service Worker] 初始化已知路径失败:', error);
    }
}

// 检查是否有新笔记
function checkForNewNotes(path) {
    // 如果不是hjf或hjm文件夹下的文件，忽略
    if (!path.includes('/2025/hjf/') && !path.includes('/2025/hjm/')) {
        return;
    }

    // 如果已经知道这个路径，忽略
    if (notesCache.knownPaths.has(path)) {
        return;
    }

    // 添加到已知路径
    notesCache.knownPaths.add(path);

    // 确定是哪个作者的笔记
    let author = 'unknown';
    if (path.includes('/hjf/')) {
        author = 'HJF';
    } else if (path.includes('/hjm/')) {
        author = 'HJM';
    }

    // 提取文件名作为标题
    const pathParts = path.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const title = fileName.replace('.html', '');

    // 如果启用了推送通知，通知所有客户端
    if (userPreferences.pushNotifications) {
        notifyClients({
            action: 'NEW_NOTE',
            author: author,
            path: path,
            title: title,
            timestamp: Date.now()
        });
    }
}

// 检查notes-data.js文件更新并检测新笔记
function checkNotesDataForUpdates(notesDataText) {
    try {
        // 提取NOTES_DATA对象
        const match = notesDataText.match(/window\.NOTES_DATA\s*=\s*({[\s\S]*?});/);
        if (!match) {
            console.log('[Service Worker] 无法解析notes-data.js');
            return;
        }

        const notesData = JSON.parse(match[1]);
        const newNotesFound = [];

        // 收集所有新笔记
        ['hjf', 'hjm'].forEach(author => {
            if (!notesData[author] || !Array.isArray(notesData[author])) return;
            
            notesData[author].forEach(note => {
                // 检查主笔记
                if (note.path && !notesCache.knownPaths.has(note.path)) {
                    notesCache.knownPaths.add(note.path);
                    
                    newNotesFound.push({
                        action: 'NEW_NOTE',
                        author: author.toUpperCase(),
                        path: note.path,
                        title: note.title || note.path.split('/').pop().replace('.html', ''),
                        date: note.date || '1970-01-01',
                        isReview: false,
                        timestamp: Date.now()
                    });
                    
                    console.log(`[Service Worker] 发现新笔记: ${note.path}`);
                }

                // 检查评分报告
                if (note.reviewReport?.path && !notesCache.knownPaths.has(note.reviewReport.path)) {
                    notesCache.knownPaths.add(note.reviewReport.path);
                    
                    newNotesFound.push({
                        action: 'NEW_NOTE',
                        author: author.toUpperCase(),
                        path: note.reviewReport.path,
                        title: note.reviewReport.title || '评分报告',
                        date: note.reviewReport.date || note.date || '1970-01-01',
                        isReview: true,
                        timestamp: Date.now()
                    });
                    
                    console.log(`[Service Worker] 发现新评分报告: ${note.reviewReport.path}`);
                }
            });
        });

        // 如果有新笔记，按优化的方式发送通知
        if (newNotesFound.length > 0) {
            sendOptimizedNotifications(newNotesFound);
        }

    } catch (error) {
        console.error('[Service Worker] 解析notes-data.js时出错:', error);
    }
}

// 优化的通知发送逻辑
function sendOptimizedNotifications(newNotesFound) {
    if (!userPreferences.pushNotifications) return;
    
    // 数组本身就是倒序排列（最新在前），我们需要让最新的最后显示
    // 所以按日期升序排序，让较旧的先发送，最新的最后发送
    newNotesFound.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB; // 升序：较旧的在前面先发送，最新的在后面最后发送
    });
    
    console.log(`[Service Worker] 准备发送 ${newNotesFound.length} 个通知，确保最新内容最后显示`);
    
    // 使用优化的批量发送策略
    if (newNotesFound.length <= 3) {
        // 少量通知：顺序发送，确保最新的最后显示
        newNotesFound.forEach((notification, index) => {
            setTimeout(() => {
                notifyClients(notification);
            }, index * 400); // 400ms间隔
        });
    } else {
        // 大量通知：只发送最新的几个，避免刷屏
        // 由于已经按日期降序排序，取后面3个就是最新的
        const recentNotifications = newNotesFound.slice(-3); 
        
        recentNotifications.forEach((notification, index) => {
            setTimeout(() => {
                notifyClients(notification);
            }, index * 400);
        });
        
        // 发送一个汇总通知
        setTimeout(() => {
            notifyClients({
                action: 'NEW_NOTE',
                author: 'SYSTEM',
                path: '/',
                title: '多个更新',
                message: `发现 ${newNotesFound.length} 个新内容`,
                timestamp: Date.now(),
                isSummary: true
            });
        }, recentNotifications.length * 400);
    }
}

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

// 处理推送通知
self.addEventListener('push', function(event) {
    if (!userPreferences.pushNotifications) {
        return;
    }

    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'New Update',
            body: event.data ? event.data.text() : 'No details available',
        };
    }

    const title = data.title || 'New Content Available';
    const options = {
        body: data.body || 'Check it out!',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        data: data.data || {}
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// 处理通知点击
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    const data = event.notification.data;
    let url = '/';

    if (data && data.path) {
        url = data.path;
    } else if (data && data.url) {
        url = data.url;
    }

    event.waitUntil(
        clients.matchAll({type: 'window'}).then(function(clientList) {
            // 如果已有窗口打开，使用它
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }

            // 如果没有窗口，打开一个新窗口
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

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

            // 智能通知控制：避免频繁通知
            const currentTime = Date.now();
            if (currentTime - cacheNotificationControl.lastNotificationTime > cacheNotificationControl.throttleInterval) {
                cacheNotificationControl.lastNotificationTime = currentTime;

                // 延迟通知，避免批量缓存时的多次通知
                if (cacheNotificationControl.batchTimeout) {
                    clearTimeout(cacheNotificationControl.batchTimeout);
                }

                cacheNotificationControl.batchTimeout = setTimeout(() => {
                    // 通知客户端缓存完成（如果允许通知）
                    notifyClients({
                        action: 'CACHE_COMPLETE',
                        timestamp: currentTime
                    });
                }, 2000); // 2秒后发送通知，给批量操作时间
            } else {
                console.log('[Service Worker] 缓存通知被节流');
            }
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
    // 处理推送通知设置
    else if (event.data && event.data.action === 'SET_PUSH_PREFERENCE') {
        const { pushEnabled } = event.data;
        userPreferences.pushNotifications = pushEnabled;

        console.log(`[Service Worker] 设置推送通知偏好: ${pushEnabled ? '启用' : '禁用'}`);

        // 响应客户端，确认收到设置
        if (event.source) {
            event.source.postMessage({
                action: 'PUSH_PREFERENCE_SET',
                success: true
            });
        }
    }
    // 处理笔记数据更新
    else if (event.data && event.data.action === 'UPDATE_NOTES_CACHE') {
        // 更新笔记缓存
        if (event.data.knownPaths && Array.isArray(event.data.knownPaths)) {
            event.data.knownPaths.forEach(path => notesCache.knownPaths.add(path));
        }

        notesCache.lastChecked = Date.now();

        // 响应客户端，确认接收
        if (event.source) {
            event.source.postMessage({
                action: 'NOTES_CACHE_UPDATED',
                timestamp: notesCache.lastChecked
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
    } else if (event.tag === 'check-notes-updates') {
        // TODO: 定期检查笔记更新
        console.log('[Service Worker] 正在检查笔记更新...');
    }
});
