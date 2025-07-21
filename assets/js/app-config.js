/**
 * 应用配置中心
 * 集中管理所有应用配置，包括版本号、缓存配置等
 * 修改此文件中的版本号即可触发所有缓存清理
 */

window.APP_CONFIG = {
    // ==================== 版本配置 ====================
    version: {
        // 主版本号 - 修改此版本号将触发所有缓存清理
        app: '1.0.0',
        // Service Worker版本 - 通常与app版本保持一致
        sw: '1.0.0',
        // 缓存版本 - 用于区分不同版本的缓存
        cache: '1.0.0',
        // 数据版本 - 用于数据格式变更
        data: '1.0.0'
    },

    // ==================== 缓存配置 ====================
    cache: {
        // 核心资源缓存名称
        core: 'live-analysis-platform-v1.0.0',
        // 动态资源缓存名称
        dynamic: 'dynamic-resources-v1.0.0',
        // 缓存清理间隔（毫秒）
        cleanupInterval: 1000 * 60 * 60, // 1小时
        // 缓存过期时间（毫秒）
        expirationTime: 7 * 24 * 60 * 60 * 1000, // 7天
        // 保留的本地存储键
        preservedKeys: [
            'app-last-version',
            'app-cleanup-history',
            'notes_auth_status',
            'app-theme',
            'swShowNotifications',
            'swSilentMode',
            'auth-token',
            'sw-last-active-version',
            'unifiedNotifications',
            'inPageNotifications',
            'swNotifications',
            'notificationSilentMode'
        ]
    },

    // ==================== 通知配置 ====================
    notifications: {
        // 默认显示通知
        enabled: true,
        // 浏览器通知
        browser: true,
        // 页面内通知
        inPage: true,
        // Service Worker通知
        sw: true,
        // 静音模式
        silentMode: false,
        // 显示时长（毫秒）
        displayDuration: 6000,
        // 节流间隔（毫秒）
        throttleInterval: 2000,
        // 缓存通知节流间隔（毫秒）
        cacheThrottle: 10000
    },

    // ==================== 开发配置 ====================
    development: {
        // 是否为开发环境
        isDev: window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('localhost'),
        // 调试模式
        debug: false,
        // 详细日志
        verbose: false
    },

    // ==================== 功能开关 ====================
    features: {
        // PWA功能
        pwa: true,
        // 离线支持
        offline: true,
        // 自动更新
        autoUpdate: true,
        // 缓存清理
        cacheCleanup: true,
        // 通知系统
        notifications: true,
        // 凭证加密
        voucherEncryption: true,
        // 金额隐藏
        amountHidden: true
    },

    // ==================== 安全配置 ====================
    security: {
        // 认证超时时间（毫秒）
        authTimeout: 30 * 60 * 1000, // 30分钟
        // 密码重试次数
        maxRetries: 3,
        // 锁定时间（毫秒）
        lockoutTime: 5 * 60 * 1000 // 5分钟
    }
};

// 导出配置供Node.js使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.APP_CONFIG;
}

// 版本管理工具
window.VersionManager = {
    /**
     * 获取当前应用版本
     */
    getCurrentVersion() {
        return window.APP_CONFIG.version.app;
    },

    /**
     * 获取Service Worker版本
     */
    getSWVersion() {
        return window.APP_CONFIG.version.sw;
    },

    /**
     * 获取缓存版本
     */
    getCacheVersion() {
        return window.APP_CONFIG.version.cache;
    },

    /**
     * 检查版本是否需要更新
     * @param {string} oldVersion - 旧版本
     * @param {string} newVersion - 新版本
     * @returns {boolean} 是否需要更新
     */
    isVersionNewer(newVersion, oldVersion) {
        if (!newVersion || !oldVersion) return true;

        const newParts = newVersion.split('.').map(Number);
        const oldParts = oldVersion.split('.').map(Number);

        // 比较主版本
        if (newParts[0] > oldParts[0]) return true;
        if (newParts[0] < oldParts[0]) return false;

        // 比较次版本
        if (newParts[1] > oldParts[1]) return true;
        if (newParts[1] < oldParts[1]) return false;

        // 比较修订版本
        return newParts[2] > oldParts[2];
    },

    /**
     * 触发版本更新
     * 修改版本号后调用此方法清理所有缓存
     */
    triggerVersionUpdate() {
        console.log('🔄 触发版本更新:', this.getCurrentVersion());
        
        // 清理本地存储
        this.clearLocalStorage();
        
        // 清理Service Worker缓存
        this.clearSWCache();
        
        // 重新加载页面
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    },

    /**
     * 清理本地存储
     */
    clearLocalStorage() {
        const preservedKeys = window.APP_CONFIG.cache.preservedKeys;
        const preservedValues = {};
        
        // 保存需要保留的值
        preservedKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value !== null) {
                preservedValues[key] = value;
            }
        });

        // 清除localStorage
        localStorage.clear();

        // 恢复保留的值
        Object.keys(preservedValues).forEach(key => {
            localStorage.setItem(key, preservedValues[key]);
        });

        // 更新版本记录
        localStorage.setItem('app-last-version', this.getCurrentVersion());
        localStorage.setItem('app-update-time', Date.now().toString());

        console.log('🧹 本地存储已清理');
    },

    /**
     * 清理Service Worker缓存
     */
    async clearSWCache() {
        if (!('serviceWorker' in navigator)) {
            console.log('⚠️ Service Worker不可用');
            return;
        }

        try {
            // 获取所有缓存
            const cacheNames = await caches.keys();
            
            // 删除所有缓存
            await Promise.all(
                cacheNames.map(name => caches.delete(name))
            );

            console.log('🧹 Service Worker缓存已清理');
        } catch (error) {
            console.error('🔴 清理Service Worker缓存失败:', error);
        }
    },

    /**
     * 获取配置值
     * @param {string} path - 配置路径，如 'version.app'
     * @returns {*} 配置值
     */
    getConfig(path) {
        const keys = path.split('.');
        let value = window.APP_CONFIG;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    },

    /**
     * 设置配置值
     * @param {string} path - 配置路径
     * @param {*} value - 配置值
     */
    setConfig(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = window.APP_CONFIG;
        
        for (const key of keys) {
            if (!(key in target) || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        target[lastKey] = value;
    }
};

// 初始化时记录版本信息
document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 应用版本:', window.VersionManager.getCurrentVersion());
    console.log('🔧 开发模式:', window.APP_CONFIG.development.isDev);
    
    // 在开发环境下显示配置信息
    if (window.APP_CONFIG.development.isDev) {
        console.log('⚙️ 应用配置:', window.APP_CONFIG);
    }
}); 
