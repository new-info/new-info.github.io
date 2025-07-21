// 任务奖励管理模块
// 负责任务状态管理、奖励计算、UI更新等功能

class TaskRewardsManager {
    constructor() {
        // 从各个分类数组中合并所有任务
        this.tasks = this.mergeTasks();
        this.categories = window.TASK_REWARDS.categories;
        this.rules = window.TASK_REWARDS.rules;
        this.currentFilter = 'all';
        this.currentPriorityFilter = 'all';
        this.showCompleted = false; // 默认不显示已完成任务
        this.init();
    }

    // 合并所有分类的任务到一个数组
    mergeTasks() {
        const allTasks = [
            ...(window.TASK_REWARDS.basicTasks || []),
            ...(window.TASK_REWARDS.academicTasks || []),
            ...(window.TASK_REWARDS.certificationTasks || []),
            ...(window.TASK_REWARDS.competitionTasks || []),
            ...(window.TASK_REWARDS.internshipTasks || []),
            ...(window.TASK_REWARDS.projectTasks || []),
            ...(window.TASK_REWARDS.socialTasks || []),
            ...(window.TASK_REWARDS.visaTasks || [])
        ];
        return allTasks;
    }

    // 获取指定分类的任务
    getTasksByCategory(category) {
        if (category === 'all') {
            return this.tasks;
        }

        const categoryTasksMap = {
            'basic': window.TASK_REWARDS.basicTasks || [],
            'academic': window.TASK_REWARDS.academicTasks || [],
            'certification': window.TASK_REWARDS.certificationTasks || [],
            'competition': window.TASK_REWARDS.competitionTasks || [],
            'internship': window.TASK_REWARDS.internshipTasks || [],
            'project': window.TASK_REWARDS.projectTasks || [],
            'social': window.TASK_REWARDS.socialTasks || [],
            'visa': window.TASK_REWARDS.visaTasks || []
        };

        return categoryTasksMap[category] || [];
    }

    init() {
        this.loadTaskProgress();
        this.renderCategoryFilters(); // 渲染分类过滤器按钮
        this.renderTasks();
        this.updateStatistics();
        this.bindEvents();
    }

    // 加载任务进度（从localStorage）
    loadTaskProgress() {
        const savedProgress = localStorage.getItem('taskRewardsProgress');
        if (savedProgress) {
            try {
                const progress = JSON.parse(savedProgress);
                // 更新任务状态
                this.tasks.forEach(task => {
                    if (progress[task.id]) {
                        Object.assign(task, progress[task.id]);
                    }
                });
            } catch (error) {
                console.error('加载任务进度失败:', error);
            }
        }
    }

    // 保存任务进度到localStorage
    saveTaskProgress() {
        const progress = {};
        this.tasks.forEach(task => {
            progress[task.id] = {
                status: task.status,
                completedDate: task.completedDate,
                completedBy: task.completedBy
            };
        });
        localStorage.setItem('taskRewardsProgress', JSON.stringify(progress));
    }

    // 更新任务状态
    updateTaskStatus(taskId, status, completedBy = null) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return false;

        if (status === 'completed' && completedBy) {
            // 检查该用户是否已经完成过该任务
            if (!task.completedBy.includes(completedBy)) {
                task.completedBy.push(completedBy);
                task.completedDate.push(new Date().toISOString().split('T')[0]);
            }
            // 如果所有人都完成了，更新任务状态为已完成
            if (task.completedBy.length > 0) {
                task.status = 'completed';
            }
        } else if (status === 'in_progress') {
            task.status = 'in_progress';
        } else if (status === 'pending') {
            task.status = 'pending';
            // 重置时不清空完成记录，保留历史记录
        }

