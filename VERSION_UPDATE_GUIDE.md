# 版本更新指南

## 概述

本系统已实现集中的版本管理机制，用户只需要修改一个版本号即可触发所有缓存清理和版本更新。

## 快速更新步骤

### 1. 修改版本号
编辑 `assets/js/app-config.js` 文件，修改版本号：

```javascript
window.APP_CONFIG = {
    version: {
        // 主版本号 - 修改此版本号将触发所有缓存清理
        app: '1.0.1', // 从 1.0.0 改为 1.0.1
        // Service Worker版本 - 通常与app版本保持一致
        sw: '1.0.1',
        // 缓存版本 - 用于区分不同版本的缓存
        cache: '1.0.1',
        // 数据版本 - 用于数据格式变更
        data: '1.0.0'
    },
    // ... 其他配置
};
```

### 2. 自动更新
修改版本号后，系统会自动：
- 检测版本变化
- 清理所有缓存（localStorage、Service Worker缓存、内存缓存）
- 保留重要数据（认证状态、主题设置等）
- 显示更新通知
- 记录更新历史

### 3. 手动触发更新（可选）
如果需要立即触发更新，可以在浏览器控制台执行：

```javascript
// 手动触发版本更新
window.versionUpdater.triggerManualUpdate();

// 或者使用版本管理器
window.VersionManager.triggerVersionUpdate();
```

## 版本号规范

### 语义化版本
使用 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- **主版本号** (Major): 不兼容的 API 修改
- **次版本号** (Minor): 向下兼容的功能性新增
- **修订号** (Patch): 向下兼容的问题修正

### 版本号示例
```javascript
// 主版本更新 - 重大变更
app: '2.0.0'

// 次版本更新 - 新功能
app: '1.1.0'

// 修订版本更新 - 问题修复
app: '1.0.1'

// 预发布版本
app: '1.0.0-beta.1'
```

## 配置说明

### 版本配置
```javascript
version: {
    app: '1.0.0',      // 主应用版本
    sw: '1.0.0',       // Service Worker版本
    cache: '1.0.0',    // 缓存版本
    data: '1.0.0'      // 数据版本
}
```

### 缓存配置
```javascript
cache: {
    // 核心资源缓存名称
    core: 'live-analysis-platform-v1.0.0',
    // 动态资源缓存名称
    dynamic: 'dynamic-resources-v1.0.0',
    // 缓存清理间隔（毫秒）
    cleanupInterval: 1000 * 60 * 60, // 1小时
    // 缓存过期时间（毫秒）
    expirationTime: 7 * 24 * 60 * 60 * 1000, // 7天
    // 保留的本地存储键
    preservedKeys: [
        'app-last-version',
        'app-cleanup-history',
        'notes_auth_status',
        'app-theme',
        // ... 其他重要数据
    ]
}
```

### 通知配置
```javascript
notifications: {
    enabled: true,              // 通知开关
    browser: true,              // 浏览器通知
    inPage: true,               // 页面内通知
    sw: true,                   // Service Worker通知
    silentMode: false,          // 静音模式
    displayDuration: 6000,      // 显示时长
    throttleInterval: 2000,     // 节流间隔
    cacheThrottle: 10000        // 缓存通知节流
}
```

## 功能特性

### 1. 自动检测
- 页面加载时自动检测版本变化
- 比较当前版本与上次记录版本
- 自动触发更新流程

### 2. 智能清理
- **本地存储清理**: 删除过期数据，保留重要配置
- **Service Worker缓存清理**: 删除所有旧版本缓存
- **内存缓存清理**: 清理图片缓存、通知队列等

### 3. 数据保护
- 保留用户认证状态
- 保留主题设置
- 保留通知偏好
- 保留其他重要配置

### 4. 用户反馈
- 显示更新进度通知
- 显示更新完成通知
- 记录更新历史
- 错误处理和提示

### 5. 开发支持
- 开发环境检测
- 详细日志输出
- 手动更新接口
- 更新历史查看

## 使用示例

### 示例1: 修复问题
```javascript
// 修改版本号
version: {
    app: '1.0.1',  // 修复了一个bug
    sw: '1.0.1',
    cache: '1.0.1',
    data: '1.0.0'
}
```

### 示例2: 添加新功能
```javascript
// 修改版本号
version: {
    app: '1.1.0',  // 添加了新功能
    sw: '1.1.0',
    cache: '1.1.0',
    data: '1.0.0'
}
```

### 示例3: 重大更新
```javascript
// 修改版本号
version: {
    app: '2.0.0',  // 重大架构变更
    sw: '2.0.0',
    cache: '2.0.0',
    data: '2.0.0'
}
```

## 调试和监控

### 查看版本信息
```javascript
// 获取当前版本
console.log('当前版本:', window.VersionManager.getCurrentVersion());

// 获取配置信息
console.log('应用配置:', window.APP_CONFIG);
```

### 查看更新历史
```javascript
// 获取更新历史
const history = window.versionUpdater.getUpdateHistory();
console.log('更新历史:', history);

// 清除更新历史
window.versionUpdater.clearUpdateHistory();
```

### 手动触发更新
```javascript
// 手动触发版本更新
window.versionUpdater.triggerManualUpdate();

// 或者使用版本管理器
window.VersionManager.triggerVersionUpdate();
```

## 注意事项

### 1. 版本号一致性
- 确保 `app`、`sw`、`cache` 版本号保持一致
- 只有数据格式变更时才修改 `data` 版本号

### 2. 测试建议
- 在开发环境测试版本更新功能
- 确保重要数据在更新后仍然保留
- 验证缓存清理是否正常工作

### 3. 用户通知
- 重大更新时建议提前通知用户
- 更新过程中显示进度提示
- 更新完成后显示成功通知

### 4. 回滚策略
- 保留更新历史以便回滚
- 重要更新前备份用户数据
- 提供手动回滚接口

## 故障排除

### 问题1: 版本更新不生效
**解决方案:**
1. 检查版本号格式是否正确
2. 确认 `app-config.js` 文件已正确加载
3. 手动触发更新: `window.versionUpdater.triggerManualUpdate()`

### 问题2: 缓存清理不完整
**解决方案:**
1. 检查浏览器控制台错误信息
2. 手动清理缓存: `window.VersionManager.clearSWCache()`
3. 刷新页面重新加载

### 问题3: 重要数据丢失
**解决方案:**
1. 检查 `preservedKeys` 配置是否包含重要键
2. 从更新历史中恢复数据
3. 重新设置用户偏好

---

🔧 **开发提示**: 在开发环境中，可以启用详细日志来监控版本更新过程。修改 `app-config.js` 中的 `development.debug` 为 `true` 即可。 