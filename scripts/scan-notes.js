#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

class NotesScanner {
    constructor() {
        this.notesData = {
            hjf: [],
            hjm: [],
            lastUpdated: new Date().toISOString()
        };

        this.rootDir = path.join(__dirname, '..');
        this.notesDir = path.join(this.rootDir, '2025');
        this.outputFile = path.join(this.rootDir, 'assets/js/notes-data.js');
        this.jsMainFile = path.join(this.rootDir, 'assets/js/main.js');
    }

    // 从HTML文件中提取标题
    extractTitleFromHtml(filePath) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');

            // 如果是加密文件，先解密
            content = this.decryptHtmlContent(content);

            // 尝试从<title>标签提取
            const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch) {
                const title = titleMatch[1].trim();
                // 跳过加密文件的默认标题
                if (title !== 'Encrypted Content') {
                    return title;
                }
            }

            // 尝试从第一个<h1>标签提取
            const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
            if (h1Match) {
                return h1Match[1].trim();
            }

            // 尝试从文件名生成标题
            const fileName = path.basename(filePath, '.html');
            return fileName.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase());

        } catch (error) {
            console.error(`读取文件失败: ${filePath}`, error.message);
            return path.basename(filePath, '.html');
        }
    }

    // 解密已加密的HTML文件内容
    decryptHtmlContent(htmlContent) {
        try {
            // 检查是否是加密格式
            if (!htmlContent.includes('id="encrypted-content"')) {
                return htmlContent; // 不是加密格式，直接返回
            }

            // 提取base64内容
            const match = htmlContent.match(/<div id="encrypted-content"[^>]*>([\s\S]*?)<\/div>/);
            if (!match) {
                return htmlContent; // 无法找到加密内容，返回原内容
            }

            const encodedContent = match[1].trim();

            // 解码base64
            const decodedContent = Buffer.from(encodedContent, 'base64').toString('utf8');
            return decodedContent;
        } catch (error) {
            console.error('解密失败:', error.message);
            return htmlContent; // 解密失败，返回原内容
        }
    }

    // 从HTML文件中提取预览内容
    extractPreviewFromHtml(filePath) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');

            // 如果是加密文件，先解密
            content = this.decryptHtmlContent(content);

            // 移除HTML标签，提取纯文本
            const textContent = content
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            // 取前150个字符作为预览
            const preview = textContent.substring(0, 150);
            return preview.length < textContent.length ? preview + '...' : preview;

        } catch (error) {
            console.error(`提取预览失败: ${filePath}`, error.message);
            return '暂无预览...';
        }
    }

    // 获取文件修改时间
    getFileDate(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return stats.mtime.toISOString().split('T')[0];
        } catch (error) {
            return new Date().toISOString().split('T')[0];
        }
    }

    // 扫描指定作者的分析内容
    scanAuthorNotes(author) {
        const authorDir = path.join(this.notesDir, author);

        if (!fs.existsSync(authorDir)) {
            console.log(`目录不存在: ${authorDir}`);
            return [];
        }

        const notes = [];
        const files = fs.readdirSync(authorDir);

        // 先处理普通笔记文件
        const noteFiles = files.filter(file =>
            file.endsWith('.html') && !file.endsWith('-review.html')
        );

        // 收集评分报告文件
        const reviewFiles = files.filter(file =>
            file.endsWith('-review.html')
        );

        noteFiles.forEach(file => {
            const filePath = path.join(authorDir, file);
            const relativePath = path.relative(this.rootDir, filePath).replace(/\\/g, '/');

            const note = {
                path: relativePath,
                title: this.extractTitleFromHtml(filePath),
                date: this.getFileDate(filePath),
                author: author,
                preview: ''//this.extractPreviewFromHtml(filePath)
            };

            // 检查是否有对应的评分报告
            const reviewFileName = file.replace('.html', '-review.html');
            const hasReview = reviewFiles.includes(reviewFileName);

            if (hasReview) {
                const reviewPath = path.join(authorDir, reviewFileName);
                const reviewRelativePath = path.relative(this.rootDir, reviewPath).replace(/\\/g, '/');

                // 从评分报告中提取分数
                let score = 0;
                try {
                    let reviewContent = fs.readFileSync(reviewPath, 'utf8');

                    // 如果是加密文件，先解密
                    reviewContent = this.decryptHtmlContent(reviewContent);

                    const scoreMatch = reviewContent.match(/<div class="score-value">(\d+)<\/div>/);
                    if (scoreMatch) {
                        score = parseInt(scoreMatch[1]);
                    }
                } catch (error) {
                    console.error(`提取分数失败: ${reviewPath}`, error.message);
                }

                note.reviewReport = {
                    path: reviewRelativePath,
                    title: this.extractTitleFromHtml(reviewPath),
                    date: this.getFileDate(reviewPath),
                    author: author,
                    isReview: true,
                    preview: '',//this.extractPreviewFromHtml(reviewPath),
                    score: score  // 添加分数字段
                };
            }

            notes.push(note);
        });

        return notes.sort((a, b) => b.date.localeCompare(a.date)); // 按日期倒序
    }

    // 扫描所有分析内容
    scanAllNotes() {
        console.log('开始扫描分析文件...');

        this.notesData.hjf = this.scanAuthorNotes('hjf');
        this.notesData.hjm = this.scanAuthorNotes('hjm');
        this.notesData.lastUpdated = new Date().toISOString();

        console.log(`扫描完成:`);
        console.log(`- HJF: ${this.notesData.hjf.length} 份分析`);
        console.log(`- HJM: ${this.notesData.hjm.length} 份分析`);

        return this.notesData;
    }

    // 生成笔记数据文件
    generateNotesDataFile() {
        // 尝试读取现有数据
        let existingData = null;
        try {
            if (fs.existsSync(this.outputFile)) {
                const existingContent = fs.readFileSync(this.outputFile, 'utf8');
                const dataMatch = existingContent.match(/window\.NOTES_DATA\s*=\s*(\{[\s\S]*?\});/);
                if (dataMatch) {
                    // 解析现有的JSON数据
                    existingData = JSON.parse(dataMatch[1]);
                    console.log('找到现有数据文件，将保持已有数据不变');
                }
            }
        } catch (error) {
            console.error('读取现有数据失败:', error.message);
        }

        // 扫描新数据
        const newData = this.scanAllNotes();

        // 如果存在现有数据，合并数据
        if (existingData) {
            // 创建映射来识别现有的笔记
            const createPathMap = (notes) => {
                const map = {};
                notes.forEach(note => {
                    map[note.path] = note;
                });
                return map;
            };

            // 为每个作者处理数据合并
            ['hjf', 'hjm'].forEach(author => {
                // 创建新数据和现有数据的路径映射
                const newNotesMap = createPathMap(newData[author]);
                const existingNotesMap = createPathMap(existingData[author] || []);

                // 创建合并后的笔记列表
                const mergedNotes = [];

                // 首先添加现有数据中的笔记（如果它们仍然存在）
                (existingData[author] || []).forEach(existingNote => {
                    const path = existingNote.path;
                    // 如果这个笔记在新数据中也存在，保留现有数据
                    if (newNotesMap[path]) {
                        mergedNotes.push(existingNote);
                    }
                });

                // 添加新数据中存在但现有数据中不存在的笔记
                newData[author].forEach(newNote => {
                    const path = newNote.path;
                    if (!existingNotesMap[path]) {
                        mergedNotes.push(newNote);
                    }
                });

                // 按日期倒序排序
                newData[author] = mergedNotes.sort((a, b) => b.date.localeCompare(a.date));
            });
        }

        // 更新最后更新时间
        newData.lastUpdated = new Date().toISOString();

        const jsContent = `// 自动生成的分析数据文件
// 最后更新时间: ${newData.lastUpdated}

window.NOTES_DATA = ${JSON.stringify(newData, null, 2)};

// 导出数据供Node.js使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.NOTES_DATA;
}
`;

        // 确保目录存在
        const outputDir = path.dirname(this.outputFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(this.outputFile, jsContent, 'utf8');
        console.log(`分析数据已保存到: ${this.outputFile}`);

        return newData;
    }

    // 更新主JS文件中的笔记数据
    updateMainJsFile() {
        try {
            let mainJsContent = fs.readFileSync(this.jsMainFile, 'utf8');

            // 添加数据文件引用（如果不存在）
            if (!mainJsContent.includes('notes-data.js')) {
                // 在文件开头添加注释说明
                const importComment = `// 注意: 在HTML中需要在main.js之前引入notes-data.js
// <script src="assets/js/notes-data.js"></script>
// <script src="assets/js/main.js"></script>

`;
                mainJsContent = importComment + mainJsContent;

                // 修改scanNotes方法使用动态数据
                const oldScanMethod = /\/\/ 扫描笔记文件[\s\S]*?\/\/ 模拟加载延迟[\s\S]*?await new Promise[\s\S]*?\);/;
                const newScanMethod = `// 扫描笔记文件
    async scanNotes() {
        // 使用动态生成的笔记数据
        if (typeof window.NOTES_DATA !== 'undefined') {
            const data = window.NOTES_DATA;
            
            // 将评分报告关联到对应的笔记
            data.hjf.forEach(note => {
                if (note.author === 'hjf') {
                    this.notes.hjf.push(note);
                }
            });
            
            data.hjm.forEach(note => {
                if (note.author === 'hjm') {
                    this.notes.hjm.push(note);
                }
            });
            
            console.log('使用动态笔记数据，最后更新:', data.lastUpdated);
        } else {
            console.warn('未找到分析数据，使用默认数据');
            // 这里保留原有的默认数据作为fallback
        }
        
        // 模拟加载延迟
        await new Promise(resolve => setTimeout(resolve, 500));`;

                if (oldScanMethod.test(mainJsContent)) {
                    mainJsContent = mainJsContent.replace(oldScanMethod, newScanMethod);
                }

                fs.writeFileSync(this.jsMainFile, mainJsContent, 'utf8');
                console.log('主JS文件已更新');
            }
        } catch (error) {
            console.error('更新主JS文件失败:', error.message);
        }
    }

    // 更新HTML文件以引入数据文件
    updateHtmlFile() {
        const htmlFile = path.join(this.rootDir, 'index.html');

        try {
            let htmlContent = fs.readFileSync(htmlFile, 'utf8');

            // 检查是否已经包含notes-data.js引用
            if (!htmlContent.includes('notes-data.js')) {
                // 在main.js之前添加notes-data.js引用
                htmlContent = htmlContent.replace(
                    '<script src="assets/js/main.js"></script>',
                    '<script src="assets/js/notes-data.js"></script>\n    <script src="assets/js/main.js"></script>'
                );

                fs.writeFileSync(htmlFile, htmlContent, 'utf8');
                console.log('HTML文件已更新，添加了数据文件引用');
            }
        } catch (error) {
            console.error('更新HTML文件失败:', error.message);
        }
    }

    // 开始监听文件变化
    startWatching() {
        console.log('开始监听文件变化...');

        // 监听2025目录下的HTML文件
        const watcher = chokidar.watch('2025/**/*.html', {
            cwd: this.rootDir,
            ignored: /node_modules/,
            persistent: true
        });

        watcher
            .on('add', (filePath) => {
                console.log(`新增文件: ${filePath}`);
                this.generateNotesDataFile();
            })
            .on('change', (filePath) => {
                console.log(`文件修改: ${filePath}`);
                this.generateNotesDataFile();
            })
            .on('unlink', (filePath) => {
                console.log(`文件删除: ${filePath}`);
                this.generateNotesDataFile();
            })
            .on('error', (error) => {
                console.error('文件监听错误:', error);
            });

        console.log('文件监听已启动，按 Ctrl+C 停止监听');

        // 优雅关闭
        process.on('SIGINT', () => {
            console.log('\n正在停止文件监听...');
            watcher.close();
            process.exit(0);
        });
    }

    // 初始化
    init(watchMode = false) {
        // 生成初始数据
        this.generateNotesDataFile();
        this.updateMainJsFile();
        this.updateHtmlFile();

        if (watchMode) {
            this.startWatching();
        }
    }
}

// 命令行参数处理
const args = process.argv.slice(2);
const watchMode = args.includes('--watch') || args.includes('-w');
const helpMode = args.includes('--help') || args.includes('-h');

if (helpMode) {
    console.log(`
分析扫描脚本使用说明:

用法:
  node scripts/scan-notes.js [选项]

选项:
  --watch, -w    监听文件变化，自动更新
  --help, -h     显示此帮助信息

示例:
  node scripts/scan-notes.js           # 扫描一次并退出
  node scripts/scan-notes.js --watch   # 持续监听文件变化
    `);
    process.exit(0);
}

// 运行脚本
if (require.main === module) {
    const scanner = new NotesScanner();
    scanner.init(watchMode);
}

module.exports = NotesScanner;
