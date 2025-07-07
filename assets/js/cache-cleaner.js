/**
 * 缓存清理器
 * 负责在版本升级时清理本地存储和Service Worker缓存
 */

class CacheCleaner {
    constructor() {
        this.appVersion = '1.1.3'; // 当前应用版本，需要与sw.js中的CACHE_NAME版本一致
        this.lastVersionKey = 'app-last-version';
        this.cleanupHistoryKey = 'app-cleanup-history';
        this.initialized = false;
    }

    /**
     * 初始化缓存清理器
     */
    async init() {
        if (this.initialized) return;
        this.initialized = true;

        try {
            // 获取上一次运行的版本
            const lastVersion = localStorage.getItem(this.lastVersionKey) || '0.0.0';

            // 检查是否需要清理缓存，并且确保版本真的不同
            if (this.isVersionNewer(this.appVersion, lastVersion) && this.appVersion !== lastVersion) {
                console.log(`🧹 检测到版本升级: ${lastVersion} -> ${this.appVersion}`);

                // 延迟执行清理，避免与其他初始化操作冲突
                setTimeout(async () => {
                    try {
                        // 执行缓存清理
                        await this.performCleanup(lastVersion, this.appVersion);

                        // 更新版本记录
                        localStorage.setItem(this.lastVersionKey, this.appVersion);

                        // 记录清理历史
                        this.recordCleanupHistory(lastVersion, this.appVersion);
                    } catch (error) {
                        console.error('🔴 延迟缓存清理失败:', error);
                    }
                }, 5000); // 延迟5秒执行，让页面完全加载
            } else {
                // 确保版本记录是最新的，但不执行清理
                if (lastVersion !== this.appVersion) {
                    localStorage.setItem(this.lastVersionKey, this.appVersion);
                }
                console.log(`✅ 当前版本 ${this.appVersion} 已是最新`);
            }
        } catch (error) {
            console.error('🔴 缓存清理器初始化失败:', error);
        }
    }

    /**
     * 比较版本号，检查newVersion是否比oldVersion更新
     * @param {string} newVersion - 新版本号 (x.y.z)
     * @param {string} oldVersion - 旧版本号 (x.y.z)
     * @returns {boolean} 如果newVersion比oldVersion新则返回true
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
    }

    /**
     * 执行缓存清理
     * @param {string} oldVersion - 旧版本号
     * @param {string} newVersion - 新版本号
     */
    async performCleanup(oldVersion, newVersion) {
        console.log(`🧹 开始清理缓存 (${oldVersion} -> ${newVersion})`);

        try {
            // 1. 清理Service Worker缓存
            await this.cleanServiceWorkerCache();

            // 2. 清理本地存储中的特定项目
            this.cleanLocalStorage();

            // 3. 清理会话存储
            this.cleanSessionStorage();

            // 4. 清理内存缓存
            this.cleanMemoryCache();

            console.log('✅ 缓存清理完成');

            // 通知用户
            this.notifyCleanupComplete(oldVersion, newVersion);

            return true;
        } catch (error) {
            console.error('🔴 缓存清理失败:', error);
            return false;
        }
    }

