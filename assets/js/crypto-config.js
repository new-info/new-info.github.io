/**
 * 加密配置模块
 * 从多个来源读取加密密钥配置
 */
window.CryptoConfig = {
    /**
     * 获取服务端加密密钥
     * 优先级：URL参数 > localStorage > 默认配置服务器端点 > 抛出错误
     */
    getServerKey: function() {
        try {
            // 1. 从URL参数读取（仅用于开发环境）
            const urlParams = new URLSearchParams(window.location.search);
            const urlKey = urlParams.get('key');
            if (urlKey && !isNaN(parseInt(urlKey))) {
                console.warn('⚠️ 从URL参数读取密钥，仅适用于开发环境');
                return parseInt(urlKey);
            }

            // 2. 从localStorage读取（由服务端设置）
            const storedKey = localStorage.getItem('crypto_server_key');
            if (storedKey && !isNaN(parseInt(storedKey))) {
                return parseInt(storedKey);
            }

            // 3. 尝试从配置端点获取
            const configKey = this._getKeyFromConfigEndpoint();
            if (configKey) {
                return configKey;
            }

            // 4. 如果都没有，抛出错误
            throw new Error('未找到服务端加密密钥配置');
        } catch (error) {
            console.error('获取服务端密钥失败:', error);
            // 抛出错误，让调用方处理
            throw new Error('密钥配置错误：请确保正确配置了加密密钥');
        }
    },

    /**
     * 从配置端点获取密钥（同步方式）
     * 这里可以连接到你的配置系统
     */
    _getKeyFromConfigEndpoint: function() {
        try {
            // 检查是否有全局配置对象
            if (window.APP_CONFIG && window.APP_CONFIG.ENCRYPT_KEY) {
                return parseInt(window.APP_CONFIG.ENCRYPT_KEY);
            }
            
            // 可以在这里添加其他配置源
            return null;
        } catch (error) {
            console.error('从配置端点读取密钥失败:', error);
            return null;
        }
    },

    /**
     * 设置服务端密钥到localStorage（由服务端调用）
     */
    setServerKey: function(key) {
        if (!key || isNaN(parseInt(key))) {
            throw new Error('无效的密钥值');
        }
        localStorage.setItem('crypto_server_key', parseInt(key).toString());
        console.log('✅ 服务端密钥已更新');
    },

    /**
     * 清除存储的密钥
     */
    clearServerKey: function() {
        localStorage.removeItem('crypto_server_key');
        console.log('🗑️ 服务端密钥已清除');
    },

    /**
     * 检查密钥配置状态
     */
    checkKeyStatus: function() {
        try {
            const key = this.getServerKey();
            console.log('✅ 密钥配置正常，当前密钥:', key);
            return true;
        } catch (error) {
            console.error('❌ 密钥配置异常:', error.message);
            return false;
        }
    }
};

// 在开发环境中提供全局访问
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugCrypto = {
        setKey: function(key) { window.CryptoConfig.setServerKey(key); },
        clearKey: function() { window.CryptoConfig.clearServerKey(); },
        checkStatus: function() { return window.CryptoConfig.checkKeyStatus(); }
    };
    console.log('🔧 开发环境：可使用 debugCrypto.setKey(200) 设置密钥');
} 