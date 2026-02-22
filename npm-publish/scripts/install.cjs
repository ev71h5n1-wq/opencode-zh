#!/usr/bin/env node
/**
 * OpenCode 汉化版 - 安装脚本
 * 自动下载对应平台的预编译二进制文件
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
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

function getProxy() {
  // 从环境变量获取代理设置
  return process.env.HTTPS_PROXY || process.env.https_proxy ||
         process.env.HTTP_PROXY || process.env.http_proxy || null;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const parsedUrl = new URL(url);
    const proxy = getProxy();

    let options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'opencode-zh-installer'
      }
    };

    // 如果有代理，使用 CONNECT 隧道
    if (proxy) {
      const proxyUrl = new URL(proxy);
      const proxyReq = http.request({
        hostname: proxyUrl.hostname,
        port: proxyUrl.port || 80,
        method: 'CONNECT',
        path: `${parsedUrl.hostname}:443`
      });

      proxyReq.on('connect', (res, socket) => {
        if (res.statusCode !== 200) {
          reject(new Error(`代理连接失败: ${res.statusCode}`));
          return;
        }

        const tlsSocket = require('tls').connect({
          socket: socket,
          servername: parsedUrl.hostname
        }, () => {
          const req = `GET ${parsedUrl.pathname}${parsedUrl.search} HTTP/1.1\r\n` +
                      `Host: ${parsedUrl.hostname}\r\n` +
                      `User-Agent: opencode-zh-installer\r\n` +
                      `Connection: close\r\n\r\n`;
          tlsSocket.write(req);
        });

        let headersDone = false;
        let redirectLocation = null;

        tlsSocket.on('data', (chunk) => {
          if (!headersDone) {
            const response = chunk.toString();
            const lines = response.split('\r\n');
            const statusLine = lines[0];
            const statusCode = parseInt(statusLine.split(' ')[1]);

            // 处理重定向
            if (statusCode === 301 || statusCode === 302) {
              for (const line of lines) {
                if (line.toLowerCase().startsWith('location:')) {
                  redirectLocation = line.substring(9).trim();
                  break;
                }
              }
            }

            if (statusCode === 200) {
              const headerEnd = response.indexOf('\r\n\r\n');
              if (headerEnd !== -1) {
                headersDone = true;
                const body = response.slice(headerEnd + 4);
                if (body.length > 0) {
                  file.write(Buffer.from(body, 'binary'));
                }
              }
            } else if (redirectLocation) {
              file.close();
              fs.unlink(dest, () => {});
              downloadFile(redirectLocation, dest).then(resolve).catch(reject);
              return;
            } else {
              file.close();
              fs.unlink(dest, () => {});
              reject(new Error(`下载失败: HTTP ${statusCode}`));
              return;
            }
          } else {
            file.write(chunk);
          }
        });

        tlsSocket.on('end', () => {
          file.end();
          resolve();
        });

        tlsSocket.on('error', (err) => {
          file.close();
          fs.unlink(dest, () => {});
          reject(err);
        });
      });

      proxyReq.on('error', (err) => {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`代理错误: ${err.message}`));
      });

      proxyReq.end();
    } else {
      // 无代理，直接连接
      https.get(url, { headers: { 'User-Agent': 'opencode-zh-installer' } }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          fs.unlink(dest, () => {});
          downloadFile(response.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          reject(new Error(`下载失败: HTTP ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        file.close();
        fs.unlink(dest, () => {});
        reject(err);
      });
    }
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

  const proxy = getProxy();
  if (proxy) {
    console.log(`   代理: ${proxy}`);
  }

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
    console.error('2. 设置代理: set HTTPS_PROXY=http://127.0.0.1:端口');
    console.error('3. 手动下载: ' + downloadUrl);
    console.error('4. 检查是否为最新版本');
    process.exit(1);
  }
}

install();