    /**
     * 清理Service Worker缓存
     */
    async cleanServiceWorkerCache() {
        try {
            // 检查是否支持Service Worker
            if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
                console.log('⚠️ Service Worker未激活，跳过缓存清理');
                return;
            }

            // 发送消息给Service Worker，请求清理缓存
            const channel = new MessageChannel();

            // 创建Promise来等待Service Worker响应
            const cleanupPromise = new Promise((resolve, reject) => {
                channel.port1.onmessage = (event) => {
                    if (event.data && event.data.error) {
                        reject(new Error(event.data.error));
                    } else {
                        resolve(event.data);
                    }
                };

                // 设置超时
                setTimeout(() => reject(new Error('清理缓存超时')), 5000);
            });

            // 发送清理请求
            navigator.serviceWorker.controller.postMessage({
                action: 'CLEAN_CACHES',
                timestamp: Date.now()
            }, [channel.port2]);

            // 等待响应
            const result = await cleanupPromise;
            console.log('🧹 Service Worker缓存清理结果:', result);

            // 发送通知
            if (result.deletedCaches.length > 0 || result.deletedResources.length > 0) {
                // 使用通知管理器或直接显示
                if (window.swUpdater) {
                    // 使用sw-updater通知系统
                    window.swUpdater.showNotification('🧹 缓存已清理完成');
                } else {
                    this.showSimpleNotification('缓存已清理完成');
                }
            }

            return result;
        } catch (error) {
            console.error('🔴 清理Service Worker缓存失败:', error);
            throw error;
        }
    }

    /**
     * 清理本地存储中的特定项目
     */
    cleanLocalStorage() {
        try {
            // 需要保留的关键项目
            const keysToKeep = [
                this.lastVersionKey,
                this.cleanupHistoryKey,
                'notes_auth_status', // 保留认证状态
                'app-theme' // 保留主题设置
            ];

            // 需要清理的项目（特定前缀）
            const prefixesToClean = [
                'sw-', // Service Worker相关
                'cache-', // 缓存相关
                'temp-' // 临时数据
            ];

            // 遍历本地存储
            const itemsToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);

                // 跳过需要保留的关键项目
                if (keysToKeep.includes(key)) continue;

                // 检查是否匹配需要清理的前缀
                if (prefixesToClean.some(prefix => key.startsWith(prefix))) {
                    itemsToRemove.push(key);
                }
            }

            // 删除匹配的项目
            itemsToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log(`🗑️ 已删除本地存储项: ${key}`);
            });

            console.log(`🧹 本地存储清理完成，共删除 ${itemsToRemove.length} 项`);
        } catch (error) {
            console.error('🔴 清理本地存储失败:', error);
        }
    }

    /**
     * 清理会话存储
     */
    cleanSessionStorage() {
        try {
            // 清理所有会话存储（因为会话存储本来就是临时的）
            sessionStorage.clear();
            console.log('🧹 会话存储已清理');
        } catch (error) {
            console.error('🔴 清理会话存储失败:', error);
        }
    }

    /**
     * 清理内存缓存
     */
    cleanMemoryCache() {
        try {
            // 清理图片缓存（如果存在）
            if (typeof window.clearImageCache === 'function') {
                window.clearImageCache();
                console.log('🧹 图片缓存已清理');
            }

            // 清理其他可能的内存缓存
            // ...

            console.log('🧹 内存缓存清理完成');
        } catch (error) {
            console.error('🔴 清理内存缓存失败:', error);
        }
    }

    /**
     * 记录清理历史
     */
    recordCleanupHistory(oldVersion, newVersion) {
        try {
            // 获取现有历史记录
            let history = [];
            try {
                const storedHistory = localStorage.getItem(this.cleanupHistoryKey);
                if (storedHistory) {
                    history = JSON.parse(storedHistory);
                }
            } catch (e) {
                console.error('解析清理历史记录失败:', e);
                history = [];
            }

            // 添加新记录
            history.push({
                timestamp: Date.now(),
                oldVersion,
                newVersion
            });

            // 限制历史记录数量（最多保留10条）
            if (history.length > 10) {
                history = history.slice(-10);
            }

            // 保存历史记录
            localStorage.setItem(this.cleanupHistoryKey, JSON.stringify(history));
        } catch (error) {
            console.error('记录清理历史失败:', error);
        }
    }

    /**
     * 通知用户清理完成
     */
    notifyCleanupComplete(oldVersion, newVersion) {
        // 检查是否有通知管理器
        if (window.swUpdater) {
            // 使用sw-updater通知系统
            window.swUpdater.showNotification('🧹 缓存已清理完成');
        } else {
            // 简单的通知
            this.showSimpleNotification(`🚀 应用已从 ${oldVersion} 升级到 ${newVersion}`);
        }
    }

    /**
     * 显示简单通知
     */
    showSimpleNotification(message) {
        // 检查版本是否相同，相同则不显示通知
        if (message && message.includes('应用已从') && message.includes('升级到')) {
            const versionMatch = message.match(/应用已从\s+([\d\.]+)\s+升级到\s+([\d\.]+)/);
            if (versionMatch && versionMatch[1] === versionMatch[2]) {
                console.log('版本相同，不显示通知:', message);
                return;
            }
        }

        const notificationElement = document.createElement('div');
        notificationElement.style.position = 'fixed';
        notificationElement.style.bottom = '20px';
        notificationElement.style.left = '50%';
        notificationElement.style.transform = 'translateX(-50%) translateY(100px)';
        notificationElement.style.backgroundColor = 'rgba(26, 41, 128, 0.9)';
        notificationElement.style.color = 'white';
        notificationElement.style.padding = '12px 20px';
        notificationElement.style.borderRadius = '8px';
        notificationElement.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        notificationElement.style.zIndex = '10000';
        notificationElement.style.transition = 'all 0.3s ease';
        notificationElement.style.maxWidth = 'calc(100vw - 40px)';
        notificationElement.style.textAlign = 'center';

        // 添加图标
        const iconSpan = document.createElement('span');
        iconSpan.textContent = '🧹 ';
        iconSpan.style.marginRight = '8px';

        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;

        notificationElement.appendChild(iconSpan);
        notificationElement.appendChild(messageSpan);

        document.body.appendChild(notificationElement);

        // 显示通知
        setTimeout(() => {
            notificationElement.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);

        // 4秒后隐藏
        setTimeout(() => {
            notificationElement.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => {
                if (notificationElement.parentNode) {
                    document.body.removeChild(notificationElement);
                }
            }, 300);
        }, 4000);
    }

    /**
     * 获取清理历史
     */
    getCleanupHistory() {
        try {
            const storedHistory = localStorage.getItem(this.cleanupHistoryKey);
            return storedHistory ? JSON.parse(storedHistory) : [];
        } catch (error) {
            console.error('获取清理历史失败:', error);
            return [];
        }
    }

    /**
     * 手动触发清理
     */
    async manualCleanup() {
        console.log('🧹 开始手动清理缓存...');
        const oldVersion = localStorage.getItem(this.lastVersionKey) || '0.0.0';
        return await this.performCleanup(oldVersion, this.appVersion);
    }
}

// 创建全局实例
const cacheCleaner = new CacheCleaner();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保其他组件已加载
    setTimeout(() => {
        cacheCleaner.init();
    }, 2000);

    // 暴露给全局作用域
    window.cacheCleaner = cacheCleaner;
});
