# 🔐 安全配置指南

## 概述

本项目已移除所有硬编码的敏感信息，现在需要通过环境变量和配置文件来设置加密密钥。

## ⚠️ 重要安全提醒

- 🚫 **禁止在代码中硬编码密钥**
- 🔒 **密钥应通过安全的配置方式提供**
- 📝 **密钥配置文件应添加到 .gitignore 中**
- 🔄 **定期更换密钥以提高安全性**

## 📁 环境变量配置

### 1. 创建 .env 文件

```bash
# 在项目根目录创建 .env 文件
touch .env
```

### 2. 配置加密密钥

```bash
# .env 文件内容
ENCRYPT_KEY=你的加密密钥

# 其他配置
NODE_ENV=production
```

### 3. 验证配置

```bash
# 检查环境变量是否正确设置
node -e "require('dotenv').config(); console.log('ENCRYPT_KEY:', process.env.ENCRYPT_KEY)"
```

## 🌐 客户端密钥配置

### 配置优先级

客户端按以下优先级获取密钥：

1. **URL参数** (仅开发环境): `?key=200`
2. **localStorage**: 由服务端设置
3. **全局配置对象**: `window.APP_CONFIG.ENCRYPT_KEY`
4. **抛出错误**: 未找到配置

### 开发环境设置

```javascript
// 在浏览器控制台中设置密钥（仅开发环境）
debugCrypto.setKey(200);

// 检查配置状态
debugCrypto.checkStatus();

// 清除密钥
debugCrypto.clearKey();
```

### 生产环境设置

```javascript
// 在你的主应用中设置密钥
window.CryptoConfig.setServerKey(yourEncryptKey);
```

## 🚀 部署配置

### 1. 服务端配置

```javascript
// scripts/encrypt-html.js 现在会检查环境变量
// 确保在运行脚本前设置 ENCRYPT_KEY
export ENCRYPT_KEY=你的密钥
node scripts/encrypt-html.js encrypt
```

### 2. 构建时配置

```json
// package.json 脚本
{
  "scripts": {
    "build": "node -r dotenv/config scripts/encrypt-html.js encrypt",
    "decrypt": "node -r dotenv/config scripts/encrypt-html.js decrypt",
    "status": "node -r dotenv/config scripts/encrypt-html.js status"
  }
}
```

### 3. 客户端初始化

```html
<!-- 在主页面中初始化配置 -->
<script>
// 设置全局配置（从服务端安全获取）
window.APP_CONFIG = {
    ENCRYPT_KEY: getKeyFromSecureSource() // 实现你的安全获取逻辑
};
</script>
```

## 🔧 配置验证

### 服务端验证

```bash
# 运行配置检查
npm run status
```

### 客户端验证

```javascript
// 在浏览器控制台检查
window.CryptoConfig.checkKeyStatus();
```

## 📋 最佳实践

### 1. 密钥管理

- ✅ 使用强密钥（避免简单数字）
- ✅ 定期更换密钥
- ✅ 不同环境使用不同密钥
- ✅ 密钥存储在安全的配置服务中

### 2. 环境隔离

```bash
# 开发环境
ENCRYPT_KEY=dev_key_123

# 测试环境  
ENCRYPT_KEY=test_key_456

# 生产环境
ENCRYPT_KEY=prod_key_789
```

### 3. 密钥轮换

```bash
# 1. 生成新密钥
NEW_KEY=new_secure_key_001

# 2. 更新服务端配置
echo "ENCRYPT_KEY=$NEW_KEY" > .env

# 3. 重新加密内容
npm run decrypt
npm run encrypt

# 4. 更新客户端配置
# 通过你的配置管理系统推送新密钥
```

## 🚨 故障排除

### 常见错误

1. **"ENCRYPT_KEY 环境变量未设置"**
   - 检查 .env 文件是否存在
   - 验证环境变量是否正确导入

2. **"未找到服务端加密密钥配置"**
   - 检查客户端配置是否正确设置
   - 验证 crypto-config.js 是否正确加载

3. **"解密失败"**
   - 确认客户端和服务端使用相同密钥
   - 检查密钥格式是否为数字

### 调试命令

```bash
# 检查环境变量
echo $ENCRYPT_KEY

# 验证脚本配置
node -e "console.log('Key:', process.env.ENCRYPT_KEY || 'NOT SET')"

# 测试加密解密
npm run status
```

## 📞 支持

如果遇到配置问题，请：

1. 检查本指南的故障排除部分
2. 验证环境变量设置
3. 查看浏览器控制台错误信息
4. 确认所有配置文件都已正确设置

---

## ⚡ 快速开始

```bash
# 1. 创建配置文件
echo "ENCRYPT_KEY=200" > .env

# 2. 设置客户端密钥（开发环境）
# 在浏览器控制台运行：
# debugCrypto.setKey(200);

# 3. 验证配置
npm run status

# 4. 测试加密
npm run encrypt
```

🎉 **配置完成！现在你的系统使用安全的配置方式管理密钥了。** 