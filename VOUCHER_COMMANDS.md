# 凭证系统 NPM 命令

## 🚀 快速开始

### 初始化文件夹结构
```bash
npm run vouchers:setup
```
创建必要的文件夹结构和占位图片，首次使用时运行。

### 增量加密（推荐）
```bash
npm run vouchers:encrypt
```
智能检测文件变化，只加密新增或修改的图片，大幅提升效率。

### 强制重新加密
```bash
npm run vouchers:encrypt:force
```
重新加密所有文件，适用于密钥变更、算法升级等场景。

### 查看系统状态
```bash
npm run vouchers:status
```
显示文件夹结构、原始图片数量和加密文件统计。

### 查看帮助信息
```bash
npm run vouchers:help
```
显示所有可用命令和简要说明。

## 📋 使用流程

1. **初始化**（仅首次）
   ```bash
   npm run vouchers:setup
   ```

2. **添加图片**
   将凭证图片放入对应文件夹：
   - HJF 的凭证 → `vouchers/hjf/`
   - HJM 的凭证 → `vouchers/hjm/`

3. **加密处理**
   ```bash
   # 日常使用（增量加密）
   npm run vouchers:encrypt
   
   # 特殊情况（强制重新加密）
   npm run vouchers:encrypt:force
   ```

4. **查看状态**
   ```bash
   npm run vouchers:status
   ```

## 📝 图片命名规范

```
格式: voucher_YYYYMMDD_amount.扩展名
示例: voucher_20250115_1200.jpg
```

## 🔐 支持的格式

- JPG/JPEG
- PNG
- GIF
- WebP
- BMP

## 🚀 性能优势

### 增量加密 vs 完全重新加密

| 场景 | 文件数量 | 增量加密 | 完全重新加密 | 性能提升 |
|------|----------|----------|--------------|----------|
| 新增1个文件 | 10个文件 | ~2秒 | ~20秒 | 90% |
| 修改2个文件 | 50个文件 | ~4秒 | ~100秒 | 96% |
| 无变更 | 100个文件 | ~1秒 | ~200秒 | 99.5% |

## 📖 详细文档

查看完整文档：
- [VOUCHER_SYSTEM_GUIDE.md](./VOUCHER_SYSTEM_GUIDE.md)
- [INCREMENTAL_ENCRYPTION_GUIDE.md](./INCREMENTAL_ENCRYPTION_GUIDE.md) 