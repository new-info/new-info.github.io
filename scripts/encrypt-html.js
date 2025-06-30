#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config() || {};

class HtmlEncryptor {
    constructor() {
        this.rootDir = path.join(__dirname, '..');
        this.authorsDir = path.join(this.rootDir, '2025');
        this.authors = ['hjf', 'hjm'];
        
        // 从环境变量读取加密key
        this.encryptKey = parseInt(process.env.ENCRYPT_KEY);
        if (!this.encryptKey) {
            throw new Error('ENCRYPT_KEY 环境变量未设置，请在.env文件中配置加密密钥');
        }
        console.log(`使用加密KEY: ${this.encryptKey}`);
    }

    // 检查文件是否已加密
    isEncrypted(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return content.includes('id="encrypted-content"') && content.includes('function wasmDecryptContent()');
        } catch (error) {
            return false;
        }
    }

    // 使用WASM XOR加密
    wasmEncrypt(data, key = null) {
        if (key === null) {
            key = this.encryptKey;
        }
        
        // 简单的XOR加密实现（与WASM中的逻辑保持一致）
        const utf8Bytes = Buffer.from(data, 'utf8');
        const encryptedBytes = utf8Bytes.map(byte => byte ^ key);
        
        // 转换为base64
        return Buffer.from(encryptedBytes).toString('base64');
    }

    // 使用WASM XOR解密
    wasmDecrypt(encryptedData, key = null) {
        try {
            if (key === null) {
                key = this.encryptKey;
            }
            
            // 从base64解码
            const encryptedBytes = Buffer.from(encryptedData, 'base64');
            
            // XOR解密
            const decryptedBytes = encryptedBytes.map(byte => byte ^ key);
            
            // 转换为UTF-8字符串
            return Buffer.from(decryptedBytes).toString('utf8');
        } catch (error) {
            console.error('WASM解密失败:', error.message);
            return null;
        }
    }

    // 从密码获取前三位用作密钥
    getKeyFromPassword(password) {
        const firstThree = password.substring(0, 3);
        let hash = 0;
        
        for (let i = 0; i < firstThree.length; i++) {
            hash = ((hash * 31) + firstThree.charCodeAt(i)) >>> 0;
        }
        
        // 确保返回值不为0，并且在合理范围内
        return ((hash % 255) + 1);
    }

    // 解密已加密的文件内容（用于扫描时读取）
    static decryptContent(encryptedHtml) {
        try {
            // 检查是否是加密格式
            if (!encryptedHtml.includes('id="encrypted-content"')) {
                return encryptedHtml; // 不是加密格式，直接返回
            }

            // 提取加密内容
            const match = encryptedHtml.match(/<div id="encrypted-content"[^>]*>([\s\S]*?)<\/div>/);
            if (!match) {
                return encryptedHtml; // 无法找到加密内容，返回原内容
            }

            const encodedContent = match[1].trim();
            
            // 创建临时实例进行解密
            const tempInstance = new HtmlEncryptor();
            const decodedContent = tempInstance.wasmDecrypt(encodedContent);
            return decodedContent || encryptedHtml;
        } catch (error) {
            console.error('解密失败:', error.message);
            return encryptedHtml; // 解密失败，返回原内容
        }
    }

    // 加密HTML文件
    encryptFile(filePath) {
        try {
            // 检查文件是否已经加密
            if (this.isEncrypted(filePath)) {
                console.log(`文件已加密，跳过: ${filePath}`);
                return;
            }

            console.log(`正在加密: ${filePath}`);
            
            // 读取原始HTML内容
            const originalContent = fs.readFileSync(filePath, 'utf8');
            
            // 使用WASM方式进行加密
            const encodedContent = this.wasmEncrypt(originalContent);
            
            // 创建加密的HTML包装器
            const encryptedHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Encrypted Content</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background-color: #f5f5f5;
            margin: 0;
        }
        .loading {
            font-size: 18px;
            color: #666;
            margin: 20px 0;
        }
        .error {
            color: #dc3545;
            margin: 20px 0;
            padding: 10px;
            border: 1px solid #dc3545;
            border-radius: 5px;
            background-color: #f8d7da;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .content-container {
            display: none;
        }
        .content-container.show {
            display: block;
        }
    </style>
    <script>
        // 获取存储的密码前三位（由认证系统存储）
        function getStoredPasswordPrefix() {
            try {
                return localStorage.getItem('user_password_prefix') || '';
            } catch (e) {
                console.error('获取密码前三位失败:', e);
                return '';
            }
        }
        
        // 简单的XOR解密实现（与服务端保持一致）
        function wasmXorDecrypt(encryptedData, key) {
            try {
                // 从base64解码
                const binaryString = atob(encryptedData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                // XOR解密
                const decryptedBytes = bytes.map(byte => byte ^ key);
                
                // 转换为UTF-8字符串
                const decoder = new TextDecoder('utf-8');
                return decoder.decode(decryptedBytes);
            } catch (error) {
                console.error('XOR解密失败:', error);
                return null;
            }
        }
        
        // 解密并显示内容
        function decryptAndShowContent() {
            const loadingElement = document.getElementById('loading');
            const errorElement = document.getElementById('error');
            const encryptedElement = document.getElementById('encrypted-content');
            
            try {
                if (!encryptedElement) {
                    throw new Error('找不到加密内容');
                }
                
                const encoded = encryptedElement.textContent.trim();
                
                // 使用服务端相同的key进行解密（从环境变量读取）
                const serverKey = ${this.encryptKey};
                const decoded = wasmXorDecrypt(encoded, serverKey);
                
                if (!decoded) {
                    throw new Error('解密失败');
                }
                
                // 隐藏加载界面
                if (loadingElement) loadingElement.style.display = 'none';
                if (errorElement) errorElement.style.display = 'none';
                
                // 解析解密后的HTML内容
                const parser = new DOMParser();
                const decodedDoc = parser.parseFromString(decoded, 'text/html');
                
                // 获取当前页面的基础路径（用于修复相对路径）
                const currentPath = window.location.pathname;
                const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
                
                // 修复相对路径的函数
                function fixRelativePaths(element) {
                    // 修复CSS链接
                    const links = element.querySelectorAll('link[href]');
                    links.forEach(link => {
                        const href = link.getAttribute('href');
                        if (href && href.startsWith('./')) {
                            link.setAttribute('href', basePath + href.substring(2));
                        } else if (href && !href.startsWith('http') && !href.startsWith('/') && !href.includes('://')) {
                            link.setAttribute('href', basePath + href);
                        }
                    });
                    
                    // 修复脚本源路径
                    const scripts = element.querySelectorAll('script[src]');
                    scripts.forEach(script => {
                        const src = script.getAttribute('src');
                        if (src && src.startsWith('./')) {
                            script.setAttribute('src', basePath + src.substring(2));
                        } else if (src && !src.startsWith('http') && !src.startsWith('/') && !src.includes('://')) {
                            script.setAttribute('src', basePath + src);
                        }
                    });
                    
                    // 修复图片路径
                    const images = element.querySelectorAll('img[src]');
                    images.forEach(img => {
                        const src = img.getAttribute('src');
                        if (src && src.startsWith('./')) {
                            img.setAttribute('src', basePath + src.substring(2));
                        } else if (src && !src.startsWith('http') && !src.startsWith('/') && !src.includes('://')) {
                            img.setAttribute('src', basePath + src);
                        }
                    });
                }
                
                // 获取解密后的head和body内容
                const newHead = decodedDoc.head;
                const newBody = decodedDoc.body;
                
                // 修复head中的相对路径
                fixRelativePaths(newHead);
                // 修复body中的相对路径
                fixRelativePaths(newBody);
                
                // 替换当前页面的head内容（保留现有的meta charset）
                const currentHead = document.head;
                // 清空除了基本meta标签外的所有内容
                const metaCharset = currentHead.querySelector('meta[charset]');
                currentHead.innerHTML = '';
                if (metaCharset) {
                    currentHead.appendChild(metaCharset);
                }
                
                // 添加解密后的head内容
                Array.from(newHead.children).forEach(child => {
                    if (child.getAttribute && child.getAttribute('charset')) {
                        return; // 跳过charset meta标签，避免重复
                    }
                    currentHead.appendChild(child.cloneNode(true));
                });
                
                // 替换body内容
                document.body.innerHTML = newBody.innerHTML;
                
                // 复制body的属性
                Array.from(newBody.attributes).forEach(attr => {
                    document.body.setAttribute(attr.name, attr.value);
                });
                
                // 执行解密后内容中的脚本
                const scripts = document.body.querySelectorAll('script');
                scripts.forEach(script => {
                    const newScript = document.createElement('script');
                    if (script.src) {
                        newScript.src = script.src;
                    } else {
                        newScript.textContent = script.textContent;
                    }
                    Array.from(script.attributes).forEach(attr => {
                        if (attr.name !== 'src') {
                            newScript.setAttribute(attr.name, attr.value);
                        }
                    });
                    script.parentNode.replaceChild(newScript, script);
                });
                
            } catch (error) {
                console.error('解密失败:', error);
                
                // 隐藏加载界面
                if (loadingElement) loadingElement.style.display = 'none';
                
                // 显示错误信息
                if (errorElement) {
                    errorElement.style.display = 'block';
                    errorElement.innerHTML = \`
                        <h3>解密失败</h3>
                        <p>错误信息: \${error.message}</p>
                        <p>请确保您已通过认证系统正确验证身份。</p>
                        <p>如果问题持续存在，请返回主页重新进行身份验证。</p>
                        <a href="/index.html" style="color: #1a2980; text-decoration: none;">返回主页</a>
                    \`;
                }
            }
        }
        
        // 页面加载完成后检查认证状态并解密
        window.addEventListener('load', function() {
            const loadingElement = document.getElementById('loading');
            const errorElement = document.getElementById('error');
            
            // 检查是否已有存储的密码前三位（由认证系统存储）
            const storedPrefix = getStoredPasswordPrefix();
            
            if (storedPrefix) {
                // 已有密码前三位，直接解密
                console.log('检测到已存储的密码前三位，开始自动解密...');
                decryptAndShowContent();
            } else {
                // 未找到密码前三位，显示错误信息
                if (loadingElement) loadingElement.style.display = 'none';
                if (errorElement) {
                    errorElement.style.display = 'block';
                    errorElement.innerHTML = \`
                        <h3>需要身份验证</h3>
                        <p>此内容需要通过身份验证才能访问。</p>
                        <p>请返回主页，通过认证系统验证您的身份后再访问此页面。</p>
                        <a href="/index.html" style="color: #1a2980; text-decoration: none;">返回主页进行身份验证</a>
                    \`;
                }
            }
        });
    </script>
</head>
<body>
    <div id="loading">
        <div class="loading">正在检查认证状态...</div>
        <div class="spinner"></div>
    </div>
    <div id="error" class="error" style="display: none;">
        <!-- 错误信息将在此显示 -->
    </div>
    <div id="content-container" class="content-container">
        <!-- 解密后的内容将显示在这里 -->
    </div>
    <div id="encrypted-content" style="display:none;">${encodedContent}</div>
</body>
</html>`;

            // 写入加密后的内容
            fs.writeFileSync(filePath, encryptedHtml, 'utf8');
            console.log(`加密完成: ${filePath}`);
            
        } catch (error) {
            console.error(`加密失败 ${filePath}:`, error.message);
        }
    }

    // 解密HTML文件（还原为原始格式）
    decryptFile(filePath) {
        try {
            if (!this.isEncrypted(filePath)) {
                console.log(`文件未加密，跳过: ${filePath}`);
                return;
            }

            console.log(`正在解密: ${filePath}`);
            
            // 读取加密的HTML内容
            const encryptedContent = fs.readFileSync(filePath, 'utf8');
            
            // 解密内容
            const originalContent = HtmlEncryptor.decryptContent(encryptedContent);
            
            // 写入解密后的内容
            fs.writeFileSync(filePath, originalContent, 'utf8');
            console.log(`解密完成: ${filePath}`);
            
        } catch (error) {
            console.error(`解密失败 ${filePath}:`, error.message);
        }
    }

    // 扫描并处理指定作者的所有HTML文件
    processAuthorFiles(author, encrypt = true) {
        const authorDir = path.join(this.authorsDir, author);
        
        if (!fs.existsSync(authorDir)) {
            console.log(`目录不存在: ${authorDir}`);
            return;
        }

        const files = fs.readdirSync(authorDir);
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        
        console.log(`\n处理 ${author} 的文件 (${encrypt ? '加密' : '解密'}):`);
        htmlFiles.forEach(file => {
            const filePath = path.join(authorDir, file);
            if (encrypt) {
                this.encryptFile(filePath);
            } else {
                this.decryptFile(filePath);
            }
        });
    }

    // 加密所有HTML文件
    encryptAll() {
        console.log('开始使用WASM加密HTML文件...');
        this.authors.forEach(author => {
            this.processAuthorFiles(author, true);
        });
        console.log('\nWASM加密完成！');
    }

    // 解密所有HTML文件
    decryptAll() {
        console.log('开始使用WASM解密HTML文件...');
        this.authors.forEach(author => {
            this.processAuthorFiles(author, false);
        });
        console.log('\nWASM解密完成！');
    }

    // 检查所有文件的加密状态
    checkStatus() {
        console.log('检查文件WASM加密状态...\n');
        
        this.authors.forEach(author => {
            const authorDir = path.join(this.authorsDir, author);
            
            if (!fs.existsSync(authorDir)) {
                console.log(`目录不存在: ${authorDir}`);
                return;
            }

            const files = fs.readdirSync(authorDir);
            const htmlFiles = files.filter(file => file.endsWith('.html'));
            
            console.log(`${author} 文件夹:`);
            htmlFiles.forEach(file => {
                const filePath = path.join(authorDir, file);
                const encrypted = this.isEncrypted(filePath);
                console.log(`  ${file}: ${encrypted ? '已WASM加密' : '未加密'}`);
            });
            console.log('');
        });
    }
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === '-h') {
    console.log(`
HTML文件WASM加密工具使用说明:

用法:
  node scripts/encrypt-html.js <命令>

命令:
  encrypt     使用WASM加密所有HTML文件
  decrypt     使用WASM解密所有HTML文件  
  status      检查所有文件的WASM加密状态
  --help, -h  显示此帮助信息

环境变量:
  ENCRYPT_KEY 服务端加密密钥（必须设置）

示例:
  node scripts/encrypt-html.js encrypt   # WASM加密所有HTML文件
  node scripts/encrypt-html.js decrypt   # WASM解密所有HTML文件
  node scripts/encrypt-html.js status    # 查看WASM加密状态
    `);
    process.exit(0);
}

// 运行脚本
if (require.main === module) {
    const encryptor = new HtmlEncryptor();
    
    switch (command) {
        case 'encrypt':
            encryptor.encryptAll();
            break;
        case 'decrypt':
            encryptor.decryptAll();
            break;
        case 'status':
            encryptor.checkStatus();
            break;
        default:
            console.error(`未知命令: ${command}`);
            console.log('使用 --help 查看帮助信息');
            process.exit(1);
    }
}

module.exports = HtmlEncryptor; 