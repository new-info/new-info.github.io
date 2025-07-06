const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 加密配置
const ENCRYPT_KEYS = {
    hjf: 'ENCRYPT_HJF_KEY',
    hjm: 'ENCRYPT_HJM_KEY'
};

// 支持的图片格式
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

/**
 * 使用AES-256-CBC加密文件
 * @param {Buffer} data - 要加密的数据
 * @param {string} key - 加密密钥
 * @returns {Buffer} 加密后的数据
 */
function encryptData(data, key) {
    try {
        // 使用密钥生成32字节的加密key
        const encryptKey = crypto.createHash('sha256').update(key).digest();
        
        // 生成随机IV
        const iv = crypto.randomBytes(16);
        
        // 创建加密器（使用正确的createCipheriv方法）
        const cipher = crypto.createCipheriv('aes-256-cbc', encryptKey, iv);
        
        // 加密数据
        let encrypted = cipher.update(data);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        // 将IV和加密数据合并
        return Buffer.concat([iv, encrypted]);
    } catch (error) {
        console.error('加密数据失败:', error);
        throw error;
    }
}

/**
 * 检查并创建目录
 * @param {string} dirPath - 目录路径
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ 创建目录: ${dirPath}`);
    }
}

/**
 * 处理单个图片文件的加密
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputPath - 输出文件路径
 * @param {string} key - 加密密钥
 */
function encryptImageFile(inputPath, outputPath, key) {
    try {
        // 读取原始图片数据
        const imageData = fs.readFileSync(inputPath);
        console.log(`📁 读取文件: ${inputPath} (${imageData.length} bytes)`);
        
        // 加密图片数据
        const encryptedData = encryptData(imageData, key);
        console.log(`🔒 加密完成: ${encryptedData.length} bytes`);
        
        // 写入加密后的文件
        fs.writeFileSync(outputPath, encryptedData);
        console.log(`💾 保存加密文件: ${outputPath}`);
        
        return true;
    } catch (error) {
        console.error(`❌ 加密文件失败 ${inputPath}:`, error.message);
        return false;
    }
}

/**
 * 处理指定用户的vouchers文件夹
 * @param {string} author - 用户名(hjf/hjm)
 */
function processAuthorVouchers(author) {
    const sourceDir = path.join(__dirname, '..', 'vouchers', author);
    const encryptedDir = path.join(__dirname, '..', 'assets', 'vouchers', author);
    
    console.log(`\n🔄 处理 ${author.toUpperCase()} 的凭证文件...`);
    console.log(`📂 源目录: ${sourceDir}`);
    console.log(`🔐 输出目录: ${encryptedDir}`);
    
    // 检查源目录是否存在
    if (!fs.existsSync(sourceDir)) {
        console.log(`⚠️  源目录不存在: ${sourceDir}`);
        console.log(`ℹ️  跳过 ${author} 的处理`);
        return;
    }
    
    // 确保输出目录存在
    ensureDirectoryExists(encryptedDir);
    
    // 获取加密密钥
    const encryptKey = ENCRYPT_KEYS[author];
    if (!encryptKey) {
        console.error(`❌ 未找到 ${author} 的加密密钥`);
        return;
    }
    
    // 读取源目录中的所有文件
    const files = fs.readdirSync(sourceDir);
    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return SUPPORTED_FORMATS.includes(ext);
    });
    
    console.log(`📋 找到 ${imageFiles.length} 个图片文件`);
    
    if (imageFiles.length === 0) {
        console.log(`ℹ️  ${author} 目录中没有可处理的图片文件`);
        return;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    // 处理每个图片文件
    imageFiles.forEach((filename, index) => {
        const inputPath = path.join(sourceDir, filename);
        const outputFilename = filename + '.enc'; // 添加.enc扩展名
        const outputPath = path.join(encryptedDir, outputFilename);
        
        console.log(`\n[${index + 1}/${imageFiles.length}] 处理: ${filename}`);
        
        const success = encryptImageFile(inputPath, outputPath, encryptKey);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
    });
    
    console.log(`\n✅ ${author.toUpperCase()} 处理完成:`);
    console.log(`   成功: ${successCount} 个文件`);
    console.log(`   失败: ${failCount} 个文件`);
}

/**
 * 创建占位图片
 */
