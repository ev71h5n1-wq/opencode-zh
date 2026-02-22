#!/usr/bin/env node
/**
 * OpenCode 汉化版 - 安装脚本
 * 自动下载对应平台的预编译二进制文件
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const { URL } = require('url');

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

function getBinaryName() {
  const { platform, arch } = getPlatform();
  return `opencode-zh-${platform}-${arch}`;
}

function downloadFile(url, dest, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error('重定向次数过多'));
      return;
    }

    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'opencode-zh-installer/1.0',
        'Accept': '*/*'
      }
    };

    const file = fs.createWriteStream(dest);

    const req = https.request(options, (response) => {
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        file.close();
        fs.unlink(dest, () => {});
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          console.log(`   ↳ 重定向到: ${redirectUrl.substring(0, 80)}...`);
          downloadFile(redirectUrl, dest, redirectCount + 1).then(resolve).catch(reject);
        } else {
          reject(new Error('重定向缺少 Location 头'));
        }
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      // 显示下载进度
      let downloaded = 0;
      const total = parseInt(response.headers['content-length'] || '0');
      
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        if (total > 0 && downloaded % (1024 * 1024) === 0) {
          const percent = Math.round((downloaded / total) * 100);
          process.stdout.write(`\r   进度: ${percent}% (${(downloaded / 1024 / 1024).toFixed(1)} MB / ${(total / 1024 / 1024).toFixed(1)} MB)`;
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        process.stdout.write('\r   下载完成!\n');
        file.close();
        resolve();
      });
    });

    req.on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(new Error(`网络错误: ${err.message}`));
    });

    req.setTimeout(60000, () => {
      req.destroy();
      file.close();
      fs.unlink(dest, () => {});
      reject(new Error('下载超时'));
    });

    req.end();
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

  console.log(`   URL: ${downloadUrl}`);

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
    console.error(`\n❌ 安装失败: ${error.message}`);
    console.error('\n可能的解决方案:');
    console.error('1. 检查网络连接');
    console.error('2. 手动下载: ' + downloadUrl);
    console.error('3. 检查 GitHub Releases 是否存在该版本');
    process.exit(1);
  }
}

install();
