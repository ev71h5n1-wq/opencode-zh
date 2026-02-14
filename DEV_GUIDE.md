# OpenCode 本地开发指南

## 项目目录结构

```
f:\AI-Tools\opencode\opencode-dev\
├── packages/                    # 主要代码包
│   ├── opencode/               # 核心 CLI 包 ⭐
│   │   ├── src/                # 源代码目录
│   │   ├── test/               # 测试文件
│   │   ├── bin/                # 可执行文件
│   │   └── package.json
│   ├── app/                    # Web 应用
│   ├── desktop/                # 桌面应用 (Tauri)
│   ├── console/                # 控制台相关
│   ├── web/                    # Web 服务
│   ├── ui/                     # UI 组件库
│   ├── sdk/                    # SDK
│   ├── plugin/                 # 插件系统
│   └── util/                   # 工具函数
├── script/                     # 构建脚本
├── sdks/                       # SDK 文件
├── package.json                # 根项目配置
├── bun.lock                    # Bun 依赖锁定
└── tsconfig.json               # TypeScript 配置
```

## 快速开始

### 1. 安装依赖

```bash
cd f:\AI-Tools\opencode\opencode-dev
bun install
```

### 2. 启动开发版本

```bash
# 方式一：从根目录启动
bun run dev

# 方式二：进入 opencode 包目录启动
cd packages/opencode
bun run dev
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `bun run dev` | 启动开发版本（CLI 模式）|
| `bun run dev:desktop` | 启动桌面应用开发模式 |
| `bun run dev:web` | 启动 Web 应用开发模式 |
| `bun run typecheck` | 类型检查 |
| `bun test` | 运行测试（在 packages/opencode 目录下）|

## 核心源码位置

主要修改和调试的代码在 `packages/opencode/src/` 目录：

- `src/index.ts` - 入口文件
- `src/` - 主要源代码（214 个 TypeScript 文件）

## 开发流程

1. 修改 `packages/opencode/src/` 下的源代码
2. 运行 `bun run dev` 测试改动
3. 代码会实时生效，无需重新构建

## 环境要求

- **Bun**: 1.3.9（项目指定的包管理器）
- **Node.js**: 可选（Bun 可独立运行）
- **TypeScript**: 5.8.2

## 相关链接

- 项目仓库：https://github.com/anomalyco/opencode
- 原始文档：`AGENTS.md`（项目编码规范）