function createPlaceholderImage() {
    const placeholderDir = path.join(__dirname, '..', 'assets', 'vouchers');
    const placeholderPath = path.join(placeholderDir, 'placeholder.svg');
    
    // SVG占位图片内容
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#f5f5f5"/>
  <rect x="20" y="20" width="160" height="160" rx="8" fill="white" stroke="#e0e0e0" stroke-width="2"/>
  <circle cx="70" cy="70" r="15" fill="#d9d9d9"/>
  <path d="m85 85 25 25 35-35" stroke="#d9d9d9" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="100" y="170" font-family="Arial, sans-serif" font-size="12" fill="#999" text-anchor="middle">凭证占位图</text>
</svg>`;
    
    try {
        ensureDirectoryExists(placeholderDir);
        fs.writeFileSync(placeholderPath, svgContent);
        console.log(`🖼️  创建占位图片: ${placeholderPath}`);
    } catch (error) {
        console.error('❌ 创建占位图片失败:', error);
    }
}

/**
 * 创建示例图片文件夹结构和说明文档
 */
function createExampleStructure() {
    const vouchersDir = path.join(__dirname, '..', 'vouchers');
    const hjfDir = path.join(vouchersDir, 'hjf');
    const hjmDir = path.join(vouchersDir, 'hjm');
    
    // 创建目录结构
    ensureDirectoryExists(hjfDir);
    ensureDirectoryExists(hjmDir);
    
    // 创建README文件
    const readmeContent = `# Vouchers 凭证文件夹

## 文件夹结构

\`\`\`
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
\`\`\`

## 使用说明

1. **添加凭证图片**:
   - 将HJF的凭证图片放入 \`vouchers/hjf/\` 文件夹
   - 将HJM的凭证图片放入 \`vouchers/hjm/\` 文件夹

2. **加密凭证**:
   \`\`\`bash
   node scripts/encrypt-vouchers.js
   \`\`\`

3. **支持的图片格式**:
   - JPG/JPEG
   - PNG
   - GIF
   - WebP
   - BMP

## 加密说明

- HJF的图片使用 \`ENCRYPT_HJF_KEY\` 密钥加密
- HJM的图片使用 \`ENCRYPT_HJM_KEY\` 密钥加密
- 加密算法: AES-256-CBC
- 加密后的文件添加 \`.enc\` 扩展名

## 安全注意事项

1. **原图保护**: 请确保原图文件夹(\`vouchers/hjf/\`, \`vouchers/hjm/\`)不被部署到生产环境
2. **密钥安全**: 加密密钥应该妥善保管
3. **访问控制**: 只有通过密码验证的用户才能查看解密后的图片
`;
    
    const readmePath = path.join(vouchersDir, 'README.md');
    try {
        fs.writeFileSync(readmePath, readmeContent);
        console.log(`📝 创建说明文档: ${readmePath}`);
    } catch (error) {
        console.error('❌ 创建说明文档失败:', error);
    }
    
    // 创建.gitignore文件，防止原图被提交
    const gitignoreContent = `# 忽略原图文件夹，只保留加密后的文件
hjf/
hjm/

# 保留文件夹结构
!hjf/.gitkeep
!hjm/.gitkeep
`;
    
    const gitignorePath = path.join(vouchersDir, '.gitignore');
    try {
        fs.writeFileSync(gitignorePath, gitignoreContent);
        console.log(`🔒 创建Git忽略文件: ${gitignorePath}`);
    } catch (error) {
        console.error('❌ 创建Git忽略文件失败:', error);
    }
    
    // 创建.gitkeep文件保持文件夹结构
    const hjfKeepPath = path.join(hjfDir, '.gitkeep');
    const hjmKeepPath = path.join(hjmDir, '.gitkeep');
    
    try {
        fs.writeFileSync(hjfKeepPath, '# 保持文件夹结构\n');
        fs.writeFileSync(hjmKeepPath, '# 保持文件夹结构\n');
        console.log(`📁 创建文件夹占位文件`);
    } catch (error) {
        console.error('❌ 创建文件夹占位文件失败:', error);
    }
}

/**
 * 主函数
 */
