# 生活费用数据维护说明

## 文件结构

- `expenses-records.js` - 借款记录数据文件
- `README.md` - 本说明文档

## 数据文件说明

### 主要结构

```javascript
window.EXPENSES_RECORDS = {
    lastUpdated: '更新时间',
    version: '版本号',
    records: [...], // 借款记录数组
    rules: {...}   // 借款规则配置
    // 注意：已移除 summary 对象，统计数据现在完全由借款记录自动计算
}
```

### 借款记录字段说明

每条借款记录包含以下字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | ✅ | 唯一标识符，自增数字 |
| `date` | string | ✅ | 借款日期，格式：YYYY-MM-DD |
| `borrower` | string | ✅ | 借款人，可选值：'hjf' 或 'hjm' |
| `amount` | number | ✅ | 借款金额，单位：元 |
| `purpose` | string | ✅ | 借款用途，如：生活费、学习用品等 |
| `returnDate` | string | ✅ | 预计归还日期，格式：YYYY-MM-DD |
| `status` | string | ✅ | 状态，可选值：'returned'（已归还）、'pending'（待归还）、'overdue'（逾期） |
| `actualReturnDate` | string\|null | ❌ | 实际归还日期，未归还时为 null |
| `notes` | string | ❌ | 备注信息 |
| `pinned` | boolean | ❌ | **新增**：是否置顶显示，默认为 false |
| `voucher` | string\|null | ❌ | **新增**：凭证图片URL，无凭证时为 null |

### 状态说明

- **returned**: 已归还，需要填写 `actualReturnDate`
- **pending**: 待归还，`actualReturnDate` 为 null
- **overdue**: 逾期未还，超过预计归还日期且未归还

## 新功能说明

### 1. 数据置顶功能

- **置顶标识**：`pinned` 字段为 `true` 的记录会在列表中置顶显示
- **显示效果**：置顶记录有特殊的视觉标识（📌图标和高亮背景）
- **排序规则**：置顶记录优先显示，同级别内按日期倒序排列
- **使用场景**：重要借款、逾期记录、需要特别关注的事项

### 2. 凭证功能

- **凭证字段**：`voucher` 字段存储图片URL
- **显示方式**：在表格中显示缩略图预览
- **查看功能**：点击缩略图可查看大图
- **支持格式**：支持各种在线图片URL
- **无凭证处理**：显示"无"占位符

## 统计数据自动计算

**重要更新**: 系统已升级为完全自动化的统计计算模式。

### 自动计算的统计项目

所有统计数据均从借款记录实时计算，包括：

- **总借款次数**: 各借款人的记录总数
- **总借款金额**: 各借款人的金额总和
- **已归还金额**: 状态为 'returned' 的记录金额总和
- **待归还金额**: 状态为 'pending' 或 'overdue' 的记录金额总和

### 优势

1. **数据一致性**: 统计数据始终与实际记录保持一致
2. **减少维护**: 无需手动计算和更新统计数据
3. **避免错误**: 消除了手动维护可能导致的计算错误
4. **实时更新**: 记录更新后统计数据自动刷新

## 数据维护操作

### 1. 添加新借款记录

在 `records` 数组末尾添加新记录：

```javascript
{
    id: 11, // 使用下一个ID
    date: '2025-03-01',
    borrower: 'hjf',
    amount: 1500,
    purpose: '生活费',
    returnDate: '2025-03-15',
    status: 'pending',
    actualReturnDate: null,
    notes: '3月份生活费',
    pinned: false, // 是否置顶
    voucher: 'https://example.com/voucher.jpg' // 凭证图片URL
}
```

### 2. 更新借款状态

当借款归还时，修改对应记录：

```javascript
// 将状态改为已归还
status: 'returned',
actualReturnDate: '2025-03-10', // 填写实际归还日期
notes: '提前归还' // 可选：更新备注
```

### 3. 处理逾期借款

当借款超过预计归还日期且未归还时：

```javascript
status: 'overdue', // 状态改为逾期
pinned: true, // 建议置顶显示逾期记录
notes: '逾期未还，需要催促' // 可选：添加备注
```

### 4. 设置置顶显示

对于重要或需要特别关注的记录：

```javascript
pinned: true, // 设置为置顶
// 其他字段保持不变
```

### 5. 添加凭证

为借款记录添加凭证图片：

```javascript
voucher: 'https://example.com/path/to/voucher-image.jpg', // 图片URL
// 建议使用稳定的图片服务或CDN
```

## 注意事项

1. **备份数据**: 修改前请备份原数据文件
2. **语法检查**: 修改后检查 JavaScript 语法是否正确
3. **更新时间**: 修改数据后更新 `lastUpdated` 字段
4. **版本号**: 重大变更时更新 `version` 字段
5. **ID唯一性**: 确保每条记录的 ID 都是唯一的
6. **日期格式**: 日期必须使用 YYYY-MM-DD 格式
7. **金额单位**: 金额统一使用元作为单位
8. **⚠️ 不要手动添加统计数据**: 系统现在会自动计算所有统计信息
9. **图片URL**: 确保凭证图片URL有效且可访问
10. **置顶使用**: 避免过多记录置顶，建议只对重要事项使用

## 示例操作

### 新增借款记录（含置顶和凭证）
```javascript
// 在 records 数组末尾添加
{
    id: 11,
    date: '2025-03-05',
    borrower: 'hjm',
    amount: 600,
    purpose: '购买教材',
    returnDate: '2025-03-20',
    status: 'pending',
    actualReturnDate: null,
    notes: '新学期教材费',
    pinned: false, // 普通记录不置顶
    voucher: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80' // 凭证图片
}
```

### 标记借款已归还
```javascript
// 找到对应记录，修改状态
{
    id: 3,
    // ... 其他字段保持不变
    status: 'returned',
    actualReturnDate: '2025-02-14',
    notes: '按时归还',
    pinned: false // 归还后可取消置顶
}
```

### 处理逾期借款（置顶显示）
```javascript
// 超过 returnDate 且未归还的记录
{
    id: 8,
    // ... 其他字段保持不变
    status: 'overdue',
    pinned: true, // 逾期记录建议置顶
    notes: '逾期未还，已催促'
}
```

## 数据验证

修改数据后，可以通过以下方式验证：

1. 在浏览器中打开网页，检查生活费用页面是否正常显示
2. 检查统计数据是否正确（现在会自动计算）
3. 验证借款记录表格是否正确显示所有记录
4. 测试置顶功能是否正常工作
5. 点击凭证图片确认查看器功能正常

## 升级说明

- **v1.1.0**: 新增数据置顶功能和凭证功能
  - 添加了 `pinned` 字段支持记录置顶
  - 添加了 `voucher` 字段支持凭证图片
  - 实现了图片查看器功能
  - 优化了排序逻辑（置顶优先）
- **v1.0.0**: 引入自动统计计算功能
  - 移除了手动维护的 `summary` 对象
  - 所有统计数据现在完全基于借款记录自动计算
  - 提升了数据的一致性和可维护性 