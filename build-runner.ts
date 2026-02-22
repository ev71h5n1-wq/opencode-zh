#!/usr/bin/env bun
/**
 * OpenCode 汉化版 - 带进度显示的构建运行器
 */

import { spawn } from "child_process"
import * as fs from "fs"
import * as path from "path"

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
}

const c = colors

console.log(`${c.bright}${c.cyan}
╔══════════════════════════════════════════════════════════╗
║     OpenCode 汉化版 - Windows 构建工具                    ║
╚══════════════════════════════════════════════════════════╝${c.reset}
`)

const startTime = Date.now()

// 显示进度动画
let progress = 0
let progressInterval: any = null

function startProgress(label: string) {
  progress = 0
  console.log(`\n${c.yellow}▶ ${label}${c.reset}`)
  progressInterval = setInterval(() => {
    progress = (progress + 1) % 100
    const filled = Math.floor(progress / 2)
    const bar = "█".repeat(filled) + "░".repeat(50 - filled)
    process.stdout.write(`\r${c.dim}[${bar}] ${progress}%${c.reset}`)
  }, 200)
}

function stopProgress(success = true) {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
  process.stdout.write("\r" + " ".repeat(60) + "\r")
  if (success) {
    console.log(`${c.green}✓ 完成${c.reset}`)
  }
}

// 步骤 1: 验证环境
console.log(`${c.bright}步骤 1/4: 验证环境${c.reset}`)
console.log(`  ${c.dim}Bun 版本: ${Bun.version}${c.reset}`)
console.log(`  ${c.dim}工作目录: ${process.cwd()}${c.reset}`)

// 步骤 2: 清理旧构建
console.log(`\n${c.bright}步骤 2/4: 清理旧构建${c.reset}`)
const distPath = path.resolve("packages/opencode/dist")
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true })
  console.log(`  ${c.green}✓ 已清理旧构建目录${c.reset}`)
}

// 步骤 3: 执行构建
console.log(`\n${c.bright}步骤 3/4: 编译 Windows 二进制文件${c.reset}`)
console.log(`  ${c.dim}这可能需要 3-8 分钟，请耐心等待...${c.reset}\n`)

const buildScript = path.resolve("packages/opencode/script/build.ts")
const buildDir = path.resolve("packages/opencode")

// 使用 Bun.spawn 来运行构建
const proc = Bun.spawn(["bun", "run", buildScript, "--windows-only"], {
  cwd: buildDir,
  stdout: "pipe",
  stderr: "pipe",
})

// 读取输出
const reader = proc.stdout.getReader()
const decoder = new TextDecoder()
let output = ""

// 启动进度显示
startProgress("正在编译...")

// 定期读取输出
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  const text = decoder.decode(value, { stream: true })
  output += text

  // 如果有新行，显示它
  const lines = text.split("\n")
  for (const line of lines) {
    if (line.trim()) {
      console.log(`    ${c.dim}${line.substring(0, 70)}${c.reset}`)
    }
  }
}

// 等待进程结束
const exitCode = await proc.exited
stopProgress(exitCode === 0)

if (exitCode !== 0) {
  const stderr = await new Response(proc.stderr).text()
  console.error(`\n${c.red}✗ 构建失败！${c.reset}`)
  console.error(`${c.red}${stderr}${c.reset}`)
  process.exit(1)
}

// 步骤 4: 验证输出
console.log(`\n${c.bright}步骤 4/4: 验证构建结果${c.reset}`)

if (!fs.existsSync(distPath)) {
  console.error(`  ${c.red}✗ 构建目录不存在${c.reset}`)
  process.exit(1)
}

const files = fs.readdirSync(distPath)
const zipFiles = files.filter((f) => f.endsWith(".zip"))

console.log(`  ${c.green}✓ 找到 ${zipFiles.length} 个构建文件:${c.reset}`)
for (const file of zipFiles) {
  const filePath = path.join(distPath, file)
  const stats = fs.statSync(filePath)
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
  console.log(`      ${c.cyan}•${c.reset} ${file} ${c.dim}(${sizeMB} MB)${c.reset}`)
}

const duration = ((Date.now() - startTime) / 1000).toFixed(1)

console.log(`\n${c.bright}${c.green}
╔══════════════════════════════════════════════════════════╗
║                   ✅ 构建成功完成！                        ║
╚══════════════════════════════════════════════════════════╝${c.reset}

${c.cyan}📊 统计信息:${c.reset}
  • 构建用时: ${duration} 秒
  • 输出目录: ${c.yellow}packages/opencode/dist/${c.reset}

${c.cyan}📦 构建文件:${c.reset}`)
for (const file of zipFiles) {
  console.log(`  • ${file}`)
}

console.log(`
${c.cyan}🚀 下一步操作:${c.reset}
  1. 创建 GitHub Release
     ${c.dim}https://github.com/ev71h5n1-wq/opencode-zh/releases/new${c.reset}
     - 标签: v1.1.65
     - 上传 packages/opencode/dist/ 中的 zip 文件

  2. 发布到 npm
     ${c.dim}bun run packages/opencode/script/publish-zh.ts${c.reset}

${c.bright}${c.green}══════════════════════════════════════════════════════════${c.reset}
`)
