#!/usr/bin/env node
/**
 * OpenCode 汉化版启动器
 * 自动检测并运行对应平台的预编译二进制
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const binDir = path.join(__dirname, '..', 'bin');
const binaryFile = process.platform === 'win32' ? 'opencode.exe' : 'opencode';
const binaryPath = path.join(binDir, binaryFile);

// 检查二进制文件是否存在
if (!fs.existsSync(binaryPath)) {
  console.error('❌ OpenCode 汉化版二进制文件未找到');
  console.error('   请重新运行: npm install -g opencode-zh');
  process.exit(1);
}

// 运行二进制文件
const proc = spawn(binaryPath, process.argv.slice(2), {
  stdio: 'inherit',
  shell: false
});

proc.on('exit', (code) => {
  process.exit(code || 0);
});

proc.on('error', (err) => {
  console.error(`❌ 启动失败: ${err.message}`);
  process.exit(1);
});
