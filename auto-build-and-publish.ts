#!/usr/bin/env bun
/**
 * OpenCode 汉化版 - 全自动构建发布脚本
 * 一键完成: 构建 -> 打包 -> GitHub Release -> npm 发布
 */

import { $ } from "bun"
import * as fs from "fs"
import * as path from "path"

const ROOT = path.resolve(import.meta.dir)
const PKG_DIR = path.join(ROOT, "packages/opencode")
const DIST_DIR = path.join(PKG_DIR, "dist")

// 颜色
const c = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
}

function log(title: string, msg?: string) {
  if (msg) {
    console.log(`${c.cyan}[${title}]${c.reset} ${msg}`)
  } else {
    console.log(`\n${c.bright}${c.cyan}▶ ${title}${c.reset}`)
  }
}

function success(msg: string) {
  console.log(`${c.green}✓ ${msg}${c.reset}`)
}

function error(msg: string) {
  console.log(`${c.red}✗ ${msg}${c.reset}`)
}

async function step1_build() {
  log("步骤 1/4: 构建 Windows 二进制文件")
  
  // 清理旧构建
  if (fs.existsSync(DIST_DIR)) {
    log("清理", "删除旧构建目录...")
    await $`rm -rf ${DIST_DIR}`.catch(() => {
      fs.rmSync(DIST_DIR, { recursive: true, force: true })
    })
  }
  
  // 执行构建
  log("构建", "开始编译（约需 3-5 分钟）...")
  const buildScript = path.join(PKG_DIR, "script/build.ts")
  
  const proc = Bun.spawn({
    cmd: ["bun", "run", buildScript, "--windows-only"],
    cwd: PKG_DIR,
    stdout: "inherit",
    stderr: "inherit",
  })
  
  const exitCode = await proc.exited
  if (exitCode !== 0) {
    throw new Error(`构建失败，退出码: ${exitCode}`)
  }
  
  success("构建完成")
}

async function step2_package() {
  log("步骤 2/4: 打包为 zip 文件")
  
  const dirs = fs.readdirSync(DIST_DIR).filter(d => {
    const fullPath = path.join(DIST_DIR, d)
    return fs.statSync(fullPath).isDirectory() && d.startsWith("opencode-zh")
  })
  
  for (const dir of dirs) {
    const sourceDir = path.join(DIST_DIR, dir)
    const zipFile = path.join(DIST_DIR, `${dir}.zip`)
    
    log("打包", `${dir} -> ${path.basename(zipFile)}`)
    
    // 使用 PowerShell 压缩
    await $`powershell -Command "Compress-Archive -Path '${sourceDir}/*' -DestinationPath '${zipFile}' -Force"`
  }
  
  success("打包完成")
  
  // 显示结果
  const zips = fs.readdirSync(DIST_DIR).filter(f => f.endsWith(".zip"))
  console.log(`\n${c.dim}生成的文件:${c.reset}`)
  for (const zip of zips) {
    const stats = fs.statSync(path.join(DIST_DIR, zip))
    const size = (stats.size / 1024 / 1024).toFixed(2)
    console.log(`  ${c.dim}├──${c.reset} ${zip} ${c.dim}(${size} MB)${c.reset}`)
  }
}

