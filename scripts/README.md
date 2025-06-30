# 笔记扫描脚本使用说明

本目录包含了用于自动扫描和管理笔记文件的脚本，支持动态更新和文件监听功能。

## 📁 脚本文件

- `scan-notes.js` - 主要的分析内容扫描脚本
- `scan-files.js` - 项目文件扫描脚本
- `file-monitor.js` - 文件监控和404错误处理
- `create-icons.js` - PWA图标生成脚本
- `demo.js` - 演示和测试脚本
- `manage-patches.js` - 分数补丁管理脚本
- `dev-with-scan.js` - 集成开发环境启动脚本
- `encrypt-html.js` - HTML文件加密脚本，对敏感内容进行base64加密保护
- `README.md` - 本说明文档

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 扫描现有笔记

```bash
# 扫描一次并生成数据文件
npm run scan

# 或直接运行脚本
node scripts/scan-notes.js
```

### 3. 开启文件监听

```bash
# 持续监听文件变化
npm run watch

# 或直接运行
node scripts/scan-notes.js --watch
```

## 📝 主要功能

### 自动扫描

脚本会自动扫描以下目录：
- `2025/hjf/` - HJF的笔记
- `2025/hjm/` - HJM的笔记

#### 扫描规则：
1. **普通笔记**：`*.html`（不以`-review.html`结尾）
2. **评分报告**：`*-review.html`
3. **自动关联**：按照文件名自动关联笔记和评分报告

#### 示例：
```
2025/hjf/1-Jun.html          ← 笔记
2025/hjf/1-Jun-review.html   ← 对应的评分报告（自动关联）
```

### 数据提取

从HTML文件中自动提取：
- **标题**：从`<title>`或`<h1>`标签
- **预览**：文本内容的前150个字符
- **日期**：文件修改时间
- **作者**：根据目录自动识别

### 生成数据文件

扫描完成后会生成：
- `assets/js/notes-data.js` - 包含所有笔记数据的JavaScript文件
- 自动更新`index.html`和`main.js`文件

## 🛠️ 脚本命令

### scan-notes.js

```bash
# 基本用法
node scripts/scan-notes.js [选项]

# 选项
--watch, -w    # 监听文件变化，自动更新
--help, -h     # 显示帮助信息

# 示例
node scripts/scan-notes.js           # 扫描一次
node scripts/scan-notes.js --watch   # 持续监听
```

### demo.js

```bash
# 创建演示笔记
node scripts/demo.js create

# 清理演示文件
node scripts/demo.js clean

# 显示帮助
node scripts/demo.js help
```

## 📊 文件监听

开启监听模式后，脚本会自动监听：
- 新增HTML文件
- 修改现有文件
- 删除文件

### 监听事件：
```bash
新增文件: 2025/hjf/new-note.html
文件修改: 2025/hjm/existing-note.html
文件删除: 2025/hjf/old-note.html
```

每次变化都会自动重新生成数据文件。

## 🎯 工作流程

### 日常使用流程：

1. **启动监听**
   ```bash
   npm run watch
   ```

2. **添加新笔记**
   - 在对应目录创建HTML文件
   - 脚本自动检测并更新

3. **添加评分报告**
   - 创建`文件名-review.html`格式的文件
   - 自动关联到对应笔记

4. **查看更新**
   - 刷新浏览器查看新笔记
   - 数据实时同步

### 部署流程：

1. **生成数据**
   ```bash
   npm run build
   ```

2. **提交代码**
   ```bash
   git add .
   git commit -m "更新笔记"
   git push
   ```

3. **GitHub Pages自动部署**

## 📋 数据格式

生成的数据文件格式：

```javascript
window.NOTES_DATA = {
  "hjf": [
    {
      "path": "2025/hjf/1-Jun.html",
      "title": "今天算是长见识了！",
      "date": "2025-06-23",
      "author": "hjf",
      "preview": "内容预览...",
      "reviewReport": {  // 如果有评分报告
        "path": "2025/hjf/1-Jun-review.html",
        "title": "评估报告",
        "date": "2025-06-23",
        "author": "hjf",
        "isReview": true,
        "preview": "评分内容..."
      }
    }
  ],
  "hjm": [...],
  "lastUpdated": "2025-06-23T08:55:56.287Z"
};
```

