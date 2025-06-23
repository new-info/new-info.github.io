#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('📋 分数补丁管理工具');

class PatchManager {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.patchFile = path.join(this.rootDir, 'assets/js/score-patches.js');
    this.notesDataFile = path.join(this.rootDir, 'assets/js/notes-data.js');
    this.patches = {};
  }
  
  // 加载现有补丁
  loadPatches() {
    try {
      if (fs.existsSync(this.patchFile)) {
        const content = fs.readFileSync(this.patchFile, 'utf8');
        const patchesMatch = content.match(/window\.SCORE_PATCHES\s*=\s*(\{[\s\S]*?\});/);
        
        if (patchesMatch && patchesMatch[1]) {
          // 使用eval解析JSON（在受控环境中）
          // 注意：这不是生产环境的最佳实践，但对于本地工具脚本来说是可行的
          const patchesStr = patchesMatch[1].replace(/\/\/.*$/gm, ''); // 移除注释
          this.patches = eval(`(${patchesStr})`);
          console.log('✅ 成功加载现有补丁文件');
          return true;
        }
      }
      
      // 如果文件不存在或解析失败，创建新的补丁对象
      this.patches = {};
      return false;
    } catch (error) {
      console.error('❌ 加载补丁文件失败:', error.message);
      this.patches = {};
      return false;
    }
  }
  
  // 加载分析数据
  loadNotesData() {
    try {
      if (fs.existsSync(this.notesDataFile)) {
        const content = fs.readFileSync(this.notesDataFile, 'utf8');
        const dataMatch = content.match(/window\.NOTES_DATA\s*=\s*(\{[\s\S]*?\});/);
        
        if (dataMatch && dataMatch[1]) {
          const dataStr = dataMatch[1];
          const notesData = eval(`(${dataStr})`);
          console.log('✅ 成功加载分析数据文件');
          return notesData;
        }
      }
      
      console.error('❌ 分析数据文件不存在或格式错误');
      return null;
    } catch (error) {
      console.error('❌ 加载分析数据失败:', error.message);
      return null;
    }
  }
  
  // 保存补丁到文件
  savePatches() {
    try {
      const content = `/**
 * 分数校正补丁文件
 * 
 * 用于校正分析报告中的分数，并添加备注说明
 * 格式: {
 *   "文件名": {
 *     score: 真实分数(可选，不提供则使用原始分数),
 *     note: "备注说明",
 *     reward: 自定义奖金金额(可选，不提供则根据分数计算)
 *   }
 * }
 */

window.SCORE_PATCHES = ${JSON.stringify(this.patches, null, 2)};

// 导出数据供Node.js使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.SCORE_PATCHES;
}`;

      fs.writeFileSync(this.patchFile, content, 'utf8');
      console.log('✅ 补丁文件已保存到:', this.patchFile);
      return true;
    } catch (error) {
      console.error('❌ 保存补丁文件失败:', error.message);
      return false;
    }
  }
  
  // 列出所有补丁
  listPatches() {
    console.log('\n📋 当前补丁列表:');
    
    if (Object.keys(this.patches).length === 0) {
      console.log('   没有补丁记录');
      return;
    }
    
    for (const [fileName, patch] of Object.entries(this.patches)) {
      console.log(`\n📄 ${fileName}:`);
      if (patch.score !== undefined) {
        console.log(`   - 真实分数: ${patch.score}`);
      } else {
        console.log(`   - 真实分数: (使用原始分数)`);
      }
      console.log(`   - 备注说明: ${patch.note}`);
      if (patch.reward !== undefined) {
        console.log(`   - 自定义奖金: ${patch.reward}元`);
      } else {
        console.log(`   - 自定义奖金: (根据分数计算)`);
      }
    }
  }
  
  // 列出所有分析文件
  listAnalysisFiles() {
    const notesData = this.loadNotesData();
    if (!notesData) return;
    
    console.log('\n📋 可用的分析文件:');
    
    // 处理HJF的分析
    if (notesData.hjf && notesData.hjf.length > 0) {
      console.log('\n👤 HJF:');
      notesData.hjf.forEach(note => {
        if (note.reviewReport) {
          const fileName = this.getBaseFileName(note.reviewReport.path);
          const originalScore = note.reviewReport.score;
          const patch = this.patches[fileName];
          
          console.log(`   - ${fileName}`);
          console.log(`     原始分数: ${originalScore}`);
          
          if (patch) {
            if (patch.score !== undefined) {
              console.log(`     校正分数: ${patch.score} (已应用补丁)`);
            } else {
              console.log(`     校正分数: ${originalScore} (保持原始分数)`);
            }
            
            if (patch.reward !== undefined) {
              console.log(`     自定义奖金: ${patch.reward}元`);
            }
          }
        }
      });
    }
    
    // 处理HJM的分析
    if (notesData.hjm && notesData.hjm.length > 0) {
      console.log('\n👤 HJM:');
      notesData.hjm.forEach(note => {
        if (note.reviewReport) {
          const fileName = this.getBaseFileName(note.reviewReport.path);
          const originalScore = note.reviewReport.score;
          const patch = this.patches[fileName];
          
          console.log(`   - ${fileName}`);
          console.log(`     原始分数: ${originalScore}`);
          
          if (patch) {
            if (patch.score !== undefined) {
              console.log(`     校正分数: ${patch.score} (已应用补丁)`);
            } else {
              console.log(`     校正分数: ${originalScore} (保持原始分数)`);
            }
            
            if (patch.reward !== undefined) {
              console.log(`     自定义奖金: ${patch.reward}元`);
            }
          }
        }
      });
    }
  }
  
  // 从路径中提取基本文件名
  getBaseFileName(filePath) {
    const fileName = filePath.split('/').pop();
    return fileName.replace(/-review\.html$/, '').replace(/\.html$/, '');
  }
  
  // 添加或更新补丁
  addPatch(fileName, score, note, reward) {
    this.patches[fileName] = {
      note: note
    };
    
    // 只有当分数有效时才添加
    if (score !== undefined && score !== null && !isNaN(score)) {
      this.patches[fileName].score = score;
    }
    
    // 只有当奖金有效时才添加
    if (reward !== undefined && reward !== null && !isNaN(reward)) {
      this.patches[fileName].reward = reward;
    }
    
    console.log(`✅ 已添加/更新补丁: ${fileName}`);
  }
  
  // 删除补丁
  removePatch(fileName) {
    if (this.patches[fileName]) {
      delete this.patches[fileName];
      console.log(`✅ 已删除补丁: ${fileName}`);
      return true;
    } else {
      console.log(`❌ 未找到补丁: ${fileName}`);
      return false;
    }
  }
  
  // 交互式添加补丁
  async interactiveAdd() {
    const notesData = this.loadNotesData();
    if (!notesData) {
      console.log('❌ 无法加载分析数据，请先运行 npm run scan');
      return;
    }
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const question = (query) => new Promise((resolve) => rl.question(query, resolve));
    
    try {
      // 显示可用的分析文件
      this.listAnalysisFiles();
      
      // 获取文件名
      const fileName = await question('\n请输入要添加补丁的文件名 (不含扩展名): ');
      if (!fileName) {
        console.log('❌ 文件名不能为空');
        return;
      }
      
      // 获取真实分数（可选）
      const scoreStr = await question('请输入真实分数 (可选，直接回车跳过，将使用原始分数): ');
      let score = undefined;
      if (scoreStr.trim()) {
        score = parseInt(scoreStr);
        if (isNaN(score) || score < 0 || score > 100) {
          console.log('❌ 分数必须是0-100之间的整数');
          return;
        }
      }
      
      // 获取备注说明
      const note = await question('请输入备注说明: ');
      if (!note) {
        console.log('❌ 备注说明不能为空');
        return;
      }
      
      // 获取自定义奖金（可选）
      const rewardStr = await question('请输入自定义奖金金额 (可选，直接回车跳过): ');
      let reward = undefined;
      if (rewardStr.trim()) {
        reward = parseInt(rewardStr);
        if (isNaN(reward)) {
          console.log('❌ 奖金必须是整数');
          return;
        }
      }
      
      // 添加补丁
      this.addPatch(fileName, score, note, reward);
      this.savePatches();
      
    } finally {
      rl.close();
    }
  }
  
  // 交互式删除补丁
  async interactiveRemove() {
    if (Object.keys(this.patches).length === 0) {
      console.log('❌ 没有可删除的补丁');
      return;
    }
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const question = (query) => new Promise((resolve) => rl.question(query, resolve));
    
    try {
      // 显示现有补丁
      this.listPatches();
      
      // 获取要删除的文件名
      const fileName = await question('\n请输入要删除的补丁文件名: ');
      if (!fileName) {
        console.log('❌ 文件名不能为空');
        return;
      }
      
      // 删除补丁
      if (this.removePatch(fileName)) {
        this.savePatches();
      }
      
    } finally {
      rl.close();
    }
  }
  
  // 运行命令
  async run(command) {
    this.loadPatches();
    
    switch (command) {
      case 'list':
        this.listPatches();
        break;
      case 'files':
        this.listAnalysisFiles();
        break;
      case 'add':
        await this.interactiveAdd();
        break;
      case 'remove':
        await this.interactiveRemove();
        break;
      case 'help':
      default:
        console.log(`
分数补丁管理工具使用说明:

用法:
  node scripts/manage-patches.js <命令>

命令:
  list     列出所有补丁
  files    列出所有分析文件
  add      添加或更新补丁
  remove   删除补丁
  help     显示此帮助信息

示例:
  node scripts/manage-patches.js list    # 列出所有补丁
  node scripts/manage-patches.js add     # 交互式添加补丁
        `);
        break;
    }
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0] || 'help';

const manager = new PatchManager();
manager.run(command).catch(console.error);

module.exports = PatchManager; 