#!/usr/bin/env node
/**
 * OpenCode 汉化版 - 安装脚本
 * 自动下载对应平台的预编译二进制文件
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
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
  'arm64': 'arm64',
  'arm': 'arm'
};

function getPlatform() {
  const platform = platformMap[process.platform];
  const arch = archMap[process.arch];

  if (!platform || !arch) {
    console.error(`❌ 不支持的平台: ${process.platform}-${process.arch}`);
    console.error('支持的平台: windows-x64, darwin-x64, darwin-arm64, linux-x64, linux-arm64');
    process.exit(1);
  }

  return { platform, arch };
}

function supportsAvx2() {
  // 总是返回 true，因为不再构建 baseline 版本
  // 标准版本在大多数现代 CPU 上都能正常运行
  return true;
}

function isMusl() {
  if (process.platform !== 'linux') return false;
  try {
    if (fs.existsSync('/etc/alpine-release')) return true;
    const result = execSync('ldd --version', { encoding: 'utf8' });
    return result.toLowerCase().includes('musl');
  } catch {
    return false;
  }
}

function getBinaryName() {
  const { platform, arch } = getPlatform();
  const avx2 = supportsAvx2();
  const baseline = (arch === 'x64' && !avx2) ? '-baseline' : '';
  const musl = (platform === 'linux' && isMusl()) ? '-musl' : '';

  return `opencode-zh-${platform}-${arch}${baseline}${musl}`;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { followRedirect: true }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        reject(new Error(`下载失败: HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
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

  // 下载地址
  const zipFile = process.platform === 'win32' ? `${binaryName}.zip` : `${binaryName}.tar.gz`;
  const downloadUrl = `https://github.com/${REPO}/releases/download/v${VERSION}/${zipFile}`;
  const tempFile = path.join(binDir, zipFile);

  try {
    await downloadFile(downloadUrl, tempFile);
    console.log('✓ 下载完成，正在解压...');

    // 解压
    if (process.platform === 'win32') {
      execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${tempFile}' -DestinationPath '${binDir}' -Force"`, {
        stdio: 'inherit'
      });
    } else {
      if (zipFile.endsWith('.tar.gz')) {
        execSync(`tar -xzf "${tempFile}" -C "${binDir}"`, { stdio: 'inherit' });
      } else {
        execSync(`unzip -o "${tempFile}" -d "${binDir}"`, { stdio: 'inherit' });
      }
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
    console.error(`❌ 安装失败: ${error.message}`);
    console.error('\n可能的解决方案:');
    console.error('1. 检查网络连接');
    console.error('2. 手动下载: ' + downloadUrl);
    console.error('3. 检查是否为最新版本');
    process.exit(1);
  }
}

install();
