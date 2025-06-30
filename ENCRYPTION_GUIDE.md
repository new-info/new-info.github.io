# 🔐 HTML文件加密指南

## 加密技术

本项目使用基于WebAssembly的XOR加密技术保护HTML文件：
- **双重加密**: Base64编码 + XOR加密 (KEY=配置)
- **WASM执行**: 加密逻辑在WebAssembly沙箱中运行
- **密码验证**: 使用输入密码的前三位进行验证

## 使用方法

### 开发流程
```bash
# 完整构建（包括WASM编译和文件加密）
npm run build

# 开发模式（不加密）
npm run dev

# 查看加密状态
npm run encrypt:status

# 部署到生产环境
npm run deploy
```

### 单独操作
```bash
# 只构建WASM模块
npm run wasm:build

# 只加密文件
npm run encrypt

# 启动本地服务器
npm run start
```

## 文件结构

### 核心文件
- `src/lib.rs` - WASM加密核心代码
- `Cargo.toml` - Rust项目配置
- `build-wasm.sh` - WASM构建脚本
- `scripts/encrypt-html.js` - 文件加密脚本

### 生成文件
- `assets/wasm/` - 编译生成的WASM模块
- `2025/hjf/` - hjf的加密文件
- `2025/hjm/` - hjm的加密文件

## 密码机制

### 加密密钥
- 配置KEY: 从环境变量读取（用于XOR加密）
- 确保所有文件使用相同密钥加密

### 用户密码
访问加密页面时，用户需要输入密码：
- 系统使用密码前三位生成验证密钥
- 验证算法: `hash = hash * 31 + char_code`
- 密钥范围: 1-255

## 工作原理

### 加密流程
1. 读取原始HTML文件
2. 进行Base64编码
3. 使用配置KEY进行XOR加密
4. 再次Base64编码
5. 生成带密码界面的加密页面

### 解密流程
1. 用户访问加密页面
2. 输入密码并验证
3. WASM模块自动加载
4. 执行双重解密
5. 还原原始HTML内容

## 浏览器兼容性

支持所有现代浏览器：
- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

## 故障排除

### 常见问题

**构建失败**
- 确保已安装Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- 检查网络连接
- 运行: `source ~/.cargo/env`

**页面解密失败**
- 确保WASM文件正确加载
- 检查密码是否正确
- 查看浏览器控制台错误信息

**文件未加密**
- 运行: `npm run encrypt:status`
- 确保WASM模块已构建: `npm run wasm:build`
- 重新加密: `npm run encrypt`

## 性能数据

- WASM模块大小: ~31KB
- 首次加载时间: 100-500ms
- 解密速度: 接近原生性能
- 内存占用: 轻量级

## 安全特性

1. **双层保护**: Base64混淆 + XOR加密
2. **沙箱执行**: WASM隔离环境
3. **密码保护**: 基于密码的访问控制
4. **内容隐藏**: 加密后无法直接查看源码

---

**✅ 项目已完全切换到WASM加密系统，删除了所有原有的base64加密相关文件** 