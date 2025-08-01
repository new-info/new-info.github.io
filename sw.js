// Service Worker for PWA functionality
// 版本配置从app-config.js中获取，确保版本一致性
const CACHE_NAME = 'live-analysis-platform-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-resources-v1.0.0';

// Service Worker版本标识，每次重要更新时修改此版本
const SW_VERSION = '1.0.0';

// 存储用户首选项
let userPreferences = {
    showNotifications: true, // 默认显示通知
    pushNotifications: true  // 默认启用推送通知
};

// 跟踪笔记更新
let notesCache = {
    lastChecked: Date.now(),
    knownPaths: new Set(),
    initialized: false,
    installTime: Date.now() // 记录Service Worker安装时间
};

// 缓存通知控制
let cacheNotificationControl = {
    lastNotificationTime: 0,
    throttleInterval: 1000 * 15, // 15秒内最多发送一次缓存完成通知
    batchTimeout: null
};

// 缓存清理控制
let cacheCleanupControl = {
    lastCleanupTime: 0,
    cleanupInterval: 1000 * 60 * 60, // 1小时内最多执行一次完整清理
    isCleaningUp: false
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
    '/assets/js/sw-updater.js', // 改为直接使用sw-updater中的通知功能
    '/assets/js/score-patches.js',
    '/assets/js/files-list.js',
    '/assets/js/missing-files.js',
    '/assets/js/file-monitor.js',
    '/assets/js/sw-storage-helper.js',
    '/assets/js/pwa-install-prompt.js'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] 安装中...');

    // 通知客户端找到更新
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                action: 'UPDATE_FOUND',
                version: SW_VERSION,
                timestamp: Date.now()
            });
        });
    });

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] 缓存核心资源');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => {
                // 通知客户端更新已就绪
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            action: 'UPDATE_READY',
                            version: SW_VERSION,
                            timestamp: Date.now()
                        });
                    });
                });

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
            // 清除客户端storage缓存
            console.log('[Service Worker] 正在清除storage缓存...');
            return clearClientStorages();
        }).then(() => {
            console.log('[Service Worker] 声明控制权');
            return self.clients.claim();
        }).then(() => {
            // 初始化已知笔记路径，避免将现有笔记当作新笔记
            return initializeKnownPaths();
        }).then(() => {
            // 通知客户端Service Worker已激活
            return self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        action: 'ACTIVATED',
                        version: SW_VERSION,
                        timestamp: Date.now()
                    });
                });
            });
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

        // 首先尝试从客户端存储中恢复已知路径
        const clients = await self.clients.matchAll();
        if (clients.length > 0) {
            // 请求客户端提供已知路径
            const storageData = await requestStorageFromClient(clients[0]);
            if (storageData && storageData.knownPaths) {
                storageData.knownPaths.forEach(path => notesCache.knownPaths.add(path));
                console.log(`[Service Worker] 从客户端恢复 ${notesCache.knownPaths.size} 个已知路径`);
            }
        }

        // 尝试获取notes-data.js文件
        const response = await fetch('/assets/js/notes-data.js');
        if (response && response.status === 200) {
            const text = await response.text();

            // 提取NOTES_DATA对象
            const match = text.match(/window\.NOTES_DATA\s*=\s*({[\s\S]*?});/);
            if (match) {
                const notesData = JSON.parse(match[1]);

                // 检查是否是首次安装（从安装到现在少于10秒）
                const isFirstInstall = (Date.now() - notesCache.installTime) < 10000;

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

                // 保存已知路径到客户端存储
                await saveKnownPathsToClient();

                console.log(`[Service Worker] 已初始化 ${notesCache.knownPaths.size} 个已知路径 ${isFirstInstall ? '(首次安装)' : ''}`);

                // 标记为已初始化
                notesCache.initialized = true;
            }
        }
    } catch (error) {
        console.log('[Service Worker] 初始化已知路径失败:', error);
        // 即使失败也标记为已初始化，避免重复尝试
        notesCache.initialized = true;
    }
}

// 从客户端请求存储数据
async function requestStorageFromClient(client) {
    return new Promise((resolve) => {
        const channel = new MessageChannel();

        channel.port1.onmessage = (event) => {
            resolve(event.data);
        };

        client.postMessage({
            action: 'REQUEST_KNOWN_PATHS'
        }, [channel.port2]);

        // 3秒后超时
        setTimeout(() => resolve(null), 3000);
    });
}

