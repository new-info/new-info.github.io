/**
 * 文件监控脚本
 * 用于在运行时检测和处理404错误
 */

class FileMonitor {
    constructor() {
        this.filesList = window.FILES_LIST || { html: [], css: [], js: [], images: [], other: [] };
        this.missingFiles = window.MISSING_FILES || { missingFiles: { links: [], scripts: [], styles: [], images: [] } };
        this.interceptedRequests = new Set();
        this.errorCount = 0;
        this.initialized = false;
    }

    /**
     * 初始化监控
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;

        console.log('文件监控已启动');
        
        // 监听资源加载错误
        window.addEventListener('error', (event) => {
            if (event.target && (event.target.tagName === 'IMG' || 
                                event.target.tagName === 'SCRIPT' || 
                                event.target.tagName === 'LINK')) {
                
                const url = event.target.src || event.target.href;
                if (!url) return;
                
                // 避免重复处理同一URL
                if (this.interceptedRequests.has(url)) return;
                this.interceptedRequests.add(url);
                
                // 处理404错误
                this.handle404Error(url, event.target.tagName.toLowerCase());
                
                // 防止错误继续传播
                event.preventDefault();
            }
        }, true);
        
        // 监听fetch请求错误
        const originalFetch = window.fetch;
        window.fetch = async (url, options) => {
            try {
                const response = await originalFetch(url, options);
                if (response.status === 404) {
                    // 避免重复处理同一URL
                    if (!this.interceptedRequests.has(url)) {
                        this.interceptedRequests.add(url);
                        this.handle404Error(url, 'fetch');
                    }
                }
                return response;
            } catch (error) {
                // 网络错误或其他错误
                if (!this.interceptedRequests.has(url)) {
                    this.interceptedRequests.add(url);
                    this.handle404Error(url, 'fetch');
                }
                throw error;
            }
        };
        
        // 监听XMLHttpRequest错误
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this.addEventListener('load', () => {
                if (this.status === 404) {
                    // 避免重复处理同一URL
                    if (!this.interceptedRequests.has(url)) {
                        this.interceptedRequests.add(url);
                        this.handle404Error(url, 'xhr');
                    }
                }
            });
            
            this.addEventListener('error', () => {
                // 网络错误或其他错误
                if (!this.interceptedRequests.has(url)) {
                    this.interceptedRequests.add(url);
                    this.handle404Error(url, 'xhr');
                }
            });
            
            return originalOpen.apply(this, [method, url, ...args]);
        };
        
        // 检查已知的缺失文件
        this.checkKnownMissingFiles();
    }
    
    /**
     * 检查已知的缺失文件
     */
    checkKnownMissingFiles() {
        const missingFiles = this.missingFiles.missingFiles;
        
        // 汇总所有缺失文件
        const allMissing = [
            ...missingFiles.links,
            ...missingFiles.scripts,
            ...missingFiles.styles,
            ...missingFiles.images
        ];
        
        if (allMissing.length > 0) {
            console.warn(`检测到 ${allMissing.length} 个已知的缺失文件`);
        }
    }
    
    /**
     * 处理404错误
     * @param {string} url - 请求的URL
     * @param {string} type - 请求类型 (img, script, link, fetch, xhr)
     */
    handle404Error(url, type) {
        // 增加错误计数
        this.errorCount++;
        
        // 提取相对路径
        let relativePath = url;
        try {
            const urlObj = new URL(url, window.location.origin);
            if (urlObj.origin === window.location.origin) {
                relativePath = urlObj.pathname.replace(/^\//, '');
            }
        } catch (e) {
            // URL解析错误，使用原始URL
        }
        
        console.warn(`404错误: ${relativePath} (${type})`);
        
        // 尝试查找替代文件
        const alternativeFile = this.findAlternativeFile(relativePath);
        if (alternativeFile) {
            console.info(`找到替代文件: ${alternativeFile}`);
            
            // 对于不同类型的资源，尝试不同的替换方法
            if (type === 'img') {
                this.replaceImageSrc(url, alternativeFile);
            } else if (type === 'script') {
                this.loadAlternativeScript(url, alternativeFile);
            } else if (type === 'link') {
                this.loadAlternativeStylesheet(url, alternativeFile);
            }
        }
        
        // 更新UI显示错误数量
        this.updateErrorCountUI();
    }
    
    /**
     * 查找替代文件
     * @param {string} relativePath - 相对路径
     * @returns {string|null} - 替代文件路径或null
     */
    findAlternativeFile(relativePath) {
        // 提取文件名和扩展名
        const fileName = relativePath.split('/').pop();
        const ext = fileName.includes('.') ? fileName.split('.').pop() : '';
        
        // 根据文件类型查找替代文件
        let fileList = [];
        if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'].includes('.' + ext)) {
            fileList = this.filesList.images;
        } else if (ext === 'js') {
            fileList = this.filesList.js;
        } else if (ext === 'css') {
            fileList = this.filesList.css;
        } else if (['html', 'htm'].includes(ext)) {
            fileList = this.filesList.html;
        } else {
            fileList = [
                ...this.filesList.html,
                ...this.filesList.css,
                ...this.filesList.js,
                ...this.filesList.images,
                ...this.filesList.other
            ];
        }
        
        // 尝试找到相似的文件名
        for (const file of fileList) {
            const fileNameOnly = file.split('/').pop();
            
            // 检查文件名是否相似
            if (fileNameOnly.toLowerCase().includes(fileName.toLowerCase()) ||
                fileName.toLowerCase().includes(fileNameOnly.toLowerCase())) {
                return file;
            }
        }
        
        // 如果找不到相似的文件名，返回同类型的第一个文件（如果有）
        return fileList.length > 0 ? fileList[0] : null;
    }
    
