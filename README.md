# 大学生活平台

基于GitHub Pages的静态网站，用于记录大学生活，助力学习成长。包含视频分析、评分报告等功能模块。支持动态更新、移动端访问、奖金统计和分析员绩效对比。

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 安全开发模式（推荐）
npm run dev:safe

# 或标准开发模式
npm run dev
```

### 构建项目

```bash
npm run build
```

### 部署到GitHub Pages

```bash
npm run deploy
```

## 📊 项目功能

- **大学生活记录**：全方位记录和展示大学生活内容
- **视频分析模块**：展示HJF和HJM的视频分析内容
- **评分系统**：为分析内容提供评分报告
- **奖金计算**：根据评分自动计算奖金（60分及格，满分100分对应100元）
- **分析员统计**：提供分析员绩效对比和统计数据
- **响应式设计**：适配桌面和移动端
- **PWA支持**：支持离线访问和添加到主屏幕
- **404错误处理**：自动检测和处理文件缺失问题

## 📁 项目结构

```
GithubPage/
├── 2025/                   # 分析内容目录（按年份组织）
│   ├── hjf/                # HJF的分析内容
│   └── hjm/                # HJM的分析内容
├── assets/                 # 静态资源
│   ├── css/                # 样式文件
│   ├── icons/              # PWA图标
│   └── js/                 # JavaScript文件
├── scripts/                # 工具脚本
│   ├── scan-notes.js       # 分析内容扫描脚本
│   ├── scan-files.js       # 项目文件扫描脚本
│   ├── create-icons.js     # 图标生成脚本
│   ├── manage-patches.js   # 分数补丁管理脚本
│   └── dev-with-scan.js    # 集成开发环境脚本
├── index.html              # 主页
├── manifest.json           # PWA配置
├── sw.js                   # Service Worker
└── package.json            # 项目配置
```

## 🛠️ 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev:safe` | 安全开发模式（推荐） |
| `npm run dev` | 标准开发模式 |
| `npm run build` | 构建项目 |
| `npm run scan` | 仅扫描分析内容 |
| `npm run scan:watch` | 监听分析内容变化 |
| `npm run scan:files` | 扫描所有项目文件 |
| `npm run scan:files:check` | 检查404错误 |
| `npm run patch:add` | 添加分数补丁 |
| `npm run patch:list` | 列出分数补丁 |
| `npm run patch:remove` | 移除分数补丁 |
| `npm run icons` | 生成PWA图标 |
| `npm run deploy` | 部署到GitHub Pages |

## 📱 PWA支持

项目支持PWA（Progressive Web App）功能：

1. **离线访问**：缓存关键资源，支持离线使用
2. **添加到主屏幕**：可以像原生应用一样添加到主屏幕
3. **响应式设计**：适配各种设备尺寸

## 🔍 文件监控系统

项目包含自动文件监控系统，可以：

1. **检测404错误**：自动检测潜在的文件缺失问题
2. **智能替换**：为缺失的资源提供替代方案
3. **错误报告**：提供详细的错误信息和解决建议

## 💰 奖金计算规则

- 视频分析评分低于60分：无奖金
- 视频分析评分60分及以上：评分即为奖金金额（如75分对应75元）
- 支持通过补丁系统自定义奖金金额

## 🔄 更新内容

1. 在对应目录（`2025/hjf/` 或 `2025/hjm/`）添加HTML文件
2. 对应的评分报告使用 `-review.html` 后缀
3. 运行 `npm run build` 更新数据
4. 刷新页面查看更新后的内容

## 📊 分析员绩效对比

视频分析模块提供分析员绩效对比功能：

- 分析数量统计
- 及格率对比
- 平均分对比
- 累计奖金统计

## 🔧 分数补丁系统

使用补丁系统调整分数和奖金：

```bash
# 列出现有补丁
npm run patch:list

# 添加新补丁
npm run patch:add

# 移除补丁
npm run patch:remove
```

## 📱 移动端支持

项目针对移动端进行了优化：

- 响应式布局
- 触摸友好的界面
- 适配不同屏幕尺寸

## 🚀 部署指南

详细的部署步骤请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📄 许可证

MIT 