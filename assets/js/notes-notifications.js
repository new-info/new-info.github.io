/**
 * 笔记更新通知模块
 * 处理hjf和hjm文件夹更新时的浏览器推送通知
 */
class NotesNotificationManager {
    constructor() {
        this.initialized = false;
        this.notificationPermission = 'default'; // default, granted, denied
        this.lastCheckedTime = localStorage.getItem('lastNotesCheckTime') || 0;
        this.lastKnownData = null;
        this.notificationEnabled = localStorage.getItem('notesNotificationsEnabled') !== 'false';
        this.checkInterval = 60 * 1000; // 默认每分钟检查一次
    }

    /**
     * 初始化通知系统
     */
    async init() {
        if (this.initialized) return;
        this.initialized = true;

        // 检查浏览器是否支持通知
        if (!('Notification' in window)) {
            console.warn('此浏览器不支持桌面通知');
            return;
        }

        // 检查通知权限
        this.notificationPermission = Notification.permission;
        console.log(`通知权限状态: ${this.notificationPermission}`);

        // 如果用户已授权，设置检查定时器
        if (this.notificationPermission === 'granted' && this.notificationEnabled) {
            this.setupPeriodicCheck();
        }

        // 添加初始通知设置到页面
        this.addNotificationToggle();

        // 当页面重新获得焦点时检查更新
        window.addEventListener('focus', () => {
            if (this.notificationPermission === 'granted' && this.notificationEnabled) {
                this.checkForUpdates();
            }
        });
    }

    /**
     * 请求通知权限
     */
    async requestPermission() {
        try {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;
            
            if (permission === 'granted') {
                console.log('通知权限已授予');
                this.notificationEnabled = true;
                localStorage.setItem('notesNotificationsEnabled', 'true');
                this.setupPeriodicCheck();
                this.updateToggleState();
                return true;
            } else {
                console.log('通知权限被拒绝');
                return false;
            }
        } catch (error) {
            console.error('请求通知权限时出错:', error);
            return false;
        }
    }

    /**
     * 设置定期检查
     */
    setupPeriodicCheck() {
        // 立即进行一次检查
        this.checkForUpdates();

        // 设置定期检查
        setInterval(() => this.checkForUpdates(), this.checkInterval);
    }

    /**
     * 检查是否有更新
     */
    async checkForUpdates() {
        // 检查是否启用通知
        if (!this.notificationEnabled || this.notificationPermission !== 'granted') {
            return;
        }

        // 获取当前数据
        const currentData = window.NOTES_DATA;
        if (!currentData) {
            console.warn('无法检查更新: 未找到笔记数据');
            return;
        }

        // 首次运行时保存数据作为基线
        if (!this.lastKnownData) {
            this.lastKnownData = this.cloneNotesData(currentData);
            this.saveLastCheckTime();
            return;
        }

        // 检查是否有新的笔记
        const newNotes = this.findNewNotes(currentData);
        
        // 如果有新笔记，发送通知
        if (newNotes.length > 0) {
            this.sendNotifications(newNotes);
        }
        
        // 更新基线数据和检查时间
        this.lastKnownData = this.cloneNotesData(currentData);
        this.saveLastCheckTime();
    }

    /**
     * 复制笔记数据对象
     */
    cloneNotesData(data) {
        return {
            hjf: [...(data.hjf || [])].map(note => ({ path: note.path, title: note.title })),
            hjm: [...(data.hjm || [])].map(note => ({ path: note.path, title: note.title })),
            lastUpdated: data.lastUpdated
        };
    }

    /**
     * 查找新的笔记
     */
    findNewNotes(currentData) {
        const newNotes = [];
        
        // 检查hjf文件夹
        if (currentData.hjf && this.lastKnownData.hjf) {
            const lastPaths = new Set(this.lastKnownData.hjf.map(note => note.path));
            currentData.hjf.forEach(note => {
                if (!lastPaths.has(note.path)) {
                    newNotes.push({ ...note, group: 'hjf' });
                }
            });
        }
        
        // 检查hjm文件夹
        if (currentData.hjm && this.lastKnownData.hjm) {
            const lastPaths = new Set(this.lastKnownData.hjm.map(note => note.path));
            currentData.hjm.forEach(note => {
                if (!lastPaths.has(note.path)) {
                    newNotes.push({ ...note, group: 'hjm' });
                }
            });
        }
        
        return newNotes;
    }

