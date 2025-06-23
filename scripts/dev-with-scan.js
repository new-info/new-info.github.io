#!/usr/bin/env node

/**
 * 开发服务器启动脚本
 * 先扫描文件，然后启动开发服务器
 */

const { spawn } = require('child_process');
const path = require('path');
const FileScanner = require('./scan-files');

console.log('准备启动开发环境...');

// 扫描分析文件
console.log('1. 扫描分析文件...');
const scanNotesProcess = spawn('node', [path.join(__dirname, 'scan-notes.js')], { stdio: 'inherit' });

scanNotesProcess.on('close', (code) => {
    if (code !== 0) {
        console.error('分析文件扫描失败！');
        process.exit(code);
    }
    
    console.log('分析文件扫描完成！');
    
    // 扫描所有文件
    console.log('2. 扫描项目文件...');
    const scanner = new FileScanner();
    scanner.init(true); // 启用404检查
    
    // 启动HTTP服务器
    console.log('3. 启动HTTP服务器...');
    const httpServer = spawn('npx', ['http-server', '-o'], { stdio: 'inherit' });
    
    httpServer.on('close', (code) => {
        console.log(`HTTP服务器已关闭，退出代码: ${code}`);
        process.exit(code);
    });
    
    // 处理进程终止信号
    process.on('SIGINT', () => {
        console.log('接收到终止信号，正在关闭服务器...');
        httpServer.kill('SIGINT');
    });
});

console.log('启动脚本执行中，请等待...'); 