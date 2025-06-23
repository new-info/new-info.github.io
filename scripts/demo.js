#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 创建测试笔记的演示脚本
class DemoNotesCreator {
    constructor() {
        this.rootDir = path.join(__dirname, '..');
        this.hjfDir = path.join(this.rootDir, '2025', 'hjf');
        this.hjmDir = path.join(this.rootDir, '2025', 'hjm');
    }

    // 创建示例笔记
    createSampleNote(author, filename, title, content) {
        const targetDir = author === 'hjf' ? this.hjfDir : this.hjmDir;
        const filePath = path.join(targetDir, filename);
        
        const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="../hjf/markdown.css">
    <link rel="stylesheet" href="../hjf/highlight.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
    </style>
</head>
<body class="vscode-body vscode-light">
    <h1>${title}</h1>
    ${content}
    
    <footer style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee; color: #666; font-size: 0.9rem;">
        <p>创建时间: ${new Date().toLocaleString('zh-CN')}</p>
        <p>作者: ${author.toUpperCase()}</p>
    </footer>
</body>
</html>`;

        fs.writeFileSync(filePath, htmlContent, 'utf8');
        console.log(`✅ 创建笔记: ${filePath}`);
        return filePath;
    }

    // 创建示例评分报告
    createSampleReview(author, filename, title, score) {
        const targetDir = author === 'hjf' ? this.hjfDir : this.hjmDir;
        const filePath = path.join(targetDir, filename);
        
        const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
        }

        body {
            background: #f5f7fa;
            color: #333;
            line-height: 1.6;
            padding: 15px;
            min-height: 100vh;
        }

        .container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }

        header {
            background: linear-gradient(135deg, #1a2980 0%, #26d0ce 100%);
            color: white;
            padding: 25px 20px;
            text-align: center;
        }

        h1 {
            font-size: 1.8rem;
            margin-bottom: 8px;
            font-weight: 600;
        }

        .score-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            margin: 20px;
            border: 2px solid #1a2980;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .score-value {
            font-size: 3.5rem;
            font-weight: 700;
            color: #1a2980;
            line-height: 1;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${title}</h1>
            <p>自动生成的评分报告</p>
        </header>
        
        <div class="score-card">
            <div class="score-value">${score}</div>
            <div>满分100分</div>
            <div style="margin-top: 10px; color: #26d0ce; font-weight: 600;">
                ${score >= 80 ? '优秀' : score >= 70 ? '良好' : score >= 60 ? '及格' : '需要改进'}
            </div>
        </div>
        
        <div style="padding: 20px;">
            <h3>评分说明</h3>
            <p>本评分报告基于内容质量、结构清晰度、实用性等多个维度进行综合评估。</p>
            
            <h3 style="margin-top: 20px;">生成信息</h3>
            <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
            <p>评估对象: ${author.toUpperCase()} 的直播分析内容</p>
        </div>
    </div>
</body>
</html>`;

        fs.writeFileSync(filePath, htmlContent, 'utf8');
        console.log(`📊 创建评分报告: ${filePath}`);
        return filePath;
    }

    // 运行演示
    runDemo() {
        console.log('🚀 开始创建演示分析内容...\n');

        // 创建一个新的笔记文件
        const date = new Date();
        const dateStr = `${date.getDate()}-${date.toLocaleString('default', { month: 'short' })}`;
        
        // HJF 的新笔记
        const hjfNote = this.createSampleNote(
            'hjf',
            `${dateStr}.html`,
            `${dateStr} 直播内容记录与分析`,
            `
            <h2>今天的主要收获</h2>
            <p>今天学习了很多有价值的内容，主要包括以下几个方面：</p>
            
            <ul>
                <li><strong>技术学习</strong>：深入理解了JavaScript的异步编程模式</li>
                <li><strong>项目管理</strong>：学会了如何更好地组织代码结构</li>
                <li><strong>个人成长</strong>：反思了自己的学习方法和效率</li>
            </ul>
            
            <h2>重要思考</h2>
            <blockquote>
                <p>学习不仅仅是获取知识，更重要的是培养思考问题和解决问题的能力。</p>
            </blockquote>
            
            <h2>明天的计划</h2>
            <ol>
                <li>继续深入学习前端技术栈</li>
                <li>完善当前项目的功能</li>
                <li>整理学习笔记并分享心得</li>
            </ol>
            `
        );

        // HJF 的评分报告
        const hjfReview = this.createSampleReview(
            'hjf',
            `${dateStr}-review.html`,
            `${dateStr} 直播内容评估报告`,
            85
        );

        // HJM 的新笔记
        const hjmNote = this.createSampleNote(
            'hjm',
            `${dateStr}.html`,
            `${dateStr} 直播内容记录与分析`,
            `
            <h2>实践项目总结</h2>
            <p>今天完成了一个重要的实践项目，过程中遇到了不少挑战，但也收获颇丰。</p>
            
            <h3>遇到的挑战</h3>
            <ul>
                <li>跨浏览器兼容性问题</li>
                <li>性能优化的复杂性</li>
                <li>用户体验设计的平衡</li>
            </ul>
            
            <h3>解决方案</h3>
            <p>通过查阅文档、测试验证和团队讨论，最终找到了合适的解决方案。</p>
            
            <h3>经验教训</h3>
            <p>这次实践让我深刻理解了理论与实践的差距，也明白了持续学习的重要性。</p>
            
            <h2>下一步行动</h2>
            <p>计划将这次的经验整理成最佳实践，分享给更多的同学。</p>
            `
        );

        // HJM 的评分报告
        const hjmReview = this.createSampleReview(
            'hjm',
            `${dateStr}-review.html`,
            `${dateStr} 直播内容评估报告`,
            78
        );

        console.log('\n✅ 演示分析内容创建完成！');
        console.log('\n📁 创建的文件：');
        console.log(`   - ${hjfNote}`);
        console.log(`   - ${hjfReview}`);
        console.log(`   - ${hjmNote}`);
        console.log(`   - ${hjmReview}`);
        
        console.log('\n💡 提示：');
        console.log('   1. 运行 "npm run scan" 重新扫描分析文件');
        console.log('   2. 运行 "npm run watch" 开启文件监听');
        console.log('   3. 打开 index.html 查看更新后的分析列表');
    }

    // 清理演示文件
    cleanDemo() {
        console.log('🧹 清理演示文件...');
        
        const demoPaths = [
            this.hjfDir,
            this.hjmDir
        ];
        
        demoPaths.forEach(dir => {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    if (file.includes('-') && file.endsWith('.html') && !file.includes('1-Jun')) {
                        const filePath = path.join(dir, file);
                        fs.unlinkSync(filePath);
                        console.log(`🗑️  删除: ${filePath}`);
                    }
                });
            }
        });
        
        console.log('✅ 清理完成！');
    }
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0];

const demo = new DemoNotesCreator();

switch (command) {
    case 'create':
        demo.runDemo();
        break;
    case 'clean':
        demo.cleanDemo();
        break;
    case 'help':
    default:
        console.log(`
演示脚本使用说明:

用法:
  node scripts/demo.js <命令>

命令:
  create    创建演示笔记文件
  clean     清理演示文件
  help      显示此帮助信息

示例:
  node scripts/demo.js create   # 创建演示笔记
  node scripts/demo.js clean    # 清理演示文件
        `);
        break;
}

module.exports = DemoNotesCreator; 