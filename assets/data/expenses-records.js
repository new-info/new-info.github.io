// 生活费用借款记录数据
// 这个文件专门用于维护借款记录数据，与业务逻辑分离

window.EXPENSES_RECORDS = {
    // 数据最后更新时间
    lastUpdated: '2025-01-15T10:30:00.000Z',

    // 数据版本号
    version: '1.2.0', // 版本升级，使用加密凭证文件

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
            voucher: 'xiazai.jpeg' // 本地凭证文件名
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
            voucher: 'xiazai.jpeg'
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
            voucher: 'xiazai.jpeg'
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
            voucher: 'xiazai.jpeg'
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
            voucher: 'voucher_20250212_300.png'
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
            voucher: 'voucher_20250110_500.jpg'
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
            voucher: null // 无凭证
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
            voucher: 'voucher_20250214_800.jpg'
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
            voucher: 'voucher_20250216_400.png'
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
    // v1.2.0: 凭证文件名现在使用本地加密文件，格式：voucher_YYYYMMDD_amount.ext
};
