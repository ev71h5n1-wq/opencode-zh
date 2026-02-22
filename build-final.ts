#!/usr/bin/env bun
/**
 * OpenCode 汉化版 - 最终构建脚本
 */

import { $ } from "bun"
import * as fs from "fs"
import * as path from "path"

const ROOT = path.resolve(import.meta.dir)
const PKG_DIR = path.join(ROOT, "packages/opencode")
const DIST_DIR = path.join(PKG_DIR, "dist")
const ENTRY = path.join(PKG_DIR, "src/index.ts")

console.log("🚀 OpenCode 汉化版构建工具\n")

// 步骤 1: 清理
console.log("📦 步骤 1/3: 清理旧构建...")
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true })
}
fs.mkdirSync(DIST_DIR, { recursive: true })

// 步骤 2: 构建
console.log("\n📦 步骤 2/3: 构建二进制文件...")
console.log("   这可能需要 3-5 分钟...\n")

const targets = [
  { name: "opencode-zh-windows-x64", target: "bun-windows-x64" },
  { name: "opencode-zh-windows-x64-baseline", target: "bun-windows-x64-baseline" },
]

for (const { name, target } of targets) {
  console.log(`   构建 ${name}...`)
  const output = path.join(DIST_DIR, name)
  
  try {
    await $`bun build ${ENTRY} --compile --target=${target} --outfile=${output}`.cwd(PKG_DIR)
    console.log(`   ✅ ${name} 完成`)
  } catch (e) {
    console.error(`   ❌ ${name} 失败:`, e)
  }
}

// 步骤 3: 打包
console.log("\n📦 步骤 3/3: 打包为 zip...")

for (const { name } of targets) {
  const exePath = path.join(DIST_DIR, `${name}.exe`)
  const zipPath = path.join(DIST_DIR, `${name}.zip`)
  
  if (fs.existsSync(exePath)) {
    // 创建临时目录
    const tempDir = path.join(DIST_DIR, name)
    fs.mkdirSync(tempDir, { recursive: true })
    
    // 复制 exe 并重命名
    fs.copyFileSync(exePath, path.join(tempDir, "opencode-zh.exe"))
    
    // 压缩
    await $`powershell Compress-Archive -Path ${tempDir}/* -DestinationPath ${zipPath} -Force`
    
    // 清理临时目录
    fs.rmSync(tempDir, { recursive: true, force: true })
    fs.rmSync(exePath, { force: true })
    
    const size = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2)
    console.log(`   ✅ ${name}.zip (${size} MB)`)
  }
}

console.log("\n✅ 构建完成！")
console.log(`\n📂 输出位置: ${DIST_DIR}\n`)

// 列出文件
const files = fs.readdirSync(DIST_DIR).filter(f => f.endsWith(".zip"))
console.log("生成的文件:")
for (const f of files) {
  console.log(`   - ${f}`)
}

console.log("\n📌 下一步:")
console.log("   1. 访问 https://github.com/ev71h5n1-wq/opencode-zh/releases/new")
console.log("   2. 创建标签 v1.1.65")
console.log("   3. 上传 dist/*.zip 文件")
console.log("   4. 运行: bun run packages/opencode/script/publish-zh.ts")
