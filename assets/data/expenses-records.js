// 生活费用借款记录数据
// 这个文件专门用于维护借款记录数据，与业务逻辑分离

window.EXPENSES_RECORDS = {
    // 数据最后更新时间
    lastUpdated: '2025-01-20T15:45:00.000Z',

    // 数据版本号
    version: '1.3.0', // 版本升级，新增归还记录和智能删除线逻辑

    // 借款记录列表
    records: [
        {
            id: 1,
            date: '-',
            borrower: 'hjf',
            amount: 1000,
            purpose: '智能手表',
            returnDate: '2025-01-25',
            status: 'returned', // returned, pending, overdue
            actualReturnDate: '2025-01-25',
            notes: '父母借款',
            pinned: true, // 是否置顶
            voucher: null // 本地凭证文件名
        },
        {
            id: 2,
            date: '2025-01-15',
            borrower: 'hjf',
            amount: 1000,
            purpose: '借款',
            returnDate: '-',
            status: 'returned', // returned, pending, overdue
            actualReturnDate: '2025-09-01',
            notes: '',
            pinned: true, // 是否置顶
            voucher: '2025-07-06 21.58.19.jpg' // 本地凭证文件名
        },
        {
            id: 3,
            date: '2025-01-16',
            borrower: 'hjf',
            amount: 1000,
            purpose: '借款',
            returnDate: '-',
            status: 'returned', // returned, pending, overdue
            actualReturnDate: '2025-09-01',
            notes: '',
            pinned: true, // 是否置顶
            voucher: '2025-07-06 21.58.19.jpg' // 本地凭证文件名
        },
        {
            id: 4,
            date: '2025-01-20',
            borrower: 'hjf',
            amount: 500,
            purpose: '交通费',
            returnDate: '-',
            status: 'pending',
            actualReturnDate: null,
            notes: '',
            pinned: false,
            voucher: null
        },
        {
            id: 5,
            date: '2025-01-25',
            borrower: 'hjf',
            amount: 800,
            purpose: '餐饮费',
            returnDate: '-',
            status: 'pending',
            actualReturnDate: null,
            notes: '',
            pinned: false,
            voucher: null
        },
        {
            id: 6,
            date: '2025-01-10',
            borrower: 'hjm',
            amount: 1200,
            purpose: '学费',
            returnDate: '-',
            status: 'pending',
            actualReturnDate: null,
            notes: '',
            pinned: false,
            voucher: null
        },
        {
            id: 7,
            date: '2025-01-15',
            borrower: 'hjm',
            amount: 800,
            purpose: '学习用品',
            returnDate: '-',
            status: 'pending',
            actualReturnDate: null,
            notes: '',
            pinned: false,
            voucher: null
        },
        {
            id: 8,
            date: '2025-01-20',
            borrower: 'hjm',
            amount: 600,
            purpose: '交通费',
            returnDate: '-',
            status: 'pending',
            actualReturnDate: null,
            notes: '',
            pinned: false,
            voucher: null
        }
    ],

    // 还款记录列表 - 独立管理
    repayments: [
        {
            id: 1,
            date: '2025-01-25',
            borrower: 'hjf',
            amount: 2000,
            purpose: '智能手表还款',
            notes: '归还1月份生活费',
            voucher: null,
            // 新增：指定要还款的借款ID列表，按优先级排序
            // 如果指定了ID，优先按ID顺序还款；如果ID对应的借款已还清，则按时间顺序还款其他借款
            targetLoanIds: [1, 2, 3] // 优先还款ID为1、2、3的借款
        },
        {
            id: 2,
            date: '2025-02-01',
            borrower: 'hjf',
            amount: 1500,
            purpose: '学习用品还款',
            notes: '归还学习用品费用',
            voucher: null,
            targetLoanIds: [3, 4] // 优先还款ID为3、4的借款
        },
        {
            id: 3,
            date: '2025-02-15',
            borrower: 'hjf',
            amount: 800,
            purpose: '餐饮费还款',
            notes: '归还餐饮费用',
            voucher: null,
            // 不指定ID，按时间顺序还款
            targetLoanIds: null
        },
        {
            id: 4,
            date: '2025-01-20',
            borrower: 'hjm',
            amount: 1200,
            purpose: '学费还款',
            notes: '归还学费',
            voucher: null,
            targetLoanIds: [6, 7] // 优先还款ID为6、7的借款
        },
        {
            id: 5,
            date: '2025-02-10',
            borrower: 'hjm',
            amount: 600,
            purpose: '交通费还款',
            notes: '归还交通费',
            voucher: null,
            targetLoanIds: [8] // 只指定一个ID
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