// 保存已知路径到客户端存储
async function saveKnownPathsToClient() {
    try {
        const clients = await self.clients.matchAll();
        const pathsArray = Array.from(notesCache.knownPaths);

        clients.forEach(client => {
            client.postMessage({
                action: 'SAVE_KNOWN_PATHS',
                knownPaths: pathsArray,
                timestamp: Date.now()
            });
        });
    } catch (error) {
        console.log('[Service Worker] 保存已知路径失败:', error);
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

        // 检查是否在静默期内（Service Worker安装后30秒内）
        const isInSilentPeriod = (Date.now() - notesCache.installTime) < 30000;
        const newNotesFound = [];

        // 收集所有新笔记
        ['hjf', 'hjm'].forEach(author => {
            if (!notesData[author] || !Array.isArray(notesData[author])) return;

            notesData[author].forEach(note => {
                // 检查主笔记
                if (note.path && !notesCache.knownPaths.has(note.path)) {
                    notesCache.knownPaths.add(note.path);

                    // 如果不在静默期且已完成初始化，才记录为新笔记
                    if (!isInSilentPeriod && notesCache.initialized) {
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
                    } else {
                        console.log(`[Service Worker] 静默期内，跳过通知: ${note.path}`);
                    }
                }

                // 检查评分报告
                if (note.reviewReport?.path && !notesCache.knownPaths.has(note.reviewReport.path)) {
                    notesCache.knownPaths.add(note.reviewReport.path);

                    // 如果不在静默期且已完成初始化，才记录为新笔记
                    if (!isInSilentPeriod && notesCache.initialized) {
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
                    } else {
                        console.log(`[Service Worker] 静默期内，跳过通知: ${note.reviewReport.path}`);
                    }
                }
            });
        });

        // 保存更新后的已知路径
        saveKnownPathsToClient();

        // 如果有新笔记且不在静默期，按优化的方式发送通知
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
                // 修改消息格式，统一使用sw-updater的通知系统
                if (message.action === 'NEW_NOTE') {
                    // 转换为统一通知格式
                    client.postMessage({
                        action: 'SHOW_NOTIFICATION',
                        message: message.isReview
                            ? `📝 ${message.author} 新评分报告: ${message.title}`
                            : `📝 ${message.author} 新内容: ${message.title}`,
                        data: message
                    });
                } else if (message.action === 'CACHE_COMPLETE') {
                    client.postMessage({
                        action: 'SHOW_NOTIFICATION',
                        message: '✅ 资源缓存完成，可离线使用',
                        data: message
                    });
                } else if (message.action === 'CACHE_CLEANED') {
                    client.postMessage({
                        action: 'SHOW_NOTIFICATION',
                        message: '🧹 缓存已清理完成',
                        data: message
                    });
                } else {
                    // 其他消息类型保持原样传递
                    client.postMessage(message);
                }
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
    } else if (event.data && event.data.action === 'CLEAN_CACHES') {
        // 处理缓存清理请求
        console.log('[Service Worker] 收到缓存清理请求');

        // 检查是否可以执行清理（避免频繁清理）
        const currentTime = Date.now();
        if (cacheCleanupControl.isCleaningUp) {
            console.log('[Service Worker] 缓存清理正在进行中，忽略此次请求');

            // 如果有回复通道，发送忙碌状态
            if (event.ports && event.ports[0]) {
                event.ports[0].postMessage({
                    status: 'busy',
                    message: '缓存清理正在进行中',
                    timestamp: currentTime
                });
            }
            return;
        }

        // 设置清理状态
        cacheCleanupControl.isCleaningUp = true;

        // 执行缓存清理
        cleanAllCaches()
            .then((result) => {
                console.log('[Service Worker] 缓存清理完成:', result);

                // 更新最后清理时间
                cacheCleanupControl.lastCleanupTime = currentTime;
                cacheCleanupControl.isCleaningUp = false;

                // 如果有回复通道，发送成功状态
                if (event.ports && event.ports[0]) {
                    event.ports[0].postMessage({
                        status: 'success',
                        message: '缓存清理成功',
                        result: result,
                        timestamp: currentTime
                    });
                }

                // 通知所有客户端缓存已清理
                notifyClients({
                    action: 'CACHE_CLEANED',
                    result: result,
                    timestamp: currentTime
                });
            })
            .catch((error) => {
                console.error('[Service Worker] 缓存清理失败:', error);

                // 重置清理状态
                cacheCleanupControl.isCleaningUp = false;

                // 如果有回复通道，发送错误状态
                if (event.ports && event.ports[0]) {
                    event.ports[0].postMessage({
                        status: 'error',
                        error: error.message || '缓存清理失败',
                        timestamp: currentTime
                    });
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

// 清理所有缓存
async function cleanAllCaches() {
    console.log('[Service Worker] 开始清理所有缓存');

    try {
        // 获取所有缓存名称
        const cacheNames = await caches.keys();

        // 保留当前版本的缓存
        const currentCaches = [CACHE_NAME, DYNAMIC_CACHE];

        // 清理旧版本缓存
        const deletedCaches = [];
        const cacheDeletionPromises = cacheNames
            .filter(name => !currentCaches.includes(name))
            .map(async name => {
                try {
                    await caches.delete(name);
                    deletedCaches.push(name);
                    console.log(`[Service Worker] 已删除缓存: ${name}`);
                } catch (error) {
                    console.error(`[Service Worker] 删除缓存失败 ${name}:`, error);
                }
            });

        // 等待所有缓存删除完成
        await Promise.all(cacheDeletionPromises);

        // 清理当前动态缓存中的旧资源
        const dynamicCache = await caches.open(DYNAMIC_CACHE);
        const dynamicKeys = await dynamicCache.keys();
        const deletedResources = [];

        // 保留最近7天的资源，删除更旧的资源
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

        for (const request of dynamicKeys) {
            try {
                const response = await dynamicCache.match(request);
                if (response) {
                    const headers = response.headers;
                    const date = headers.get('date');

                    if (date) {
                        const timestamp = new Date(date).getTime();
                        if (timestamp < oneWeekAgo) {
                            await dynamicCache.delete(request);
                            deletedResources.push(request.url);
                        }
                    } else {
                        // 如果没有日期，保留资源
                    }
                }
            } catch (error) {
                console.error(`[Service Worker] 清理资源失败 ${request.url}:`, error);
            }
        }

        return {
            deletedCaches,
            deletedResources,
            timestamp: Date.now()
        };
    } catch (error) {
        console.error('[Service Worker] 清理缓存失败:', error);
        throw error;
    }
}

/**
 * 清除客户端storage缓存
 * 当Service Worker版本更新时，清除可能不兼容的旧数据
 */
async function clearClientStorages() {
    try {
        const clients = await self.clients.matchAll();

        // 创建一个消息通道用于等待客户端响应
        const clearPromises = clients.map(client => {
            return new Promise((resolve) => {
                const messageChannel = new MessageChannel();

                // 设置消息通道接收回调
                messageChannel.port1.onmessage = (event) => {
                    if (event.data && event.data.action === 'STORAGE_CLEARED') {
                        console.log(`[Service Worker] 客户端 ${client.id} 已清除storage`);
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                };

                // 发送清除storage请求
                client.postMessage({
                    action: 'CLEAR_STORAGE',
                    preserveKeys: [
                                        // 保留这些键，不要清除 - 从配置获取
                ...(window.APP_CONFIG?.cache?.preservedKeys || [
                    'swShowNotifications',
                    'swSilentMode',
                    'auth-token', // 保留认证信息
                    'sw-last-active-version' // 保留上次活跃版本号
                ])
                    ],
                    version: SW_VERSION
                }, [messageChannel.port2]);

                // 超时处理，防止无限等待
                setTimeout(() => {
                    console.log(`[Service Worker] 客户端 ${client.id} 清除storage超时`);
                    resolve(false);
                }, 2000);
            });
        });

        // 等待所有客户端响应
        const results = await Promise.all(clearPromises);
        console.log(`[Service Worker] ${results.filter(Boolean).length}/${clients.length} 个客户端已清除storage`);

        return true;
    } catch (error) {
        console.error('[Service Worker] 清除storage失败:', error);
        return false;
    }
}
