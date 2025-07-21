/**
 * 版本更新器
 * 提供简单的版本更新接口，修改版本号后自动清理所有缓存
 */

class VersionUpdater {
    constructor() {
        this.initialized = false;
        this.updateInProgress = false;
    }

    /**
     * 初始化版本更新器
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;

        // 检查是否需要版本更新
        this.checkForVersionUpdate();
    }

    /**
     * 检查是否需要版本更新
     */
    checkForVersionUpdate() {
        const currentVersion = window.VersionManager.getCurrentVersion();
        const lastVersion = localStorage.getItem('app-last-version') || '0.0.0';

        if (window.VersionManager.isVersionNewer(currentVersion, lastVersion)) {
            console.log(`🔄 检测到版本更新: ${lastVersion} -> ${currentVersion}`);
            this.performVersionUpdate(lastVersion, currentVersion);
        } else {
            console.log(`✅ 当前版本 ${currentVersion} 已是最新`);
        }
    }

    /**
     * 执行版本更新
     * @param {string} oldVersion - 旧版本
     * @param {string} newVersion - 新版本
     */
    async performVersionUpdate(oldVersion, newVersion) {
        if (this.updateInProgress) {
            console.log('⚠️ 版本更新已在进行中');
            return;
        }

        this.updateInProgress = true;

        try {
            console.log(`🔄 开始版本更新: ${oldVersion} -> ${newVersion}`);

            // 显示更新通知
            this.showUpdateNotification(oldVersion, newVersion);

            // 延迟执行清理，避免与页面初始化冲突
            setTimeout(async () => {
                try {
                    // 清理所有缓存
                    await this.cleanAllCaches();

                    // 更新版本记录
                    localStorage.setItem('app-last-version', newVersion);
                    localStorage.setItem('app-update-time', Date.now().toString());

                    // 记录更新历史
                    this.recordUpdateHistory(oldVersion, newVersion);

                    console.log('✅ 版本更新完成');
                    
                    // 显示完成通知
                    this.showUpdateCompleteNotification(oldVersion, newVersion);

                } catch (error) {
                    console.error('🔴 版本更新失败:', error);
                    this.showUpdateErrorNotification(error);
                } finally {
                    this.updateInProgress = false;
                }
            }, 3000); // 延迟3秒执行

        } catch (error) {
            console.error('🔴 版本更新初始化失败:', error);
            this.updateInProgress = false;
        }
    }

    /**
     * 清理所有缓存
     */
    async cleanAllCaches() {
        console.log('🧹 开始清理所有缓存');

        // 1. 清理本地存储
        this.cleanLocalStorage();

        // 2. 清理Service Worker缓存
        await this.cleanSWCache();

        // 3. 清理内存缓存
        this.cleanMemoryCache();

        console.log('✅ 所有缓存清理完成');
    }

    /**
     * 清理本地存储
     */
    cleanLocalStorage() {
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
        const itemCount = localStorage.length;
        localStorage.clear();

        // 恢复保留的值
        Object.keys(preservedValues).forEach(key => {
            localStorage.setItem(key, preservedValues[key]);
        });

        console.log(`🧹 本地存储已清理，删除 ${itemCount} 项，保留 ${Object.keys(preservedValues).length} 项`);
    }

    /**
     * 清理Service Worker缓存
     */
    async cleanSWCache() {
        if (!('serviceWorker' in navigator)) {
            console.log('⚠️ Service Worker不可用');
            return;
        }

        try {
            // 获取所有缓存
            const cacheNames = await caches.keys();
            
            // 删除所有缓存
            await Promise.all(
                cacheNames.map(name => {
                    console.log(`🗑️ 删除缓存: ${name}`);
                    return caches.delete(name);
                })
            );

            console.log(`🧹 Service Worker缓存已清理，删除 ${cacheNames.length} 个缓存`);
        } catch (error) {
            console.error('🔴 清理Service Worker缓存失败:', error);
            throw error;
        }
    }

    /**
     * 清理内存缓存
     */
    cleanMemoryCache() {
        // 清理图片缓存
        if (window.VoucherDecryptor && window.VoucherDecryptor.clearImageCache) {
            window.VoucherDecryptor.clearImageCache();
            console.log('🧹 图片缓存已清理');
        }

        // 清理其他内存缓存
        if (window.imageCache) {
            window.imageCache.clear();
            console.log('🧹 内存图片缓存已清理');
        }

        // 清理通知队列
        if (window.unifiedNotificationManager) {
            window.unifiedNotificationManager.clearNotificationQueue();
            console.log('🧹 通知队列已清理');
        }
    }

    /**
     * 显示更新通知
     */
    showUpdateNotification(oldVersion, newVersion) {
        const message = `应用正在从 ${oldVersion} 更新到 ${newVersion}，请稍候...`;
        
        if (window.unifiedNotificationManager) {
            window.unifiedNotificationManager.showNotification('🔄 版本更新中', message);
        } else {
            console.log(message);
        }
    }

    /**
     * 显示更新完成通知
     */
    showUpdateCompleteNotification(oldVersion, newVersion) {
        const message = `应用已从 ${oldVersion} 成功更新到 ${newVersion}`;
        
        if (window.unifiedNotificationManager) {
            window.unifiedNotificationManager.showNotification('✅ 更新完成', message);
        } else {
            console.log(message);
        }
    }

    /**
     * 显示更新错误通知
     */
    showUpdateErrorNotification(error) {
        const message = `版本更新失败: ${error.message}`;
        
        if (window.unifiedNotificationManager) {
            window.unifiedNotificationManager.showNotification('❌ 更新失败', message);
        } else {
            console.error(message);
        }
    }

    /**
     * 记录更新历史
     */
    recordUpdateHistory(oldVersion, newVersion) {
        try {
            const history = JSON.parse(localStorage.getItem('app-update-history') || '[]');
            
            history.push({
                oldVersion,
                newVersion,
                timestamp: Date.now(),
                date: new Date().toISOString()
            });

            // 只保留最近10次更新记录
            if (history.length > 10) {
                history.splice(0, history.length - 10);
            }

            localStorage.setItem('app-update-history', JSON.stringify(history));
            console.log('📝 更新历史已记录');
        } catch (error) {
            console.error('🔴 记录更新历史失败:', error);
        }
    }

    /**
     * 手动触发版本更新
     * 用于开发时测试或强制更新
     */
    triggerManualUpdate() {
        const currentVersion = window.VersionManager.getCurrentVersion();
        const lastVersion = localStorage.getItem('app-last-version') || '0.0.0';
        
        console.log(`🔄 手动触发版本更新: ${lastVersion} -> ${currentVersion}`);
        this.performVersionUpdate(lastVersion, currentVersion);
    }

    /**
     * 获取更新历史
     */
    getUpdateHistory() {
        try {
            return JSON.parse(localStorage.getItem('app-update-history') || '[]');
        } catch (error) {
            console.error('🔴 获取更新历史失败:', error);
            return [];
        }
    }

    /**
     * 清除更新历史
     */
    clearUpdateHistory() {
        localStorage.removeItem('app-update-history');
        console.log('🗑️ 更新历史已清除');
    }
}

// 创建全局实例
window.versionUpdater = new VersionUpdater();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保其他组件已加载
    setTimeout(() => {
        window.versionUpdater.init();
    }, 1000);
});

// 导出供Node.js使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VersionUpdater;
} 