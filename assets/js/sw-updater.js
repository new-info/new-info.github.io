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
        // 检测开发环境 - 从配置获取
        this.isDevelopment = window.APP_CONFIG?.development?.isDev || 
                            window.location.hostname === 'localhost' ||
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
        if (!event.data || !event.data.action) return;

        const { action, message, data } = event.data;

        // 开发环境日志
        if (this.isDevelopment) {
            console.log(`📥 接收SW消息: ${action}`, event.data);
        }

        switch(action) {
            case 'UPDATE_FOUND':
                console.log('🆕 发现Service Worker更新');
                this.handleUpdateFound(data);
                break;

            case 'UPDATE_READY':
                console.log('✅ Service Worker已更新并准备安装');
                this.handleUpdateReady();
                break;

            case 'ACTIVATED':
                console.log('🚀 新版Service Worker已激活');
                this.handleActivated(data);
                break;

            case 'CACHE_COMPLETE':
                console.log('📦 资源缓存完成');
                this.handleCacheComplete(data);
                break;

            case 'CACHE_CLEANED':
                console.log('🧹 缓存已清理');
                this.handleCacheCleaned(data);
                break;

            case 'ERROR':
                console.error('⚠️ Service Worker错误:', data);
                this.handleSWError(data);
                break;

            case 'NEW_NOTE':
                console.log('📝 发现新笔记:', data);
                this.handleNewNote(data);
                break;

            case 'SHOW_NOTIFICATION':
                // 处理通过统一方式显示的通知
                this.showNotification(message);
                break;

            case 'CLEAR_STORAGE':
                console.log('🗑️ 收到清除storage请求');
                this.handleClearStorage(data, event.ports[0]);
                break;

            default:
                console.log(`未处理的SW消息: ${action}`);
        }
    }

    /**
     * 处理新笔记通知
     */
    handleNewNote(data) {
        // 注意：通知已经通过SHOW_NOTIFICATION处理
        // 这里只处理额外的逻辑，如更新笔记列表等

        // 如果页面上有notesApp，刷新数据
        if (window.notesApp && typeof window.notesApp.loadNotes === 'function') {
            // 延迟1秒刷新，避免连续多个更新导致频繁刷新
            clearTimeout(this._notesRefreshTimer);
            this._notesRefreshTimer = setTimeout(() => {
                window.notesApp.loadNotes();
            }, 1000);
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

    /**
     * 处理更新发现事件
     */
    handleUpdateFound(data) {
        console.log('发现Service Worker更新:', data);

        // 可以在这里处理更新发现逻辑
        // 例如显示更新进度或提示用户即将更新
        if (this.showNotifications && !this.silentMode) {
            this.showNotification('🔄 发现新版本，正在准备更新...');
        }
    }

    /**
     * 处理更新准备就绪事件
     */
    handleUpdateReady() {
        console.log('Service Worker更新已准备就绪');

        if (this.showNotifications && !this.silentMode) {
            // 创建更新就绪通知，包含刷新按钮
            this.showUpdateReadyNotification();
        }
    }

    /**
     * 显示更新就绪通知，并提供刷新按钮
     */
    showUpdateReadyNotification() {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.id = 'sw-update-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary-color, #007bff);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: calc(100vw - 40px);
            font-size: 14px;
            backdrop-filter: blur(10px);
        `;

        // 消息文本
        const text = document.createElement('span');
        text.textContent = '✨ 新版本已就绪，是否立即更新？';
        text.style.cssText = 'flex: 1;';

        // 刷新按钮
        const refreshButton = document.createElement('button');
        refreshButton.textContent = '更新';
        refreshButton.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            padding: 5px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.3s;
        `;
        refreshButton.addEventListener('mouseover', () => {
            refreshButton.style.background = 'rgba(255, 255, 255, 0.3)';
        });
        refreshButton.addEventListener('mouseout', () => {
            refreshButton.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        refreshButton.addEventListener('click', () => {
            window.location.reload();
        });

        // 关闭按钮
        const closeButton = document.createElement('span');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            cursor: pointer;
            font-size: 20px;
            opacity: 0.8;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeButton.addEventListener('click', () => {
            notification.remove();
        });

        // 组装通知
        notification.appendChild(text);
        notification.appendChild(refreshButton);
        notification.appendChild(closeButton);

        // 添加到页面
        document.body.appendChild(notification);
    }

    /**
     * 处理缓存完成事件
     */
    handleCacheComplete(data) {
        const currentTime = Date.now();
        console.log('资源缓存完成，时间戳:', new Date(data?.timestamp || currentTime).toLocaleString());

        // 检查是否在阈值时间内重复通知
        if (currentTime - this.lastCacheCompleteTime < this.cacheCompleteThreshold) {
            console.log('缓存完成通知被过滤（重复）');
            return;
        }

        // 更新最后通知时间
        this.lastCacheCompleteTime = currentTime;

        // 显示通知
        if (this.showNotifications && !this.silentMode) {
            this.showNotification('📦 资源已缓存，可离线使用');
        }
    }

    /**
     * 处理缓存清理事件
     */
    handleCacheCleaned(data) {
        if (data && data.result) {
            const { deletedCaches = [], deletedResources = [] } = data.result;
            console.log(`清理了 ${deletedCaches.length} 个旧缓存，${deletedResources.length} 个过期资源`);
        }
    }

    /**
     * 处理Service Worker激活事件
     */
    handleActivated(data) {
        // 激活后可以执行一些操作，比如重新加载页面
        // 也可以仅显示通知告知用户
        const version = data?.version || '0.0.0';
        console.log(`Service Worker已激活，版本: ${version}`);

        if (this.showNotifications && !this.silentMode) {
            this.showNotification(`✅ 应用已更新到 v${version}`);
        }

        // 缓存最近更新的版本号到本地
        localStorage.setItem('sw-last-active-version', version);
        localStorage.setItem('sw-last-active-time', Date.now().toString());
    }

    /**
     * 处理Service Worker错误
     */
    handleSWError(data) {
        const errorMsg = data?.message || '未知错误';
        console.error('Service Worker错误:', errorMsg);

        // 严重错误才显示通知
        if (data?.critical && this.showNotifications) {
            this.showNotification(`⚠️ 应用出现问题: ${errorMsg}`);
        }
    }

    /**
     * 测试版本更新通知流程
     * 仅用于开发环境测试
     */
    testVersionNotifications() {
        if (!this.isDevelopment) {
            console.warn('版本通知测试仅在开发环境可用');
            return false;
        }

        console.log('🧪 测试版本更新通知流程...');

        // 模拟发现更新
        setTimeout(() => {
            this.handleUpdateFound({
                version: '1.0.3-test',
                timestamp: Date.now()
            });

            // 模拟更新就绪
            setTimeout(() => {
                this.handleUpdateReady();

                // 模拟激活
                setTimeout(() => {
                    this.handleActivated({
                        version: '1.0.3-test',
                        timestamp: Date.now()
                    });
                }, 3000);
            }, 3000);
        }, 1000);

        return true;
    }

    /**
     * 处理清除storage请求
     * @param {Object} data 消息数据
     * @param {MessagePort} port 消息通道端口，用于响应
     */
    handleClearStorage(data, port) {
        // 如果没有端口，无法响应
        if (!port) {
            console.error('清除storage请求缺少响应端口');
            return;
        }

        try {
            const newVersion = data.version || '未知';
            const oldVersion = localStorage.getItem('sw-last-active-version') || '未知';

            console.log(`🧹 清除storage，从版本 ${oldVersion} 更新到: ${newVersion}`);

            // 要保留的键列表
            const preserveKeys = data.preserveKeys || [];

            // 保存需要保留的值
            const preservedValues = {};
            preserveKeys.forEach(key => {
                const value = localStorage.getItem(key);
                if (value !== null) {
                    preservedValues[key] = value;
                }
            });

            // 清除localStorage
            const itemCount = localStorage.length;
            localStorage.clear();

            // 恢复保留的值
            Object.keys(preservedValues).forEach(key => {
                localStorage.setItem(key, preservedValues[key]);
            });

            // 保存新版本号
            localStorage.setItem('sw-last-active-version', newVersion);
            localStorage.setItem('sw-last-update-time', Date.now().toString());

            // 清除sessionStorage
            sessionStorage.clear();

            // 尝试清除IndexedDB
            this.clearIndexedDB();

            console.log(`🧹 已清除 ${itemCount} 个localStorage项，保留 ${Object.keys(preservedValues).length} 个项`);

            // 显示更新通知
            this.showVersionUpdateNotification(oldVersion, newVersion);

            // 回复Service Worker
            port.postMessage({
                action: 'STORAGE_CLEARED',
                success: true,
                itemCount: itemCount,
                preservedCount: Object.keys(preservedValues).length,
                oldVersion,
                newVersion
            });
        } catch (error) {
            console.error('清除storage失败:', error);

            // 回复Service Worker出错
            port.postMessage({
                action: 'STORAGE_CLEARED',
                success: false,
                error: error.message
            });
        }
    }

    /**
     * 显示版本更新清理通知
     * @param {string} oldVersion 旧版本
     * @param {string} newVersion 新版本
     */
    showVersionUpdateNotification(oldVersion, newVersion) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.id = 'version-update-notification';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--primary-color, #4caf50);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            max-width: calc(100vw - 40px);
            font-size: 14px;
            backdrop-filter: blur(10px);
            opacity: 0;
            transition: opacity 0.3s, transform 0.3s;
        `;

        // 标题
        const title = document.createElement('h3');
        title.textContent = '应用已更新';
        title.style.cssText = 'margin: 0; font-size: 16px;';

        // 消息
        const message = document.createElement('p');
        message.textContent = `版本: ${oldVersion} → ${newVersion}`;
        message.style.cssText = 'margin: 0; text-align: center;';

        // 信息
        const info = document.createElement('p');
        info.textContent = '已清除旧数据缓存，应用功能已更新';
        info.style.cssText = 'margin: 0; text-align: center; font-size: 12px; opacity: 0.8;';

        // 按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 5px;';

        // 刷新按钮
        const refreshButton = document.createElement('button');
        refreshButton.textContent = '刷新页面';
        refreshButton.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.3s;
        `;
        refreshButton.addEventListener('mouseover', () => {
            refreshButton.style.background = 'rgba(255, 255, 255, 0.3)';
        });
        refreshButton.addEventListener('mouseout', () => {
            refreshButton.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        refreshButton.addEventListener('click', () => {
            window.location.reload();
        });

        // 关闭按钮
        const closeButton = document.createElement('button');
        closeButton.textContent = '知道了';
        closeButton.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.3s;
        `;
        closeButton.addEventListener('mouseover', () => {
            closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        closeButton.addEventListener('mouseout', () => {
            closeButton.style.background = 'rgba(255, 255, 255, 0.1)';
        });
        closeButton.addEventListener('click', () => {
            // 隐藏通知
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        });

        // 组装通知
        buttonContainer.appendChild(refreshButton);
        buttonContainer.appendChild(closeButton);

        notification.appendChild(title);
        notification.appendChild(message);
        notification.appendChild(info);
        notification.appendChild(buttonContainer);

        // 添加到页面
        document.body.appendChild(notification);

        // 显示通知
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translate(-50%, -50%)';
        }, 100);

        // 30秒后自动关闭
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.opacity = '0';
                notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 30000);
    }

    /**
     * 尝试清除IndexedDB数据库
     * 注意：这是一个异步操作，但我们不等待它完成
     */
    clearIndexedDB() {
        if (!window.indexedDB) return;

        try {
            // 已知的应用数据库名称列表
            const knownDatabases = ['notes-cache', 'files-cache', 'app-state'];

            // 检查是否支持databases()方法
            if (typeof indexedDB.databases === 'function') {
                // 现代浏览器支持获取数据库列表
                const request = indexedDB.databases();

                request.onsuccess = (event) => {
                    const databases = event.target.result || [];

                    databases.forEach(db => {
                        try {
                            console.log(`正在删除IndexedDB数据库: ${db.name}`);
                            indexedDB.deleteDatabase(db.name);
                        } catch (error) {
                            console.error(`删除数据库 ${db.name} 失败:`, error);
                        }
                    });
                };

                request.onerror = (event) => {
                    console.error('获取IndexedDB数据库列表失败:', event.target.error);
                    // 回退到已知数据库列表
                    this.deleteKnownDatabases(knownDatabases);
                };
            } else {
                // 不支持databases()方法的浏览器，使用已知数据库列表
                console.log('浏览器不支持indexedDB.databases()方法，使用已知数据库列表');
                this.deleteKnownDatabases(knownDatabases);
            }
        } catch (error) {
            console.error('清除IndexedDB失败:', error);
        }
    }

    /**
     * 删除已知的IndexedDB数据库
     * @param {Array<string>} databaseNames 数据库名称列表
     */
    deleteKnownDatabases(databaseNames) {
        if (!Array.isArray(databaseNames) || databaseNames.length === 0) return;

        databaseNames.forEach(dbName => {
            try {
                console.log(`尝试删除已知数据库: ${dbName}`);
                const request = indexedDB.deleteDatabase(dbName);

                request.onsuccess = () => {
                    console.log(`成功删除数据库: ${dbName}`);
                };

                request.onerror = (event) => {
                    console.error(`删除数据库 ${dbName} 失败:`, event.target.error);
                };
            } catch (error) {
                console.error(`删除数据库 ${dbName} 时发生错误:`, error);
            }
        });
    }

    /**
     * 测试清除缓存功能
     * @param {string} newVersion 模拟的新版本号
     * @returns {boolean} 是否成功执行测试
     */
    testClearStorage(newVersion = '1.0.3-test') {
        if (!this.isDevelopment) {
            console.warn('缓存清理测试仅在开发环境可用');
            return false;
        }

        console.log(`🧪 测试清除缓存功能，模拟版本: ${newVersion}`);

        // 模拟消息端口
        const channel = new MessageChannel();

        // 设置消息处理
        channel.port1.onmessage = (event) => {
            console.log('收到缓存清理响应:', event.data);
        };

        // 创建模拟消息
        const mockData = {
            action: 'CLEAR_STORAGE',
            preserveKeys: [
                'swShowNotifications',
                'swSilentMode',
                'auth-token',
                'sw-last-active-version'
            ],
            version: newVersion
        };

        // 调用处理函数
        this.handleClearStorage(mockData, channel.port2);

        return true;
    }
}

// 初始化并导出Service Worker更新器实例
window.swUpdater = new ServiceWorkerUpdater();

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.swUpdater.init();
});

// 提供便捷的全局方法
window.toggleNotifications = () => window.swUpdater.toggleNotifications();
window.toggleSilentMode = () => window.swUpdater.toggleSilentMode();
window.getNotificationStatus = () => window.swUpdater.getNotificationStatus();
window.getSilentMode = () => window.swUpdater.getSilentMode();
window.testVersionNotifications = () => window.swUpdater.testVersionNotifications();
window.testClearStorage = (version) => window.swUpdater.testClearStorage(version);
