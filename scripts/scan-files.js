#!/usr/bin/env node

/**
 * 文件扫描脚本
 * 扫描项目中的所有文件，生成文件列表，用于检查和管理
 */

const fs = require('fs');
const path = require('path');

class FileScanner {
    constructor() {
        this.rootDir = path.join(__dirname, '..');
        this.outputFile = path.join(this.rootDir, 'assets/js/files-list.js');
        this.ignoreDirs = [
            'node_modules',
            '.git',
            '.github',
            '.vscode',
            'dist',
            '.idea',
            'wasm',
            'scripts'
        ];

        // 忽略的文件名和扩展名
        this.ignoreFiles = [
            '.gitignore',
            '.gitattributes',
            '.env',
            '.DS_Store',
            '.gitlab-ci.yml',
            '.env.local',
            '.env.example',
            'package.json',
            'package-lock.json',
            '.env.example',
        ];

        this.ignoreExtensions = [
            '.md',
            '.rs',
            '.lock',
            '.toml',
            '.sh'
        ];
        this.filesByType = {
            html: [],
            css: [],
            js: [],
            images: [],
            other: []
        };
        this.fileCount = 0;
    }

    // 扫描目录并收集文件
    scanDirectory(dir) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(this.rootDir, fullPath).replace(/\\/g, '/');

                // 忽略特定目录
                if (entry.isDirectory()) {
                    if (!this.ignoreDirs.includes(entry.name)) {
                        this.scanDirectory(fullPath);
                    }
                    continue;
                }

                // 检查是否需要忽略此文件
                const ext = path.extname(entry.name).toLowerCase();

                // 忽略特定文件名
                if (this.ignoreFiles.includes(entry.name)) {
                    continue;
                }

                // 忽略特定扩展名
                if (this.ignoreExtensions.includes(ext)) {
                    continue;
                }

                // 处理文件
                this.fileCount++;

