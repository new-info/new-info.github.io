// 注意: 在HTML中需要在main.js之前引入notes-data.js
// <script src="assets/js/notes-data.js"></script>
// <script src="assets/js/main.js"></script>

// 直播分析平台 JavaScript - 主程序
class NotesApp {
    constructor() {
        this.notes = {
            hjf: [],
            hjm: []
        };

        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupMobileMenu();
        this.loadNotes();
        this.setupBackButtonScript();
    }

    // 设置返回按钮脚本
    setupBackButtonScript() {
        // 检查当前URL是否在分析或评分页面
        const currentPath = window.location.pathname;
        if (currentPath.includes('.html') && (currentPath.includes('/hjf/') || currentPath.includes('/hjm/'))) {
            // 动态加载返回按钮脚本
            const script = document.createElement('script');
            script.src = '/assets/js/back-button.js';
            document.head.appendChild(script);
            
            // 判断是否是iframe中的页面
            if (window.self === window.top) {
                // 不在iframe中，加载返回按钮
                const scriptInline = document.createElement('script');
                scriptInline.textContent = `
                    // 直接加载返回按钮
                    const buttonContainer = document.createElement('div');
                    buttonContainer.style.position = 'fixed';
                    buttonContainer.style.top = '20px';
                    buttonContainer.style.left = '20px';
                    buttonContainer.style.zIndex = '100000';
                    
                    const backButton = document.createElement('a');
                    backButton.href = '/index.html';
                    backButton.title = '返回主页';
                    backButton.innerText = '←';
                    
                    backButton.style.display = 'flex';
                    backButton.style.alignItems = 'center';
                    backButton.style.justifyContent = 'center';
                    backButton.style.width = '40px';
                    backButton.style.height = '40px';
                    backButton.style.borderRadius = '50%';
                    backButton.style.backgroundColor = 'rgba(26, 41, 128, 0.8)';
                    backButton.style.color = 'white';
                    backButton.style.textDecoration = 'none';
                    backButton.style.fontSize = '20px';
                    backButton.style.fontWeight = 'bold';
                    backButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                    backButton.style.transition = 'all 0.2s ease';
                    backButton.style.cursor = 'pointer';
                    
                    backButton.addEventListener('mouseover', function() {
                        this.style.backgroundColor = 'rgba(38, 208, 206, 0.9)';
                        this.style.transform = 'translateY(-2px)';
                    });
                    
                    backButton.addEventListener('mouseout', function() {
                        this.style.backgroundColor = 'rgba(26, 41, 128, 0.8)';
                        this.style.transform = 'translateY(0)';
                    });
                    
                    buttonContainer.appendChild(backButton);
                    setTimeout(() => document.body.appendChild(buttonContainer), 300);
                `;
                document.head.appendChild(scriptInline);
            }
        }
    }

    // 设置导航
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.section');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);

                // 更新活跃导航
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // 显示对应部分
                sections.forEach(section => section.classList.remove('active'));
                document.getElementById(targetId).classList.add('active');