    /**
     * 替换图片的src属性
     * @param {string} originalSrc - 原始src
     * @param {string} newSrc - 新的src
     */
    replaceImageSrc(originalSrc, newSrc) {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.src === originalSrc || img.getAttribute('src') === originalSrc) {
                img.src = newSrc;
                img.setAttribute('data-original-src', originalSrc);
                img.setAttribute('title', `原始图片未找到: ${originalSrc}`);
            }
        });
    }
    
    /**
     * 加载替代脚本
     * @param {string} originalSrc - 原始src
     * @param {string} newSrc - 新的src
     */
    loadAlternativeScript(originalSrc, newSrc) {
        // 移除原始脚本
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.src === originalSrc || script.getAttribute('src') === originalSrc) {
                script.remove();
            }
        });
        
        // 加载新脚本
        const newScript = document.createElement('script');
        newScript.src = newSrc;
        newScript.setAttribute('data-original-src', originalSrc);
        document.head.appendChild(newScript);
    }
    
    /**
     * 加载替代样式表
     * @param {string} originalHref - 原始href
     * @param {string} newHref - 新的href
     */
    loadAlternativeStylesheet(originalHref, newHref) {
        // 移除原始样式表
        const links = document.querySelectorAll('link');
        links.forEach(link => {
            if (link.href === originalHref || link.getAttribute('href') === originalHref) {
                link.remove();
            }
        });
        
        // 加载新样式表
        const newLink = document.createElement('link');
        newLink.rel = 'stylesheet';
        newLink.href = newHref;
        newLink.setAttribute('data-original-href', originalHref);
        document.head.appendChild(newLink);
    }
    
    /**
     * 更新UI显示错误数量
     */
    updateErrorCountUI() {
        // 检查是否已存在错误计数器
        let errorCounter = document.getElementById('file-monitor-error-counter');
        
        if (!errorCounter) {
            // 创建错误计数器
            errorCounter = document.createElement('div');
            errorCounter.id = 'file-monitor-error-counter';
            errorCounter.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                background: rgba(255, 0, 0, 0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 12px;
                z-index: 9999;
                cursor: pointer;
            `;
            errorCounter.addEventListener('click', () => this.showErrorDetails());
            document.body.appendChild(errorCounter);
        }
        
        // 更新错误计数
        errorCounter.textContent = `404错误: ${this.errorCount}`;
        
        // 只在有错误时显示
        if (this.errorCount > 0) {
            errorCounter.style.display = 'block';
        } else {
            errorCounter.style.display = 'none';
        }
    }
    
    /**
     * 显示错误详情
     */
    showErrorDetails() {
        // 检查是否已存在错误详情面板
        let errorPanel = document.getElementById('file-monitor-error-panel');
        
        if (errorPanel) {
            // 如果已存在，则切换显示/隐藏
            errorPanel.style.display = errorPanel.style.display === 'none' ? 'block' : 'none';
            return;
        }
        
        // 创建错误详情面板
        errorPanel = document.createElement('div');
        errorPanel.id = 'file-monitor-error-panel';
        errorPanel.style.cssText = `
            position: fixed;
            bottom: 40px;
            right: 10px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 10px;
            max-width: 80%;
            max-height: 80%;
            overflow: auto;
            z-index: 9998;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        `;
        
        // 添加标题
        const title = document.createElement('h3');
        title.textContent = '404错误详情';
        title.style.margin = '0 0 10px 0';
        errorPanel.appendChild(title);
        
        // 添加关闭按钮
        const closeButton = document.createElement('button');
        closeButton.textContent = '关闭';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 3px 8px;
            cursor: pointer;
        `;
        closeButton.addEventListener('click', () => {
            errorPanel.style.display = 'none';
        });
        errorPanel.appendChild(closeButton);
        
        // 添加错误列表
        const errorList = document.createElement('ul');
        errorList.style.padding = '0 0 0 20px';
        
        this.interceptedRequests.forEach(url => {
            const item = document.createElement('li');
            item.textContent = url;
            errorList.appendChild(item);
        });
        
        errorPanel.appendChild(errorList);
        document.body.appendChild(errorPanel);
    }
}

// 初始化文件监控
const fileMonitor = new FileMonitor();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    fileMonitor.init();
});

// 导出实例供其他脚本使用
window.fileMonitor = fileMonitor; 