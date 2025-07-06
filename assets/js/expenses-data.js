// 生活费用数据管理 - 大学生活费用借贷记录
// 数据从外部文件 assets/data/expenses-records.js 加载

// 获取借款记录数据
function getExpensesData() {
    if (typeof window.EXPENSES_RECORDS !== 'undefined') {
        return {
            lastUpdated: window.EXPENSES_RECORDS.lastUpdated,
            loans: window.EXPENSES_RECORDS.records,
            rules: window.EXPENSES_RECORDS.rules
            // 注意：移除了summary字段，统计数据将完全由借款记录自动计算
        };
    } else {
        console.warn('未加载借款记录数据文件，使用默认数据');
        return {
            lastUpdated: new Date().toISOString(),
            loans: [],
            rules: {
                monthlyLimit: 1500,
                overdueGracePeriod: 7,
                categories: []
            }
        };
    }
}

// 全局数据对象
window.EXPENSES_DATA = getExpensesData();

// 生活费用管理类
class ExpensesManager {
    constructor() {
        // 重新获取最新数据（确保数据文件已加载）
        window.EXPENSES_DATA = getExpensesData();
        this.loans = window.EXPENSES_DATA.loans;
        this.rules = window.EXPENSES_DATA.rules;
        // 移除了this.summary，统计数据现在完全通过calculateStats方法计算
        this.currentTab = 'all';
        this.currentPage = 1;
        this.pageSize = 8; // 改为8条数据每页，沿用首页的分页设置
        this.init();
    }

    init() {
        this.setupTabSwitching();
        this.updateExpensesStats();
        this.renderExpensesTable();
    }