                // 关闭移动菜单
                this.closeMobileMenu();
            });
        });


    }

    // 设置移动端菜单
    setupMobileMenu() {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.nav');

        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            nav.classList.toggle('active');
        });

        // 点击外部关闭菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.header')) {
                this.closeMobileMenu();
            }
        });
    }

    closeMobileMenu() {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.nav');

        menuToggle.classList.remove('active');
        nav.classList.remove('active');
    }

    // 加载分析数据
    async loadNotes() {
        try {
            // 显示加载状态
            this.showLoading();

            // 扫描文件夹获取分析列表
            await this.scanNotes();

            // 渲染分析列表
            this.renderNotes();

            // 更新统计数据
            this.updateStats();

        } catch (error) {
            console.error('加载内容失败:', error);
            this.showError('加载内容时出现错误');
        }
    }

    // 扫描笔记文件
    async scanNotes() {
        // 使用动态生成的笔记数据
        if (typeof window.NOTES_DATA !== 'undefined') {
            const data = window.NOTES_DATA;

            // 将评分报告关联到对应的笔记
            data.hjf.forEach(note => {
                if (note.author === 'hjf') {
                    this.notes.hjf.push(note);
                }
            });

            data.hjm.forEach(note => {
                if (note.author === 'hjm') {
                    this.notes.hjm.push(note);
                }
            });

            console.log('使用动态分析数据，最后更新:', data.lastUpdated);
        } else {
            console.warn('未找到分析数据，使用默认数据');
            // 这里保留原有的默认数据作为fallback
        }

        // 模拟加载延迟
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 渲染笔记列表
    renderNotes() {
        this.renderNoteSection('hjf-notes', this.notes.hjf);
        this.renderNoteSection('hjm-notes', this.notes.hjm);
    }

    // 渲染特定部分的笔记
    renderNoteSection(containerId, notes) {
        const container = document.getElementById(containerId);

        if (notes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>暂无内容</h3>
                    <p>这里还没有任何分析内容</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notes.map(note => this.createNoteCard(note)).join('');
    }

    // 创建笔记卡片
    createNoteCard(note) {
        const preview = this.generatePreview(note);
        const hasReview = note.reviewReport;
        const score = hasReview ? this.extractScore(note.reviewReport) : 0;
        const reward = this.calculateReward(score);

        // 判断分数是否被修改
        const scoreModified = hasReview && note.reviewReport.patchApplied && window.SCORE_PATCHES &&
                             window.SCORE_PATCHES[this.getBaseFileName(note.reviewReport.path)] &&
                             window.SCORE_PATCHES[this.getBaseFileName(note.reviewReport.path)].score !== undefined;

        // 构建按钮区域
        let actionsHtml = `
            <a href="${note.path}" class="btn btn-primary" target="_blank">
                📝 查看分析
            </a>`;

        if (hasReview) {
            // 计算奖金
            const rewardAmount = score < 60 ? 0 : (note.reviewReport.customReward !== undefined ? note.reviewReport.customReward : score);

            actionsHtml += `
            <a href="${note.reviewReport.path}" class="btn btn-review" target="_blank">
                ${scoreModified ? '🔧' : '📊'} 评分: ${score}分 
<!--                <span class="reward-badge">💰 ${rewardAmount}元</span>-->
            </a>`;
        }

  /*      actionsHtml += `
            <button class="btn btn-secondary" onclick="notesApp.shareNote('${note.path}', '${note.title}')">
                🔗 分享
            </button>`;*/

        return `
            <div class="note-card ${hasReview ? 'has-review' : ''}">
                <div class="note-header">
                    <div class="note-title">${note.title}</div>
                    <div class="note-meta">
                        <div class="note-flex">
                            <span class="note-type">直播分析</span> • 
                            <span class="note-author">${note.author.toUpperCase()}</span> • 
                            <span class="note-date">${this.formatDate(note.date)}</span>     
                        </div>
                        <div class="note-flex">
                            ${hasReview ?
                            `<span class="review-badge ${score >= 60 ? 'passed' : 'failed'}">
                                                ${score >= 60 ? '✅' : '❌'} ${score}分
                                            </span>
                                            <span class="review-badge passed">
                                                💰 ${score < 60 ? 0 : (note.reviewReport.customReward !== undefined ? note.reviewReport.customReward : score)}元
                                            </span>`
                            : ''}
                        </div>
                    </div>
                </div>
                <div class="note-preview">${preview}</div>
                <div class="note-actions">
                    ${actionsHtml}
                </div>
            </div>
        `;
    }

    // 生成预览内容
    generatePreview(note) {
        // 使用笔记自带的预览内容，如果没有则使用默认内容
        if (note.preview) {
            return note.preview;
        }

        if (note.isReview) {
            return '这是一份详细的评分报告，包含了多个维度的分析和评估...';
        } else {
            return '包含了对直播内容的详细记录和分析...';
        }
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 从评分报告中提取分数，并应用补丁校正
    extractScore(reviewReport) {
        let score = 0;
        let isPatchApplied = false;
        let patchNote = null;

        // 尝试从文件名中提取基本名称（不含扩展名和-review后缀）
        const filePath = reviewReport.path;
        const fileName = filePath.split('/').pop();
        const baseName = fileName.replace(/-review\.html$/, '').replace(/\.html$/, '');

        // 先获取原始分数，用于后续计算奖金差值
        if (reviewReport.score !== undefined) {
            score = reviewReport.score;
        } else if (reviewReport.preview) {
            const scoreMatch = reviewReport.preview.match(/(\d+)\s*分/);
            if (scoreMatch) {
                score = parseInt(scoreMatch[1]);
            }
        }

        // 检查是否有对应的补丁
        if (window.SCORE_PATCHES && window.SCORE_PATCHES[baseName]) {
            const patch = window.SCORE_PATCHES[baseName];
            isPatchApplied = true;
            patchNote = patch.note;

            // 记录补丁应用信息
            reviewReport.patchApplied = true;
            reviewReport.patchNote = patchNote;

            // 如果补丁中指定了自定义奖金，也记录下来
            if (patch.reward !== undefined) {
                reviewReport.customReward = patch.reward;

                // 计算默认奖金（用于计算差值）
                const defaultReward = score < 60 ? 0 : score;
                reviewReport.rewardDiff = patch.reward - defaultReward;
                reviewReport.isRewardHigher = reviewReport.rewardDiff > 0;

                // 调试信息
                console.log('补丁奖金:', {
                    baseName,
                    originalScore: score,
                    defaultReward,
                    customReward: patch.reward,
                    diff: reviewReport.rewardDiff,
                    isHigher: reviewReport.isRewardHigher
                });
            }

            // 如果补丁中指定了分数，使用补丁分数
            if (patch.score !== undefined) {
                score = patch.score;
                return score;
            }

            // 否则继续使用原始分数计算方式，但标记为已应用补丁
            return score;
        }

        // 如果没有补丁，使用原有逻辑

        // 如果有预存的分数，直接返回
        if (reviewReport.score !== undefined) {
            return reviewReport.score;
        }

        // 否则尝试从预览中提取
        if (reviewReport.preview) {
            const scoreMatch = reviewReport.preview.match(/(\d+)\s*分/);
            if (scoreMatch) {
                return parseInt(scoreMatch[1]);
            }
        }

        // 如果没有找到分数，返回0
        return 0;
    }

    // 计算奖金金额
    calculateReward(score, reviewReport) {
        // 计算默认奖金
        const defaultReward = score < 60 ? 0 : score;

        // 如果有自定义奖金，直接使用它
        if (reviewReport && reviewReport.customReward !== undefined) {
            // 使用已经在extractScore中计算好的差值
            // 不再重复计算差值，避免覆盖之前的计算结果

            // 调试信息
            console.log('奖金计算:', {
                fileName: this.getBaseFileName(reviewReport.path),
                defaultReward,
                customReward: reviewReport.customReward,
                rewardDiff: reviewReport.rewardDiff,
                isHigher: reviewReport.isRewardHigher
            });

            return reviewReport.customReward;
        }

        // 否则使用默认规则：60分及格，满分100分对应100元奖金
        return defaultReward;
    }

    // 从路径中提取基本文件名
    getBaseFileName(filePath) {
        const fileName = filePath.split('/').pop();
        return fileName.replace(/-review\.html$/, '').replace(/\.html$/, '');
    }

    // 更新统计数据
    updateStats() {
        const allItems = this.getAllAnalysisItems();

        // 计算总体统计
        const totalCount = allItems.length;
        const passedItems = allItems.filter(item => item.passed);
        const passedCount = passedItems.length;
        const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
        const totalScore = allItems.reduce((sum, item) => sum + item.score, 0);
        const avgScore = totalCount > 0 ? Math.round(totalScore / totalCount) : 0;
        const totalReward = allItems.reduce((sum, item) => sum + item.reward, 0);

        // 更新首页总体统计
        if (document.getElementById('home-total-analysis')) {
            document.getElementById('home-total-analysis').textContent = totalCount;
            document.getElementById('home-pass-rate').textContent = `${passRate}%`;
            document.getElementById('home-avg-score').textContent = avgScore;
            document.getElementById('home-total-reward').textContent = `¥${totalReward}`;
        }

        // 计算各分析员统计
        const hjfItems = allItems.filter(item => item.analyst === 'HJF');
        const hjmItems = allItems.filter(item => item.analyst === 'HJM');

        // HJF统计
        const hjfCount = hjfItems.length;
        const hjfPassedCount = hjfItems.filter(item => item.passed).length;
        const hjfPassRate = hjfCount > 0 ? Math.round((hjfPassedCount / hjfCount) * 100) : 0;
        const hjfTotalScore = hjfItems.reduce((sum, item) => sum + item.score, 0);
        const hjfAvgScore = hjfCount > 0 ? Math.round(hjfTotalScore / hjfCount) : 0;
        const hjfTotalReward = hjfItems.reduce((sum, item) => sum + item.reward, 0);

        // HJM统计
        const hjmCount = hjmItems.length;
        const hjmPassedCount = hjmItems.filter(item => item.passed).length;
        const hjmPassRate = hjmCount > 0 ? Math.round((hjmPassedCount / hjmCount) * 100) : 0;
        const hjmTotalScore = hjmItems.reduce((sum, item) => sum + item.score, 0);
        const hjmAvgScore = hjmCount > 0 ? Math.round(hjmTotalScore / hjmCount) : 0;
        const hjmTotalReward = hjmItems.reduce((sum, item) => sum + item.reward, 0);

        // 更新首页分析员统计
        if (document.getElementById('home-hjf-count')) {
            document.getElementById('home-hjf-count').textContent = hjfCount;
            document.getElementById('home-hjf-pass').textContent = `${hjfPassRate}%`;
            document.getElementById('home-hjf-avg').textContent = hjfAvgScore;
            document.getElementById('home-hjf-reward').textContent = `¥${hjfTotalReward}`;

            document.getElementById('home-hjm-count').textContent = hjmCount;
            document.getElementById('home-hjm-pass').textContent = `${hjmPassRate}%`;
            document.getElementById('home-hjm-avg').textContent = hjmAvgScore;
            document.getElementById('home-hjm-reward').textContent = `¥${hjmTotalReward}`;
        }

        // 向后兼容：保留原有的统计更新
        if (document.getElementById('hjf-count')) {
            document.getElementById('hjf-count').textContent = hjfCount;
            document.getElementById('hjm-count').textContent = hjmCount;
            document.getElementById('reward-total').textContent = totalReward;
        }

        // 更新最近分析列表
        this.updateRecentAnalysis(allItems);

        // 添加动画效果
        this.animateNumbers();
    }

    // 更新最近分析列表
    updateRecentAnalysis(items) {
        const recentList = document.getElementById('recent-analysis-list');
        if (!recentList) return;

        // 获取最近10条记录
        const recentItems = items.slice(0, 10);

        if (recentItems.length === 0) {
            recentList.innerHTML = '<div class="empty-state">暂无分析记录</div>';
            return;
        }

        recentList.innerHTML = recentItems.map(item => {
            // 判断分数是否被修改 - 只有当patchApplied为true且存在score修改时才显示扳手
            const scoreModified = item.patchApplied && window.SCORE_PATCHES &&
                                  window.SCORE_PATCHES[this.getBaseFileName(item.reviewPath)] &&
                                  window.SCORE_PATCHES[this.getBaseFileName(item.reviewPath)].score !== undefined;

            return `
            <div class="recent-item ${item.patchApplied ? 'patched-item' : ''} ${item.customReward ? (item.isRewardHigher ? 'reward-higher-item' : 'reward-lower-item') : ''}">
                <div class="recent-date">${this.formatShortDate(item.date)}</div>
                <div class="recent-content">
                    <span class="recent-analyst ${item.analyst.toLowerCase()}">${item.analyst}</span>
                    <a href="${item.path}" class="recent-title" target="_blank">${item.title}</a>
                    <div class="recent-actions">
                        <a href="${item.reviewPath}" class="recent-score ${item.passed ? 'passed' : 'failed'} ${item.patchApplied ? 'patched' : ''}" target="_blank" title="${item.patchApplied ? '已校正分数' : '查看评分报告'}">
                            ${item.score}分
                            <span class="score-icon">${scoreModified ? '🔧' : '📊'}</span>
                        </a>
                                  ${item.customReward !== undefined ?
                `<span class="recent-custom-reward ${item.isRewardHigher ? 'reward-higher' : 'reward-lower'}" 
                                  title="${item.isRewardHigher ? '增加奖金' : '减少奖金'}">
                                ${item.isRewardHigher ? '↑' : '↓'}${Math.abs(item.rewardDiff)}
                            </span>` :
                ''}
                        <span class="reward-icon">💰 ${item.reward}元</span>
                    </div>
                </div>
                ${item.patchApplied && item.patchNote ? `<div class="recent-patch-note">${item.patchNote}</div>` : ''}
            </div>
        `;
        }).join('');
    }

    // 格式化短日期
    formatShortDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric'
        });
    }

    // 计算总奖金
    calculateTotalRewards() {
        let total = 0;

        // 计算HJF的奖金
        this.notes.hjf.forEach(note => {
            if (note.reviewReport) {
                const score = this.extractScore(note.reviewReport);
                total += this.calculateReward(score);
            }
        });

        // 计算HJM的奖金
        this.notes.hjm.forEach(note => {
            if (note.reviewReport) {
                const score = this.extractScore(note.reviewReport);
                total += this.calculateReward(score);
            }
        });

        return total;
    }

    // 获取所有分析条目
    getAllAnalysisItems() {
        const allItems = [];

        // 添加HJF的分析
        this.notes.hjf.forEach(note => {
            if (note.reviewReport) {
                const score = this.extractScore(note.reviewReport);
                const reward = this.calculateReward(score, note.reviewReport);
                allItems.push({
                    date: note.date,
                    analyst: 'HJF',
                    title: note.title,
                    score: score,
                    reward: reward,
                    passed: score >= 60,
                    path: note.path,
                    reviewPath: note.reviewReport.path,
                    patchApplied: note.reviewReport.patchApplied || false,
                    patchNote: note.reviewReport.patchNote || null,
                    customReward: note.reviewReport.customReward,
                    rewardDiff: note.reviewReport.rewardDiff,
                    isRewardHigher: note.reviewReport.isRewardHigher
                });
            }
        });

        // 添加HJM的分析
        this.notes.hjm.forEach(note => {
            if (note.reviewReport) {
                const score = this.extractScore(note.reviewReport);
                const reward = this.calculateReward(score, note.reviewReport);
                allItems.push({
                    date: note.date,
                    analyst: 'HJM',
                    title: note.title,
                    score: score,
                    reward: reward,
                    passed: score >= 60,
                    path: note.path,
                    reviewPath: note.reviewReport.path,
                    patchApplied: note.reviewReport.patchApplied || false,
                    patchNote: note.reviewReport.patchNote || null,
                    customReward: note.reviewReport.customReward,
                    rewardDiff: note.reviewReport.rewardDiff,
                    isRewardHigher: note.reviewReport.isRewardHigher
                });
            }
        });

        // 按日期排序
        return allItems.sort((a, b) => new Date(b.date) - new Date(a.date));
    }



    // 更新奖金统计选项卡
    updateRewardsTab(analyst = 'all') {
        const allItems = this.getAllAnalysisItems();
        let filteredItems = allItems;

        // 按分析员筛选
        if (analyst !== 'all') {
            filteredItems = filteredItems.filter(item => item.analyst === analyst);
        }

        // 更新总体统计数据
        const totalCount = filteredItems.length;
        const passedItems = filteredItems.filter(item => item.passed);
        const passedCount = passedItems.length;
        const totalScore = filteredItems.reduce((sum, item) => sum + item.score, 0);
        const averageScore = totalCount > 0 ? Math.round(totalScore / totalCount) : 0;
        const totalRewards = filteredItems.reduce((sum, item) => sum + item.reward, 0);

        document.getElementById('total-analysis-count').textContent = totalCount;
        document.getElementById('passed-analysis-count').textContent = passedCount;
        document.getElementById('average-score').textContent = averageScore;
        document.getElementById('total-rewards').textContent = totalRewards;

        // 更新分析员统计
        this.updateAnalystStats(allItems);

        // 渲染表格
        const tableBody = document.getElementById('rewards-table-body');
        if (tableBody) {
            if (filteredItems.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-table">暂无奖金数据</td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = filteredItems.map(item => `
                <tr class="${item.patchApplied ? 'patched-row' : ''} ${item.customReward ? (item.isRewardHigher ? 'reward-higher-row' : 'reward-lower-row') : ''}">
                    <td>${this.formatDate(item.date)}</td>
                    <td>${item.analyst}</td>
                    <td>
                        <a href="${item.path}" target="_blank" title="${item.title}">
                            ${item.title.length > 30 ? item.title.substring(0, 30) + '...' : item.title}
                        </a>
                    </td>
                    <td class="score-cell">
                        <a href="${item.reviewPath}" target="_blank" class="score-link ${item.patchApplied ? 'patched-score' : ''}">
                            ${item.score}分
                            ${item.patchApplied && item.score !== undefined && window.SCORE_PATCHES && 
                              window.SCORE_PATCHES[this.getBaseFileName(item.reviewPath)] && 
                              window.SCORE_PATCHES[this.getBaseFileName(item.reviewPath)].score !== undefined ? 
                                `<span class="patch-icon" title="分数已校正">🔧</span>` : ''}
                        </a>
                        ${item.patchApplied && item.patchNote ? `<div class="patch-note">${item.patchNote}</div>` : ''}
                    </td>
                    <td class="reward-amount">
                        <span class="reward-value">💰 ${item.reward}元</span>
                        ${item.customReward !== undefined ? 
                            `<span class="custom-reward-icon ${item.isRewardHigher ? 'reward-higher' : 'reward-lower'}" 
                                  title="${item.isRewardHigher ? '增加奖金' : '减少奖金'}">
                                ${item.isRewardHigher ? '↑' : '↓'}${Math.abs(item.rewardDiff)}
                            </span>` : 
                            ''}
                    </td>
                    <td>
                        <span class="reward-status ${item.passed ? 'status-passed' : 'status-failed'}">
                            ${item.passed ? '及格' : '不及格'}
                        </span>
                    </td>
                </tr>
            `).join('');
        }
    }

    // 更新分析员统计卡片
    updateAnalystStats(allItems) {
        // 获取各个分析员的数据
        const hjfItems = this.filterAnalystItems(allItems, 'HJF');
        const hjmItems = this.filterAnalystItems(allItems, 'HJM');

        // 更新HJF统计
        this.updateSingleAnalystStats('hjf', hjfItems);

        // 更新HJM统计
        this.updateSingleAnalystStats('hjm', hjmItems);
    }

    // 更新单个分析员统计
    updateSingleAnalystStats(analystId, items) {
        const count = items.length;
        const passedItems = items.filter(item => item.passed);
        const passedCount = passedItems.length;
        const passRate = count > 0 ? Math.round((passedCount / count) * 100) : 0;
        const totalScore = items.reduce((sum, item) => sum + item.score, 0);
        const avgScore = count > 0 ? Math.round(totalScore / count) : 0;
        const totalReward = items.reduce((sum, item) => sum + item.reward, 0);

        // 更新DOM
        document.getElementById(`${analystId}-analysis-count`).textContent = count;
        document.getElementById(`${analystId}-pass-rate`).textContent = `${passRate}%`;
        document.getElementById(`${analystId}-avg-score`).textContent = avgScore;
        document.getElementById(`${analystId}-total-reward`).textContent = `${totalReward}元`;

        // 更新分数分布
        this.updateScoreDistribution(analystId, items);
    }

    // 更新分数分布条形图
    updateScoreDistribution(analystId, items) {
        // 计算分数分布
        const scoreRanges = {
            excellent: { min: 90, max: 100, count: 0, label: '优秀 (90-100)' },
            good: { min: 80, max: 89, count: 0, label: '良好 (80-89)' },
            average: { min: 70, max: 79, count: 0, label: '中等 (70-79)' },
            passing: { min: 60, max: 69, count: 0, label: '及格 (60-69)' },
            poor: { min: 0, max: 59, count: 0, label: '不及格 (<60)' }
        };

        items.forEach(item => {
            const score = item.score;
            if (score >= 90) scoreRanges.excellent.count++;
            else if (score >= 80) scoreRanges.good.count++;
            else if (score >= 70) scoreRanges.average.count++;
            else if (score >= 60) scoreRanges.passing.count++;
            else scoreRanges.poor.count++;
        });

        // 生成HTML
        const total = items.length;
        const distributionDiv = document.getElementById(`${analystId}-score-distribution`);

        if (distributionDiv) {
            if (total === 0) {
                distributionDiv.innerHTML = '<p class="empty-state">暂无数据</p>';
                return;
            }

            let html = '';

            // 按顺序显示分数范围
            const ranges = ['excellent', 'good', 'average', 'passing', 'poor'];
            ranges.forEach(range => {
                const rangeData = scoreRanges[range];
                const percentage = total > 0 ? (rangeData.count / total) * 100 : 0;

                html += `
                    <div class="score-bar">
                        <div class="score-bar-fill ${range}" style="width: ${percentage}%"></div>
                        <span class="score-bar-label">${rangeData.label}</span>
                        <span class="score-bar-value">${rangeData.count}份 (${Math.round(percentage)}%)</span>
                    </div>
                `;
            });

            distributionDiv.innerHTML = html;
        }
    }



    // 按分析员筛选数据
    filterAnalystItems(items, analyst) {
        return items.filter(item => item.analyst === analyst);
    }

    // 数字动画效果
    animateNumbers() {
        const numbers = document.querySelectorAll('.stat-number');

        numbers.forEach(number => {
            const target = parseInt(number.textContent);
            let current = 0;
            const increment = Math.max(1, target / 20);

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                number.textContent = Math.floor(current);
            }, 50);
        });
    }

    // 显示加载状态
    showLoading() {
        const sections = ['hjf-notes', 'hjm-notes'];
        sections.forEach(sectionId => {
            document.getElementById(sectionId).innerHTML = `
                <div class="loading">正在加载内容...</div>
            `;
        });
    }

    // 显示错误信息
    showError(message) {
        const sections = ['hjf-notes', 'hjm-notes'];
        sections.forEach(sectionId => {
            document.getElementById(sectionId).innerHTML = `
                <div class="empty-state">
                    <h3>加载失败</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="notesApp.loadNotes()">重试</button>
                </div>
            `;
        });
    }

    // 分享功能
    shareNote(path, title) {
        if (navigator.share) {
            navigator.share({
                title: title,
                url: window.location.origin + '/' + path
            });
        } else {
            // fallback: 复制到剪贴板
            const url = window.location.origin + '/' + path;
            navigator.clipboard.writeText(url).then(() => {
                this.showToast('链接已复制到剪贴板');
            });
        }
    }

    // 显示提示信息
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary-color);
            color: white;
            padding: 1rem 2rem;
            border-radius: var(--border-radius);
            z-index: 1001;
            animation: fadeInOut 3s ease;
        `;

        // 添加CSS动画
        if (!document.querySelector('style[data-toast]')) {
            const style = document.createElement('style');
            style.setAttribute('data-toast', '');
            style.textContent = `
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    10%, 90% { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// 初始化应用
let notesApp;
document.addEventListener('DOMContentLoaded', () => {
    notesApp = new NotesApp();
});

// PWA 支持已由 sw-updater.js 处理
