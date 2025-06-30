/**
 * 统一通知管理器
 * 整合SW通知、浏览器通知和页面通知为一个统一系统
 */
class UnifiedNotificationManager {
    constructor() {
        this.initialized = false;
        
        // 通知配置 - 统一管理所有通知相关配置
        this.config = {
            // 通知开关
            enabled: localStorage.getItem('unifiedNotifications') !== 'false',
            // 浏览器原生通知 - 默认启用
            browserNotifications: this.initBrowserNotificationsConfig(),
            // 页面内通知
            inPageNotifications: localStorage.getItem('inPageNotifications') !== 'false',
            // SW后台通知
            serviceWorkerNotifications: localStorage.getItem('swNotifications') !== 'false',
            // 静音模式（开发时使用）
            silentMode: localStorage.getItem('notificationSilentMode') === 'true',
            // 通知显示时长
            displayDuration: 6000,
            // 通知节流间隔
            throttleInterval: 2000
        };
        
        // 通知状态
        this.state = {
            permission: 'default',
            lastNotificationTime: 0,
            notificationQueue: new Map(), // 使用Map管理通知队列，支持去重和优先级
            activeNotifications: new Set(), // 当前活跃的通知
            knownPaths: new Set() // SW已知路径同步
        };
        
        // 事件监听器
        this.eventListeners = new Map();
        
        // 性能优化
        this.performance = {
            lastCheck: 0,
            checkInterval: 30000, // 30秒检查一次
            batchSize: 5, // 批量处理通知数量
            debounceTimeout: null
        };
        
        // 开发环境检测
        this.isDevelopment = this.detectDevelopmentEnvironment();
        
        // 绑定方法到实例
        this.handleSWMessage = this.handleSWMessage.bind(this);
    }

    /**
     * 初始化浏览器通知配置
     * 首次访问时默认启用，已有配置则使用现有配置
     */
    initBrowserNotificationsConfig() {
        const stored = localStorage.getItem('browserNotifications');
        
        // 如果已有配置，使用现有配置
        if (stored !== null) {
            return stored !== 'false';
        }
        
        // 首次访问且浏览器支持通知，默认启用
        if ('Notification' in window) {
            localStorage.setItem('browserNotifications', 'true');
            console.log('🔔 首次访问，已默认启用浏览器通知');
            return true;
        }
        
        // 浏览器不支持，关闭功能
        localStorage.setItem('browserNotifications', 'false');
        return false;
    }
    
    /**
     * 初始化统一通知管理器
     */
    async init() {
        if (this.initialized) return;
        
        console.log('🔔 初始化统一通知管理器...');
        
        try {
            // 1. 检查浏览器支持
            await this.checkBrowserSupport();
            
            // 2. 初始化SW通信
            await this.initServiceWorkerCommunication();
            
            // 3. 初始化浏览器通知
            await this.initBrowserNotifications();
            
            // 4. 设置事件监听
            this.setupEventListeners();
            
            // 5. 同步配置到SW
            await this.syncConfigToServiceWorker();
            
            // 6. 开发环境提示
            if (this.isDevelopment) {
                this.showDevelopmentHelp();
            }
            
            this.initialized = true;
            console.log('✅ 统一通知管理器初始化完成');
            
        } catch (error) {
            console.error('❌ 通知管理器初始化失败:', error);
        }
    }
    
    /**
     * 检查浏览器支持
     */
    async checkBrowserSupport() {
        const support = {
            serviceWorker: 'serviceWorker' in navigator,
            notification: 'Notification' in window,
            pushManager: 'PushManager' in window
        };
        
        console.log('🔍 浏览器支持检查:', support);
        
        if (!support.notification) {
            console.warn('⚠️ 浏览器不支持通知API');
            this.config.browserNotifications = false;
        }
        
        return support;
    }
    
    /**
     * 初始化Service Worker通信
     */
    async initServiceWorkerCommunication() {
        if (!('serviceWorker' in navigator)) return;
        
        try {
            // 监听SW消息
            navigator.serviceWorker.addEventListener('message', this.handleSWMessage);
            
            // 如果SW已经激活，立即同步配置
            if (navigator.serviceWorker.controller) {
                await this.syncConfigToServiceWorker();
            }
            
            console.log('✅ SW通信初始化完成');
        } catch (error) {
            console.error('❌ SW通信初始化失败:', error);
        }
    }
    
    /**
     * 初始化浏览器通知
     */
    async initBrowserNotifications() {
        if (!('Notification' in window)) return;
        
        this.state.permission = Notification.permission;
        console.log(`🔔 通知权限状态: ${this.state.permission}`);
    }
    
    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 页面焦点事件
        window.addEventListener('focus', () => {
            this.emit('pageFocus');
        });
        
