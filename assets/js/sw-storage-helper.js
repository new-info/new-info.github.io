/**
 * Service Worker 存储助手
 * 处理已知路径的持久化存储，避免Service Worker重启后的误报通知
 */
class SWStorageHelper {
    constructor() {
        this.storageKey = 'sw-known-paths';
        this.init();
    }

    init() {
        this.setupMessageListener();
        console.log('📦 Service Worker存储助手已初始化');
    }

    /**
     * 设置消息监听器
     */
    setupMessageListener() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event);
            });
        }
    }

    /**
     * 处理Service Worker消息
     */
    handleServiceWorkerMessage(event) {
        const { data } = event;

        switch (data.action) {
            case 'REQUEST_KNOWN_PATHS':
                this.handleKnownPathsRequest(event);
                break;

            case 'SAVE_KNOWN_PATHS':
                this.handleSaveKnownPaths(data);
                break;

            default:
                // 忽略其他消息
                break;
        }
    }

    /**
     * 处理已知路径请求
     */
    handleKnownPathsRequest(event) {
        try {
            const storedData = this.getKnownPaths();

            // 通过MessageChannel响应
            if (event.ports && event.ports[0]) {
                event.ports[0].postMessage(storedData);
            }

            console.log(`📦 向Service Worker提供 ${storedData?.knownPaths?.length || 0} 个已知路径`);
        } catch (error) {
            console.error('📦 处理已知路径请求失败:', error);

            // 发送错误响应
            if (event.ports && event.ports[0]) {
                event.ports[0].postMessage(null);
            }
        }
    }

    /**
     * 处理保存已知路径请求
     */
    handleSaveKnownPaths(data) {
        try {
            const { knownPaths, timestamp } = data;

            if (Array.isArray(knownPaths)) {
                this.saveKnownPaths(knownPaths, timestamp);
                console.log(`📦 保存 ${knownPaths.length} 个已知路径到本地存储`);
            }
        } catch (error) {
            console.error('📦 保存已知路径失败:', error);
        }
    }

    /**
     * 获取已知路径
     */
    getKnownPaths() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('📦 读取已知路径失败:', error);
            return null;
        }
    }

    /**
     * 保存已知路径
     */
    saveKnownPaths(knownPaths, timestamp = Date.now()) {
        try {
            const data = {
                knownPaths: knownPaths,
                timestamp: timestamp,
                version: '1.0.0'
            };

            localStorage.setItem(this.storageKey, JSON.stringify(data));

            // 也保存到sessionStorage作为备份
            sessionStorage.setItem(this.storageKey + '-session', JSON.stringify(data));

        } catch (error) {
            console.error('📦 保存已知路径失败:', error);
        }
    }

    /**
     * 清除存储的已知路径
     */
    clearKnownPaths() {
        try {
            localStorage.removeItem(this.storageKey);
            sessionStorage.removeItem(this.storageKey + '-session');
            console.log('📦 已清除存储的已知路径');
        } catch (error) {
            console.error('📦 清除已知路径失败:', error);
        }
    }

    /**
     * 手动初始化已知路径（在页面加载时调用）
     */
    initializeKnownPaths() {
        try {
            // 如果notes数据可用，主动保存当前的已知路径
            if (typeof window.NOTES_DATA !== 'undefined') {
                const knownPaths = [];
                const data = window.NOTES_DATA;

                // 收集所有路径
                ['hjf', 'hjm'].forEach(author => {
                    if (data[author] && Array.isArray(data[author])) {
                        data[author].forEach(note => {
                            if (note.path) {
                                knownPaths.push(note.path);
                            }
                            if (note.reviewReport && note.reviewReport.path) {
                                knownPaths.push(note.reviewReport.path);
                            }
                        });
                    }
                });

                // 保存到本地存储
                this.saveKnownPaths(knownPaths);

                console.log(`📦 初始化保存 ${knownPaths.length} 个已知路径`);
            }
        } catch (error) {
            console.error('📦 初始化已知路径失败:', error);
        }
    }

    /**
     * 获取存储统计信息
     */
    getStorageStats() {
        const stored = this.getKnownPaths();

        return {
            pathCount: stored?.knownPaths?.length || 0,
            lastUpdate: stored?.timestamp || 0,
            version: stored?.version || 'unknown'
        };
    }
}

// 全局实例
let swStorageHelper;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    swStorageHelper = new SWStorageHelper();

    // 暴露给全局作用域
    window.swStorageHelper = swStorageHelper;

    // 延迟初始化已知路径，确保notes数据已加载
    setTimeout(() => {
        swStorageHelper.initializeKnownPaths();
    }, 1000);
});