## 🔧 自定义配置

### 修改扫描路径

编辑`scan-notes.js`中的路径配置：

```javascript
this.notesDir = path.join(this.rootDir, '2025');  // 年份目录
```

### 修改关联规则

在`scanAuthorNotes`方法中修改：

```javascript
const reviewFileName = file.replace('.html', '-review.html');
```

### 添加新作者

1. 创建新的作者目录
2. 在脚本中添加作者识别逻辑
3. 更新HTML导航

## 🐛 故障排除

### 常见问题：

1. **文件监听不工作**
   - 检查权限设置
   - 确保目录存在
   - 重启监听服务

2. **标题提取失败**
   - 检查HTML格式
   - 确保有`<title>`或`<h1>`标签
   - 查看控制台错误信息

3. **关联失败**
   - 检查文件命名格式
   - 确保评分文件以`-review.html`结尾
   - 路径大小写匹配

### 调试模式：

```bash
# 查看详细日志
DEBUG=notes-scanner node scripts/scan-notes.js --watch
```

## 📈 性能优化

- 使用文件监听而非轮询
- 增量更新而非全量扫描
- 缓存解析结果
- 异步处理文件操作

## 🔒 HTML文件加密功能

为了保护敏感内容，项目提供了HTML文件加密功能，支持对hjf和hjm文件夹下的HTML文件进行base64加密。

### 加密特性

- **透明加密**：加密后的文件在浏览器中正常显示
- **自动解密**：扫描时自动检测并解密内容
- **功能保持**：不影响预览生成、标题提取等功能
- **安全保护**：文件内容以base64编码存储，避免直接泄露

### 使用方法

#### 加密所有HTML文件
```bash
node scripts/encrypt-html.js encrypt
```

#### 解密所有HTML文件
```bash
node scripts/encrypt-html.js decrypt
```

#### 检查加密状态
```bash
node scripts/encrypt-html.js status
```

#### 显示帮助信息
```bash
node scripts/encrypt-html.js --help
```

### 加密原理

1. **原始文件**：正常的HTML文件
2. **加密处理**：将整个HTML内容进行base64编码
3. **包装存储**：创建包含解密逻辑的HTML包装器
4. **自动解密**：浏览器打开时自动解密并显示原始内容

### 加密后的文件格式

```html
<!DOCTYPE html>
<html>
<head>
    <title>Encrypted Content</title>
    <script>
        function decryptContent() {
            // 自动解密逻辑
        }
    </script>
</head>
<body onload="decryptContent()">
    <div>正在解密内容...</div>
    <div id="encrypted-content" style="display:none;">
        [BASE64_ENCODED_CONTENT]
    </div>
</body>
</html>
```

### 扫描兼容性

`scan-notes.js` 已经集成了自动解密功能：

- **自动检测**：扫描时自动识别加密文件
- **透明解密**：无需额外配置，自动解码内容
- **功能完整**：预览生成、标题提取、分数解析等功能正常工作

### 工作流程

1. **开发阶段**：
   ```bash
   # 解密文件以便编辑
   node scripts/encrypt-html.js decrypt
   
   # 编辑HTML文件
   # ...
   
   # 重新加密
   node scripts/encrypt-html.js encrypt
   ```

2. **生产部署**：
   ```bash
   # 确保文件已加密
   node scripts/encrypt-html.js status
   
   # 部署到生产环境
   git add . && git commit -m "deploy encrypted content"
   ```

### 注意事项

- 加密后的文件仍可在浏览器中正常访问
- 扫描功能会自动处理加密文件，无需手动解密
- 建议在提交代码前确认文件已加密
- 加密主要防止源码泄露，非军用级安全保护

## 🔒 安全注意事项

- 不要扫描敏感文件
- 检查文件路径安全性
- 限制文件大小
- 验证HTML内容
- 定期检查文件加密状态

---

## 📞 获取帮助

如果遇到问题：
1. 查看控制台错误信息
2. 检查文件权限和路径
3. 参考本文档的故障排除部分
4. 运行演示脚本测试功能

## 🎉 最佳实践

1. **文件命名**：使用有意义的文件名
2. **内容结构**：保持HTML结构清晰
3. **定期备份**：重要笔记要有备份
4. **版本控制**：使用Git管理变更
5. **文档更新**：及时更新使用说明 