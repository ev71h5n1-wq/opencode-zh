#!/usr/bin/env bun
/**
 * OpenCode 汉化版 - 带进度显示的构建程序
 * 用法: bun run build-with-progress.ts
 */

import { $ } from "bun"
import * as fs from "fs"
import * as path from "path"

// 颜色配置
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
}

const c = colors

// 进度条函数
function showProgress(current: number, total: number, label: string, width = 40) {
  const percent = Math.round((current / total) * 100)
  const filled = Math.round((current / total) * width)
  const empty = width - filled
  const bar = `${c.green}█${c.reset}`.repeat(filled) + `${c.dim}░${c.reset}`.repeat(empty)
  process.stdout.write(`\r${c.cyan}[${bar}]${c.reset} ${percent}% ${label}`)
  if (current === total) {
    console.log()
  }
}

// 打印标题
console.log(`
${c.bright}${c.magenta}═══════════════════════════════════════════════════════${c.reset}
${c.bright}${c.magenta}  OpenCode 汉化版 - Windows 构建工具${c.reset}
${c.bright}${c.magenta}═══════════════════════════════════════════════════════${c.reset}
`)

const startTime = Date.now()

// 步骤定义
const steps = [
  { name: "验证环境", fn: verifyEnvironment },
  { name: "清理旧构建", fn: cleanOldBuild },
  { name: "编译主程序", fn: buildMainBinary },
  { name: "编译 Baseline 版本", fn: buildBaselineBinary },
  { name: "打包输出", fn: packageOutput },
  { name: "验证构建", fn: verifyBuild },
]

let currentStep = 0

async function runStep(step: typeof steps[0]) {
  currentStep++
  console.log(`\n${c.bright}${c.yellow}步骤 ${currentStep}/${steps.length}: ${step.name}${c.reset}`)
  console.log(`${c.dim}${"─".repeat(50)}${c.reset}`)

  try {
    await step.fn()
    showProgress(currentStep, steps.length, `${c.green}✓ ${step.name} 完成${c.reset}`)
  } catch (error) {
    console.log(`\n${c.red}✗ ${step.name} 失败${c.reset}`)
    console.error(error)
    process.exit(1)
  }
}

// 步骤 1: 验证环境
async function verifyEnvironment() {
  console.log(`${c.blue}  → 检查 Bun 版本...${c.reset}`)
  const bunVersion = await $`bun --version`.text()
  console.log(`     Bun 版本: ${c.green}${bunVersion.trim()}${c.reset}`)

  console.log(`${c.blue}  → 检查 npm 登录状态...${c.reset}`)
  try {
    const npmUser = await $`npm whoami`.text()
    console.log(`     npm 用户: ${c.green}${npmUser.trim()}${c.reset}`)
  } catch {
    console.log(`     ${c.yellow}⚠ npm 未登录（构建不需要，发布时需要）${c.reset}`)
  }

  const pkgPath = path.resolve(import.meta.dir, "packages/opencode/package.json")
  const pkg = await Bun.file(pkgPath).json()
  console.log(`     构建版本: ${c.green}${pkg.version}${c.reset}`)
}

// 步骤 2: 清理旧构建
async function cleanOldBuild() {
  const distPath = path.resolve(import.meta.dir, "packages/opencode/dist")
  if (fs.existsSync(distPath)) {
    console.log(`${c.blue}  → 清理旧构建目录...${c.reset}`)
    await $`rm -rf ${distPath}`.catch(() => {
      // Windows fallback
      try {
        fs.rmSync(distPath, { recursive: true, force: true })
      } catch {}
    })
  }
}

// 步骤 3: 编译主程序
async function buildMainBinary() {
  console.log(`${c.blue}  → 开始编译 Windows x64 版本...${c.reset}`)
  const buildPath = path.resolve(import.meta.dir, "packages/opencode/script/build.ts")

  const proc = Bun.spawn(["bun", "run", buildPath, "--windows-only"], {
    cwd: path.resolve(import.meta.dir, "packages/opencode"),
    stdout: "pipe",
    stderr: "pipe",
  })

  // 模拟进度显示
  let progress = 0
  const interval = setInterval(() => {
    progress = Math.min(progress + 2, 90)
    process.stdout.write(`\r     ${c.dim}编译中... ${progress}%${c.reset}`)
  }, 500)

  const exitCode = await proc.exited
  clearInterval(interval)
  process.stdout.write(`\r     ${c.green}编译完成!${c.reset}      \n`)

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text()
    throw new Error(`构建失败: ${stderr}`)
  }
}

// 步骤 4: 编译 Baseline 版本 (如果需要的话，主构建脚本已包含)
async function buildBaselineBinary() {
  console.log(`${c.blue}  → Baseline 版本已包含在主构建中${c.reset}`)
  await new Promise((resolve) => setTimeout(resolve, 500))
}

// 步骤 5: 打包输出
async function packageOutput() {
  const distPath = path.resolve(import.meta.dir, "packages/opencode/dist")

  console.log(`${c.blue}  → 检查构建输出...${c.reset}`)

  if (!fs.existsSync(distPath)) {
    throw new Error("构建目录不存在")
  }

  const files = fs.readdirSync(distPath)
  const zipFiles = files.filter((f) => f.endsWith(".zip"))

  console.log(`     找到 ${c.green}${zipFiles.length}${c.reset} 个构建文件:`)
  for (const file of zipFiles) {
    const filePath = path.join(distPath, file)
    const stats = fs.statSync(filePath)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
    console.log(`       ${c.dim}├──${c.reset} ${file} ${c.dim}(${sizeMB} MB)${c.reset}`)
  }
}

// 步骤 6: 验证构建
async function verifyBuild() {
  const distPath = path.resolve(import.meta.dir, "packages/opencode/dist")
  const files = fs.readdirSync(distPath)

  const hasWinX64 = files.some((f) => f.includes("win32-x64") && !f.includes("baseline"))
  const hasBaseline = files.some((f) => f.includes("baseline"))

  console.log(`     ${hasWinX64 ? c.green + "✓" : c.red + "✗"}${c.reset} Windows x64 版本`)
  console.log(`     ${hasBaseline ? c.green + "✓" : c.red + "✗"}${c.reset} Baseline 版本`)

  if (!hasWinX64) {
    throw new Error("主构建文件缺失")
  }
}

// 主函数
async function main() {
  console.log(`${c.dim}准备开始构建...${c.reset}\n`)

  for (const step of steps) {
    await runStep(step)
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log(`
${c.bright}${c.green}═══════════════════════════════════════════════════════${c.reset}
${c.bright}${c.green}  ✓ 构建成功完成！${c.reset}
${c.bright}${c.green}═══════════════════════════════════════════════════════${c.reset}

${c.cyan}构建统计:${c.reset}
  • 用时: ${duration} 秒
  • 输出目录: ${c.yellow}packages/opencode/dist/${c.reset}

${c.cyan}下一步操作:${c.reset}
  1. 创建 GitHub Release 并上传 zip 文件
     ${c.dim}https://github.com/ev71h5n1-wq/opencode-zh/releases/new${c.reset}

  2. 发布到 npm
     ${c.dim}bun run packages/opencode/script/publish-zh.ts${c.reset}

${c.bright}${c.magenta}═══════════════════════════════════════════════════════${c.reset}
`)
}

// 运行
main().catch((error) => {
  console.error(`\n${c.red}构建失败: ${error.message}${c.reset}`)
  process.exit(1)
})
