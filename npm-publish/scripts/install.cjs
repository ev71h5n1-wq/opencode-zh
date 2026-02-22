#!/usr/bin/env node
/**
 * OpenCode 汉化版 - 安装脚本
 * 参考官方安装逻辑
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

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
    console.error(`❌ 不支持的平台: ${process.platform}-${process.arch}`);
    process.exit(1);
  }

  return { platform, arch };
}

function getBinaryName() {
  const { platform, arch } = getPlatform();
  return `opencode-zh-${platform}-${arch}`;
}

function downloadWithCurl(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`   使用 curl 下载...`);
    
    const curl = spawn('curl', ['-L', '-#', '-o', dest, url], {
      stdio: ['ignore', 'inherit', 'inherit'],
      shell: process.platform === 'win32'
    });

    curl.on('close', (code) => {
      if (code === 0) {
        // 检查文件是否下载成功
        if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
          resolve();
        } else {
          reject(new Error('下载的文件太小，可能下载失败'));
        }
      } else {
        reject(new Error(`curl 退出码: ${code}`));
      }
    });

    curl.on('error', (err) => {
      reject(new Error(`curl 执行失败: ${err.message}`));
    });
  });
}

async function install() {
  const binaryName = getBinaryName();
  const binDir = path.join(__dirname, '..', 'bin');
  const binaryFile = process.platform === 'win32' ? 'opencode.exe' : 'opencode';
  const binaryPath = path.join(binDir, binaryFile);

  // 检查是否已存在
  if (fs.existsSync(binaryPath)) {
    console.log('✓ OpenCode 汉化版已安装');
    return;
  }

  console.log(`📦 正在下载 OpenCode 汉化版 v${VERSION}...`);
  console.log(`   平台: ${binaryName}`);

  // 确保目录存在
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  // 下载地址 - 使用 GitHub releases
  const zipFile = `${binaryName}.zip`;
  const downloadUrl = `https://github.com/${REPO}/releases/download/v${VERSION}/${zipFile}`;
  const tempFile = path.join(binDir, zipFile);

  console.log(`   URL: ${downloadUrl}`);

  try {
    // 使用 curl 下载（支持重定向）
    await downloadWithCurl(downloadUrl, tempFile);
    console.log('\n✓ 下载完成，正在解压...');

    // 解压
    if (process.platform === 'win32') {
      execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${tempFile}' -DestinationPath '${binDir}' -Force"`, {
        stdio: 'inherit'
      });
    } else {
      execSync(`unzip -o "${tempFile}" -d "${binDir}"`, { stdio: 'inherit' });
    }

    // 删除压缩包
    fs.unlinkSync(tempFile);

    // 设置可执行权限 (非 Windows)
    if (process.platform !== 'win32') {
      fs.chmodSync(binaryPath, '755');
    }

    console.log('✓ OpenCode 汉化版安装成功！');
    console.log('   运行命令: opencode-zh');

  } catch (error) {
    console.error(`\n❌ 安装失败: ${error.message}`);
    console.error('\n可能的解决方案:');
    console.error('1. 安装 curl 工具');
    console.error('2. 手动下载: ' + downloadUrl);
    console.error('3. 或使用官方安装脚本: curl -fsSL https://opencode.ai/install | bash');
    process.exit(1);
  }
}

install();
