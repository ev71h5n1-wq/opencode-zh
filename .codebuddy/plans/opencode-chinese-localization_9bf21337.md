---
name: opencode-chinese-localization
overview: 汉化 OpenCode 项目，包括 App 界面 i18n 翻译补全和 CLI TUI 硬编码文本汉化
todos:
  - id: analyze-missing-translations
    content: 分析 App 界面中文翻译文件缺失的键值
    status: completed
  - id: translate-app-zh
    content: 补全 App 界面中文翻译文件所有缺失键值
    status: completed
    dependencies:
      - analyze-missing-translations
  - id: translate-tui-prompt
    content: 汉化 TUI 输入框占位符和底部快捷键提示
    status: completed
  - id: translate-tui-commands
    content: 汉化 TUI 命令菜单标题和描述
    status: completed
  - id: translate-tui-help
    content: 汉化 TUI 帮助弹窗内容和按钮
    status: completed
  - id: translate-tui-tips
    content: 汉化 TUI 提示信息（TIPS 数组）
    status: completed
  - id: translate-tui-dialogs
    content: 汉化 TUI 其他对话框标题和提示信息
    status: completed
---

## 产品概述

汉化 OpenCode 项目，包括 App 界面（Web 端）的中文翻译文件补全，以及 CLI TUI 界面（终端界面）的硬编码英文文本汉化。

## 核心功能

### 1. App 界面汉化

- 补全 `packages/app/src/i18n/zh.ts` 中缺失的中文翻译键值（对比英文版本 `en.ts`）
- 确保所有新增功能的中文翻译完整

### 2. CLI TUI 界面汉化

汉化以下文件中的硬编码英文文本：

- **输入框占位符**：`packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx`
- "Ask anything..." → "随便问点什么..."
- "Run a command..." → "运行命令..."
- 占位符示例列表（Fix a TODO in the codebase 等）

- **底部快捷键提示**：`packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx`
- "ctrl+t variants" → "ctrl+t 变体"
- "tab agents" → "tab 智能体"
- "ctrl+p commands" → "ctrl+p 命令"
- "esc interrupt" → "esc 中断"
- "esc exit shell mode" → "esc 退出 shell 模式"

- **命令菜单标题和描述**：`packages/opencode/src/cli/cmd/tui/app.tsx`
- "Switch agent" → "切换智能体"
- "Connect provider" → "连接提供商"
- "New session" → "新建会话"
- "Help" → "帮助"
- "Exit the app" → "退出应用"
- 等其他命令标题和描述

- **帮助弹窗内容**：`packages/opencode/src/cli/cmd/tui/ui/dialog-help.tsx`
- "Help" → "帮助"
- "Press ctrl+p to see all available actions and commands in any context." → "按 ctrl+p 查看所有可用操作和命令"
- "ok" → "确定"

- **提示信息**：`packages/opencode/src/cli/cmd/tui/component/tips.tsx`
- 主题提示
- 所有 TIPS 数组内容（共 100+ 条提示）

- **按钮和标签**：`packages/opencode/src/cli/cmd/tui/ui/dialog-help.tsx`
- "ok" → "确定"

- **命令菜单标题**：`packages/opencode/src/cli/cmd/tui/component/dialog-command.tsx`
- "Commands" → "命令"

- **提示信息**：
- "Connect a provider to send prompts" → "连接提供商以发送提示"
- "Update Available" → "有可用更新"
- "The current session was deleted" → "当前会话已删除"
- "Copied to clipboard" → "已复制到剪贴板"

### 3. 视觉要求

- 保持原有的 TUI 界面布局和样式不变
- 确保中文文本在终端中正确显示，不出现乱码或截断

## 技术栈

- **App 界面**：TypeScript + SolidJS
- **CLI TUI**：TypeScript + SolidJS + OpenTUI
- **包管理器**：Bun

## 实现方案

### App 界面翻译

1. 对比 `packages/app/src/i18n/en.ts` 和 `packages/app/src/i18n/zh.ts`
2. 找出缺失的键值（英文版本中有但中文版本中没有的键）
3. 补充完整的中文翻译，保持与现有翻译风格一致

### CLI TUI 汉化

1. **硬编码文本替换**：直接将所有硬编码的英文文本替换为中文
2. **占位符数组汉化**：将 PLACEHOLDERS 和 SHELL_PLACEHOLDERS 数组中的英文示例替换为中文
3. **提示信息汉化**：翻译 TIPS 数组中的所有提示内容
4. **命令标题和描述汉化**：翻译所有命令注册时的 title 和 description

### 注意事项

- 保持代码格式和结构不变，仅替换文本内容
- 确保终端中文显示正常（现代终端普遍支持 UTF-8）
- 保留所有模板变量（如 `{{provider}}`、`{{theme}}` 等）
- 快捷键提示保持英文快捷键名称，仅翻译描述部分

## 关键文件

### App 界面

- `packages/app/src/i18n/zh.ts` [MODIFY] - 补充缺失的中文翻译

### CLI TUI

- `packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx` [MODIFY] - 输入框占位符、快捷键提示
- `packages/opencode/src/cli/cmd/tui/app.tsx` [MODIFY] - 命令标题和描述、提示信息
- `packages/opencode/src/cli/cmd/tui/ui/dialog-help.tsx` [MODIFY] - 帮助弹窗内容
- `packages/opencode/src/cli/cmd/tui/component/tips.tsx` [MODIFY] - 提示信息
- `packages/opencode/src/cli/cmd/tui/component/dialog-command.tsx` [MODIFY] - 命令菜单标题