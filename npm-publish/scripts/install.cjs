#!/usr/bin/env node
/**
 * OpenCode 汉化版 - 安装脚本
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO = 'ev71h5n1-wq/opencode-zh';
const PKG = require('../package.json');
const VERSION = PKG.version;

// 平台映射
const platformMap = {
  'win32': 'windows',
  'darwin': 'darwin',
  'linux': 'linux'
};

const archMap = {
  'x64': 'x64',
  'arm64': 'arm64'
};

function getPlatform() {
  const platform = platformMap[process.platform];
  const arch = archMap[process.arch];

  if (!platform || !arch) {
    console.error('不支持的平台: ' + process.platform + '-' + process.arch);
    process.exit(1);
  }

  return { platform: platform, arch: arch };
}

function getBinaryName() {
  const p = getPlatform();
  return 'opencode-zh-' + p.platform + '-' + p.arch;
}

function downloadWithCurl(url, dest) {
  try {
    console.log('   使用 curl 下载...');
    execSync('curl -L -# -o "' + dest + '" "' + url + '"', { stdio: 'inherit' });
    
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

function install() {
  const binaryName = getBinaryName();
  const binDir = path.join(__dirname, '..', 'bin');
  const binaryFile = process.platform === 'win32' ? 'opencode.exe' : 'opencode';
  const binaryPath = path.join(binDir, binaryFile);

  // 检查是否已存在
  if (fs.existsSync(binaryPath)) {
    console.log('OpenCode 汉化版已安装');
    return;
  }

  console.log('正在下载 OpenCode 汉化版 v' + VERSION + '...');
  console.log('   平台: ' + binaryName);

  // 确保目录存在
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  // 下载地址
  var zipFile = binaryName + '.zip';
  var downloadUrl = 'https://github.com/' + REPO + '/releases/download/v' + VERSION + '/' + zipFile;
  var tempFile = path.join(binDir, zipFile);

  console.log('   URL: ' + downloadUrl);

  // 使用 curl 下载
  if (!downloadWithCurl(downloadUrl, tempFile)) {
    console.error('下载失败');
    console.error('手动下载: ' + downloadUrl);
    process.exit(1);
  }

  console.log('\n下载完成，正在解压...');

  // 解压
  try {
    if (process.platform === 'win32') {
      execSync('powershell -NoProfile -Command "Expand-Archive -Path \'' + tempFile + '\' -DestinationPath \'' + binDir + '\' -Force"', { stdio: 'inherit' });
    } else {
      execSync('unzip -o "' + tempFile + '" -d "' + binDir + '"', { stdio: 'inherit' });
    }
  } catch (e) {
    console.error('解压失败: ' + e.message);
    process.exit(1);
  }

  // 删除压缩包
  fs.unlinkSync(tempFile);

  // 设置可执行权限 (非 Windows)
  if (process.platform !== 'win32') {
    fs.chmodSync(binaryPath, '755');
  }

  console.log('OpenCode 汉化版安装成功！');
  console.log('   运行命令: opencode-zh');
}

install();
