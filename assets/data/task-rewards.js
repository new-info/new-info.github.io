// 任务奖励数据
// 定义大学需要完成的任务、证书和对应奖励

window.TASK_REWARDS = {
    // 数据最后更新时间
    lastUpdated: '2025-01-20T15:45:00.000Z',

    // 数据版本号
    version: '1.0.0',

    // 任务分类
    categories: [
        {
            id: 'basic',
            name: '基础任务',
            icon: '🔧',
            description: '基础技能和必备能力'
        },
        {
            id: 'academic',
            name: '学术成就',
            icon: '🎓',
            description: '学术相关的任务和证书'
        },
        {
            id: 'certification',
            name: '专业证书',
            icon: '📜',
            description: '专业认证和资格证书'
        },
        {
            id: 'competition',
            name: '竞赛获奖',
            icon: '🏆',
            description: '各类竞赛和比赛获奖'
        },
        {
            id: 'internship',
            name: '实习经历',
            icon: '💼',
            description: '实习和工作经验'
        },
        {
            id: 'project',
            name: '项目实践',
            icon: '🚀',
            description: '项目开发和实践'
        },
        {
            id: 'social',
            name: '社会实践',
            icon: '🤝',
            description: '志愿服务和社会实践'
        },
        {
            id: 'visa',
            name: '出国签证',
            icon: '✈️',
            description: '签证办理和出入境手续'
        }
    ],

    // 按分类组织的任务列表
    basicTasks: [
        // 基础任务类
        {
            id: 0,
            category: 'basic',
            name: '键盘盲打',
            description: '掌握键盘盲打技能，提高打字速度和准确性，计算机专业基础技能',
            reward: 500,
            difficulty: 'easy',
            priority: 'high',
            locked: false,
            icon: '⌨️',
            status: 'pending',
            completedBy: [], // 完成人员数组
            completedDate: [], // 完成时间数组
            notes: '使用在线打字练习网站，达到每分钟50字以上，准确率95%以上（录制1分钟视频验证）',
            requirements: ['完成打字练习', '达到50字/分钟', '准确率≥95%'],
            deadline: '2025-09-01',
            friendlyDeadline: ''
        },
    ],

    academicTasks: [
        // 学术成就类
        {
            id: 1,
            category: 'academic',
            name: '英语四级证书',
            description: '通过大学英语四级考试（必须完成，否则中断生活费用和任务奖励）',
            reward: 0,
            difficulty: 'easy',
            priority: 'critical', // 重要程度：critical, high, medium, low
            locked: false, // 锁定状态
            icon: '📚',
            status: 'pending', // pending, completed, in_progress
            completedBy: [], // 完成人员数组
            completedDate: [], // 完成时间数组
            notes: 'CET-4考试，总分为710分，425分以上通过。',
            requirements: ['参加CET-4考试', '成绩达到425分以上'],
            deadline: '',
            friendlyDeadline: '大二上学期结束前'
        },
        {
            id: 10,
            category: 'academic',
            name: '英语六级证书',
            description: '通过大学英语六级考试',
            reward: 3000,
            difficulty: 'medium',
            priority: 'high',
            locked: true,
            lockReason: '需先通过英语四级',
            icon: '📖',
            status: 'pending',
            completedBy: [], // 完成人员数组
            completedDate: [], // 完成时间数组
            notes: 'CET-6考试，总分为710分，425分以上通过。',
            requirements: ['参加CET-6考试', '成绩达到425分以上'],
            deadline: '',
            friendlyDeadline: '大三上学期结束前'
        },
    ],

    certificationTasks: [
        // 专业证书类
        {
            id: 98,
            category: 'certification',
            name: '软考中项（信息系统项目管理师）',
            description: '通过计算机技术与软件专业技术资格（水平）考试中级',
            reward: 2000,
            difficulty: 'medium',
            priority: 'medium',
            locked: false,
            icon: '💼',
            status: 'pending',
            completedBy: [], // 完成人员数组
            completedDate: [], // 完成时间数组
            notes: '信息系统项目管理师，含上午选择题和下午案例分析题，需要项目管理知识',
            requirements: ['通过上午选择题考试', '通过下午案例分析考试', '总分达到合格线'],
            deadline: '',
            friendlyDeadline: '大三下学期结束前'
        },
    ],

    competitionTasks: [
        // 竞赛获奖类
        {
            id: 9,
            category: 'competition',
            name: '蓝桥杯程序设计',
            description: '参加蓝桥杯全国软件和信息技术专业人才大赛，并获得国三以上奖项',
            reward: 0,
            difficulty: 'easy',
            priority: 'critical',
            icon: '🏆',
            status: 'pending',
            completedBy: [], // 修正为空数组
            completedDate: [], // 修正为空数组
            notes: '全国性程序设计竞赛',
            requirements: ['个人参赛', '获得省级以上奖项'],
            deadline: '',
            friendlyDeadline: '大二下学期结束前'
        },
        {
            id: 10,
            category: 'competition',
            name: 'ACM国际大学生程序设计竞赛',
            description: '参加ACM国际大学生程序设计竞赛',
            reward: 3000,
            difficulty: 'medium',
            priority: 'medium',
            locked: false,
            icon: '⚡',
            status: 'pending',
            completedBy: [], // 完成人员数组
            completedDate: [], // 完成时间数组
            notes: 'ACM铜牌以上奖项',
            requirements: ['组队参赛', '获得铜牌以上奖项'],
            deadline: '',
            friendlyDeadline: '大四上学期结束前'
        },
    ],

    internshipTasks: [
        // 实习经历类
        {
            id: 16,
            category: 'internship',
            name: '互联网企业实习',
            description: '完成互联网企业实习经历',
            reward: 2000,
            difficulty: 'medium',
            priority: 'medium',
            locked: false,
            icon: '🏢',
            status: 'pending',
            completedBy: [], // 完成人员数组
            completedDate: [], // 完成时间数组
            notes: '找到实习单位且实习时间≥1个月（首次成功入职可领取）',
            requirements: ['找到实习单位', '实习时间≥1个月', '获得实习证明'],
            deadline: '2025-08-31',
            friendlyDeadline: '大三下学期结束前'
        },
    ],

    projectTasks: [
        // 项目实践类
        {
            id: 99,
            category: 'project',
            name: '开源项目贡献',
            description: '为开源项目做出贡献',
            reward: 3000,
            difficulty: 'hard',
            priority: 'low',
            locked: false,
            icon: '🌐',
            status: 'pending',
            completedBy: [], // 完成人员数组
            completedDate: [], // 完成时间数组
            notes: 'GitHub上获得认可，超过100个star',
            requirements: ['提交代码', '获得PR合并', '获得社区认可'],
            deadline: '',
            friendlyDeadline: '大四毕业之前'
        },
        {
            id: 15,
            category: 'project',
            name: '个人项目开发',
            description: '开发完整的个人博客项目',
            reward: 1000,
            difficulty: 'easy',
            priority: 'medium',
            locked: false,
            icon: '🛠️',
            status: 'pending',
            completedBy: [], // 完成人员数组
            completedDate: [], // 完成时间数组
            notes: '功能完整的博客项目，可在线正常使用',
            requirements: ['开发完整项目', '部署上线', '获得用户反馈'],
            deadline: '',
            friendlyDeadline: '大三上学期结束前'
        },
    ],

    socialTasks: [
        // 社会实践类
        {
            id: 17,
            category: 'social',
            name: '社会寒暑假工',
            description: '参与社会寒暑假工招聘',
            reward: 500,
            difficulty: 'easy',
            priority: 'medium',
            locked: false,
            icon: '🌍',
            status: 'pending',
            completedBy: ['hjf'], // 完成人员数组
            completedDate: ['进行中...'], // 完成时间数组
            notes: '找到一份可以温饱的工作，挣到人生第一桶金且工作时间≥1个月（首次成功入职可领取）',
            requirements: ['找到社会寒暑假工', '工作时间≥1个月'],
            deadline: '',
            friendlyDeadline: '大二下学期开始前'
        },
    ],

    visaTasks:[
        {
            id: 23,
            category: 'visa',
            name: '欧美互惠生',
            description: '通过文化交流换取食宿+津贴，工作>=6个月（申请成功报销往返机票）',
            reward: 10000,
            difficulty: 'medium',
            priority: 'low',
            locked: true,
            lockReason: '需首先完成必须完成的任务，过英语六级',
            icon: '👨‍👩‍👧',
            status: 'pending',
            completedBy: [],
            completedDate: [],
            notes: '入住欧美家庭，协助照顾儿童/简单家务，每周工作25-35小时。包食宿+每月津贴（约800美元）+报销语言课程费',
            requirements: [
                '年龄18-26岁',
                '基础英语/当地语言',
                '无犯罪记录',
                '喜欢儿童（需提供照看经验证明）'
            ],
            deadline: '',
            friendlyDeadline: '大四毕业之前'
        },
        // 澳大利亚工作假期签证 (WHV)
        {
            id: 22,
            category: 'visa',
            name: '澳洲WHV签证',
            description: '申请澳大利亚工作假期签证，工作>=6个月（申请成功报销往返机票）',
            reward: 10000,
            difficulty: 'medium',
            priority: 'low',
            locked: true,
            lockReason: '需首先完成必须完成的任务，过英语六级',
            icon: '🇦🇺',
            status: 'pending',
            completedBy: [],
            completedDate: [],
            notes: '18-30岁申请，需提供英语成绩（雅思4.5+）、高等教育学历证明、资金证明（≥5000澳元），每年对中国开放5000个名额，需抢签',
            requirements: [
                '年龄18-30周岁',
                '雅思总分4.5或同等英语成绩',
                '完成至少2年高等教育',
                '资金证明≥5000澳元',
                '通过健康体检',
                '无犯罪记录证明'
            ],
            deadline: '',
            friendlyDeadline: '大四毕业之前'
        },
        // 新加坡工作假期计划 (WHP)
        {
            id: 18,
            category: 'visa',
            name: '新加坡WHP签证',
            description: '申请新加坡工作假期准证，工作>=3个月（申请成功报销往返机票）',
            reward: 5000,
            difficulty: 'medium',
            priority: 'low',
            locked: true,
            lockReason: '需完成必须完成的任务，过英语六级',
            icon: '🇸🇬',
            status: 'pending',
            completedBy: [],
            completedDate: [],
            notes: '18-25岁在校大学生或毕业未满1年可申请，需大学在读证明/毕业证，英语工作能力证明，资金≥3000新币。有效期6个月，不可续签',
            requirements: [
                '年龄18-25周岁',
                '全日制大学在读或毕业未满1年',
                '英语工作能力证明',
                '资金证明≥3000新币',
                '购买医疗保险',
                '提供详细行程计划'
            ],
            deadline: '',
            friendlyDeadline: '大四毕业之前'
        },
        // 新西兰工作假期签证 (WHV)
        {
            id: 21,
            category: 'visa',
            name: '新西兰WHV签证',
            description: '申请新西兰工作假期签证，工作>=6个月（申请成功报销往返机票）',
            reward: 10000,
            difficulty: 'medium',
            priority: 'low',
            locked: true,
            lockReason: '需完成必须完成的任务，过英语六级',
            icon: '🇳🇿',
            status: 'pending',
            completedBy: [],
            completedDate: [],
            notes: '18-30岁申请，需高中以上学历，雅思5.5分，资金证明≥4200纽币。每年1000个名额，可在线申请，签证有效期1年',
            requirements: [
                '年龄18-30周岁',
                '高中及以上学历',
                '雅思总分5.5或同等英语成绩',
                '资金证明≥4200纽币',
                '往返机票或购票资金',
                '无重大犯罪记录'
            ],
            deadline: '',
            friendlyDeadline: '大四毕业之前'
        },
    ],
    // 奖励规则
    rules: {
       /* // 难度等级对应的基础奖励倍数
        difficultyMultiplier: {
            'easy': 1.0,
            'medium': 1.5,
            'hard': 2.0
        },

        // 特殊奖励规则
        specialRewards: {
            // 时间奖励（提前完成）
            timeRewards: {
                earlyCompletion: 0.2, // 提前完成奖励20%
                onTimeCompletion: 0.1  // 按时完成奖励10%
            }
        }*/
    }
};
