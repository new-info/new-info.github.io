// 凭证解密器 - 前端图片解密工具
(function() {
    'use strict';

    // 加密配置（与服务端保持一致）
    const ENCRYPT_KEYS = {
        hjf: 'ENCRYPT_HJF_KEY',
        hjm: 'ENCRYPT_HJM_KEY'
    };

    // MD5哈希函数（复用auth-helper.js中的实现）
    function md5(input) {
        if (typeof window.AuthHelper !== 'undefined' && window.AuthHelper.md5) {
            return window.AuthHelper.md5(input);
        }
        
        // 如果AuthHelper不可用，提供简单的实现
        console.warn('AuthHelper MD5 not available, using fallback');
        return btoa(input); // 简单的base64编码作为fallback
    }

    /**
     * 将字符串转换为Uint8Array
     * @param {string} str 
     * @returns {Uint8Array}
     */
    function stringToUint8Array(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }

    /**
     * 使用简化的解密算法（与服务端crypto.createCipher兼容）
     * @param {ArrayBuffer} encryptedData - 加密的数据
     * @param {string} password - 用户密码
     * @param {string} author - 作者(hjf/hjm)
     * @returns {Promise<ArrayBuffer>} 解密后的数据
     */
    async function decryptData(encryptedData, password, author) {
        try {
            // 获取对应的加密密钥
            const baseKey = ENCRYPT_KEYS[author];
            if (!baseKey) {
                throw new Error(`未找到${author}的加密密钥`);
            }

            // 使用与服务端相同的密钥组合方式
            const keyString = baseKey;
            
            // 生成密钥的SHA-256哈希
            const keyBuffer = await window.crypto.subtle.digest('SHA-256', stringToUint8Array(keyString));
            
            // 导入密钥
            const key = await window.crypto.subtle.importKey(
                'raw',
                keyBuffer,
                { name: 'AES-CBC' },
                false,
                ['decrypt']
            );

            // 提取IV（前16字节）和加密数据
            const iv = encryptedData.slice(0, 16);
            const encrypted = encryptedData.slice(16);

            // 解密数据
            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-CBC',
                    iv: new Uint8Array(iv)
                },
                key,
                encrypted
            );

            return decrypted;
        } catch (error) {
            console.error('解密失败:', error);
            
            // 如果解密失败，可能是密钥不正确或文件格式不对
            // 尝试使用用户密码作为额外的密钥成分
            try {
                console.log('尝试使用用户密码进行解密...');
                return await decryptWithPassword(encryptedData, password, author);
            } catch (secondError) {
                console.error('第二次解密也失败:', secondError);
                throw new Error('解密失败：密钥不正确或文件已损坏');
            }
        }
    }

    /**
     * 使用用户密码的备用解密方法
     */
    async function decryptWithPassword(encryptedData, password, author) {
        const baseKey = ENCRYPT_KEYS[author];
        const combinedKey = baseKey + '_' + password;
        
        const keyBuffer = await window.crypto.subtle.digest('SHA-256', stringToUint8Array(combinedKey));
        
        const key = await window.crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'AES-CBC' },
            false,
            ['decrypt']
        );

        const iv = encryptedData.slice(0, 16);
        const encrypted = encryptedData.slice(16);

        return await window.crypto.subtle.decrypt(
            {
                name: 'AES-CBC',
                iv: new Uint8Array(iv)
            },
            key,
            encrypted
        );
    }

    /**
     * 从加密文件URL获取解密后的图片数据URL
     * @param {string} encryptedUrl - 加密文件的URL
     * @param {string} author - 作者(hjf/hjm)
     * @returns {Promise<string>} 解密后的图片数据URL
     */
    async function decryptVoucherImage(encryptedUrl, author) {
        try {
            // 检查用户是否已认证
            if (!window.AuthHelper || !window.AuthHelper.isAuthenticated(author)) {
                throw new Error('用户未认证，无法解密图片');
            }

            // 获取存储的密码
            const storedPassword = getStoredPassword(author);
            if (!storedPassword) {
                throw new Error('未找到存储的密码');
            }

            // 下载加密文件
            console.log('下载加密文件:', encryptedUrl);
            const response = await fetch(encryptedUrl);
            if (!response.ok) {
                throw new Error(`下载失败: ${response.status} ${response.statusText}`);
            }

            const encryptedData = await response.arrayBuffer();
            console.log('下载完成，文件大小:', encryptedData.byteLength, 'bytes');

            // 解密数据
            console.log('开始解密...');
            const decryptedData = await decryptData(encryptedData, storedPassword, author);
            console.log('解密完成，数据大小:', decryptedData.byteLength, 'bytes');

            // 创建Blob并生成数据URL
            const blob = new Blob([decryptedData]);
            const dataUrl = URL.createObjectURL(blob);
            
            console.log('✅ 图片解密成功');
            return dataUrl;
        } catch (error) {
            console.error('❌ 图片解密失败:', error);
            throw error;
        }
    }

    /**
     * 获取存储的密码
     * @param {string} author - 作者
     * @returns {string|null} 存储的密码
     */
    function getStoredPassword(author) {
        try {
            // 这里需要根据实际的密码存储机制来获取
            // 目前假设密码已经在认证过程中存储
            const authData = JSON.parse(localStorage.getItem('notes_auth_status') || '{}');
            return authData[author]?.password || null;
        } catch (error) {
            console.error('获取存储密码失败:', error);
            return null;
        }
    }

    /**
     * 缓存管理
     */
    const imageCache = new Map();

    /**
     * 带缓存的图片解密
     * @param {string} encryptedUrl - 加密文件URL
     * @param {string} author - 作者
     * @returns {Promise<string>} 解密后的图片数据URL
     */
    async function decryptVoucherImageWithCache(encryptedUrl, author) {
        const cacheKey = `${author}_${encryptedUrl}`;
        
        // 检查缓存
        if (imageCache.has(cacheKey)) {
            const cachedUrl = imageCache.get(cacheKey);
            console.log('✅ 使用缓存的解密图片');
            
            // 验证缓存的URL是否仍然有效
            try {
                // 创建一个测试请求来验证URL是否有效
                const testResponse = await fetch(cachedUrl, { method: 'HEAD' });
                if (testResponse.ok) {
                    return cachedUrl;
                } else {
                    console.log('⚠️ 缓存的URL已失效，重新解密');
                    imageCache.delete(cacheKey);
                }
            } catch (error) {
                console.log('⚠️ 缓存的URL已失效，重新解密');
                imageCache.delete(cacheKey);
            }
        }

        try {
            // 解密图片
            const dataUrl = await decryptVoucherImage(encryptedUrl, author);
            
            // 存入缓存
            imageCache.set(cacheKey, dataUrl);
            console.log('💾 图片已缓存');
            
            return dataUrl;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 清理缓存
     */
    function clearImageCache() {
        // 释放所有blob URL
        for (const dataUrl of imageCache.values()) {
            if (dataUrl.startsWith('blob:')) {
                URL.revokeObjectURL(dataUrl);
            }
        }
        imageCache.clear();
        console.log('🗑️ 图片缓存已清理');
    }

    /**
     * 清理特定图片的缓存
     * @param {string} encryptedUrl - 加密文件URL
     * @param {string} author - 作者
     */
    function clearSpecificCache(encryptedUrl, author) {
        const cacheKey = `${author}_${encryptedUrl}`;
        if (imageCache.has(cacheKey)) {
            const dataUrl = imageCache.get(cacheKey);
            if (dataUrl.startsWith('blob:')) {
                URL.revokeObjectURL(dataUrl);
            }
            imageCache.delete(cacheKey);
            console.log('🗑️ 已清理特定图片缓存:', cacheKey);
        }
    }

    /**
     * 获取缓存状态
     */
    function getCacheStatus() {
        return {
            size: imageCache.size,
            keys: Array.from(imageCache.keys())
        };
    }

    /**
     * 检查是否支持WebCrypto API
     */
    function isWebCryptoSupported() {
        return typeof window.crypto !== 'undefined' && 
               typeof window.crypto.subtle !== 'undefined';
    }

    /**
     * 获取占位图片URL
     */
    function getPlaceholderImageUrl() {
        return 'assets/vouchers/placeholder.svg';
    }

    /**
     * 构建加密文件URL
     * @param {string} filename - 原始文件名
     * @param {string} author - 作者
     * @returns {string} 加密文件URL
     */
    function buildEncryptedUrl(filename, author) {
        return `assets/vouchers/${author}/${filename}.enc`;
    }

    // 页面卸载时清理缓存
    window.addEventListener('beforeunload', clearImageCache);

    /**
     * 验证密码（复用首页的验证逻辑）
     * @param {string} author - 作者(hjf/hjm)
     * @param {string} password - 密码
     * @returns {boolean} 验证结果
     */
    function authenticate(author, password) {
        if (!window.AuthHelper || !window.AuthHelper.verifyPassword) {
            console.error('AuthHelper未加载或缺少verifyPassword方法');
            return false;
        }
        
        // 使用AuthHelper的验证逻辑
        const isValid = window.AuthHelper.verifyPassword(author, password);
        
        if (isValid) {
            // 验证成功，设置认证状态
            if (window.AuthHelper.setAuthenticated) {
                window.AuthHelper.setAuthenticated(author, password);
            }
            console.log(`✅ ${author} 密码验证成功`);
        } else {
            console.log(`❌ ${author} 密码验证失败`);
        }
        
        return isValid;
    }

    // 导出到全局
    window.VoucherDecryptor = {
        decryptVoucherImage: decryptVoucherImageWithCache,
        clearImageCache,
        clearSpecificCache,
        getCacheStatus,
        isWebCryptoSupported,
        getPlaceholderImageUrl,
        buildEncryptedUrl,
        authenticate, // 添加authenticate方法
        
        // 工具方法
        isAuthenticated: (author) => {
            return window.AuthHelper && window.AuthHelper.isAuthenticated(author);
        },
        
        // 检查是否有凭证文件
        hasVoucher: (filename, author) => {
            if (!filename || !author) return false;
            return true; // 假设文件存在，实际使用时会在解密时验证
        }
    };

    console.log('🔐 凭证解密器已初始化');

})(); 