#!/usr/bin/env bun
/**
 * OpenCode 汉化版发布脚本
 * 
 * 用法: bun run script/publish-zh.ts
 * 
 * 需要设置环境变量:
 * - NPM_TOKEN: npm 发布令牌
 * - GITHUB_TOKEN: GitHub 令牌 (可选，用于创建 Release)
 */
import { $ } from "bun"
import pkg from "../package.json"
import { Script } from "@opencode-ai/script"
import { fileURLToPath } from "url"

const dir = fileURLToPath(new URL("..", import.meta.url))
process.chdir(dir)

const binaries: Record<string, string> = {}
for (const filepath of new Bun.Glob("*/package.json").scanSync({ cwd: "./dist" })) {
  const distPkg = await Bun.file(`./dist/${filepath}`).json()
  binaries[distPkg.name] = distPkg.version
}
console.log("构建的二进制文件:", binaries)
const version = Object.values(binaries)[0]

// 准备主包目录
await $`mkdir -p ./dist/${pkg.name}`
await $`cp -r ./bin ./dist/${pkg.name}/bin`

// 复制 postinstall 脚本（如果存在）
const postinstallPath = "./script/postinstall.mjs"
if (await Bun.file(postinstallPath).exists()) {
  await $`cp ${postinstallPath} ./dist/${pkg.name}/postinstall.mjs`
}

// 复制 LICENSE
const licensePath = "../../LICENSE"
if (await Bun.file(licensePath).exists()) {
  await Bun.file(`./dist/${pkg.name}/LICENSE`).write(await Bun.file(licensePath).text())
}

// 创建 npm 包配置
const npmPkg = {
  name: "opencode-zh",
  version: version,
  description: "OpenCode 汉化版 - AI 编程助手",
  bin: {
    "opencode-zh": `./bin/${pkg.name}`,
  },
  scripts: await Bun.file(postinstallPath).exists() 
    ? { postinstall: "bun ./postinstall.mjs || node ./postinstall.mjs" }
    : undefined,
  license: pkg.license,
  repository: {
    type: "git",
    url: "https://github.com/ev71h5n1-wq/opencode-zh",
  },
  homepage: "https://github.com/ev71h5n1-wq/opencode-zh",
  keywords: [
    "opencode",
    "ai",
    "coding",
    "assistant",
    "chinese",
    "中文",
    "agent",
    "llm",
    "claude",
    "gpt",
  ],
  engines: {
    node: ">=18",
  },
  os: ["win32"],
  cpu: ["x64"],
  optionalDependencies: binaries,
}

await Bun.file(`./dist/${pkg.name}/package.json`).write(
  JSON.stringify(npmPkg, null, 2),
)

console.log(`\n准备发布: ${npmPkg.name}@${version}\n`)

// 发布平台特定的二进制包
const tasks = Object.entries(binaries).map(async ([name]) => {
  if (process.platform !== "win32") {
    await $`chmod -R 755 .`.cwd(`./dist/${name}`)
  }
  console.log(`打包: ${name}`)
  await $`bun pm pack`.cwd(`./dist/${name}`)
  console.log(`发布: ${name}`)
  await $`npm publish *.tgz --access public --tag ${Script.channel}`.cwd(`./dist/${name}`)
})
await Promise.all(tasks)

// 发布主包
console.log(`\n发布主包: opencode-zh`)
await $`cd ./dist/${pkg.name} && bun pm pack && npm publish *.tgz --access public --tag ${Script.channel}`

console.log(`\n✅ 发布成功!\n`)
console.log(`  npm: https://www.npmjs.com/package/opencode-zh`)
console.log(`  版本: ${version}`)
console.log(`  渠道: ${Script.channel}\n`)

// 打包 GitHub Release 文件
console.log("准备 GitHub Release 文件...")
for (const [name] of Object.entries(binaries)) {
  if (name.includes("windows")) {
    const zipName = `${name}.zip`
    await $`cd ./dist/${name}/bin && zip -r ../${zipName} *`
    console.log(`  创建: ${zipName}`)
  }
}

console.log("\n🎉 完成!")