        this.saveTaskProgress();
        this.renderCategoryFilters(); // 更新分类过滤器按钮
        this.renderTasks();
        this.updateStatistics();
        return true;
    }

    // 计算任务奖励 - 简化版本，直接使用基础奖励
    calculateTaskReward(task) {
        // 必须完成的任务没有奖励
        if (task.priority === 'critical') {
            return 0;
        }
        // 直接返回任务的基础奖励，不应用任何倍数或时间奖励
        return task.reward;
    }

    // 计算组合奖励（已移除）
    calculateComboRewards() {
        return [];
    }

    // 计算人员统计
    calculatePersonStats() {
        const persons = ['hjf', 'hjm'];
        const totalTasks = this.tasks.length;

        return persons.map(person => {
            // 计算该人员完成的任务
            const completedTasks = this.tasks.filter(task =>
                task.completedBy && task.completedBy.includes(person)
            );

            // 计算完成率
            const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

            // 计算总奖励（包括该人员在组合奖励中的份额）
            const baseReward = completedTasks.reduce((sum, task) => {
                return sum + this.calculateTaskReward(task);
            }, 0);

            // 组合奖励已移除
            const comboReward = 0;

            const totalReward = baseReward + comboReward;

            // 计算平均奖励
            const avgReward = completedTasks.length > 0 ? totalReward / completedTasks.length : 0;

            return {
                person,
                completedCount: completedTasks.length,
                completionRate,
                totalReward,
                baseReward,
                comboReward,
                avgReward
            };
        });
    }

    // 获取统计数据
    getStatistics() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.status === 'completed');
        const inProgressTasks = this.tasks.filter(t => t.status === 'in_progress');
        const pendingTasks = this.tasks.filter(t => t.status === 'pending');

        const totalReward = this.tasks.reduce((sum, task) => {
            return sum + (task.status === 'completed' ? this.calculateTaskReward(task) : 0);
        }, 0);

        const comboRewards = [];
        const comboRewardTotal = 0;

        const categoryStats = this.categories.map(category => {
            const categoryTasks = this.getTasksByCategory(category.id);
            const completed = categoryTasks.filter(t => t.status === 'completed').length;
            const total = categoryTasks.length;

            // 修复：分类统计应该计算所有非critical任务的总奖励，无论任务状态
            const reward = categoryTasks.reduce((sum, task) => {
                // 只计算非critical任务的奖励
                if (task.priority !== 'critical') {
                    // 直接使用任务的奖励值，不考虑任务状态
                    return sum + task.reward;
                }
                return sum;
            }, 0);

            return {
                ...category,
                completed,
                total,
                reward,
                progress: total > 0 ? (completed / total) * 100 : 0
            };
        });

        // 计算人员统计
        const personStats = this.calculatePersonStats();

        return {
            totalTasks,
            completedTasks: completedTasks.length,
            inProgressTasks: inProgressTasks.length,
            pendingTasks: pendingTasks.length,
            completionRate: totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0,
            totalReward: totalReward + comboRewardTotal,
            baseReward: totalReward,
            comboReward: comboRewardTotal,
            comboRewards,
            categoryStats,
            personStats
        };
    }

    // 渲染任务列表
    renderTasks() {
        const container = document.getElementById('task-rewards-list');
        if (!container) return;

        const filteredTasks = this.getFilteredTasks();

        container.innerHTML = filteredTasks.map(task => this.renderTaskCard(task)).join('');

        // 更新任务数量显示
        this.updateTaskCount(filteredTasks.length);
    }

    // 获取过滤后的任务
    getFilteredTasks() {
        let filteredTasks;

        // 按分类过滤
        if (this.currentFilter !== 'all') {
            filteredTasks = this.getTasksByCategory(this.currentFilter);
        } else {
            filteredTasks = this.tasks;
        }

        // 按优先级过滤
        if (this.currentPriorityFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === this.currentPriorityFilter);
        }

        // 按完成状态过滤
        if (!this.showCompleted) {
            filteredTasks = filteredTasks.filter(task => task.status !== 'completed');
        }

        // 按ID排序
        filteredTasks.sort((a, b) => a.id - b.id);

        return filteredTasks;
    }

    // 更新任务数量显示
    updateTaskCount(filteredCount) {
        const countNumberElement = document.getElementById('task-count-number');
        const countTotalElement = document.getElementById('task-count-total');

        // 计算在当前显示模式下的总任务数
        const totalTasks = this.showCompleted ?
            this.tasks.length :
            this.tasks.filter(task => task.status !== 'completed').length;

        if (countNumberElement) {
            countNumberElement.textContent = filteredCount;
        }

        if (countTotalElement) {
            countTotalElement.textContent = totalTasks;
        }
    }

    // 计算各分类的任务数量
    getCategoryTaskCounts() {
        const counts = {};

        // 根据是否显示已完成任务来过滤基础任务列表
        let baseTasks = this.showCompleted ?
            this.tasks :
            this.tasks.filter(task => task.status !== 'completed');

        // 计算总任务数
        counts.all = baseTasks.length;

        // 计算各分类任务数
        this.categories.forEach(category => {
            const categoryTasks = baseTasks.filter(task => task.category === category.id);
            counts[category.id] = categoryTasks.length;
        });

        return counts;
    }

    // 渲染分类过滤器按钮
    renderCategoryFilters() {
        const container = document.getElementById('category-filters');
        if (!container) return;

        const counts = this.getCategoryTaskCounts();

        // 生成全部按钮
        let buttonsHTML = `
            <button class="category-filter ${this.currentFilter === 'all' ? 'active' : ''}" data-category="all">
                <span>全部</span>
                <span class="filter-count">${counts.all}</span>
            </button>
        `;

        // 生成各分类按钮
        this.categories.forEach(category => {
            const isActive = this.currentFilter === category.id;
            buttonsHTML += `
                <button class="category-filter ${isActive ? 'active' : ''}" data-category="${category.id}">
                    <span>${category.icon} ${category.name}</span>
                    <span class="filter-count">${counts[category.id]}</span>
                </button>
            `;
        });

        container.innerHTML = buttonsHTML;

        // 重新绑定事件
        this.bindFilterEvents();
    }

    // 绑定分类过滤器事件
    bindFilterEvents() {
        const filterButtons = document.querySelectorAll('.category-filter');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const category = btn.dataset.category;
                this.currentFilter = category;
                this.renderCategoryFilters(); // 重新渲染按钮状态
                this.renderTasks();
            });
        });
    }

    // 渲染单个任务卡片 - 支持多人完成统计
    renderTaskCard(task) {
        const category = this.categories.find(c => c.id === task.category);
        const reward = this.calculateTaskReward(task);
        const deadline = new Date(task.deadline);
        const now = new Date();
        const isOverdue = deadline < now && task.status !== 'completed';
        const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

        const statusClass = {
            'pending': 'status-pending',
            'in_progress': 'status-progress',
            'completed': 'status-completed'
        }[task.status];

        // 根据完成人数添加不同的置灰效果类
        let completionClass = '';
        if (task.status === 'completed') {
            const completedCount = task.completedBy.length;
            if (completedCount === 1) {
                completionClass = 'partial-completion'; // 只有一个人完成
            } else if (completedCount === 2) {
                completionClass = 'full-completion'; // 两个人都完成
            }
        }

        // 友好的时间显示
        let deadlineText;
        let deadlineClass = '';
        let deadlineIcon = '⏰';

        if (task.friendlyDeadline) {
            deadlineText = task.friendlyDeadline;
            deadlineClass = 'friendly';
        } else if (task.deadline) {
            if (isOverdue) {
                deadlineText = `逾期${Math.abs(daysLeft)}天`;
                deadlineClass = 'overdue';
                deadlineIcon = '🚨';
            } else if (daysLeft <= 7) {
                deadlineText = `剩余${daysLeft}天`;
                deadlineClass = 'urgent';
                deadlineIcon = '🔥';
            } else if (daysLeft <= 30) {
                deadlineText = `剩余${daysLeft}天`;
                deadlineClass = 'warning';
                deadlineIcon = '⚠️';
            } else {
                deadlineText = `剩余${daysLeft}天`;
                deadlineClass = 'normal';
                deadlineIcon = '📅';
            }
        } else {
            deadlineText = '无截止日期';
            deadlineClass = 'no-deadline';
            deadlineIcon = '∞';
        }

        // 计算完成统计
        const completedCount = task.completedBy.length;
        const hjfCompleted = task.completedBy.includes('hjf');
        const hjmCompleted = task.completedBy.includes('hjm');

        // 重要程度和锁定状态
        const priority = task.priority || 'medium';
        const locked = task.locked || false;
        const priorityText = this.getPriorityText(priority);
        const lockText = locked ? '已锁定' : '可进行';

        return `
            <div class="task-card ${statusClass} ${completionClass} ${locked ? 'locked' : ''}" data-task-id="${task.id}" data-priority="${priority}">
                <div class="task-header">
                    <div class="task-icon">${task.icon}</div>
                    <div class="task-info">
                        <h3 class="task-title">${task.name}</h3>
                        <div class="task-meta">
                            <span class="task-category">${category.icon} ${category.name}</span>
                            <span class="task-difficulty difficulty-${task.difficulty}">${this.getDifficultyText(task.difficulty)}</span>
                        </div>
                        <div class="task-meta-row">
                            <div class="task-priority ${priority}">
                                <span class="priority-icon ${priority}"></span>
                                <span>${priorityText}</span>
                            </div>
                            <div class="task-lock-status ${locked ? 'locked' : 'unlocked'}">
                                <span class="lock-icon ${locked ? 'locked' : 'unlocked'}"></span>
                                <span>${lockText}</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-reward">
                        ${task.priority === 'critical' ? 
                            '<span class="reward-amount critical">必须完成</span>' : 
                            `<span class="reward-amount">¥${reward}</span>`
                        }
                    </div>
                </div>
                
                ${task.description ? `<div class="task-content"><p class="task-description ${task.priority === 'critical' ? 'critical-description' : ''}">${task.description}</p></div>` : ''}
                ${locked && task.lockReason ? `<div class="task-lock-reason">
                    <span class="lock-reason-icon">🔒</span>
                    <span class="lock-reason-text">${task.lockReason}</span>
                </div>` : ''}
                ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
                
                <div class="task-footer">
                    <div class="task-deadline ${deadlineClass}">
                        <span class="deadline-icon">${deadlineIcon}</span>
                        <span class="deadline-text">${deadlineText}</span>
                    </div>
                    
                    <div class="task-actions" style="display: none">
                        ${this.renderTaskActions(task)}
                    </div>
                </div>
                
                ${completedCount > 0 ? `
                    <div class="task-completion">
                        <span class="completion-icon">✅</span>
                        <span class="completion-text">已完成 (${completedCount}/2)</span>
                        <div class="completion-details">
                            ${hjfCompleted ? `<span class="completion-person hjf">HJF: ${task.completedDate[task.completedBy.indexOf('hjf')]}</span>` : ''}
                            ${hjmCompleted ? `<span class="completion-person hjm">HJM: ${task.completedDate[task.completedBy.indexOf('hjm')]}</span>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 渲染任务操作按钮 - 支持多人完成
    renderTaskActions(task) {
        const hjfCompleted = task.completedBy.includes('hjf');
        const hjmCompleted = task.completedBy.includes('hjm');
        const allCompleted = hjfCompleted && hjmCompleted;
        const locked = task.locked || false;

        // 如果任务被锁定，显示锁定提示
        if (locked) {
            return `
                <button class="btn btn-secondary btn-sm" disabled>
                    🔒 已锁定
                </button>
            `;
        }

        if (allCompleted) {
            return `
                <button class="btn btn-secondary btn-sm" onclick="taskRewardsManager.updateTaskStatus(${task.id}, 'pending')">
                    重置
                </button>
            `;
        } else if (task.status === 'in_progress' || task.status === 'completed') {
            return `
                ${!hjfCompleted ? `<button class="btn btn-success btn-sm" onclick="taskRewardsManager.updateTaskStatus(${task.id}, 'completed', 'hjf')">
                    HJF 完成
                </button>` : ''}
                ${!hjmCompleted ? `<button class="btn btn-success btn-sm" onclick="taskRewardsManager.updateTaskStatus(${task.id}, 'completed', 'hjm')">
                    HJM 完成
                </button>` : ''}
                <button class="btn btn-secondary btn-sm" onclick="taskRewardsManager.updateTaskStatus(${task.id}, 'pending')">
                    暂停
                </button>
            `;
        } else {
            return `
                <button class="btn btn-primary btn-sm" onclick="taskRewardsManager.updateTaskStatus(${task.id}, 'in_progress')">
                    开始
                </button>
            `;
        }
    }

    // 获取难度文本
    getDifficultyText(difficulty) {
        const texts = {
            'easy': '简单',
            'medium': '中等',
            'hard': '困难'
        };
        return texts[difficulty] || difficulty;
    }

    // 获取重要程度文本
    getPriorityText(priority) {
        const texts = {
            'critical': '必须完成',
            'high': '高优先级',
            'medium': '中优先级',
            'low': '低优先级'
        };
        return texts[priority] || priority;
    }

    // 更新人员统计显示
    updatePersonDisplay(person, stats) {
        const totalElement = document.getElementById(`task-${person}-total`);
        const countElement = document.getElementById(`task-${person}-count`);
        const totalRewardElement = document.getElementById(`task-${person}-total-reward`);
        const rewardElement = document.getElementById(`task-${person}-reward`);

        // 计算所有任务的总奖励
        const allTasksReward = this.tasks.reduce((sum, task) => {
            return sum + this.calculateTaskReward(task);
        }, 0);

        if (totalElement) totalElement.textContent = this.tasks.length;
        if (countElement) countElement.textContent = stats.completedCount;
        if (totalRewardElement) totalRewardElement.textContent = `¥${Math.round(allTasksReward)}`;
        if (rewardElement) rewardElement.textContent = `¥${Math.round(stats.totalReward)}`;
    }

    // 更新统计信息
    updateStatistics() {
        const stats = this.getStatistics();

        // 更新人员统计
        if (stats.personStats && stats.personStats.length >= 2) {
            const hjfStats = stats.personStats.find(p => p.person === 'hjf');
            const hjmStats = stats.personStats.find(p => p.person === 'hjm');

            if (hjfStats) {
                this.updatePersonDisplay('hjf', hjfStats);
            }
            if (hjmStats) {
                this.updatePersonDisplay('hjm', hjmStats);
            }
        }

        // 更新分类统计
        const categoryStatsContainer = document.getElementById('category-stats');
        if (categoryStatsContainer) {
            console.log('分类统计数据:', stats.categoryStats);

            // 添加详细的调试日志
            stats.categoryStats.forEach(cat => {
                const categoryTasks = this.getTasksByCategory(cat.id);
                console.log(`分类 ${cat.name} 统计:`);
                console.log(`- 总任务数: ${cat.total}, 已完成: ${cat.completed}`);
                console.log(`- 总奖励: ¥${cat.reward} (应为所有非critical任务奖励总和)`);

                // 计算预期的奖励总和进行验证
                const expectedReward = categoryTasks
                    .filter(t => t.priority !== 'critical')
                    .reduce((sum, t) => sum + t.reward, 0);
                console.log(`- 预期奖励总和: ¥${expectedReward}`);

                console.log('- 任务详情:');
                categoryTasks.forEach(task => {
                    const isRewarded = task.priority !== 'critical';
                    const status = task.status;
                    const completedBy = task.completedBy ? task.completedBy.join(', ') : '无人';
                    console.log(`  - ${task.name}: 奖励¥${task.reward}, 状态: ${status}, 优先级: ${task.priority}, 计入统计: ${isRewarded ? '是' : '否'}, 完成人: ${completedBy}`);
                });
            });

            categoryStatsContainer.innerHTML = stats.categoryStats.map(cat => `
                <div class="category-stat-card">
                    <div class="category-icon">${cat.icon}</div>
                    <div class="category-info">
                        <h4>${cat.name}</h4>
                        <div class="category-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${cat.progress}%"></div>
                            </div>
                            <span class="progress-text">${cat.completed}/${cat.total}</span>
                        </div>
                        <div class="category-reward">¥${Math.round(cat.reward)}</div>
                    </div>
                </div>
            `).join('');
            console.log('分类统计HTML已更新');
        } else {
            console.error('未找到category-stats容器');
        }

        // 组合奖励已移除
        const comboRewardsContainer = document.getElementById('combo-rewards');
        if (comboRewardsContainer) {
            comboRewardsContainer.innerHTML = '';
        }
    }

    // 绑定事件
    bindEvents() {
        // 分类过滤器事件在renderCategoryFilters中处理

        // 绑定显示已完成任务的切换开关
        const showCompletedToggle = document.getElementById('show-completed-tasks');
        if (showCompletedToggle) {
            // 设置初始状态
            showCompletedToggle.checked = this.showCompleted;

            // 绑定切换事件
            showCompletedToggle.addEventListener('change', (e) => {
                this.showCompleted = e.target.checked;
                console.log('显示已完成任务:', this.showCompleted);

                // 更新显示
                this.renderCategoryFilters();
                this.renderTasks();
            });
        }

        // 绑定优先级过滤器
        const priorityFilter = document.getElementById('priority-filter');
        if (priorityFilter) {
            // 设置初始状态
            priorityFilter.value = this.currentPriorityFilter;

            // 绑定切换事件
            priorityFilter.addEventListener('change', (e) => {
                this.currentPriorityFilter = e.target.value;
                console.log('优先级过滤:', this.currentPriorityFilter);

                // 更新显示
                this.renderCategoryFilters();
                this.renderTasks();
            });
        }
    }

    // updateActiveFilter方法已移除，现在在renderCategoryFilters中直接处理按钮状态
}

// 初始化任务奖励管理器
let taskRewardsManager;
document.addEventListener('DOMContentLoaded', () => {
    taskRewardsManager = new TaskRewardsManager();
});
