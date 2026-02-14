---
name: uninstall-and-install-opencode
overview: 卸载现有 opencode 并安装本地源码开发版本
todos:
  - id: uninstall-npm
    content: 卸载 npm 全局安装的 opencode-ai 包
    status: completed
  - id: clean-config
    content: 删除配置目录 C:\Users\kery\.config\opencode
    status: completed
    dependencies:
      - uninstall-npm
  - id: clean-npm-residue
    content: 清理 npm 残留文件和缓存
    status: completed
    dependencies:
      - clean-config
  - id: install-deps
    content: 在项目目录运行 bun install 安装依赖
    status: completed
    dependencies:
      - clean-npm-residue
  - id: run-dev
    content: 运行 bun run dev 启动本地开发版本
    status: completed
    dependencies:
      - install-deps
---

## 用户要求

1. 卸载现有的 npm 全局安装的 opencode（opencode-ai 包）
2. 删除相关配置和数据（不保留）
3. 在本地项目 f:/AI-Tools/opencode/opencode-dev 安装依赖并运行开发版本

## 现状分析

- opencode 通过 npm 全局安装为 opencode-ai 包
- 配置目录：C:\Users\kery\.config\opencode
- 可执行文件位置：C:\Users\kery\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode
- 项目使用 bun 作为包管理器
- 开发命令：bun run dev

## 技术方案

### 卸载方案

1. 使用 npm uninstall -g opencode-ai 卸载全局包
2. 手动删除配置目录 C:\Users\kery\.config\opencode
3. 清理 npm 缓存中的残留文件

### 本地开发安装方案

1. 确保已安装 bun 包管理器
2. 在项目根目录运行 bun install 安装所有依赖
3. 运行 bun run dev 启动开发版本

### 注意事项

- Windows 系统下 npm 全局包的卸载
- bun 可能需要通过 npm install -g bun 安装
- 项目使用 monorepo 结构，根目录安装即可