    // 设置tab切换功能
    setupTabSwitching() {
        const tabs = document.querySelectorAll('.table-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 更新tab状态
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // 更新当前tab
                this.currentTab = tab.dataset.tab;
                this.currentPage = 1;
                
                // 重新渲染表格
                this.renderExpensesTable();
            });
        });
    }

    // 更新生活费用统计
    updateExpensesStats() {
        const hjfLoans = this.loans.filter(loan => loan.borrower === 'hjf');
        const hjmLoans = this.loans.filter(loan => loan.borrower === 'hjm');

        // 计算HJF统计 - 完全基于借款记录数据自动计算
        const hjfStats = this.calculateStats(hjfLoans);
        document.getElementById('expenses-hjf-count').textContent = hjfStats.count;
        document.getElementById('expenses-hjf-total').textContent = `¥${hjfStats.total}`;
        document.getElementById('expenses-hjf-returned').textContent = `¥${hjfStats.returned}`;
        document.getElementById('expenses-hjf-pending').textContent = `¥${hjfStats.pending}`;

        // 计算HJM统计 - 完全基于借款记录数据自动计算
        const hjmStats = this.calculateStats(hjmLoans);
        document.getElementById('expenses-hjm-count').textContent = hjmStats.count;
        document.getElementById('expenses-hjm-total').textContent = `¥${hjmStats.total}`;
        document.getElementById('expenses-hjm-returned').textContent = `¥${hjmStats.returned}`;
        document.getElementById('expenses-hjm-pending').textContent = `¥${hjmStats.pending}`;
    }

    // 计算统计数据 - 这是核心的自动计算方法
    calculateStats(loans) {
        const count = loans.length;
        const total = loans.reduce((sum, loan) => sum + loan.amount, 0);
        const returned = loans.filter(loan => loan.status === 'returned')
                              .reduce((sum, loan) => sum + loan.amount, 0);
        const pending = loans.filter(loan => loan.status === 'pending' || loan.status === 'overdue')
                             .reduce((sum, loan) => sum + loan.amount, 0);

        return { count, total, returned, pending };
    }

    // 获取过滤后的借款记录
    getFilteredLoans() {
        let filteredLoans = [...this.loans];

        switch (this.currentTab) {
            case 'hjf':
                filteredLoans = filteredLoans.filter(loan => loan.borrower === 'hjf');
                break;
            case 'hjm':
                filteredLoans = filteredLoans.filter(loan => loan.borrower === 'hjm');
                break;
            case 'pending':
                filteredLoans = filteredLoans.filter(loan => loan.status === 'pending' || loan.status === 'overdue');
                break;
            // 'all' 不需要过滤
        }

        // 排序逻辑：置顶记录优先，然后按日期排序（最新的在前）
        filteredLoans.sort((a, b) => {
            // 首先按置顶状态排序
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            
            // 如果置顶状态相同，则按日期排序（最新的在前）
            return new Date(b.date) - new Date(a.date);
        });

        return filteredLoans;
    }

    // 渲染借款记录表格
    renderExpensesTable() {
        const filteredLoans = this.getFilteredLoans();
        const totalPages = Math.ceil(filteredLoans.length / this.pageSize);
        
        // 计算当前页的数据
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const currentLoans = filteredLoans.slice(startIndex, endIndex);

        const tbody = document.getElementById('expenses-table-body');
        
        if (currentLoans.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div style="text-align: center; padding: 20px;">
                            <h3>暂无借款记录</h3>
                            <p>当前筛选条件下没有找到相关记录</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = currentLoans.map(loan => this.createLoanRow(loan)).join('');
        }

        // 更新分页
        this.updateExpensesPagination(totalPages, filteredLoans.length);

        // 初始化图片查看器（如果还没有初始化）
        this.initImageViewer();
    }

    // 创建借款记录行
    createLoanRow(loan) {
        const statusClass = loan.status === 'returned' ? 'returned' : 
                           loan.status === 'overdue' ? 'overdue' : 'pending';
        const statusText = loan.status === 'returned' ? '已归还' : 
                          loan.status === 'overdue' ? '逾期' : '待归还';
        const statusIcon = loan.status === 'returned' ? '✅' : 
                          loan.status === 'overdue' ? '⚠️' : '⏳';

        // 置顶标识
        const pinnedIndicator = loan.pinned ? '<span class="pinned-indicator">置顶</span>' : '';
        
        // 凭证显示
        const voucherCell = this.createVoucherCell(loan);

        // 添加置顶行样式类
        const pinnedClass = loan.pinned ? ' pinned' : '';

        return `
            <tr class="loan-row ${statusClass}${pinnedClass}">
                <td>${pinnedIndicator}${this.formatDate(loan.date)}</td>
                <td>
                    <span class="borrower-badge ${loan.borrower}">${loan.borrower.toUpperCase()}</span>
                </td>
                <td class="amount">¥${loan.amount}</td>
                <td>${loan.purpose}</td>
                <td>${loan.actualReturnDate ? this.formatDate(loan.actualReturnDate) : this.formatDate(loan.returnDate)}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusIcon} ${statusText}
                    </span>
                </td>
                <td class="voucher-cell">${voucherCell}</td>
            </tr>
        `;
    }

    // 创建凭证单元格
    createVoucherCell(loan) {
        if (loan.voucher) {
            // 检查用户是否已认证
            const isAuthenticated = window.VoucherDecryptor && window.VoucherDecryptor.isAuthenticated(loan.borrower);
            
            if (isAuthenticated) {
                // 已认证，显示可点击的占位图片
                return `
                    <img src="${window.VoucherDecryptor ? window.VoucherDecryptor.getPlaceholderImageUrl() : 'vouchers/placeholder.svg'}" 
                         alt="点击查看凭证" 
                         class="voucher-preview" 
                         title="点击查看凭证详情"
                         onclick="expensesManager.showVoucherWithAuth('${loan.voucher}', '${loan.borrower}', '${loan.purpose}', '${loan.borrower.toUpperCase()} - ¥${loan.amount}')">
                `;
            } else {
                // 未认证，显示锁定状态的占位图片
                return `
                    <img src="${window.VoucherDecryptor ? window.VoucherDecryptor.getPlaceholderImageUrl() : 'vouchers/placeholder.svg'}" 
                         alt="需要验证查看" 
                         class="voucher-preview voucher-locked" 
                         title="需要密码验证才能查看凭证"
                         onclick="expensesManager.showVoucherWithAuth('${loan.voucher}', '${loan.borrower}', '${loan.purpose}', '${loan.borrower.toUpperCase()} - ¥${loan.amount}')">
                `;
            }
        } else {
            return '<div class="voucher-placeholder">无</div>';
        }
    }

    // 显示凭证（带认证检查）
    showVoucherWithAuth(voucherFilename, author, title, description) {
        // 检查是否支持WebCrypto API
        if (!window.VoucherDecryptor || !window.VoucherDecryptor.isWebCryptoSupported()) {
            alert('您的浏览器不支持加密功能，无法查看凭证');
            return;
        }

        // 检查用户是否已认证
        if (!window.VoucherDecryptor.isAuthenticated(author)) {
            // 未认证，显示密码输入框
            if (window.AuthHelper) {
                window.AuthHelper.showPasswordPrompt(author, (success) => {
                    if (success) {
                        // 认证成功，重新尝试显示凭证
                        this.showVoucherWithAuth(voucherFilename, author, title, description);
                    }
                });
            } else {
                alert('认证系统未加载，无法验证身份');
            }
            return;
        }

        // 已认证，解密并显示凭证
        this.decryptAndShowVoucher(voucherFilename, author, title, description);
    }

    // 解密并显示凭证
    async decryptAndShowVoucher(voucherFilename, author, title, description) {
        try {
            // 显示加载提示
            this.showImageViewer('vouchers/placeholder.svg', '正在解密...', '请稍候，正在解密凭证图片');

            // 构建加密文件URL
            const encryptedUrl = window.VoucherDecryptor.buildEncryptedUrl(voucherFilename, author);
            
            // 解密图片
            const decryptedImageUrl = await window.VoucherDecryptor.decryptVoucherImage(encryptedUrl, author);
            
            // 显示解密后的图片
            this.showImageViewer(decryptedImageUrl, title || '凭证详情', description || '借款凭证');
            
        } catch (error) {
            console.error('凭证解密失败:', error);
            
            // 根据错误类型显示不同的提示
            if (error.message.includes('404') || error.message.includes('下载失败')) {
                this.showImageViewer('vouchers/placeholder.svg', '凭证不存在', '该借款记录的凭证文件不存在或已被删除');
            } else if (error.message.includes('解密失败') || error.message.includes('认证')) {
                this.showImageViewer('vouchers/placeholder.svg', '解密失败', '凭证解密失败，可能是密码错误或文件损坏');
            } else {
                this.showImageViewer('vouchers/placeholder.svg', '加载失败', '凭证加载失败：' + error.message);
            }
        }
    }

    // 显示图片查看器
    showImageViewer(imageUrl, title, description) {
        const modal = document.getElementById('image-viewer-modal');
        const img = document.getElementById('image-viewer-img');
        const titleEl = document.getElementById('image-viewer-title');
        const descEl = document.getElementById('image-viewer-description');

        if (modal && img && titleEl && descEl) {
            img.src = imageUrl;
            titleEl.textContent = title || '凭证详情';
            descEl.textContent = description || '借款凭证';
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        }
    }

    // 隐藏图片查看器
    hideImageViewer() {
        const modal = document.getElementById('image-viewer-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // 恢复滚动
            
            // 如果显示的是解密后的blob URL，释放它
            const img = document.getElementById('image-viewer-img');
            if (img && img.src && img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
        }
    }

    // 初始化图片查看器
    initImageViewer() {
        // 避免重复初始化
        if (this.imageViewerInitialized) return;
        
        const modal = document.getElementById('image-viewer-modal');
        const closeBtn = document.querySelector('.image-viewer-close');
        const backdrop = document.querySelector('.image-viewer-backdrop');

        if (modal && closeBtn && backdrop) {
            // 关闭按钮事件
            closeBtn.addEventListener('click', () => {
                this.hideImageViewer();
            });

            // 背景点击关闭
            backdrop.addEventListener('click', () => {
                this.hideImageViewer();
            });

            // ESC键关闭
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.hideImageViewer();
                }
            });

            this.imageViewerInitialized = true;
        }
    }

    // 更新分页控件
    updateExpensesPagination(totalPages, totalItems) {
        const paginationContainer = document.getElementById('expenses-pagination');
        
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';

        // 计算显示的条目范围
        const startItem = (this.currentPage - 1) * this.pageSize + 1;
        const endItem = Math.min(this.currentPage * this.pageSize, totalItems);

        // 生成分页信息
        const paginationInfo = `
            <div class="pagination-info">
                显示第 ${startItem}-${endItem} 条，共 ${totalItems} 条记录
            </div>
        `;

        // 生成分页按钮 - 使用与首页相同的智能分页逻辑
        const paginationControls = this.generateExpensesPaginationControls(totalPages);

        paginationContainer.innerHTML = paginationInfo + paginationControls;
    }

    // 生成分页控件 - 采用与首页相同的智能分页逻辑
    generateExpensesPaginationControls(totalPages) {
        let controls = '<div class="pagination-controls">';

        // 上一页按钮
        controls += `
            <button class="pagination-btn prev ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="expensesManager.goToPage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                上一页
            </button>
        `;

        // 页码按钮 - 使用智能分页逻辑
        const pageButtons = this.generatePageButtons(this.currentPage, totalPages);
        controls += pageButtons;

        // 下一页按钮
        controls += `
            <button class="pagination-btn next ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="expensesManager.goToPage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                下一页
            </button>
        `;

        controls += '</div>';
        return controls;
    }

    // 生成页码按钮 - 沿用首页的智能分页逻辑
    generatePageButtons(currentPage, totalPages) {
        let buttons = '';

        // 如果总页数少于等于7页，显示所有页码
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                buttons += `
                    <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                            onclick="expensesManager.goToPage(${i})">
                        ${i}
                    </button>
                `;
            }
        } else {
            // 复杂分页逻辑：显示首页、当前页附近页码、尾页
            
            // 第1页
            buttons += `
                <button class="pagination-btn ${currentPage === 1 ? 'active' : ''}" 
                        onclick="expensesManager.goToPage(1)">
                    1
                </button>
            `;

            // 是否显示左侧省略号
            if (currentPage > 4) {
                buttons += '<span class="pagination-ellipsis">...</span>';
            }

            // 当前页及其邻近页码
            let start, end;
            
            if (currentPage <= 3) {
                // 当前页靠近开头
                start = 2;
                end = Math.min(4, totalPages - 1);
            } else if (currentPage >= totalPages - 2) {
                // 当前页靠近结尾
                start = Math.max(2, totalPages - 3);
                end = totalPages - 1;
            } else {
                // 当前页在中间
                start = currentPage - 1;
                end = currentPage + 1;
            }

            for (let i = start; i <= end; i++) {
                if (i === 1 || i === totalPages) continue; // 避免重复显示首页和尾页
                buttons += `
                    <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                            onclick="expensesManager.goToPage(${i})">
                        ${i}
                    </button>
                `;
            }

            // 是否显示右侧省略号（当前页和尾页之间至少隔2页才显示省略号）
            if (end < totalPages - 2) {
                buttons += '<span class="pagination-ellipsis">...</span>';
            }

            // 最后一页（确保totalPages > 1）
            if (totalPages > 1) {
                buttons += `
                    <button class="pagination-btn ${currentPage === totalPages ? 'active' : ''}" 
                            onclick="expensesManager.goToPage(${totalPages})">
                        ${totalPages}
                    </button>
                `;
            }
        }

        return buttons;
    }

    // 跳转到指定页面
    goToPage(page) {
        const totalPages = Math.ceil(this.getFilteredLoans().length / this.pageSize);
        
        if (page < 1 || page > totalPages) return;

        this.currentPage = page;
        this.renderExpensesTable();

        // 滚动到表格顶部
        const tableSection = document.querySelector('.expenses-table-section');
        if (tableSection) {
            tableSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
}

// 全局实例
let expensesManager = null;

// 当DOM加载完成时初始化
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保在页面完全加载后
    setTimeout(() => {
        if (document.getElementById('expenses-table-body')) {
            expensesManager = new ExpensesManager();
        }
    }, 100);
}); 