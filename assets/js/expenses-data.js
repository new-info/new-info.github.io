// 生活费用数据管理 - 大学生活费用借贷记录
// 数据从外部文件 assets/data/expenses-records.js 加载

// 获取借款记录数据
function getExpensesData() {
    if (typeof window.EXPENSES_RECORDS !== 'undefined') {
        return {
            lastUpdated: window.EXPENSES_RECORDS.lastUpdated,
            loans: window.EXPENSES_RECORDS.records,
            repayments: window.EXPENSES_RECORDS.repayments || [], // 还款记录
            rules: window.EXPENSES_RECORDS.rules
            // 注意：移除了summary字段，统计数据将完全由借款记录自动计算
        };
    } else {
        console.warn('未加载借款记录数据文件，使用默认数据');
        return {
            lastUpdated: new Date().toISOString(),
            loans: [],
            repayments: [],
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
        this.repayments = window.EXPENSES_DATA.repayments; // 还款记录
        this.rules = window.EXPENSES_DATA.rules;
        // 移除了this.summary，统计数据现在完全通过calculateStats方法计算
        this.currentTab = 'all';
        this.currentPage = 1;
        this.pageSize = 8; // 改为8条数据每页，沿用首页的分页设置
        this.strikethroughEnabled = localStorage.getItem('expensesStrikethroughEnabled') !== 'false';
        this.init();
    }

    // 初始化
    init() {
        this.bindEvents();
        this.renderExpensesTable();
        this.updateExpensesStats();

        // 初始化删除线切换按钮状态
        this.updateStrikethroughToggleState();

        // 确保图片查看器事件监听器被绑定
        this.initImageViewer();
    }

    // 绑定事件
    bindEvents() {
        // 标签切换事件
        document.querySelectorAll('.table-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 删除线效果切换按钮（如果存在）
        const strikethroughToggle = document.getElementById('strikethrough-toggle');
        if (strikethroughToggle) {
            strikethroughToggle.addEventListener('click', () => {
                this.toggleStrikethrough();
            });
        }
    }

    // 切换标签
    switchTab(tabName) {
        // 更新标签状态
        document.querySelectorAll('.table-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 更新当前标签
        this.currentTab = tabName;
        this.currentPage = 1; // 重置到第一页

        // 重新渲染表格
        this.renderExpensesTable();
    }

    // 更新生活费用统计
    updateExpensesStats() {
        const hjfLoans = this.loans.filter(loan => loan.borrower === 'hjf');
        const hjmLoans = this.loans.filter(loan => loan.borrower === 'hjm');

        // 计算HJF统计 - 完全基于借款记录数据自动计算
        const hjfStats = this.calculateStats(hjfLoans);
        const hjfAmounts = this.calculateBorrowerAmounts('hjf');
        document.getElementById('expenses-hjf-count').textContent = hjfStats.count;
        document.getElementById('expenses-hjf-total').textContent = `¥${hjfStats.total}`;
        document.getElementById('expenses-hjf-returned').textContent = `¥${hjfAmounts.returnedAmount}`;
        document.getElementById('expenses-hjf-pending').textContent = `¥${hjfStats.pending}`;

        // 计算HJM统计 - 完全基于借款记录数据自动计算
        const hjmStats = this.calculateStats(hjmLoans);
        const hjmAmounts = this.calculateBorrowerAmounts('hjm');
        document.getElementById('expenses-hjm-count').textContent = hjmStats.count;
        document.getElementById('expenses-hjm-total').textContent = `¥${hjmStats.total}`;
        document.getElementById('expenses-hjm-returned').textContent = `¥${hjmAmounts.returnedAmount}`;
        document.getElementById('expenses-hjm-pending').textContent = `¥${hjmStats.pending}`;

        // 更新智能删除线提示信息
        this.updateStrikethroughHint();
    }

    // 更新删除线提示信息
    updateStrikethroughHint() {
        const hjfAmounts = this.calculateBorrowerAmounts('hjf');
        const hjmAmounts = this.calculateBorrowerAmounts('hjm');
        
        const hintContainer = document.getElementById('strikethrough-hint');
        if (hintContainer) {
            const hjfStatus = hjfAmounts.returnedAmount >= hjfAmounts.pendingAmount ? '✅' : '⏳';
            const hjmStatus = hjmAmounts.returnedAmount >= hjmAmounts.pendingAmount ? '✅' : '⏳';
            
            hintContainer.innerHTML = `
                <div class="strikethrough-hint-content">
                    <h4>智能删除线说明</h4>
                    <p><strong>HJF:</strong> 归还 ¥${hjfAmounts.returnedAmount} / 未还 ¥${hjfAmounts.pendingAmount} ${hjfStatus}</p>
                    <p><strong>HJM:</strong> 归还 ¥${hjmAmounts.returnedAmount} / 未还 ¥${hjmAmounts.pendingAmount} ${hjmStatus}</p>
                    <p class="hint-note">💰 标记表示归还金额已覆盖未还借款</p>
                </div>
            `;
        }
    }

    // 计算统计数据 - 这是核心的自动计算方法
    calculateStats(loans) {
        const count = loans.length;
        const total = loans.reduce((sum, loan) => sum + loan.amount, 0);
        const pending = loans.filter(loan => loan.status === 'pending' || loan.status === 'overdue')
                             .reduce((sum, loan) => sum + loan.amount, 0);

        return { count, total, pending };
    }

    // 计算借款人的归还和未归还金额
    calculateBorrowerAmounts(borrower) {
        const borrowerLoans = this.loans.filter(loan => loan.borrower === borrower);
        
        // 计算归还金额（从独立的还款记录中获取）
        const returnedAmount = this.repayments
            .filter(repayment => repayment.borrower === borrower)
            .reduce((sum, repayment) => sum + repayment.amount, 0);
        
        // 计算未归还借款金额（不包括归还记录）
        const pendingAmount = borrowerLoans
            .filter(loan => loan.status === 'pending' || loan.status === 'overdue')
            .reduce((sum, loan) => sum + loan.amount, 0);
        
        return { returnedAmount, pendingAmount };
    }

    // 检查是否应该显示删除线（基于归还金额与未归还借款的比较）
    shouldShowStrikethrough(loan) {
        // 对于所有借款记录，检查归还金额是否大于未归还借款总和
        const { returnedAmount, pendingAmount } = this.calculateBorrowerAmounts(loan.borrower);
        
        // 如果归还金额大于等于未归还借款总和，则显示删除线
        return returnedAmount >= pendingAmount;
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
            case 'repayments':
                // 对于还款记录标签页，返回空数组，因为还款记录会单独处理
                return [];
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
        if (this.currentTab === 'repayments') {
            this.renderRepaymentsTable();
            return;
        }

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

        // 应用删除线效果
        this.applyStrikethroughEffects();
    }

    // 渲染还款记录表格
    renderRepaymentsTable() {
        const totalPages = Math.ceil(this.repayments.length / this.pageSize);

        // 计算当前页的数据
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const currentRepayments = this.repayments.slice(startIndex, endIndex);

        const tbody = document.getElementById('expenses-table-body');

        if (currentRepayments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div style="text-align: center; padding: 20px;">
                            <h3>暂无还款记录</h3>
                            <p>当前没有还款记录</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = currentRepayments.map(repayment => this.createRepaymentRow(repayment)).join('');
        }

        // 更新分页
        this.updateExpensesPagination(totalPages, this.repayments.length);

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

        // 添加记录ID属性，用于删除线效果
        const recordIdAttr = `data-record-id="${loan.id}"`;

        return `
            <tr class="loan-row ${statusClass}${pinnedClass}" ${recordIdAttr}>
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

    // 创建还款记录行
    createRepaymentRow(repayment) {
        // 凭证显示
        const voucherCell = this.createVoucherCell(repayment);

        return `
            <tr class="repayment-row">
                <td>${this.formatDate(repayment.date)}</td>
                <td>
                    <span class="borrower-badge ${repayment.borrower}">${repayment.borrower.toUpperCase()}</span>
                </td>
                <td class="amount">¥${repayment.amount}</td>
                <td>${repayment.purpose}</td>
                <td>-</td>
                <td>
                    <span class="status-badge returned">
                        ✅ 已还款
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

    // 应用删除线效果
    applyStrikethroughEffects() {
        if (!this.strikethroughEnabled) return;

        const tableRows = document.querySelectorAll('#expenses-table-body tr.loan-row');

        tableRows.forEach(row => {
            const recordId = row.getAttribute('data-record-id');
            if (recordId) {
                const loan = this.loans.find(l => l.id === parseInt(recordId));
                if (loan) {
                    // 移除所有删除线类
                    row.classList.remove('returned-strikethrough', 'smart-strikethrough');
                    
                    if (this.shouldShowStrikethrough(loan)) {
                        // 所有显示删除线的记录都使用智能删除线
                        row.classList.add('smart-strikethrough');
                    }
                }
            }
        });
    }

    // 切换删除线效果
    toggleStrikethrough() {
        this.strikethroughEnabled = !this.strikethroughEnabled;
        localStorage.setItem('expensesStrikethroughEnabled', this.strikethroughEnabled);

        if (this.strikethroughEnabled) {
            this.applyStrikethroughEffects();
        } else {
            // 移除所有删除线效果
            document.querySelectorAll('.returned-strikethrough, .smart-strikethrough').forEach(row => {
                row.classList.remove('returned-strikethrough', 'smart-strikethrough');
            });
        }

        // 更新切换按钮状态
        this.updateStrikethroughToggleState();
    }

    // 更新删除线切换按钮状态
    updateStrikethroughToggleState() {
        const toggleBtn = document.getElementById('strikethrough-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = this.strikethroughEnabled ? '隐藏删除线' : '显示删除线';
            toggleBtn.classList.toggle('active', this.strikethroughEnabled);
        }
    }

    // 显示带认证的凭证
    async showVoucherWithAuth(voucherFilename, author, purpose, title) {
        try {
            // 检查是否已认证
            if (window.VoucherDecryptor && window.VoucherDecryptor.isAuthenticated(author)) {
                // 已认证，直接显示
                await this.decryptAndShowVoucher(voucherFilename, author, title, purpose);
            } else {
                // 未认证，显示认证对话框
                this.showAuthDialog(voucherFilename, author, purpose, title);
            }
        } catch (error) {
            console.error('显示凭证失败:', error);
            this.showImageViewer('vouchers/placeholder.svg', '显示失败', '凭证显示失败：' + error.message);
        }
    }

    // 显示认证对话框 - 使用现有的密码输入弹窗
    showAuthDialog(voucherFilename, author, purpose, title) {
        // 检查是否已认证
        if (window.AuthHelper && window.AuthHelper.isAuthenticated(author)) {
            // 已认证，直接显示凭证
            this.decryptAndShowVoucher(voucherFilename, author, title, purpose);
            return;
        }

        // 使用AuthHelper的密码输入弹窗
        window.AuthHelper.showPasswordPrompt(author, (success) => {
            if (success) {
                // 认证成功，显示凭证
                this.decryptAndShowVoucher(voucherFilename, author, title, purpose);
            }
            // 认证失败或取消，不需要额外处理
        });
    }



    // 解密并显示凭证
    async decryptAndShowVoucher(voucherFilename, author, title, description) {
        try {
            // 显示加载提示
            this.showImageViewer('vouchers/placeholder.svg', '正在解密...', '请稍候，正在解密凭证图片');
            console.log(voucherFilename,'voucherFilename')
            // 构建加密文件URL
            const encryptedUrl = window.VoucherDecryptor.buildEncryptedUrl(voucherFilename, author);

            // 解密图片
            const decryptedImageUrl = await window.VoucherDecryptor.decryptVoucherImage(encryptedUrl, author);

            // 显示解密后的图片
            this.showImageViewer(decryptedImageUrl, title || '凭证详情', description || '借款凭证');

        } catch (error) {
            this.closeImageViewer();
            // alert('凭证解密失败：' + (error && error.message ? error.message : error));
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

    // 初始化图片查看器
    initImageViewer() {
        const modal = document.getElementById('image-viewer-modal');

        // 如果模态框不存在，创建它
        if (!modal) {
            const newModal = document.createElement('div');
            newModal.id = 'image-viewer-modal';
            newModal.className = 'image-viewer-modal';
            newModal.innerHTML = `
                <div class="image-viewer-backdrop"></div>
                <div class="image-viewer-container">
                    <button class="image-viewer-close">×</button>
                    <img id="image-viewer-img" class="image-viewer-image" src="" alt="凭证图片" />
                    <div class="image-viewer-info">
                        <h3 id="image-viewer-title">凭证详情</h3>
                        <p id="image-viewer-description">借款凭证</p>
                    </div>
                </div>
            `;

            document.body.appendChild(newModal);
        }

        // 获取模态框（可能是新创建的或已存在的）
        const existingModal = document.getElementById('image-viewer-modal');

        // 检查是否已经绑定过事件监听器
        if (existingModal.dataset.eventsBound === 'true') {
            return;
        }

        // 使用事件委托处理所有点击事件
        existingModal.addEventListener('click', (e) => {
            // 只允许点击 backdrop 或 close 按钮关闭
            if (
                e.target.classList.contains('image-viewer-backdrop') ||
                e.target.classList.contains('image-viewer-close')
            ) {
                e.preventDefault();
                e.stopPropagation();
                this.closeImageViewer();
                return;
            }
            // 其他区域点击不做任何操作
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && existingModal.classList.contains('active')) {
                this.closeImageViewer();
            }
        });

        // 标记事件已绑定
        existingModal.dataset.eventsBound = 'true';
    }

    // 关闭图片查看器
    closeImageViewer() {
        console.log('closeImageViewer called'); // 调试日志
        const modal = document.getElementById('image-viewer-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // 恢复背景滚动
            console.log('Modal closed successfully'); // 调试日志
        } else {
            console.log('Modal not found'); // 调试日志
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

    // 生成页码按钮 - 智能分页逻辑
    generatePageButtons(currentPage, totalPages) {
        let buttons = '';

        // 如果总页数小于等于7，显示所有页码
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                buttons += `
                    <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                            onclick="expensesManager.goToPage(${i})">
                        ${i}
                    </button>
                `;
            }
            return buttons;
        }

        // 智能分页逻辑
        const showPages = [];

        // 始终显示第一页
        showPages.push(1);

        // 计算中间页的范围
        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);

        // 调整范围以确保显示3个中间页
        if (currentPage <= 3) {
            end = Math.min(totalPages - 1, 4);
        } else if (currentPage >= totalPages - 2) {
            start = Math.max(2, totalPages - 3);
        }

        // 添加中间页
        for (let i = start; i <= end; i++) {
            if (!showPages.includes(i)) {
                showPages.push(i);
            }
        }

        // 始终显示最后一页
        if (!showPages.includes(totalPages)) {
            showPages.push(totalPages);
        }

        // 生成按钮
        for (let i = 0; i < showPages.length; i++) {
            const page = showPages[i];

            // 添加省略号
            if (i > 0 && page - showPages[i - 1] > 1) {
                buttons += '<span class="pagination-ellipsis">...</span>';
            }

            buttons += `
                <button class="pagination-btn ${page === currentPage ? 'active' : ''}" 
                        onclick="expensesManager.goToPage(${page})">
                    ${page}
                </button>
            `;
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

        // 刷新数据
    refreshData() {
        // 重新获取数据
        window.EXPENSES_DATA = getExpensesData();
        this.loans = window.EXPENSES_DATA.loans;
        this.repayments = window.EXPENSES_DATA.repayments;
        this.rules = window.EXPENSES_DATA.rules;
        
        // 重新渲染
        this.renderExpensesTable();
        this.updateExpensesStats();
        
        // 触发数据更新事件
        document.dispatchEvent(new CustomEvent('expensesDataUpdated'));
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