        // SW状态变化
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                this.syncConfigToServiceWorker();
            });
        }
    }
    
    /**
     * 处理SW消息
     */
    handleSWMessage(event) {
        const message = event.data;
        if (!message || !message.action) return;
        
        console.log(`📨 收到SW消息: ${message.action}`, message);
        
        switch (message.action) {
            case 'NEW_NOTE':
                this.handleNewNoteNotification(message);
                break;
                
            case 'CACHE_COMPLETE':
                this.handleCacheCompleteNotification(message);
                break;
                
            default:
                console.log(`🤷 未处理的SW消息: ${message.action}`);
        }
    }
    
    /**
     * 处理新笔记通知
     */
    handleNewNoteNotification(message) {
        if (!this.shouldShowNotification('new-note')) return;
        
        const notificationId = `new-note-${message.path}`;
        
        // 检查是否已在队列中
        if (this.state.notificationQueue.has(notificationId)) {
            console.log('📝 新笔记通知已在队列中，跳过');
            return;
        }
        
        // 构建通知内容
        const notificationData = {
            id: notificationId,
            type: 'new-note',
            title: '📝 发现新内容',
            message: this.buildNewNoteMessage(message),
            data: message,
            priority: message.isReview ? 2 : 3,
            timestamp: Date.now()
        };
        
        // 添加到队列并处理
        this.addToQueue(notificationData);
        this.processNotificationQueue();
    }
    
    /**
     * 处理缓存完成通知
     */
    handleCacheCompleteNotification(message) {
        if (!this.shouldShowNotification('cache-complete')) return;
        
        // 检查节流
        const now = Date.now();
        if (now - this.state.lastNotificationTime < this.config.throttleInterval) {
            console.log('🚀 缓存完成通知被节流');
            return;
        }
        
        const notificationData = {
            id: 'cache-complete',
            type: 'cache-complete',
            title: '🚀 应用优化完成',
            message: '应用已优化，可离线使用',
            data: message,
            priority: 1,
            timestamp: now
        };
        
        this.addToQueue(notificationData);
        this.processNotificationQueue();
    }
    
    /**
     * 构建新笔记消息
     */
    buildNewNoteMessage(message) {
        if (!message.author || !message.title) {
            return '发现新内容';
        }
        
        let displayTitle = message.title;
        if (displayTitle.length > 15) {
            displayTitle = displayTitle.substring(0, 12) + '...';
        }
        
        const type = message.isReview ? '评分报告' : '笔记';
        return `${message.author} 发布了新${type}：${displayTitle}`;
    }
    
    /**
     * 检查是否应该显示通知
     */
    shouldShowNotification(type) {
        if (!this.config.enabled || this.config.silentMode) {
            return false;
        }
        
        switch (type) {
            case 'new-note':
                return this.config.inPageNotifications || this.config.browserNotifications;
            case 'cache-complete':
                return this.config.inPageNotifications;
            default:
                return this.config.inPageNotifications;
        }
    }
    
    /**
     * 添加到通知队列
     */
    addToQueue(notificationData) {
        this.state.notificationQueue.set(notificationData.id, notificationData);
        console.log(`📋 通知已加入队列: ${notificationData.id}`);
    }
    
    /**
     * 处理通知队列
     */
    processNotificationQueue() {
        if (this.state.notificationQueue.size === 0) return;
        
        // 防抖处理
        if (this.performance.debounceTimeout) {
            clearTimeout(this.performance.debounceTimeout);
        }
        
        this.performance.debounceTimeout = setTimeout(() => {
            this.processQueueBatch();
        }, 100);
    }
    
    /**
     * 批量处理队列
     */
    processQueueBatch() {
        const notifications = Array.from(this.state.notificationQueue.values());
        
        // 按优先级和时间排序
        // 注意：数据数组是倒序的（最新在前），我们要让最新的最后显示
        notifications.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority; // 高优先级在前
            }
            // 对于同优先级的通知，按时间戳升序排列，让较早的先显示
            return a.timestamp - b.timestamp;
        });
        
        // 批量处理
        const batch = notifications.slice(0, this.performance.batchSize);
        
        batch.forEach((notification, index) => {
            setTimeout(() => {
                this.showNotificationByType(notification);
                this.state.notificationQueue.delete(notification.id);
            }, index * 300);
        });
    }
    
    /**
     * 根据类型显示通知
     */
    showNotificationByType(notificationData) {
        const { type } = notificationData;
        
        // 页面内通知
        if (this.config.inPageNotifications) {
            this.showInPageNotification(notificationData);
        }
        
        // 浏览器通知（仅新笔记）
        if (type === 'new-note' && this.config.browserNotifications && this.state.permission === 'granted') {
            this.showBrowserNotification(notificationData);
        }
        
        // 更新状态
        this.state.lastNotificationTime = Date.now();
        this.state.activeNotifications.add(notificationData.id);
        
        // 定时移除
        setTimeout(() => {
            this.state.activeNotifications.delete(notificationData.id);
        }, this.config.displayDuration);
    }
    
    /**
     * 显示浏览器通知
     */
    showBrowserNotification(notificationData) {
        if (this.state.permission !== 'granted') return;
        
        const options = {
            body: notificationData.message,
            icon: '/assets/icons/icon-128x128.png',
            badge: '/assets/icons/icon-72x72.png',
            tag: notificationData.id,
            data: notificationData.data,
            requireInteraction: true, // 需要用户交互才会消失
            silent: false,
            timestamp: Date.now(),
            actions: [
                {
                    action: 'view',
                    title: '查看内容',
                    icon: '/assets/icons/icon-72x72.png'
                },
                {
                    action: 'dismiss',
                    title: '关闭',
                    icon: '/assets/icons/icon-72x72.png'
                }
            ]
        };
        
        try {
            const notification = new Notification(notificationData.title, options);
            
            // 点击处理
            notification.onclick = () => {
                this.handleNotificationClick(notificationData);
                notification.close();
            };
            
            // 错误处理
            notification.onerror = (error) => {
                console.error('浏览器通知显示失败:', error);
            };
            
            // 自动关闭
            setTimeout(() => {
                notification.close();
            }, this.config.displayDuration);
            
            console.log(`🔔 浏览器通知已显示: ${notificationData.message}`);
            
        } catch (error) {
            console.error('创建浏览器通知失败:', error);
        }
    }
    
    /**
     * 处理通知点击事件
     */
    handleNotificationClick(notificationData) {
        // 聚焦到窗口
        if (window.focus) {
            window.focus();
        }
        
        // 跳转到对应内容
        if (notificationData.data && notificationData.data.path) {
            const path = notificationData.data.path;
            
            // 检查是否是内部链接
            if (path.startsWith('/') || path.startsWith('#') || path.startsWith('2025/')) {
                // 内部链接，使用页面路由
                if (path.startsWith('#')) {
                    window.location.hash = path;
                } else {
                    // 打开新标签页或当前页面
                    window.open(path, '_blank');
                }
            } else {
                // 外部链接
                window.open(path, '_blank');
            }
        }
        
        // 发送点击事件
        this.emit('notificationClick', notificationData);
    }
    
    /**
     * 请求通知权限
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('浏览器不支持通知API');
            return false;
        }
        
        try {
            const permission = await Notification.requestPermission();
            this.state.permission = permission;
            
            if (permission === 'granted') {
                console.log('✅ 通知权限已授予');
                this.config.browserNotifications = true;
                this.saveConfig();
                
                // 显示欢迎通知
                this.showBrowserNotification({
                    id: 'welcome-notification',
                    type: 'success',
                    title: '🎉 通知已启用',
                    message: '您将收到新内容的推送通知',
                    data: { path: '#home' }
                });
                
                return true;
            } else {
                console.log('❌ 通知权限被拒绝');
                this.config.browserNotifications = false;
                this.saveConfig();
                return false;
            }
        } catch (error) {
            console.error('❌ 请求通知权限失败:', error);
            return false;
        }
    }
    
    /**
     * 显示页面内通知
     */
    showInPageNotification(notificationData) {
        this.removeExistingInPageNotification();
        
        const notification = this.createNotificationElement(notificationData);
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            this.hideNotification(notification);
        }, this.config.displayDuration);
        
        console.log(`📱 页面内通知已显示: ${notificationData.message}`);
    }
    
    /**
     * 创建通知元素
     */
    createNotificationElement(notificationData) {
        const notification = document.createElement('div');
        notification.id = 'unified-notification';
        notification.className = `notification-${notificationData.type}`;
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: var(--primary-color, #007acc);
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
            cursor: pointer;
        `;
        
        // 图标
        const icon = document.createElement('span');
        icon.textContent = this.getNotificationIcon(notificationData.type);
        icon.style.cssText = `margin-right: 10px; font-size: 16px; flex-shrink: 0;`;
        
        // 消息
        const message = document.createElement('span');
        message.textContent = notificationData.message;
        message.style.cssText = `flex: 1; line-height: 1.4; word-break: break-word;`;
        
        // 关闭按钮
        const closeBtn = document.createElement('span');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            margin-left: 15px; cursor: pointer; font-size: 18px; opacity: 0.8;
            width: 20px; height: 20px; display: flex; align-items: center;
            justify-content: center; border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
        `;
        
        // 事件处理
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideNotification(notification);
        });
        
        notification.addEventListener('click', () => {
            if (notificationData.data && notificationData.data.path) {
                window.open(notificationData.data.path, '_blank');
            }
            this.hideNotification(notification);
        });
        
        notification.appendChild(icon);
        notification.appendChild(message);
        notification.appendChild(closeBtn);
        
        return notification;
    }
    
    /**
     * 获取通知图标
     */
    getNotificationIcon(type) {
        const icons = {
            'new-note': '📝',
            'cache-complete': '🚀',
            'error': '⚠️',
            'success': '✅'
        };
        return icons[type] || '🔔';
    }
    
    /**
     * 隐藏通知
     */
    hideNotification(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }
    
    /**
     * 移除现有页面内通知
     */
    removeExistingInPageNotification() {
        const existing = document.getElementById('unified-notification');
        if (existing) {
            this.hideNotification(existing);
        }
    }
    
    /**
     * 同步配置到SW
     */
    async syncConfigToServiceWorker() {
        if (!navigator.serviceWorker.controller) return;
        
        try {
            navigator.serviceWorker.controller.postMessage({
                action: 'SET_NOTIFICATION_PREFERENCE',
                showNotifications: this.config.serviceWorkerNotifications
            });
            
            console.log('🔄 配置已同步到SW');
        } catch (error) {
            console.error('❌ SW配置同步失败:', error);
        }
    }
    
    /**
     * 切换通知
     */
    toggleNotifications() {
        this.config.enabled = !this.config.enabled;
        this.saveConfig();
        
        if (!this.config.enabled) {
            this.clearAllNotifications();
        }
        
        this.syncConfigToServiceWorker();
        
        console.log(`🔔 通知${this.config.enabled ? '已启用' : '已禁用'}`);
        return this.config.enabled;
    }
    
    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        Object.keys(newConfig).forEach(key => {
            if (key in this.config) {
                this.config[key] = newConfig[key];
                console.log(`⚙️ 配置已更新: ${key} = ${newConfig[key]}`);
            }
        });
        
        // 保存到localStorage
        this.saveConfig();
        
        // 同步到SW
        this.syncConfigToServiceWorker();
    }

    /**
     * 保存配置
     */
    saveConfig() {
        // 保存各个配置项到localStorage
        localStorage.setItem('unifiedNotifications', this.config.enabled ? 'true' : 'false');
        localStorage.setItem('browserNotifications', this.config.browserNotifications ? 'true' : 'false');
        localStorage.setItem('inPageNotifications', this.config.inPageNotifications ? 'true' : 'false');
        localStorage.setItem('swNotifications', this.config.serviceWorkerNotifications ? 'true' : 'false');
        localStorage.setItem('notificationSilentMode', this.config.silentMode ? 'true' : 'false');
        
        console.log('💾 通知配置已保存');
    }
    
    /**
     * 清除所有通知
     */
    clearAllNotifications() {
        this.state.notificationQueue.clear();
        this.removeExistingInPageNotification();
        this.state.activeNotifications.clear();
    }
    
    /**
     * 检测开发环境
     */
    detectDevelopmentEnvironment() {
        return window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('localhost');
    }
    
    /**
     * 显示开发帮助
     */
    showDevelopmentHelp() {
        console.log('🔧 开发模式 - 统一通知管理器');
        console.log('💡 可用命令:');
        console.log('  - unifiedNotifications.toggleNotifications()');
        console.log('  - unifiedNotifications.getStatus()');
        console.log('  - unifiedNotifications.testNotification()');
    }
    
    /**
     * 获取状态
     */
    getStatus() {
        return {
            initialized: this.initialized,
            config: this.config,
            state: {
                permission: this.state.permission,
                queueSize: this.state.notificationQueue.size,
                activeCount: this.state.activeNotifications.size
            }
        };
    }
    
    /**
     * 测试通知
     */
    testNotification() {
        const testData = {
            id: 'test-notification',
            type: 'new-note',
            title: '🧪 测试通知',
            message: '这是一个测试通知',
            data: { path: '#test' },
            priority: 3,
            timestamp: Date.now()
        };
        
        this.addToQueue(testData);
        this.processNotificationQueue();
    }
    
    /**
     * 事件系统
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => callback(data));
        }
    }
    
    /**
     * 销毁
     */
    destroy() {
        navigator.serviceWorker.removeEventListener('message', this.handleSWMessage);
        this.clearAllNotifications();
        
        if (this.performance.debounceTimeout) {
            clearTimeout(this.performance.debounceTimeout);
        }
        
        this.initialized = false;
        console.log('🗑️ 统一通知管理器已销毁');
    }
}

// 创建全局实例
const unifiedNotifications = new UnifiedNotificationManager();

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    unifiedNotifications.init();
});

// 导出到全局
window.unifiedNotifications = unifiedNotifications;

// 向后兼容
window.toggleNotifications = () => unifiedNotifications.toggleNotifications();
window.getNotificationStatus = () => unifiedNotifications.getStatus(); 