#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class HtmlEncryptor {
    constructor() {
        this.rootDir = path.join(__dirname, '..');
        this.authorsDir = path.join(this.rootDir, '2025');
        this.authors = ['hjf', 'hjm'];
    }

    // 检查文件是否已加密
    isEncrypted(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return content.includes('id="encrypted-content"') && content.includes('function decryptContent()');
        } catch (error) {
            return false;
        }
    }

    // 解密已加密的文件内容（用于扫描时读取）
    static decryptContent(encryptedHtml) {
        try {
            // 检查是否是加密格式
            if (!encryptedHtml.includes('id="encrypted-content"')) {
                return encryptedHtml; // 不是加密格式，直接返回
            }

            // 提取base64内容
            const match = encryptedHtml.match(/<div id="encrypted-content"[^>]*>([\s\S]*?)<\/div>/);
            if (!match) {
                return encryptedHtml; // 无法找到加密内容，返回原内容
            }

            const encodedContent = match[1].trim();
            
            // 使用UTF-8安全的方式解码base64
            const decodedContent = Buffer.from(encodedContent, 'base64').toString('utf8');
            return decodedContent;
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
            
            // 使用UTF-8安全的方式进行base64编码
            const encodedContent = Buffer.from(originalContent, 'utf8').toString('base64');
            
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
        // UTF-8安全的base64解码函数
        function utf8DecodeBase64(base64) {
            try {
                // 首先解码base64
                const binaryString = atob(base64);
                // 然后处理UTF-8字符
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                // 使用TextDecoder正确解码UTF-8
                const decoder = new TextDecoder('utf-8');
                return decoder.decode(bytes);
            } catch (error) {
                console.error('UTF-8解码失败:', error);
                // 降级到普通atob
                return atob(base64);
            }
        }
        
        // 解密函数
        function decryptContent() {
            try {
                const encryptedElement = document.getElementById('encrypted-content');
                const loadingElement = document.getElementById('loading');
                const contentContainer = document.getElementById('content-container');
                
                if (!encryptedElement) {
                    loadingElement.innerHTML = '<div class="loading">解密失败：找不到加密内容</div>';
                    return;
                }
                
                const encoded = encryptedElement.textContent.trim();
                // 使用UTF-8安全的解码方式
                const decoded = utf8DecodeBase64(encoded);
                
                // 隐藏加载界面
                loadingElement.style.display = 'none';
                
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
                const loadingElement = document.getElementById('loading');
                if (loadingElement) {
                    loadingElement.innerHTML = '<div class="loading">解密失败：' + error.message + '</div>';
                }
            }
        }
        
        // 页面加载完成后自动解密
        window.addEventListener('load', function() {
            setTimeout(decryptContent, 100); // 稍微延迟以显示加载动画
        });
    </script>
</head>
<body>
    <div id="loading">
        <div class="loading">正在解密内容...</div>
        <div class="spinner"></div>
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
        console.log('开始加密HTML文件...');
        this.authors.forEach(author => {
            this.processAuthorFiles(author, true);
        });
        console.log('\n加密完成！');
    }

    // 解密所有HTML文件
    decryptAll() {
        console.log('开始解密HTML文件...');
        this.authors.forEach(author => {
            this.processAuthorFiles(author, false);
        });
        console.log('\n解密完成！');
    }

    // 检查所有文件的加密状态
    checkStatus() {
        console.log('检查文件加密状态...\n');
        
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
                console.log(`  ${file}: ${encrypted ? '已加密' : '未加密'}`);
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
HTML文件加密工具使用说明:

用法:
  node scripts/encrypt-html.js <命令>

命令:
  encrypt     加密所有HTML文件
  decrypt     解密所有HTML文件  
  status      检查所有文件的加密状态
  --help, -h  显示此帮助信息

示例:
  node scripts/encrypt-html.js encrypt   # 加密所有HTML文件
  node scripts/encrypt-html.js decrypt   # 解密所有HTML文件
  node scripts/encrypt-html.js status    # 查看加密状态
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