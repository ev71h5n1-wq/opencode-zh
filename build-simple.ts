#!/usr/bin/env bun
/**
 * OpenCode 汉化版 - 简化构建程序（跳过 npm 检查）
 */

console.log("🚀 OpenCode 汉化版 Windows 构建工具\n")

const startTime = Date.now()

// 步骤 1: 验证 Bun 环境
console.log("📋 步骤 1/3: 验证 Bun 版本...")
const bunVersion = Bun.version
console.log(`   ✓ Bun 版本: ${bunVersion}`)

// 步骤 2: 清理并构建
console.log("\n📋 步骤 2/3: 开始构建 Windows 二进制文件...")
console.log("   这可能需要 2-5 分钟，请耐心等待...")

const { execSync } = require("child_process")
const path = require("path")

const buildScript = path.resolve(import.meta.dir, "packages/opencode/script/build.ts")
const cwd = path.resolve(import.meta.dir, "packages/opencode")

try {
  // 使用 execSync 来运行构建，可以看到实时输出
  execSync(`bun run "${buildScript}" --windows-only`, {
    cwd,
    stdio: "inherit", // 直接输出到控制台
    encoding: "utf-8",
  })
} catch (error) {
  console.error("\n❌ 构建失败:", error.message)
  process.exit(1)
}

// 步骤 3: 验证输出
console.log("\n📋 步骤 3/3: 验证构建结果...")
const fs = require("fs")
const distPath = path.resolve(import.meta.dir, "packages/opencode/dist")

if (!fs.existsSync(distPath)) {
  console.error("❌ 构建目录不存在")
  process.exit(1)
}

const files = fs.readdirSync(distPath)
const zipFiles = files.filter((f: string) => f.endsWith(".zip"))

console.log(`   ✓ 找到 ${zipFiles.length} 个构建文件:`)
for (const file of zipFiles) {
  const filePath = path.join(distPath, file)
  const stats = fs.statSync(filePath)
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
  console.log(`     - ${file} (${sizeMB} MB)`)
}

const duration = ((Date.now() - startTime) / 1000).toFixed(1)

console.log(`
✅ 构建成功完成！用时: ${duration} 秒

📦 输出位置: packages/opencode/dist/

📌 下一步:
   1. 访问 https://github.com/ev71h5n1-wq/opencode-zh/releases/new
   2. 创建标签 v1.1.65
   3. 上传 dist/ 目录中的 zip 文件
   4. 发布到 npm: bun run packages/opencode/script/publish-zh.ts
`)