    /**
     * 发送通知
     */
    sendNotifications(newNotes) {
        if (!this.notificationEnabled || this.notificationPermission !== 'granted') {
            return;
        }
        
        // 按组分组通知
        const groupedNotes = {
            hjf: newNotes.filter(note => note.group === 'hjf'),
            hjm: newNotes.filter(note => note.group === 'hjm')
        };
        
        // 为每个组发送一个通知
        Object.entries(groupedNotes).forEach(([group, notes]) => {
            if (notes.length > 0) {
                this.showBrowserNotification(group.toUpperCase(), notes);
            }
        });
    }

    /**
     * 显示浏览器通知
     */
    showBrowserNotification(group, notes) {
        if (notes.length === 0) return;
        
        const title = `${group} 有新内容`;
        let body = '';
        
        if (notes.length === 1) {
            body = `新增: ${notes[0].title}`;
        } else {
            body = `新增了 ${notes.length} 份内容，包括: ${notes[0].title}${notes.length > 1 ? ' 等' : ''}`;
        }
        
        const notification = new Notification(title, {
            body: body,
            icon: '/assets/icons/icon-128x128.png',
            badge: '/assets/icons/icon-72x72.png',
            tag: `notes-update-${group}`, // 使用tag防止重复通知
            data: {
                notes: notes,
                timestamp: Date.now()
            }
        });
        
        // 点击通知时的处理
        notification.onclick = () => {
            // 如果只有一个新笔记，直接导航到该笔记
            if (notes.length === 1) {
                window.open(notes[0].path, '_blank');
            } else {
                // 否则导航到相应的标签页
                window.open(`/#${notes[0].group}`, '_blank');
            }
            notification.close();
        };
    }

    /**
     * 保存最后检查时间
     */
    saveLastCheckTime() {
        const now = Date.now();
        this.lastCheckedTime = now;
        localStorage.setItem('lastNotesCheckTime', now);
    }

    /**
     * 切换通知状态
     */
    toggleNotifications(enabled) {
        if (enabled === undefined) {
            this.notificationEnabled = !this.notificationEnabled;
        } else {
            this.notificationEnabled = enabled;
        }
        
        localStorage.setItem('notesNotificationsEnabled', this.notificationEnabled ? 'true' : 'false');
        
        // 如果启用了通知但没有权限，请求权限
        if (this.notificationEnabled && this.notificationPermission !== 'granted') {
            this.requestPermission();
        }
        
        // 如果启用了通知并且有权限，设置检查
        if (this.notificationEnabled && this.notificationPermission === 'granted') {
            this.setupPeriodicCheck();
        }
        
        this.updateToggleState();
        return this.notificationEnabled;
    }

    /**
     * 获取通知状态
     */
    getNotificationStatus() {
        return this.notificationEnabled && this.notificationPermission === 'granted';
    }

    /**
     * 添加通知开关到页面
     */
    addNotificationToggle() {
        // 在页面加载完成后执行
        document.addEventListener('DOMContentLoaded', () => {
            // 检查是否已存在footer中的设置区域
            const footerSettings = document.querySelector('.footer-settings');
            
            if (footerSettings) {
                // 创建通知开关
                const notificationToggle = document.createElement('label');
                notificationToggle.className = 'toggle-setting';
                notificationToggle.innerHTML = `
                    <input type="checkbox" id="notes-notifications-toggle" ${this.notificationEnabled ? 'checked' : ''}>
                    <span class="toggle-label">内容更新通知</span>
                `;
                
                // 添加到设置区域
                footerSettings.appendChild(notificationToggle);
                
                // 监听开关变化
                const toggleInput = document.getElementById('notes-notifications-toggle');
                if (toggleInput) {
                    toggleInput.addEventListener('change', () => {
                        // 如果开启通知但没有权限，请求权限
                        if (toggleInput.checked && this.notificationPermission !== 'granted') {
                            this.requestPermission().then(granted => {
                                if (!granted) {
                                    // 如果权限请求被拒绝，恢复开关状态
                                    toggleInput.checked = false;
                                }
                            });
                        } else {
                            // 直接切换状态
                            this.toggleNotifications(toggleInput.checked);
                        }
                    });
                }
            }
        });
    }

    /**
     * 更新开关状态
     */
    updateToggleState() {
        const toggleInput = document.getElementById('notes-notifications-toggle');
        if (toggleInput) {
            toggleInput.checked = this.notificationEnabled && this.notificationPermission === 'granted';
        }
    }
}

// 创建实例
const notesNotifications = new NotesNotificationManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    notesNotifications.init();
});

// 导出实例
window.notesNotifications = notesNotifications; 