async function step3_github_release() {
  log("步骤 3/4: 创建 GitHub Release")
  
  const pkg = await Bun.file(path.join(PKG_DIR, "package.json")).json()
  const version = pkg.version
  const tag = `v${version}`
  
  log("版本", tag)
  
  // 检查 git 状态
  try {
    await $`git rev-parse ${tag}`
    log("标签", `${tag} 已存在`)
  } catch {
    log("标签", `创建新标签 ${tag}...`)
    await $`git tag -a ${tag} -m "Release ${tag}"`
    await $`git push origin ${tag}`
  }
  
  // 使用 gh CLI 创建 release（如果已安装）
  try {
    await $`gh --version`
    log("发布", "使用 gh CLI 创建 GitHub Release...")
    
    const zips = fs.readdirSync(DIST_DIR).filter(f => f.endsWith(".zip"))
    const files = zips.map(f => `"${path.join(DIST_DIR, f)}"`).join(" ")
    
    await $`gh release create ${tag} ${files} --title "OpenCode 汉化版 ${tag}" --notes "OpenCode 汉化版 ${tag} 发布"`
    success("GitHub Release 创建成功")
  } catch {
    log("提示", "请手动创建 GitHub Release:")
    console.log(`  ${c.yellow}https://github.com/ev71h5n1-wq/opencode-zh/releases/new?tag=${tag}${c.reset}`)
    console.log(`  ${c.dim}上传文件: ${DIST_DIR}/*.zip${c.reset}`)
  }
}

async function step4_npm_publish() {
  log("步骤 4/4: 发布到 npm")
  
  // 检查 npm 登录状态
  try {
    const user = await $`npm whoami`.text()
    success(`已登录 npm: ${user.trim()}`)
  } catch {
    error("npm 未登录")
    console.log(`\n${c.yellow}请先运行: npm login${c.reset}`)
    console.log(`用户名: ev71h5n1`)
    return
  }
  
  // 执行发布脚本
  const publishScript = path.join(PKG_DIR, "script/publish-zh.ts")
  if (fs.existsSync(publishScript)) {
    log("发布", "执行发布脚本...")
    const proc = Bun.spawn({
      cmd: ["bun", "run", publishScript],
      cwd: PKG_DIR,
      stdout: "inherit",
      stderr: "inherit",
    })
    const exitCode = await proc.exited
    if (exitCode === 0) {
      success("npm 发布完成")
    } else {
      error("npm 发布失败")
    }
  } else {
    // 手动发布
    log("发布", "手动发布到 npm...")
    const pkg = await Bun.file(path.join(PKG_DIR, "package.json")).json()
    
    // 创建临时发布目录
    const publishDir = path.join(DIST_DIR, "npm-publish")
    fs.mkdirSync(publishDir, { recursive: true })
    
    // 复制必要文件
    fs.cpSync(path.join(PKG_DIR, "bin"), path.join(publishDir, "bin"), { recursive: true })
    
    // 创建 package.json
    const publishPkg = {
      name: "opencode-zh",
      version: pkg.version,
      description: "OpenCode 汉化版 - AI 编程助手",
      bin: { "opencode-zh": "./bin/opencode-zh" },
      license: "MIT",
      repository: {
        type: "git",
        url: "https://github.com/ev71h5n1-wq/opencode-zh"
      },
      keywords: ["opencode", "ai", "coding", "chinese"]
    }
    
    await Bun.write(path.join(publishDir, "package.json"), JSON.stringify(publishPkg, null, 2))
    
    // 发布
    await $`npm publish --access public`.cwd(publishDir)
    success("npm 发布完成")
  }
}

// 主函数
async function main() {
  console.log(`\n${c.bright}${c.cyan}═══════════════════════════════════════════════════════${c.reset}`)
  console.log(`${c.bright}${c.cyan}  OpenCode 汉化版 - 全自动构建发布脚本${c.reset}`)
  console.log(`${c.bright}${c.cyan}═══════════════════════════════════════════════════════${c.reset}\n`)
  
  const startTime = Date.now()
  
  try {
    await step1_build()
    await step2_package()
    await step3_github_release()
    await step4_npm_publish()
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
    
    console.log(`\n${c.bright}${c.green}═══════════════════════════════════════════════════════${c.reset}`)
    console.log(`${c.bright}${c.green}  ✓ 全部完成！用时: ${duration} 分钟${c.reset}`)
    console.log(`${c.bright}${c.green}═══════════════════════════════════════════════════════${c.reset}\n`)
    
  } catch (e: any) {
    error(e.message)
    process.exit(1)
  }
}

main()
