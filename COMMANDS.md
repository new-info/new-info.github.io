# 项目命令说明

## 开发命令

### `npm run dev`
**快速开发模式**：扫描内容 → 启动本地服务器
- 用于日常开发和调试
- 假设文件已处于所需状态（解密或加密）
- 快速启动，无额外加密/解密操作
- 自动打开浏览器访问 http://localhost:8000

### `npm run dev:decrypt`
**解密开发模式**：解密文件 → 扫描内容 → 启动本地服务器
- 用于文件当前是加密状态，需要解密后进行开发的场景
- 确保文件处于解密状态，便于查看和编辑
- 适合从生产环境切换到开发环境时使用

### `npm run dev:encrypted`
**加密开发模式**：构建加密版本 → 启动本地服务器
- 用于测试加密文件在浏览器中的显示效果
- 验证iframe和加密功能是否正常工作

## 构建命令

### `npm run build`
**生产构建**：扫描内容 → 加密文件
- 用于生产环境部署
- 输出加密后的文件，保护内容安全
- 部署前必须执行此命令

### `npm run build:dev`
**开发构建**：仅扫描内容，不加密
- 用于生成数据文件但保持文件解密状态
- 适用于需要查看原始内容的场景

## 工具命令

### `npm run encrypt`
**手动加密**：加密所有HTML文件
- 独立的加密操作

### `npm run decrypt`
**手动解密**：解密所有HTML文件
- 独立的解密操作

### `npm run encrypt:status`
**查看加密状态**：检查所有文件的加密状态

### `npm run scan`
**扫描内容**：更新notes-data.js和文件索引

### `npm run icons`
**生成图标**：创建PWA所需的图标文件

### `npm run start`
**启动服务器**：在8000端口启动HTTP服务器

### `npm run deploy`
**部署到GitHub Pages**：构建 → 提交 → 推送
- 自动执行完整的部署流程

## 典型工作流程

### 日常开发（文件已解密）
```bash
npm run dev          # 快速开始开发
# 编辑文件...
npm run dev          # 重新启动查看更改
```

### 从加密状态开始开发
```bash
npm run dev:decrypt  # 解密并开始开发
# 编辑文件...
npm run dev          # 后续使用快速模式
```

### 测试加密效果
```bash
npm run dev:encrypted  # 测试加密文件显示
```

### 部署到生产
```bash
npm run deploy       # 一键部署
```

### 手动操作
```bash
npm run decrypt      # 解密文件进行编辑
# 编辑文件...
npm run build        # 重新扫描和加密
```

### 检查当前状态
```bash
npm run encrypt:status  # 查看文件加密状态
``` 