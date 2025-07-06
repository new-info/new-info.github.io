# 凭证系统 NPM 命令

## 🚀 快速开始

### 初始化文件夹结构
```bash
npm run vouchers:setup
```
创建必要的文件夹结构和占位图片，首次使用时运行。

### 加密凭证图片
```bash
npm run vouchers:encrypt
```
扫描并加密 `vouchers/hjf/` 和 `vouchers/hjm/` 文件夹中的所有图片。

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
   npm run vouchers:encrypt
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

## 📖 详细文档

查看完整文档：[VOUCHER_SYSTEM_GUIDE.md](./VOUCHER_SYSTEM_GUIDE.md) 