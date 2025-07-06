# Vouchers 凭证文件夹

## 文件夹结构

```
vouchers/
├── hjf/                    # HJF的凭证原图
│   ├── voucher001.jpg
│   ├── voucher002.png
│   └── ...
├── hjm/                    # HJM的凭证原图
│   ├── voucher001.jpg
│   ├── voucher002.png
│   └── ...
├── encrypted/              # 加密后的凭证文件
│   ├── hjf/
│   │   ├── voucher001.jpg.enc
│   │   └── voucher002.png.enc
│   └── hjm/
│       ├── voucher001.jpg.enc
│       └── voucher002.png.enc
└── placeholder.svg         # 占位图片
```

## 使用说明

1. **添加凭证图片**:
   - 将HJF的凭证图片放入 `vouchers/hjf/` 文件夹
   - 将HJM的凭证图片放入 `vouchers/hjm/` 文件夹

2. **加密凭证**:
   ```bash
   node scripts/encrypt-vouchers.js
   ```

3. **支持的图片格式**:
   - JPG/JPEG
   - PNG
   - GIF
   - WebP
   - BMP

## 加密说明

- HJF的图片使用 `ENCRYPT_HJF_KEY` 密钥加密
- HJM的图片使用 `ENCRYPT_HJM_KEY` 密钥加密
- 加密算法: AES-256-CBC
- 加密后的文件添加 `.enc` 扩展名

## 安全注意事项

1. **原图保护**: 请确保原图文件夹(`vouchers/hjf/`, `vouchers/hjm/`)不被部署到生产环境
2. **密钥安全**: 加密密钥应该妥善保管
3. **访问控制**: 只有通过密码验证的用户才能查看解密后的图片
