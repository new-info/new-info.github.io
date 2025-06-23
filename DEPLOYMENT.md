# 部署指南

本文档将指导你如何将学习笔记平台部署到 GitHub Pages。

## 🚀 快速开始

### 1. 准备工作

确保你已经：
- 拥有 GitHub 账户
- 安装了 Git
- 对 Git 基本操作有了解

### 2. 创建 GitHub 仓库

1. 登录 GitHub
2. 点击右上角的 "+" 按钮，选择 "New repository"
3. 填写仓库信息：
   - Repository name: `GithubPage` (或其他你喜欢的名字)
   - Description: `学习笔记平台`
   - 设置为 Public
   - 不要勾选 "Add a README file"（我们已经有了）
4. 点击 "Create repository"

### 3. 上传代码

在你的项目目录中执行：

```bash
# 初始化 Git 仓库（如果还没有的话）
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: 学习笔记平台"

# 设置主分支
git branch -M main

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/YOUR_USERNAME/GithubPage.git

# 推送代码
git push -u origin main
```

### 4. 启用 GitHub Pages

1. 进入你的 GitHub 仓库页面
2. 点击 "Settings" 选项卡
3. 在左侧菜单中找到 "Pages"
4. 在 "Source" 部分：
   - 选择 "Deploy from a branch"
   - Branch 选择 "main"
   - Folder 选择 "/ (root)"
5. 点击 "Save"

### 5. 访问网站

等待 1-2 分钟后，你的网站将在以下地址可用：
```
https://YOUR_USERNAME.github.io/REPOSITORY_NAME
```

## 📝 添加新笔记

### 方法一：通过 GitHub 网页界面

1. 进入你的仓库
2. 导航到对应的年份和作者目录（如 `2025/hjf/`）
3. 点击 "Add file" → "Create new file"
4. 输入文件名（如 `2-Jun.html`）
5. 复制并修改现有笔记的 HTML 结构
6. 点击 "Commit new file"

### 方法二：本地添加后推送

1. 在本地对应目录创建新的 HTML 文件
2. 编写笔记内容
3. 提交并推送：
   ```bash
   git add .
   git commit -m "添加新笔记: 标题"
   git push
   ```

## 🎨 自定义设置

### 修改主题颜色

编辑 `assets/css/main.css` 文件中的 CSS 变量：
```css
:root {
    --primary-color: #1a2980;    /* 主色调 */
    --secondary-color: #26d0ce;  /* 次要色调 */
    --accent-color: #667eea;     /* 强调色 */
}
```

### 修改网站标题

编辑 `index.html` 中的以下部分：
```html
<title>学习笔记 - GitHub Pages</title>
<h1 class="logo">📚 学习笔记</h1>
```

### 添加新的笔记作者

1. 在年份目录下创建新的作者目录
2. 修改 `assets/js/main.js` 中的 `scanNotes` 方法
3. 在主页导航中添加新的链接

## 📱 PWA 配置

### 添加图标

1. 创建各种尺寸的图标文件
2. 将它们放在 `assets/icons/` 目录中
3. 图标文件命名格式：`icon-{size}x{size}.png`

### 修改应用信息

编辑 `manifest.json` 文件：
```json
{
    "name": "你的应用名称",
    "short_name": "短名称",
    "description": "应用描述"
}
```

## 🔧 高级配置

### 自定义域名

1. 购买域名
2. 在仓库根目录创建 `CNAME` 文件
3. 在文件中写入你的域名（如 `notes.example.com`）
4. 在域名提供商处配置 DNS

### 启用 HTTPS

GitHub Pages 自动为 `.github.io` 域名启用 HTTPS。
对于自定义域名，在 Pages 设置中勾选 "Enforce HTTPS"。

## 🐛 常见问题

### 网站没有更新
- 等待几分钟，GitHub Pages 更新需要时间
- 检查 Actions 选项卡是否有构建错误
- 清除浏览器缓存

### 图标不显示
- 确保图标文件路径正确
- 检查文件格式是否为 PNG
- 暂时从 `manifest.json` 中移除图标配置

### 移动端显示异常
- 检查 `assets/css/mobile.css` 是否正确加载
- 使用浏览器开发者工具调试

## 📊 监控和分析

### GitHub Actions
查看 Actions 选项卡了解部署状态和错误信息。

### Google Analytics（可选）
在 HTML 文件的 `<head>` 部分添加 Google Analytics 代码。

## 🔒 安全注意事项

- 不要在公开仓库中包含敏感信息
- 定期更新依赖项
- 使用 HTTPS

## 📞 获取帮助

如果遇到问题：
1. 查看 GitHub Pages 官方文档
2. 检查仓库的 Issues 部分
3. 在相关技术社区寻求帮助

---

🎉 **恭喜！你的学习笔记平台已经成功部署了！** 