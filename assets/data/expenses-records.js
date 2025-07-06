// 生活费用借款记录数据
// 这个文件专门用于维护借款记录数据，与业务逻辑分离

window.EXPENSES_RECORDS = {
    // 数据最后更新时间
    lastUpdated: '2025-01-15T10:30:00.000Z',
    
    // 数据版本号
    version: '1.1.0', // 版本升级，添加了置顶和凭证功能
    
    // 借款记录列表
    records: [
        {
            id: 1,
            date: '2025-01-15',
            borrower: 'hjf',
            amount: 1200,
            purpose: '生活费',
            returnDate: '2025-01-25',
            status: 'returned', // returned, pending, overdue
            actualReturnDate: '2025-01-25',
            notes: '按时归还',
            pinned: false, // 是否置顶
            voucher: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80' // 凭证图片URL
        },
        {
            id: 2,
            date: '2025-01-20',
            borrower: 'hjm',
            amount: 800,
            purpose: '学习用品',
            returnDate: '2025-02-01',
            status: 'returned',
            actualReturnDate: '2025-01-30',
            notes: '提前归还',
            pinned: false,
            voucher: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        },
        {
            id: 3,
            date: '2025-02-01',
            borrower: 'hjf',
            amount: 1500,
            purpose: '生活费',
            returnDate: '2025-02-15',
            status: 'pending',
            actualReturnDate: null,
            notes: '按月生活费',
            pinned: true, // 置顶显示
            voucher: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        },
        {
            id: 4,
            date: '2025-02-05',
            borrower: 'hjm',
            amount: 600,
            purpose: '餐费',
            returnDate: '2025-02-20',
            status: 'pending',
            actualReturnDate: null,
            notes: '食堂充值',
            pinned: false,
            voucher: null // 无凭证
        },
        {
            id: 5,
            date: '2025-02-10',
            borrower: 'hjf',
            amount: 2000,
            purpose: '学费补充',
            returnDate: '2025-02-25',
            status: 'pending',
            actualReturnDate: null,
            notes: '学费不足补充',
            pinned: true, // 置顶显示
            voucher: 'https://images.unsplash.com/photo-1554224154-26032fbed8bd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        },
        {
            id: 6,
            date: '2025-02-12',
            borrower: 'hjm',
            amount: 300,
            purpose: '交通费',
            returnDate: '2025-02-28',
            status: 'pending',
            actualReturnDate: null,
            notes: '回家路费',
            pinned: false,
            voucher: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        },
        {
            id: 7,
            date: '2025-01-10',
            borrower: 'hjf',
            amount: 500,
            purpose: '书本费',
            returnDate: '2025-01-20',
            status: 'returned',
            actualReturnDate: '2025-01-18',
            notes: '教材费用',
            pinned: false,
            voucher: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        },
        {
            id: 8,
            date: '2025-01-28',
            borrower: 'hjm',
            amount: 1000,
            purpose: '生活费',
            returnDate: '2025-02-10',
            status: 'overdue',
            actualReturnDate: null,
            notes: '逾期未还',
            pinned: true, // 逾期记录置顶显示
            voucher: null
        },
        {
            id: 9,
            date: '2025-02-14',
            borrower: 'hjf',
            amount: 800,
            purpose: '电子设备',
            returnDate: '2025-03-01',
            status: 'pending',
            actualReturnDate: null,
            notes: '购买学习设备',
            pinned: false,
            voucher: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        },
        {
            id: 10,
            date: '2025-02-16',
            borrower: 'hjm',
            amount: 400,
            purpose: '医疗费',
            returnDate: '2025-03-05',
            status: 'pending',
            actualReturnDate: null,
            notes: '看病买药',
            pinned: false,
            voucher: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        }
    ],
    
    // 借款规则配置
    rules: {
        monthlyLimit: 1500, // 每月生活费限额
        overdueGracePeriod: 7, // 逾期宽限期（天）
        categories: [
            { name: '生活费', limit: 1500, monthly: true },
            { name: '学习用品', limit: 1000, monthly: false },
            { name: '医疗费', limit: 2000, monthly: false },
            { name: '交通费', limit: 500, monthly: false },
            { name: '餐费', limit: 800, monthly: false },
            { name: '其他', limit: 500, monthly: false }
        ]
    }
    
    // 注意：已移除 summary 对象，统计数据现在完全由借款记录自动计算生成
    // 这样可以确保统计数据始终与实际记录保持一致，无需手动维护
}; 