function main() {
    // 解析命令行参数
    const args = process.argv.slice(2);
    const setupOnly = args.includes('--setup-only');
    const statusOnly = args.includes('--status');

    if (statusOnly) {
        showStatus();
        return;
    }

    console.log('🚀 开始处理凭证文件加密...\n');
    
    try {
        // 创建基础结构和占位图片
        createExampleStructure();
        createPlaceholderImage();
        
        if (setupOnly) {
            console.log('\n✅ 凭证文件夹结构初始化完成！');
            console.log('\n📖 下一步操作：');
            console.log('1. 将凭证图片放入对应的用户文件夹 (vouchers/hjf/, vouchers/hjm/)');
            console.log('2. 运行 npm run vouchers:encrypt 进行加密');
            return;
        }
        
        // 处理各用户的凭证文件
        processAuthorVouchers('hjf');
        processAuthorVouchers('hjm');
        
        console.log('\n🎉 凭证文件加密处理完成！');
        console.log('\n📖 使用说明：');
        console.log('1. 将凭证图片放入对应的用户文件夹 (vouchers/hjf/, vouchers/hjm/)');
        console.log('2. 运行此脚本进行加密');
        console.log('3. 加密后的文件会保存在 vouchers/encrypted/ 文件夹中');
        console.log('4. 前端会自动使用加密后的文件，并在用户验证密码后解密显示');
        
    } catch (error) {
        console.error('❌ 处理过程中出现错误:', error);
        process.exit(1);
    }
}

/**
 * 显示当前状态
 */
function showStatus() {
    console.log('📊 凭证加密系统状态\n');
    
    const vouchersDir = path.join(__dirname, '..', 'vouchers');
    const hjfDir = path.join(vouchersDir, 'hjf');
    const hjmDir = path.join(vouchersDir, 'hjm');
    const assetsVouchersDir = path.join(__dirname, '..', 'assets', 'vouchers');
    const placeholderPath = path.join(assetsVouchersDir, 'placeholder.svg');
    
    // 检查基础结构
    console.log('📁 文件夹结构:');
    console.log(`   vouchers/           ${fs.existsSync(vouchersDir) ? '✅' : '❌'}`);
    console.log(`   vouchers/hjf/       ${fs.existsSync(hjfDir) ? '✅' : '❌'}`);
    console.log(`   vouchers/hjm/       ${fs.existsSync(hjmDir) ? '✅' : '❌'}`);
    console.log(`   assets/vouchers/    ${fs.existsSync(assetsVouchersDir) ? '✅' : '❌'}`);
    console.log(`   placeholder.svg     ${fs.existsSync(placeholderPath) ? '✅' : '❌'}`);
    
    // 统计原始图片
    console.log('\n📷 原始图片统计:');
    ['hjf', 'hjm'].forEach(author => {
        const authorDir = path.join(vouchersDir, author);
        if (fs.existsSync(authorDir)) {
            const files = fs.readdirSync(authorDir);
            const imageFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return SUPPORTED_FORMATS.includes(ext);
            });
            console.log(`   ${author.toUpperCase()}: ${imageFiles.length} 个图片文件`);
            if (imageFiles.length > 0) {
                imageFiles.forEach(file => {
                    console.log(`     - ${file}`);
                });
            }
        } else {
            console.log(`   ${author.toUpperCase()}: 文件夹不存在`);
        }
    });
    
    // 统计加密文件
    console.log('\n🔐 加密文件统计:');
    ['hjf', 'hjm'].forEach(author => {
        const encryptedAuthorDir = path.join(__dirname, '..', 'assets', 'vouchers', author);
        if (fs.existsSync(encryptedAuthorDir)) {
            const files = fs.readdirSync(encryptedAuthorDir);
            const encFiles = files.filter(file => file.endsWith('.enc'));
            console.log(`   ${author.toUpperCase()}: ${encFiles.length} 个加密文件`);
            if (encFiles.length > 0) {
                encFiles.forEach(file => {
                    const filePath = path.join(encryptedAuthorDir, file);
                    const stats = fs.statSync(filePath);
                    const sizeKB = Math.round(stats.size / 1024);
                    console.log(`     - ${file} (${sizeKB}KB)`);
                });
            }
        } else {
            console.log(`   ${author.toUpperCase()}: 加密文件夹不存在`);
        }
    });
    
    console.log('\n💡 快速命令:');
    console.log('   npm run vouchers:setup   - 初始化文件夹结构');
    console.log('   npm run vouchers:encrypt - 加密所有图片');
    console.log('   npm run vouchers:help    - 显示帮助信息');
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = {
    encryptData,
    encryptImageFile,
    processAuthorVouchers,
    createPlaceholderImage,
    createExampleStructure,
    showStatus,
    ENCRYPT_KEYS,
    SUPPORTED_FORMATS
}; 