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
        
        // 修复滚动条问题
        this.fixScrollbarIssue();
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
        document.getElementById('expenses-hjf-pending').textContent = `¥${hjfAmounts.pendingAmount}`;

        // 计算HJM统计 - 完全基于借款记录数据自动计算
        const hjmStats = this.calculateStats(hjmLoans);
        const hjmAmounts = this.calculateBorrowerAmounts('hjm');
        document.getElementById('expenses-hjm-count').textContent = hjmStats.count;
        document.getElementById('expenses-hjm-total').textContent = `¥${hjmStats.total}`;
        document.getElementById('expenses-hjm-returned').textContent = `¥${hjmAmounts.returnedAmount}`;
        document.getElementById('expenses-hjm-pending').textContent = `¥${hjmAmounts.pendingAmount}`;

        // 更新智能删除线提示信息
        this.updateStrikethroughHint();
    }

    // 更新删除线提示信息
    updateStrikethroughHint() {
        const hjfAmounts = this.calculateBorrowerAmounts('hjf');
        const hjmAmounts = this.calculateBorrowerAmounts('hjm');
        
        const hintContainer = document.getElementById('strikethrough-hint');
        if (hintContainer) {
            // 计算按时间顺序的删除线覆盖情况
            const hjfCoverage = this.calculateStrikethroughCoverage('hjf');
            const hjmCoverage = this.calculateStrikethroughCoverage('hjm');
            
            hintContainer.innerHTML = `
                <div class="strikethrough-hint-content">
                    <h4>智能删除线说明</h4>
                    <p><strong>HJF:</strong> 归还 ¥${hjfAmounts.returnedAmount} / 总借款 ¥${hjfAmounts.totalLoanAmount}</p>
                    <p><strong>HJM:</strong> 归还 ¥${hjmAmounts.returnedAmount} / 总借款 ¥${hjmAmounts.totalLoanAmount}</p>
                    <p class="hint-note">💰 按借款时间顺序，从最早的借款开始累加，还款金额覆盖的借款显示删除线</p>
                    <p class="hint-note">📊 HJF覆盖: ${hjfCoverage.coveredCount}/${hjfCoverage.totalCount} 条借款</p>
                    <p class="hint-note">📊 HJM覆盖: ${hjmCoverage.coveredCount}/${hjmCoverage.totalCount} 条借款</p>
                </div>
            `;
        }
    }

    // 计算删除线覆盖情况
    calculateStrikethroughCoverage(borrower) {
        // 获取该借款人的所有还款记录
        const borrowerRepayments = this.repayments.filter(repayment => repayment.borrower === borrower);
        
        // 获取该借款人的所有借款记录
        const borrowerLoans = this.loans.filter(l => l.borrower === borrower);
        
        // 计算还款分配后的借款状态
        const loanStatus = this.calculateLoanRepaymentStatus(borrowerLoans, borrowerRepayments);
        
        // 统计已还清的借款数量
        const coveredCount = loanStatus.filter(status => status.isRepaid).length;
        const coveredAmount = loanStatus
            .filter(status => status.isRepaid)
            .reduce((sum, status) => sum + status.amount, 0);
        
        return {
            totalCount: borrowerLoans.length,
            coveredCount: coveredCount,
            totalAmount: borrowerLoans.reduce((sum, loan) => sum + loan.amount, 0),
            coveredAmount: coveredAmount
        };
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
        
        // 计算所有借款记录的总金额（不管状态）
        const totalLoanAmount = borrowerLoans.reduce((sum, loan) => sum + loan.amount, 0);
        
        // 计算未归还借款金额（总借款金额 - 已还款金额）
        const pendingAmount = totalLoanAmount - returnedAmount;
        
        return { returnedAmount, pendingAmount, totalLoanAmount };
    }

    // 检查是否应该显示删除线（基于借款时间顺序和累加还款金额）
    shouldShowStrikethrough(loan) {
        const borrower = loan.borrower;
        
        // 获取该借款人的所有还款记录
        const borrowerRepayments = this.repayments.filter(repayment => repayment.borrower === borrower);
        
        // 计算该借款人的总还款金额
        const totalReturnedAmount = borrowerRepayments.reduce((sum, repayment) => sum + repayment.amount, 0);
        
        // 获取该借款人的所有借款记录
        const borrowerLoans = this.loans.filter(l => l.borrower === borrower);
        
        // 计算还款分配后的借款状态
        const loanStatus = this.calculateLoanRepaymentStatus(borrowerLoans, borrowerRepayments);
        
        // 查找当前借款的状态
        const currentLoanStatus = loanStatus.find(status => status.loanId === loan.id);
        
        // 如果找到了状态且已还清，则显示删除线
        return currentLoanStatus ? currentLoanStatus.isRepaid : false;
    }

    // 计算借款还款状态（支持指定ID优先匹配）
    calculateLoanRepaymentStatus(borrowerLoans, borrowerRepayments) {
        const loanStatus = borrowerLoans.map(loan => ({
            loanId: loan.id,
            amount: loan.amount,
            date: loan.date,
            isRepaid: false,
            repaidAmount: 0
        }));
        
        let remainingRepaymentAmount = borrowerRepayments.reduce((sum, repayment) => sum + repayment.amount, 0);
        
        // 处理每个还款记录
        for (const repayment of borrowerRepayments) {
            if (remainingRepaymentAmount <= 0) break;
            
            let currentRepaymentAmount = repayment.amount;
            
            // 如果指定了目标借款ID，按指定顺序还款
            if (repayment.targetLoanIds && repayment.targetLoanIds.length > 0) {
                // 按指定ID顺序还款
                for (const targetId of repayment.targetLoanIds) {
                    if (currentRepaymentAmount <= 0) break;
                    
                    const loanStatusItem = loanStatus.find(status => status.loanId === targetId);
                    if (loanStatusItem && !loanStatusItem.isRepaid) {
                        const needToRepay = loanStatusItem.amount - loanStatusItem.repaidAmount;
                        const canRepay = Math.min(currentRepaymentAmount, needToRepay);
                        
                        loanStatusItem.repaidAmount += canRepay;
                        currentRepaymentAmount -= canRepay;
                        remainingRepaymentAmount -= canRepay;
                        
                        // 如果已还清，标记为已还款
                        if (loanStatusItem.repaidAmount >= loanStatusItem.amount) {
                            loanStatusItem.isRepaid = true;
                        }
                    }
                }
            }
            
            // 如果还有剩余还款金额，按时间顺序还款其他借款
            if (currentRepaymentAmount > 0) {
                // 按时间排序（最早的在前）
                const sortedLoanStatus = loanStatus
                    .filter(status => !status.isRepaid)
                    .sort((a, b) => {
                        const dateA = a.date === '-' ? '1900-01-01' : a.date;
                        const dateB = b.date === '-' ? '1900-01-01' : b.date;
                        return new Date(dateA) - new Date(dateB);
                    });
                
                for (const loanStatusItem of sortedLoanStatus) {
                    if (currentRepaymentAmount <= 0) break;
                    
                    const needToRepay = loanStatusItem.amount - loanStatusItem.repaidAmount;
                    const canRepay = Math.min(currentRepaymentAmount, needToRepay);
                    
                    loanStatusItem.repaidAmount += canRepay;
                    currentRepaymentAmount -= canRepay;
                    remainingRepaymentAmount -= canRepay;
                    
                    // 如果已还清，标记为已还款
                    if (loanStatusItem.repaidAmount >= loanStatusItem.amount) {
                        loanStatusItem.isRepaid = true;
                    }
                }
            }
        }
        
        return loanStatus;
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

        // 排序逻辑：置顶记录优先，然后按ID排序（ID大的在前）
        filteredLoans.sort((a, b) => {
            // 首先按置顶状态排序
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;

            // 如果置顶状态相同，则按ID排序（ID大的在前）
            return b.id - a.id;
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
        
        // 修复滚动条问题
        this.fixScrollbarIssue();
    }

    // 渲染还款记录表格
    renderRepaymentsTable() {
        // 按ID排序还款记录（ID大的在前）
        const sortedRepayments = [...this.repayments].sort((a, b) => b.id - a.id);
        
        const totalPages = Math.ceil(sortedRepayments.length / this.pageSize);

        // 计算当前页的数据
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const currentRepayments = sortedRepayments.slice(startIndex, endIndex);

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
        this.updateExpensesPagination(totalPages, sortedRepayments.length);

        // 初始化图片查看器（如果还没有初始化）
        this.initImageViewer();
        
        // 修复滚动条问题
        this.fixScrollbarIssue();
    }

    // 创建借款记录行
    createLoanRow(loan) {
        const statusClass = loan.status === 'returned' ? 'returned' :
                           loan.status === 'overdue' ? 'overdue' : 'pending';
        const statusText = loan.status === 'returned' ? '已归还' :
                          loan.status === 'overdue' ? '逾期' : '待归还';
        const statusIcon = loan.status === 'returned' ? '✅' :
                          loan.status === 'overdue' ? '⚠️' : '⏳';

        // 计算逾期天数
        const overdueDays = this.calculateOverdueDays(loan);
        const overdueText = overdueDays > 0 ? ` (逾期${overdueDays}天)` : '';
        const overdueDataAttr = overdueDays > 0 ? `data-overdue="逾期${overdueDays}天"` : '';

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
                <td>${this.formatDate(loan.actualReturnDate || loan.returnDate)}</td>
                <td>
                    <span class="status-badge ${statusClass}" ${overdueDataAttr}>
                        ${statusIcon} ${statusText}${overdueText}
                    </span>
                </td>
                <td class="notes-cell">${loan.notes || '-'}</td>
                <td class="voucher-cell">${voucherCell}</td>
            </tr>
        `;
    }

    // 创建还款记录行
    createRepaymentRow(repayment) {
        // 凭证显示
        const voucherCell = this.createVoucherCell(repayment);

        // 计算还款状态和进度
        const repaymentStatus = this.calculateRepaymentStatus(repayment);
        
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
                    <div class="repayment-status-container">
                        <span class="status-badge returned">
                            ${repaymentStatus.icon} ${repaymentStatus.text}
                        </span>
                        ${repaymentStatus.progress ? `
                            <div class="repayment-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${repaymentStatus.progress}%"></div>
                                </div>
                                <span class="progress-text">${repaymentStatus.progress}%</span>
                            </div>
                        ` : ''}
                        ${repaymentStatus.type ? `
                            <span class="repayment-type-badge ${repaymentStatus.type}">
                                ${repaymentStatus.typeIcon} ${repaymentStatus.typeText}
                            </span>
                        ` : ''}
                        ${repaymentStatus.targetInfo ? `
                            <span class="repayment-target-badge">
                                🎯 指定还款 ${repaymentStatus.targetInfo.count} 笔借款 (¥${repaymentStatus.targetInfo.amount})
                            </span>
                        ` : ''}
                    </div>
                </td>
                <td class="notes-cell">${repayment.notes || '-'}</td>
                <td class="voucher-cell">${voucherCell}</td>
            </tr>
        `;
    }

    // 计算还款状态和进度
    calculateRepaymentStatus(repayment) {
        // 基础状态
        const baseStatus = {
            icon: '✅',
            text: '已还款',
            progress: null,
            type: null,
            typeIcon: '',
            typeText: '',
            targetInfo: null // 新增：指定借款信息
        };

        // 计算该借款人的总借款金额
        const totalLoanAmount = this.loans
            .filter(loan => loan.borrower === repayment.borrower)
            .reduce((sum, loan) => sum + loan.amount, 0);

        // 计算该借款人的累计还款金额（包括当前还款）
        const totalRepaymentAmount = this.repayments
            .filter(r => r.borrower === repayment.borrower)
            .reduce((sum, r) => sum + r.amount, 0);

        // 计算还款进度
        if (totalLoanAmount > 0) {
            const progress = Math.min(100, Math.round((totalRepaymentAmount / totalLoanAmount) * 100));
            baseStatus.progress = progress;
        }

        // 处理指定借款ID信息
        if (repayment.targetLoanIds && repayment.targetLoanIds.length > 0) {
            const targetLoans = repayment.targetLoanIds
                .map(id => this.loans.find(loan => loan.id === id))
                .filter(loan => loan && loan.borrower === repayment.borrower);
            
            if (targetLoans.length > 0) {
                const targetAmount = targetLoans.reduce((sum, loan) => sum + loan.amount, 0);
                baseStatus.targetInfo = {
                    count: targetLoans.length,
                    amount: targetAmount,
                    loans: targetLoans
                };
            }
        }

        // 判断还款类型
        if (repayment.amount >= totalLoanAmount) {
            // 一次性还清
            baseStatus.type = 'full';
            baseStatus.typeIcon = '🎯';
            baseStatus.typeText = '全额还款';
        } else if (totalRepaymentAmount >= totalLoanAmount) {
            // 累计还清
            baseStatus.type = 'complete';
            baseStatus.typeIcon = '🎉';
            baseStatus.typeText = '累计还清';
        } else if (repayment.amount >= totalLoanAmount * 0.5) {
            // 大额还款
            baseStatus.type = 'large';
            baseStatus.typeIcon = '💰';
            baseStatus.typeText = '大额还款';
        } else if (repayment.amount >= totalLoanAmount * 0.2) {
            // 中额还款
            baseStatus.type = 'medium';
            baseStatus.typeIcon = '💳';
            baseStatus.typeText = '中额还款';
        } else {
            // 小额还款
            baseStatus.type = 'small';
            baseStatus.typeIcon = '💸';
            baseStatus.typeText = '小额还款';
        }

        // 特殊状态：首笔还款
        const isFirstRepayment = this.repayments
            .filter(r => r.borrower === repayment.borrower)
            .sort((a, b) => new Date(a.date) - new Date(b.date))[0]?.id === repayment.id;
        
        if (isFirstRepayment) {
            baseStatus.type = 'first';
            baseStatus.typeIcon = '🎊';
            baseStatus.typeText = '首笔还款';
        }

        return baseStatus;
    }

    // 计算逾期天数
    calculateOverdueDays(loan) {
        // 如果已经归还，不需要计算逾期天数
        if (loan.status === 'returned' || loan.actualReturnDate) {
            return 0;
        }

        // 如果没有还款日期或还款日期无效，不计算逾期天数
        if (!loan.returnDate || loan.returnDate === '-' || loan.returnDate === 'null' || loan.returnDate === 'undefined') {
            return 0;
        }

        const today = new Date();
        const returnDate = new Date(loan.returnDate);
        
        // 检查日期是否有效
        if (isNaN(returnDate.getTime())) {
            return 0;
        }
        
        // 计算天数差
        const timeDiff = today.getTime() - returnDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // 如果超过还款日期，返回逾期天数
        return daysDiff > 0 ? daysDiff : 0;
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
        // 如果日期字符串为空、null、undefined或无效，返回"-"
        if (!dateString || dateString === '-' || dateString === 'null' || dateString === 'undefined') {
            return '-';
        }
        
        const date = new Date(dateString);
        
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
            return '-';
        }
        
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    // 修复滚动条问题
    fixScrollbarIssue() {
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) {
            // 确保滚动条能够到达最左边
            tableContainer.scrollLeft = 0;
            
            // 监听滚动事件，确保滚动边界正确
            tableContainer.addEventListener('scroll', () => {
                // 如果滚动到最左边，确保scrollLeft为0
                if (tableContainer.scrollLeft < 0) {
                    tableContainer.scrollLeft = 0;
                }
                
                // 如果滚动到最右边，确保不会超出范围
                const maxScrollLeft = tableContainer.scrollWidth - tableContainer.clientWidth;
                if (tableContainer.scrollLeft > maxScrollLeft) {
                    tableContainer.scrollLeft = maxScrollLeft;
                }
            });
            
            // 添加触摸滚动支持
            let isScrolling = false;
            let startX = 0;
            let scrollLeft = 0;
            
            tableContainer.addEventListener('touchstart', (e) => {
                isScrolling = true;
                startX = e.touches[0].pageX - tableContainer.offsetLeft;
                scrollLeft = tableContainer.scrollLeft;
            });
            
            tableContainer.addEventListener('touchmove', (e) => {
                if (!isScrolling) return;
                e.preventDefault();
                const x = e.touches[0].pageX - tableContainer.offsetLeft;
                const walk = (x - startX) * 2;
                tableContainer.scrollLeft = scrollLeft - walk;
            });
            
            tableContainer.addEventListener('touchend', () => {
                isScrolling = false;
            });
        }
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
