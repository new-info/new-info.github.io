/**
 * Service Worker 更新器
 * 负责与Service Worker通信，实现自动校准功能
 */

class ServiceWorkerUpdater {
    constructor() {
        this.swRegistration = null;
        this.filesList = null;
        this.initialized = false;
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
            // 加载文件列表
            this.filesList = window.FILES_LIST || null;
            if (!this.filesList) {
                console.warn('未找到文件列表数据，无法进行自动校准');
            }

            // 注册Service Worker
            this.swRegistration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker 注册成功:', this.swRegistration);

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
            this.showNotification('资源缓存已完成，应用可以离线使用');
        }
    }

    /**
     * 显示通知
     */
    showNotification(message) {
        // 检查是否已存在通知元素
        let notification = document.getElementById('sw-notification');
        
        if (!notification) {
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