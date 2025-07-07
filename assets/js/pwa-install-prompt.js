/**
 * PWA 安装提示管理器
 * 处理 PWA 安装横幅显示和安装流程
 */
class PWAInstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.installBanner = null;
        this.installButton = null;

        this.init();
    }

    init() {
        this.checkInstallStatus();
        this.setupEventListeners();
        this.createInstallUI();
    }

    /**
     * 检查应用安装状态
     */
    checkInstallStatus() {
        // 检查是否已在 PWA 模式下运行
        const isPWAMode = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone ||
                         document.referrer.includes('android-app://');

        if (isPWAMode) {
            this.isInstalled = true;
            console.log('🚀 应用已安装并在 PWA 模式下运行');
            return;
        }

        // 检查是否为支持安装的环境
        if (!this.isSupportedBrowser()) {
            console.log('📱 当前浏览器不支持 PWA 安装');
            return;
        }

        console.log('📲 PWA 安装管理器已初始化');
    }

    /**
     * 检查浏览器是否支持 PWA 安装
     */
    isSupportedBrowser() {
        // 检查基本支持
        if (!('serviceWorker' in navigator)) {
            return false;
        }

        // 检查用户代理
        const userAgent = navigator.userAgent.toLowerCase();
        
        // Chrome, Edge, Samsung Browser 等支持 beforeinstallprompt
        if (userAgent.includes('chrome') || 
            userAgent.includes('edge') || 
            userAgent.includes('samsung')) {
            return true;
        }

        // iOS Safari 不支持 beforeinstallprompt，但支持 Add to Home Screen
        if (userAgent.includes('safari') && userAgent.includes('mobile')) {
            return true;
        }

        return false;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听 beforeinstallprompt 事件
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📲 PWA 安装提示可用');
            
            // 阻止浏览器默认的安装横幅
            e.preventDefault();
            
            // 保存事件引用
            this.deferredPrompt = e;
            
            // 显示自定义安装界面
            this.showInstallPrompt();
        });

        // 监听应用安装事件
        window.addEventListener('appinstalled', (e) => {
            console.log('✅ PWA 已成功安装');
            this.isInstalled = true;
            this.hideInstallPrompt();
            this.showInstallSuccessMessage();
        });

        // 监听页面加载完成
        window.addEventListener('load', () => {
            // 延迟检查是否需要显示 iOS 安装提示
            setTimeout(() => {
                this.checkiOSInstallPrompt();
            }, 2000);
        });
    }

    /**
     * 创建安装 UI 元素
     */
    createInstallUI() {
        this.createInstallBanner();
        this.createInstallButton();
    }

    /**
     * 创建安装横幅
     */
    createInstallBanner() {
        this.installBanner = document.createElement('div');
        this.installBanner.id = 'pwa-install-banner';
        this.installBanner.className = 'pwa-install-banner hidden';
        this.installBanner.innerHTML = `
            <div class="install-banner-content">
                <div class="install-banner-icon">📱</div>
                <div class="install-banner-text">
                    <div class="install-banner-title">安装大学生活平台</div>
                    <div class="install-banner-subtitle">获得更好的使用体验</div>
                </div>
                <div class="install-banner-actions">
                    <button class="install-btn install-btn-primary" onclick="pwaInstallManager.promptInstall()">
                        安装
                    </button>
                    <button class="install-btn install-btn-secondary" onclick="pwaInstallManager.dismissInstallPrompt()">
                        不了，谢谢
                    </button>
                </div>
                <button class="install-banner-close" onclick="pwaInstallManager.dismissInstallPrompt()" aria-label="关闭">
                    ×
                </button>
            </div>
        `;

        // 添加样式
        this.addInstallStyles();
        
        // 插入到页面
        document.body.appendChild(this.installBanner);
    }

    /**
     * 创建浮动安装按钮
     */
    createInstallButton() {
        this.installButton = document.createElement('button');
        this.installButton.id = 'pwa-install-fab';
        this.installButton.className = 'pwa-install-fab hidden';
        this.installButton.innerHTML = `
            <span class="fab-icon">📱</span>
            <span class="fab-text">安装应用</span>
        `;
        this.installButton.onclick = () => this.promptInstall();

        document.body.appendChild(this.installButton);
    }

    /**
     * 添加安装相关样式
     */
    addInstallStyles() {
        if (document.getElementById('pwa-install-styles')) return;

        const style = document.createElement('style');
        style.id = 'pwa-install-styles';
        style.textContent = `
            .pwa-install-banner {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
                color: white;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transform: translateY(-100%);
                transition: transform 0.3s ease-in-out;
            }

            .pwa-install-banner.show {
                transform: translateY(0);
            }

            .pwa-install-banner.hidden {
                display: none;
            }

            .install-banner-content {
                display: flex;
                align-items: center;
                padding: 16px 20px;
                max-width: 1200px;
                margin: 0 auto;
                position: relative;
            }

            .install-banner-icon {
                font-size: 2rem;
                margin-right: 16px;
                flex-shrink: 0;
            }

            .install-banner-text {
                flex: 1;
                margin-right: 16px;
            }

            .install-banner-title {
                font-weight: bold;
                font-size: 1.1rem;
                margin-bottom: 4px;
            }

            .install-banner-subtitle {
                font-size: 0.9rem;
                opacity: 0.9;
            }

            .install-banner-actions {
                display: flex;
                gap: 12px;
                flex-shrink: 0;
            }

            .install-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 0.9rem;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s ease;
            }

            .install-btn-primary {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }

            .install-btn-primary:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-1px);
            }

            .install-btn-secondary {
                background: transparent;
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }

            .install-btn-secondary:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .install-banner-close {
                position: absolute;
                top: 8px;
                right: 8px;
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
            }

            .install-banner-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .pwa-install-fab {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
                color: white;
                border: none;
                border-radius: 50px;
                padding: 12px 20px;
                font-size: 0.9rem;
                font-weight: 500;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 9999;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                transform: translateY(100px);
            }

            .pwa-install-fab.show {
                transform: translateY(0);
            }

            .pwa-install-fab.hidden {
                display: none;
            }

            .pwa-install-fab:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            }

            .fab-icon {
                font-size: 1.2rem;
            }

            .fab-text {
                white-space: nowrap;
            }

            /* iOS 安装提示 */
            .ios-install-prompt {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
                color: white;
                padding: 20px;
                z-index: 10000;
                transform: translateY(100%);
                transition: transform 0.3s ease-in-out;
            }

            .ios-install-prompt.show {
                transform: translateY(0);
            }

            .ios-install-content {
                max-width: 600px;
                margin: 0 auto;
                text-align: center;
            }

            .ios-install-title {
                font-size: 1.2rem;
                font-weight: bold;
                margin-bottom: 8px;
            }

            .ios-install-text {
                font-size: 0.95rem;
                margin-bottom: 16px;
                opacity: 0.9;
            }

            .ios-install-steps {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
                font-size: 1.5rem;
                margin-bottom: 16px;
            }

            .ios-close-btn {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
            }

            /* 移动端适配 */
            @media (max-width: 768px) {
                .install-banner-content {
                    padding: 12px 16px;
                    flex-wrap: wrap;
                }

                .install-banner-icon {
                    font-size: 1.8rem;
                    margin-right: 12px;
                }

                .install-banner-actions {
                    flex: 1;
                    justify-content: flex-end;
                }

                .install-btn {
                    padding: 6px 12px;
                    font-size: 0.85rem;
                }

                .pwa-install-fab {
                    bottom: 80px;
                    right: 16px;
                    padding: 10px 16px;
                    font-size: 0.85rem;
                }

                .fab-text {
                    display: none;
                }
            }

            /* PWA 模式下隐藏安装元素 */
            @media (display-mode: standalone) {
                .pwa-install-banner,
                .pwa-install-fab {
                    display: none !important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * 显示安装提示
     */
    showInstallPrompt() {
        if (this.isInstalled) return;

        // 检查是否已被用户拒绝
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

        if (dismissedTime > oneDayAgo) {
            console.log('📲 用户已拒绝安装提示，24小时内不再显示');
            return;
        }

        // 延迟显示，避免干扰用户初始体验
        setTimeout(() => {
            if (this.installBanner) {
                this.installBanner.classList.remove('hidden');
                setTimeout(() => {
                    this.installBanner.classList.add('show');
                }, 100);
            }

            // 稍后显示浮动按钮
            setTimeout(() => {
                if (this.installButton) {
                    this.installButton.classList.remove('hidden');
                    setTimeout(() => {
                        this.installButton.classList.add('show');
                    }, 100);
                }
            }, 3000);
        }, 2000);
    }

    /**
     * 隐藏安装提示
     */
    hideInstallPrompt() {
        if (this.installBanner) {
            this.installBanner.classList.remove('show');
            setTimeout(() => {
                this.installBanner.classList.add('hidden');
            }, 300);
        }

        if (this.installButton) {
            this.installButton.classList.remove('show');
            setTimeout(() => {
                this.installButton.classList.add('hidden');
            }, 300);
        }
    }

    /**
     * 用户拒绝安装提示
     */
    dismissInstallPrompt() {
        this.hideInstallPrompt();
        
        // 记录拒绝时间
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
        
        console.log('📲 用户拒绝了安装提示');
    }

    /**
     * 执行安装流程
     */
    async promptInstall() {
        if (!this.deferredPrompt) {
            console.log('❌ 安装提示不可用');
            return;
        }

        try {
            // 显示安装提示
            this.deferredPrompt.prompt();

            // 等待用户响应
            const { outcome } = await this.deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('✅ 用户接受了安装');
                this.hideInstallPrompt();
            } else {
                console.log('❌ 用户拒绝了安装');
                this.dismissInstallPrompt();
            }

            // 清除保存的事件引用
            this.deferredPrompt = null;

        } catch (error) {
            console.error('❌ 安装流程出错:', error);
        }
    }

    /**
     * 检查并显示 iOS 安装提示
     */
    checkiOSInstallPrompt() {
        // 检查是否为 iOS Safari
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);

        if (isIOS && !isInStandaloneMode && !this.deferredPrompt) {
            // 检查是否已显示过 iOS 提示
            const iosPromptShown = localStorage.getItem('ios-install-prompt-shown');
            const lastShown = iosPromptShown ? parseInt(iosPromptShown) : 0;
            const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);

            if (lastShown < threeDaysAgo) {
                setTimeout(() => {
                    this.showiOSInstallPrompt();
                }, 5000);
            }
        }
    }

    /**
     * 显示 iOS 安装提示
     */
    showiOSInstallPrompt() {
        const iosPrompt = document.createElement('div');
        iosPrompt.className = 'ios-install-prompt';
        iosPrompt.innerHTML = `
            <div class="ios-install-content">
                <div class="ios-install-title">📱 添加到主屏幕</div>
                <div class="ios-install-text">
                    在 Safari 中点击分享按钮，然后选择"添加到主屏幕"以安装此应用
                </div>
                <div class="ios-install-steps">
                    <span>📤</span>
                    <span>→</span>
                    <span>➕</span>
                    <span>🏠</span>
                </div>
                <button class="ios-close-btn" onclick="this.parentElement.parentElement.remove()">
                    我知道了
                </button>
            </div>
        `;

        document.body.appendChild(iosPrompt);

        // 显示动画
        setTimeout(() => {
            iosPrompt.classList.add('show');
        }, 100);

        // 记录显示时间
        localStorage.setItem('ios-install-prompt-shown', Date.now().toString());

        // 自动隐藏
        setTimeout(() => {
            if (iosPrompt.parentElement) {
                iosPrompt.classList.remove('show');
                setTimeout(() => {
                    iosPrompt.remove();
                }, 300);
            }
        }, 10000);
    }

    /**
     * 显示安装成功消息
     */
    showInstallSuccessMessage() {
        // 显示成功通知
        this.showSuccessNotification();

        // 清除拒绝记录
        localStorage.removeItem('pwa-install-dismissed');
        localStorage.removeItem('ios-install-prompt-shown');
    }

    /**
     * 显示安装成功通知
     */
    showSuccessNotification() {
        // 优先使用统一通知系统
        if (window.swUpdater) {
            window.swUpdater.showNotification('✅ PWA 安装成功！您可以离线使用此应用了');
        } else {
            // 创建自定义通知
            const notification = document.createElement('div');
            notification.className = 'pwa-install-notification success';
            notification.innerHTML = `
                <div class="pwa-install-notification-icon">✅</div>
                <div class="pwa-install-notification-content">
                    <p>PWA 安装成功！您可以离线使用此应用了</p>
                </div>
                <div class="pwa-install-notification-close">&times;</div>
            `;

            // 添加到页面
            document.body.appendChild(notification);

            // 设置自动关闭
            setTimeout(() => {
                notification.classList.add('hide');
                setTimeout(() => notification.remove(), 300);
            }, 5000);

            // 添加关闭按钮功能
            const closeBtn = notification.querySelector('.pwa-install-notification-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    notification.classList.add('hide');
                    setTimeout(() => notification.remove(), 300);
                });
            }
        }
    }

    /**
     * 手动触发安装检查（供其他模块调用）
     */
    checkForInstall() {
        if (!this.isInstalled && this.deferredPrompt) {
            this.showInstallPrompt();
        }
    }
}

// 全局实例
let pwaInstallManager;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    pwaInstallManager = new PWAInstallManager();
    
    // 暴露给全局作用域
    window.pwaInstallManager = pwaInstallManager;
}); 