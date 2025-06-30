/**
 * Service Worker 更新器
 * 负责与Service Worker通信，实现自动校准功能
 */

class ServiceWorkerUpdater {
    constructor() {
        this.swRegistration = null;
        this.filesList = null;
        this.initialized = false;
        // 添加通知首选项设置，从localStorage读取，如果没有则默认显示通知
        this.showNotifications = localStorage.getItem('swShowNotifications') !== 'false';
        // 添加通知去重机制
        this.lastCacheCompleteTime = 0;
        this.cacheCompleteThreshold = 1000 * 10; // 10秒内不重复显示缓存完成通知
        this.notificationQueue = new Set(); // 通知队列，避免重复
        // 添加静音模式（开发时使用）
        this.silentMode = localStorage.getItem('swSilentMode') === 'true';
        // 检测开发环境
        this.isDevelopment = window.location.hostname === 'localhost' ||
                            window.location.hostname === '127.0.0.1' ||
                            window.location.hostname.includes('localhost');
    }

    /**
     * 初始化Service Worker更新器
     */
    async init() {
        if (this.initialized) return;
        this.initialized = true;

        // 检查Service Worker支持
        if (!('serviceWorker' in navigator)) {
            console.warn('浏览器不支持Service Worker');
            return;
        }

        try {
            // 如果禁用了通知，移除任何可能存在的通知
            if (!this.showNotifications) {
                this.removeAllNotifications();
            }

            // 开发环境提示
            if (this.isDevelopment) {
                console.log('🔧 开发模式已检测到');
                console.log('💡 通知控制命令:');
                console.log('   - toggleNotifications() : 切换通知开关');
                console.log('   - toggleSilentMode() : 切换静音模式');
                console.log('   - getNotificationStatus() : 查看通知状态');
                console.log('   - getSilentMode() : 查看静音状态');
                console.log('ℹ️  开发环境下默认启用通知，如需关闭请使用 toggleSilentMode()');

                // 显示当前状态
                if (this.silentMode) {
                    console.log('🔇 当前静音模式：已启用');
                } else {
                    console.log('🔊 当前静音模式：已禁用（通知将正常显示）');
                }
            }

            // 加载文件列表
            this.filesList = window.FILES_LIST || null;
            if (!this.filesList) {
                console.warn('未找到文件列表数据，无法进行自动校准');
            }

            // 注册Service Worker
            this.swRegistration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker 注册成功:', this.swRegistration);

            // 同步通知首选项到Service Worker
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    action: 'SET_NOTIFICATION_PREFERENCE',
                    showNotifications: this.showNotifications
                });
            }

            // 监听Service Worker消息
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event);
            });

            // 等待Service Worker激活
            if (this.swRegistration.active) {
                this.onServiceWorkerActive();
            } else {
                // 监听状态变化
                this.swRegistration.addEventListener('statechange', (event) => {
                    if (event.target.state === 'activated') {
                        this.onServiceWorkerActive();
                    }
                });
            }
        } catch (error) {
            console.error('Service Worker 注册失败:', error);
        }
    }

    /**
     * 当Service Worker激活时调用
     */
    onServiceWorkerActive() {
        console.log('Service Worker 已激活');

        // 延迟一段时间后发送缓存请求，确保页面已完全加载
        setTimeout(() => {
            this.sendCacheAssetsRequest();
        }, 3000);
    }

    /**
     * 发送缓存资源请求给Service Worker
     */
    sendCacheAssetsRequest() {
        if (!this.filesList || !navigator.serviceWorker.controller) return;

        // 收集需要缓存的资源
        const assetsToCacheMap = new Map();

        // 添加HTML文件
        this.filesList.html.forEach(file => assetsToCacheMap.set(file, true));

        // 添加CSS文件
        this.filesList.css.forEach(file => assetsToCacheMap.set(file, true));

        // 添加JS文件
        this.filesList.js.forEach(file => assetsToCacheMap.set(file, true));

        // 添加图片文件（仅添加关键图片，如图标）
        this.filesList.images
            .filter(file => file.includes('icon-') || file.includes('logo'))
            .forEach(file => assetsToCacheMap.set(file, true));

        // 转换为数组
        const assetsToCache = Array.from(assetsToCacheMap.keys());

        // 发送消息给Service Worker
        if (assetsToCache.length > 0) {
            console.log(`请求缓存 ${assetsToCache.length} 个资源`);
            navigator.serviceWorker.controller.postMessage({
                action: 'CACHE_DYNAMIC_ASSETS',
                assets: assetsToCache,
                timestamp: Date.now()
            });
        }
    }

    /**
     * 处理来自Service Worker的消息
     */
    handleServiceWorkerMessage(event) {
        const message = event.data;

        if (message && message.action === 'CACHE_COMPLETE') {
            const currentTime = Date.now();
            console.log('资源缓存完成，时间戳:', new Date(message.timestamp).toLocaleString());

            // 检查是否在阈值时间内重复通知
            if (currentTime - this.lastCacheCompleteTime < this.cacheCompleteThreshold) {
                console.log('缓存完成通知被过滤（重复）');
                return;
            }

            // 更新最后通知时间
            this.lastCacheCompleteTime = currentTime;

            // 确认通知未被禁用再显示
            if (this.showNotifications) {
                // 检查是否已在队列中
                const notificationId = 'cache-complete';
                if (this.notificationQueue.has(notificationId)) {
                    console.log('缓存完成通知已在队列中，跳过');
                    return;
                }

                // 添加到队列
                this.notificationQueue.add(notificationId);

                // 显示通知
                this.showNotification('🚀 应用已优化，可离线使用');

                // 3秒后从队列中移除
                setTimeout(() => {
                    this.notificationQueue.delete(notificationId);
                }, 3000);
            }
        }
        else if (message && message.action === 'NEW_NOTE') {
            console.log('检测到新笔记:', message);

            // 确认通知未被禁用再显示
            if (this.showNotifications) {
                // 构建通知消息
                let notificationMessage = '📝 发现新内容';

                if (message.author && message.title) {
                    // 简化标题显示
                    let displayTitle = message.title;
                    if (displayTitle.length > 15) {
                        displayTitle = displayTitle.substring(0, 12) + '...';
                    }
                    notificationMessage = `📝 ${message.author} 发布了新内容：${displayTitle}`;
                } else if (message.author) {
                    notificationMessage = `📝 ${message.author} 发布了新内容`;
                }

                // 使用路径作为唯一标识符
                const notificationId = `new-note-${message.path}`;
                if (this.notificationQueue.has(notificationId)) {
                    console.log('新笔记通知已在队列中，跳过');
                    return;
                }

                // 添加到队列
                this.notificationQueue.add(notificationId);

                // 显示通知
                this.showNotification(notificationMessage);

                // 5秒后从队列中移除
                setTimeout(() => {
                    this.notificationQueue.delete(notificationId);
                }, 5000);
            }
        }
    }

    /**
     * 设置是否显示通知
     * @param {boolean} show - true显示通知，false不显示
     */
    setShowNotifications(show) {
        // 立即获取当前通知，如果存在将被隐藏或移除
        const existingNotification = document.getElementById('sw-notification');

        // 更新状态和存储
        this.showNotifications = show;
        localStorage.setItem('swShowNotifications', show ? 'true' : 'false');

        // 同步设置到Service Worker
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                action: 'SET_NOTIFICATION_PREFERENCE',
                showNotifications: show
            });
        }

        // 处理现有通知
        if (existingNotification) {
            existingNotification.style.opacity = '0';
            setTimeout(() => existingNotification.remove(), 300);
        }

        // 仅在开启通知时显示确认信息
        if (show) {
            this.showNotification('已开启通知');
        } else {
            console.log('通知已禁用');
            // 不再显示"已关闭通知"的提示
            // 移除所有可能存在的通知
            this.removeAllNotifications();
        }

        return show;
    }

    /**
     * 移除所有通知
     */
    removeAllNotifications() {
        const notification = document.getElementById('sw-notification');
        if (notification) {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }
    }

    /**
     * 切换通知状态
     * @returns {boolean} 切换后的状态
     */
    toggleNotifications() {
        return this.setShowNotifications(!this.showNotifications);
    }

    /**
     * 获取当前通知状态
     * @returns {boolean} 当前是否显示通知
     */
    getNotificationStatus() {
        return this.showNotifications;
    }

    /**
     * 显示通知（仅当 showNotifications 为 true 时显示）
     */
    showNotification(message) {
        // 检查是否禁用通知
        if (!this.showNotifications) {
            console.log('通知已禁用，消息:', message);
            return;
        }

        // 检查手动启用的静音模式
        if (this.silentMode) {
            console.log('静音模式已启用，消息:', message);
            return;
        }

        this.showNotificationOnce(message);
    }

    /**
     * 显示一次性通知，无论通知设置如何
     * 注意: 此方法应仅被showNotification调用，以确保通知首选项被尊重
     * 或者在关闭通知前显示最后一条通知
     */
    showNotificationOnce(message) {
        // 检查是否已存在通知元素
        let notification = document.getElementById('sw-notification');

        if (!notification) {
            // 创建新通知
            this.createNewNotification(message);
        } else {
            // 如果已存在通知，创建新的通知元素而不是覆盖
            // 先隐藏现有通知
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(20px)';
            
            // 延迟创建新通知，避免重叠
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
                this.createNewNotification(message);
            }, 300);
        }
    }

    /**
     * 创建新的通知元素
     */
    createNewNotification(message) {
        // 保存this引用，解决事件处理程序中的this问题
        const self = this;

        // 创建通知元素
        const notification = document.createElement('div');
        notification.id = 'sw-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary-color);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
            z-index: 9999;
            display: flex;
            align-items: center;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            max-width: calc(100vw - 40px);
            font-size: 14px;
            backdrop-filter: blur(10px);
        `;

        // 添加图标
        const icon = document.createElement('span');
        icon.textContent = '';
        icon.style.cssText = `
            margin-right: 10px;
            font-size: 16px;
            flex-shrink: 0;
        `;
        notification.appendChild(icon);

        // 添加消息文本
        const text = document.createElement('span');
        text.textContent = message;
        text.style.cssText = `
            flex: 1;
            line-height: 1.4;
            word-break: break-word;
        `;
        notification.appendChild(text);

        // 添加关闭按钮
        const closeBtn = document.createElement('span');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            margin-left: 15px;
            cursor: pointer;
            font-size: 20px;
            font-weight: bold;
            opacity: 0.8;
            transition: opacity 0.2s ease;
            flex-shrink: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
        `;
        closeBtn.addEventListener('click', () => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        });

        // 鼠标悬停效果
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.opacity = '1';
            closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.opacity = '0.8';
            closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        });

        notification.appendChild(closeBtn);

        document.body.appendChild(notification);

        // 显示通知动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);

        // 6秒后自动隐藏（延长时间让用户有足够时间看到）
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(-50%) translateY(20px)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 6000);
    }

    /**
     * 检查更新
     */
    async checkForUpdates() {
        if (!this.swRegistration) return;

        try {
            await this.swRegistration.update();
            console.log('Service Worker 已检查更新');
        } catch (error) {
            console.error('检查更新失败:', error);
        }
    }

    /**
     * 设置静音模式
     * @param {boolean} silent - true启用静音，false禁用静音
     */
    setSilentMode(silent) {
        this.silentMode = silent;
        localStorage.setItem('swSilentMode', silent ? 'true' : 'false');

        if (this.isDevelopment) {
            if (silent) {
                console.log('🔇 静音模式已启用 - 缓存通知将被隐藏');
            } else {
                console.log('🔊 静音模式已禁用 - 缓存通知将正常显示');
            }
        } else {
            console.log(`静音模式${silent ? '已启用' : '已禁用'}`);
        }

        return silent;
    }

    /**
     * 切换静音模式
     */
    toggleSilentMode() {
        return this.setSilentMode(!this.silentMode);
    }

    /**
     * 获取静音模式状态
     */
    getSilentMode() {
        return this.silentMode;
    }
}

// 创建实例
const swUpdater = new ServiceWorkerUpdater();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    swUpdater.init();
});

// 导出实例和便捷方法
window.swUpdater = swUpdater;

// 提供便捷的全局方法
window.toggleNotifications = () => swUpdater.toggleNotifications();
window.toggleSilentMode = () => swUpdater.toggleSilentMode();
window.getNotificationStatus = () => swUpdater.getNotificationStatus();
window.getSilentMode = () => swUpdater.getSilentMode();
