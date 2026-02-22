#!/usr/bin/env bun
/**
 * OpenCode 汉化版 - 仅 npm 发布脚本
 * 不需要构建二进制文件，直接发布源代码包
 */

import { $ } from "bun"
import * as fs from "fs"
import * as path from "path"

const PKG_DIR = path.resolve(import.meta.dir, "packages/opencode")

console.log("🚀 OpenCode 汉化版 - npm 发布工具\n")

// 检查 npm 登录
console.log("📦 检查 npm 登录状态...")
try {
  const user = await $`npm whoami`.text()
  console.log(`   ✅ 已登录: ${user.trim()}`)
} catch {
  console.log("   ❌ 未登录，请先运行: npm login")
  console.log("   用户名: ev71h5n1")
  process.exit(1)
}

// 读取 package.json
const pkg = await Bun.file(path.join(PKG_DIR, "package.json")).json()
console.log(`\n📦 准备发布: ${pkg.name}@${pkg.version}\n`)

// 创建发布目录
const publishDir = path.join(PKG_DIR, "dist-npm")
if (fs.existsSync(publishDir)) {
  fs.rmSync(publishDir, { recursive: true, force: true })
}
fs.mkdirSync(publishDir, { recursive: true })

// 复制必要文件
console.log("📦 复制文件...")

// 复制 src 目录
fs.cpSync(path.join(PKG_DIR, "src"), path.join(publishDir, "src"), { recursive: true })

// 复制 bin 目录
if (fs.existsSync(path.join(PKG_DIR, "bin"))) {
  fs.cpSync(path.join(PKG_DIR, "bin"), path.join(publishDir, "bin"), { recursive: true })
}

// 创建简化版 package.json
const publishPkg = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description || "OpenCode 汉化版 - AI 编程助手",
  type: "module",
  license: pkg.license || "MIT",
  bin: {
    "opencode-zh": "./bin/opencode-zh"
  },
  scripts: {
    "postinstall": "echo 'OpenCode 汉化版安装完成'"
  },
  repository: {
    type: "git",
    url: "https://github.com/ev71h5n1-wq/opencode-zh"
  },
  keywords: ["opencode", "ai", "coding", "assistant", "chinese", "汉化"],
  author: "ev71h5n1",
  engines: {
    bun: ">=1.3.0"
  }
}

await Bun.write(path.join(publishDir, "package.json"), JSON.stringify(publishPkg, null, 2))

// 复制其他必要文件
const filesToCopy = ["README.md", "LICENSE"]
for (const file of filesToCopy) {
  const src = path.join(PKG_DIR, file)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(publishDir, file))
  }
}

// 创建 bin/opencode-zh 启动脚本
const binDir = path.join(publishDir, "bin")
fs.mkdirSync(binDir, { recursive: true })

const launcherScript = `#!/usr/bin/env bun
// OpenCode 汉化版启动器
import { spawn } from "child_process"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const indexPath = path.join(__dirname, "../src/index.ts")

// 使用 bun 运行主程序
const proc = spawn("bun", ["run", "--conditions=browser", indexPath, ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true
})

proc.on("exit", (code) => {
  process.exit(code || 0)
})
`

await Bun.write(path.join(binDir, "opencode-zh"), launcherScript)

// 发布到 npm
console.log("\n📦 发布到 npm...")
console.log("   运行: npm publish --access public\n")

try {
  await $`npm publish --access public`.cwd(publishDir)
  console.log("\n✅ 发布成功！")
  console.log(`\n   现在可以使用: npm i -g ${pkg.name}`)
} catch (e: any) {
  console.error("\n❌ 发布失败:", e.message)
  console.log("\n   可能的解决方案:")
  console.log("   1. 检查 npm 是否登录: npm whoami")
  console.log("   2. 检查版本号是否已存在")
  console.log("   3. 手动发布: cd packages/opencode/dist-npm && npm publish --access public")
}

// 清理
console.log("\n📦 清理临时文件...")
fs.rmSync(publishDir, { recursive: true, force: true })
console.log("   ✅ 完成")
