#!/usr/bin/env node
/**
 * OpenCode 汉化版启动器
 * 需要 Bun 运行时: https://bun.sh
 */

const { spawn } = require("child_process");
const path = require("path");

// 检查是否安装了 Bun
try {
  require("child_process").execSync("bun --version", { stdio: "pipe" });
} catch {
  console.error("❌ 请先安装 Bun 运行时:");
  console.error("   Windows: powershell -c \"irm bun.sh/install.ps1 | iex\"");
  console.error("   其他系统: curl -fsSL https://bun.sh/install | bash");
  process.exit(1);
}

// OpenCode 汉化版仓库路径
const opencodeDir = path.join(__dirname, "..", "..", "..", "opencode-zh", "packages", "opencode");

// 检查仓库是否存在
const fs = require("fs");
if (!fs.existsSync(opencodeDir)) {
  console.log("📦 首次运行，需要克隆 OpenCode 汉化版仓库...");
  
  const cloneDir = path.join(__dirname, "..", "..", "..");
  const { execSync } = require("child_process");
  
  try {
    execSync(
      'git clone https://github.com/ev71h5n1-wq/opencode-zh.git "' + 
      path.join(cloneDir, "opencode-zh") + '"',
      { stdio: "inherit" }
    );
  } catch (e) {
    console.error("❌ 克隆仓库失败，请手动克隆:");
    console.error("   git clone https://github.com/ev71h5n1-wq/opencode-zh.git");
    process.exit(1);
  }
}

// 启动 OpenCode
const proc = spawn(
  "bun",
  ["run", "--conditions=browser", path.join(opencodeDir, "src", "index.ts"), ...process.argv.slice(2)],
  {
    stdio: "inherit",
    shell: true,
  }
);

proc.on("exit", (code) => {
  process.exit(code || 0);
});
