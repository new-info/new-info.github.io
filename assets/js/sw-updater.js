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
            console.log('资源缓存完成，时间戳:', new Date(message.timestamp).toLocaleString());
            // 确认通知未被禁用再显示
            if (this.showNotifications) {
                this.showNotification('资源缓存已完成，应用可以离线使用');
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
        if (!this.showNotifications) {
            console.log('通知已禁用，消息:', message);
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
            // 保存this引用，解决事件处理程序中的this问题
            const self = this;

            // 创建通知元素
            notification = document.createElement('div');
            notification.id = 'sw-notification';
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--primary-color);
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                z-index: 9999;
                display: flex;
                align-items: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;

            // 添加图标
            const icon = document.createElement('span');
            icon.textContent = '✅';
            icon.style.marginRight = '10px';
            notification.appendChild(icon);

            // 添加消息文本
            const text = document.createElement('span');
            text.textContent = message;
            notification.appendChild(text);

            // 添加关闭按钮
            const closeBtn = document.createElement('span');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = `
                margin-left: 15px;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
            `;
            closeBtn.addEventListener('click', () => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            });
            notification.appendChild(closeBtn);

            // 不再显示提示按钮 - 仅当通知功能当前未禁用时显示此按钮
            /*if (self.showNotifications) {
                const noPromptBtn = document.createElement('span');
                noPromptBtn.textContent = '不再提示';
                noPromptBtn.style.cssText = `
                    margin-left: 15px;
                    cursor: pointer;
                    font-size: 12px;
                    text-decoration: underline;
                    opacity: 0.8;
                `;
                noPromptBtn.addEventListener('click', () => {
                    // 使用self而不是this，确保引用正确的实例
                    self.setShowNotifications(false);

                    // 确保页面上的通知开关也被更新
                    const toggle = document.getElementById('sw-notifications-toggle');
                    if (toggle) {
                        toggle.checked = false;
                    }

                    // 不需要再次处理通知隐藏，因为setShowNotifications会处理
                });
                notification.appendChild(noPromptBtn);
            }*/

            document.body.appendChild(notification);

            // 显示通知
            setTimeout(() => {
                notification.style.opacity = '1';
            }, 100);

            // 5秒后自动隐藏
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 5000);
        } else {
            // 更新现有通知
            const textElement = notification.querySelector('span:nth-child(2)');
            if (textElement) {
                textElement.textContent = message;
            }
        }
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
}

// 创建实例
const swUpdater = new ServiceWorkerUpdater();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    swUpdater.init();
});

// 导出实例
window.swUpdater = swUpdater;