                // 按文件类型分类
                if (['.html', '.htm'].includes(ext)) {
                    this.filesByType.html.push(relativePath);
                } else if (['.css'].includes(ext)) {
                    this.filesByType.css.push(relativePath);
                } else if (['.js'].includes(ext)) {
                    this.filesByType.js.push(relativePath);
                } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'].includes(ext)) {
                    this.filesByType.images.push(relativePath);
                } else {
                    this.filesByType.other.push(relativePath);
                }
            }
        } catch (error) {
            console.error(`扫描目录失败: ${dir}`, error.message);
        }
    }

    // 生成文件列表
    generateFilesList() {
        console.log('开始扫描项目文件...');
        this.scanDirectory(this.rootDir);

        // 按路径排序
        Object.keys(this.filesByType).forEach(type => {
            this.filesByType[type].sort();
        });

        const data = {
            html: this.filesByType.html,
            css: this.filesByType.css,
            js: this.filesByType.js,
            images: this.filesByType.images,
            other: this.filesByType.other,
            lastUpdated: new Date().toISOString()
        };

        const jsContent = `// 自动生成的文件列表
// 最后更新时间: ${data.lastUpdated}

window.FILES_LIST = ${JSON.stringify(data, null, 2)};

// 导出数据供Node.js使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.FILES_LIST;
}
`;

        // 确保目录存在
        const outputDir = path.dirname(this.outputFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(this.outputFile, jsContent, 'utf8');
        console.log(`扫描完成:`);
        console.log(`- HTML文件: ${this.filesByType.html.length} 个`);
        console.log(`- CSS文件: ${this.filesByType.css.length} 个`);
        console.log(`- JS文件: ${this.filesByType.js.length} 个`);
        console.log(`- 图片文件: ${this.filesByType.images.length} 个`);
        console.log(`- 其他文件: ${this.filesByType.other.length} 个`);
        console.log(`- 总计: ${this.fileCount} 个文件`);
        console.log(`文件列表已保存到: ${this.outputFile}`);

        return data;
    }

    // 检查404错误
    check404Errors() {
        console.log('\n检查潜在的404错误...');

        // 读取HTML文件并查找链接
        const links = new Set();
        const scripts = new Set();
        const styles = new Set();
        const images = new Set();

        this.filesByType.html.forEach(htmlFile => {
            try {
                const content = fs.readFileSync(path.join(this.rootDir, htmlFile), 'utf8');

                // 提取链接
                const hrefMatches = content.match(/href=["']([^"']+)["']/g) || [];
                hrefMatches.forEach(match => {
                    const href = match.match(/href=["']([^"']+)["']/)[1];
                    if (!href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
                        links.add(href);
                    }
                });

                // 提取脚本
                const scriptMatches = content.match(/src=["']([^"']+\.js)["']/g) || [];
                scriptMatches.forEach(match => {
                    const src = match.match(/src=["']([^"']+)["']/)[1];
                    if (!src.startsWith('http')) {
                        scripts.add(src);
                    }
                });

                // 提取样式表
                const styleMatches = content.match(/href=["']([^"']+\.css)["']/g) || [];
                styleMatches.forEach(match => {
                    const href = match.match(/href=["']([^"']+)["']/)[1];
                    if (!href.startsWith('http')) {
                        styles.add(href);
                    }
                });

                // 提取图片
                const imgMatches = content.match(/src=["']([^"']+\.(png|jpg|jpeg|gif|svg|ico))["']/g) || [];
                imgMatches.forEach(match => {
                    const src = match.match(/src=["']([^"']+)["']/)[1];
                    if (!src.startsWith('http')) {
                        images.add(src);
                    }
                });

            } catch (error) {
                console.error(`读取文件失败: ${htmlFile}`, error.message);
            }
        });

        // 检查JS文件中的引用
        this.filesByType.js.forEach(jsFile => {
            try {
                const content = fs.readFileSync(path.join(this.rootDir, jsFile), 'utf8');

                // 提取可能的文件引用
                const importMatches = content.match(/import\s+.*?from\s+["']([^"']+)["']/g) || [];
                importMatches.forEach(match => {
                    const src = match.match(/from\s+["']([^"']+)["']/)[1];
                    if (!src.startsWith('http') && !src.includes('node_modules')) {
                        scripts.add(src);
                    }
                });

            } catch (error) {
                console.error(`读取文件失败: ${jsFile}`, error.message);
            }
        });

        // 检查CSS文件中的引用
        this.filesByType.css.forEach(cssFile => {
            try {
                const content = fs.readFileSync(path.join(this.rootDir, cssFile), 'utf8');

                // 提取图片引用
                const urlMatches = content.match(/url\(["']?([^"')]+)["']?\)/g) || [];
                urlMatches.forEach(match => {
                    const url = match.match(/url\(["']?([^"')]+)["']?\)/)[1];
                    if (!url.startsWith('http') && !url.startsWith('data:')) {
                        images.add(url);
                    }
                });

            } catch (error) {
                console.error(`读取文件失败: ${cssFile}`, error.message);
            }
        });

        // 检查文件是否存在
        const allFiles = [...this.filesByType.html, ...this.filesByType.css, ...this.filesByType.js, ...this.filesByType.images, ...this.filesByType.other];
        const missingFiles = {
            links: [...links].filter(link => !this.fileExists(link, allFiles)),
            scripts: [...scripts].filter(script => !this.fileExists(script, allFiles)),
            styles: [...styles].filter(style => !this.fileExists(style, allFiles)),
            images: [...images].filter(image => !this.fileExists(image, allFiles))
        };

        // 输出结果
        let hasMissingFiles = false;

        if (missingFiles.links.length > 0) {
            hasMissingFiles = true;
            console.log('\n可能缺失的链接:');
            missingFiles.links.forEach(link => console.log(`- ${link}`));
        }

        if (missingFiles.scripts.length > 0) {
            hasMissingFiles = true;
            console.log('\n可能缺失的脚本:');
            missingFiles.scripts.forEach(script => console.log(`- ${script}`));
        }

        if (missingFiles.styles.length > 0) {
            hasMissingFiles = true;
            console.log('\n可能缺失的样式表:');
            missingFiles.styles.forEach(style => console.log(`- ${style}`));
        }

        if (missingFiles.images.length > 0) {
            hasMissingFiles = true;
            console.log('\n可能缺失的图片:');
            missingFiles.images.forEach(image => console.log(`- ${image}`));
        }

        if (!hasMissingFiles) {
            console.log('未发现潜在的404错误，所有引用的文件都存在。');
        }

        // 将404错误信息保存到文件
        const errorData = {
            missingFiles,
            lastUpdated: new Date().toISOString()
        };

        const errorJsContent = `// 自动生成的404错误检查结果
// 最后更新时间: ${errorData.lastUpdated}

window.MISSING_FILES = ${JSON.stringify(errorData, null, 2)};

// 导出数据供Node.js使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.MISSING_FILES;
}
`;

        const errorFile = path.join(this.rootDir, 'assets/js/missing-files.js');
        fs.writeFileSync(errorFile, errorJsContent, 'utf8');
        console.log(`\n404错误检查结果已保存到: ${errorFile}`);

        return errorData;
    }

    // 检查文件是否存在
    fileExists(filePath, allFiles) {
        // 规范化路径
        filePath = filePath.replace(/^\//, '');

        // 直接检查
        if (allFiles.includes(filePath)) {
            return true;
        }

        // 检查相对路径
        for (const existingFile of allFiles) {
            const existingDir = path.dirname(existingFile);
            const potentialPath = path.join(existingDir, filePath).replace(/\\/g, '/');
            if (allFiles.includes(potentialPath)) {
                return true;
            }
        }

        // 检查带索引的路径
        if (filePath.endsWith('/')) {
            if (allFiles.includes(filePath + 'index.html')) {
                return true;
            }
        }

        return false;
    }

    // 初始化
    init(check404 = false) {
        // 生成文件列表
        this.generateFilesList();

        // 检查404错误
        if (check404) {
            this.check404Errors();
        }
    }
}

// 命令行参数处理
const args = process.argv.slice(2);
const check404 = args.includes('--check404') || args.includes('-c');
const helpMode = args.includes('--help') || args.includes('-h');

if (helpMode) {
    console.log(`
文件扫描脚本使用说明:

用法:
  node scripts/scan-files.js [选项]

选项:
  --check404, -c    检查潜在的404错误
  --help, -h        显示此帮助信息

示例:
  node scripts/scan-files.js           # 只扫描文件
  node scripts/scan-files.js --check404 # 扫描文件并检查404错误
    `);
    process.exit(0);
}

// 运行脚本
if (require.main === module) {
    const scanner = new FileScanner();
    scanner.init(check404);
}

module.exports = FileScanner;
