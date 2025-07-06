# 借款记录删除线功能说明

## 功能概述

新增了借款记录删除线功能，用于直观显示已归还的借款记录。当借款记录的状态为 `returned`（已归还）时，可以通过删除线效果来区分已归还和未归还的记录。

## 功能特性

### 1. 删除线效果
- **自动应用**：根据数据中的 `status` 字段自动判断是否显示删除线
- **视觉区分**：已归还记录显示删除线，透明度降低，背景色变化
- **状态保持**：删除线效果会记住用户的选择，下次访问时保持相同状态

### 2. 切换控制
- **切换按钮**：在借款记录表格上方提供"显示删除线/隐藏删除线"按钮
- **实时切换**：点击按钮可以立即切换删除线效果的显示/隐藏
- **状态指示**：按钮会根据当前状态显示不同的文字和样式

### 3. 数据驱动
- **基于状态**：删除线效果完全基于数据中的 `status` 字段
- **无需监测**：不需要实时监测数据变化，直接根据当前数据状态显示
- **正确统计**：统计数据正确反映已归还和未归还的金额

## 技术实现

### 数据结构
```javascript
{
    id: 1,
    date: '2025-01-15',
    borrower: 'hjf',
    amount: 3000,
    purpose: '生活费',
    returnDate: '2025-01-25',
    status: 'returned', // 关键字段：returned, pending, overdue
    actualReturnDate: '2025-01-25',
    notes: '按时归还',
    pinned: true,
    voucher: '111.jpeg'
}
```

### CSS样式
```css
.returned-strikethrough {
    text-decoration: line-through !important;
    opacity: 0.7;
    background: rgba(40, 167, 69, 0.05) !important;
}

.returned-strikethrough td {
    text-decoration: line-through;
    color: #666;
}
```

### JavaScript逻辑
```javascript
// 应用删除线效果
applyStrikethroughEffects() {
    if (!this.strikethroughEnabled) return;

    const tableRows = document.querySelectorAll('#expenses-table-body tr.loan-row');
    
    tableRows.forEach(row => {
        const recordId = row.getAttribute('data-record-id');
        if (recordId) {
            const loan = this.loans.find(l => l.id === parseInt(recordId));
            if (loan && loan.status === 'returned') {
                row.classList.add('returned-strikethrough');
            } else {
                row.classList.remove('returned-strikethrough');
            }
        }
    });
}
```

## 使用方法

### 1. 查看删除线效果
1. 打开生活费用管理页面
2. 点击"显示删除线"按钮
3. 已归还的借款记录会显示删除线效果

### 2. 隐藏删除线效果
1. 点击"隐藏删除线"按钮
2. 所有删除线效果会被移除

### 3. 状态记忆
- 用户的选择会保存在浏览器的 localStorage 中
- 下次访问页面时会自动恢复上次的选择状态

## 数据字段说明

### status 字段
- `returned`：已归还，会显示删除线效果
- `pending`：待归还，不显示删除线效果
- `overdue`：逾期未还，不显示删除线效果

### 相关字段
- `actualReturnDate`：实际归还日期，已归还记录必须填写
- `returnDate`：预计归还日期，所有记录都有

## 统计计算

删除线功能不影响统计计算，统计数据仍然基于 `status` 字段正确计算：

- **已归还金额**：`status === 'returned'` 的记录金额总和
- **待归还金额**：`status === 'pending' || status === 'overdue'` 的记录金额总和
- **总借款金额**：所有记录金额总和

## 响应式设计

删除线功能支持响应式设计：

- **桌面端**：删除线切换按钮位于表格标签右侧
- **移动端**：删除线切换按钮位于表格标签下方，居中显示

## 浏览器兼容性

- 支持所有现代浏览器
- 使用标准的 CSS `text-decoration: line-through` 属性
- 使用 localStorage 保存用户偏好设置

## 注意事项

1. **数据一致性**：删除线效果完全依赖数据中的 `status` 字段
2. **性能优化**：只在需要时应用删除线效果，不影响页面性能
3. **用户体验**：提供切换按钮，用户可以选择是否显示删除线效果
4. **无障碍访问**：删除线效果不影响屏幕阅读器的使用

## 未来扩展

可以考虑的扩展功能：

1. **自定义样式**：允许用户自定义删除线的颜色和样式
2. **批量操作**：提供批量标记归还的功能
3. **动画效果**：添加删除线显示的动画效果
4. **导出功能**：支持导出带有删除线标记的报表 