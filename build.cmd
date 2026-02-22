@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════
echo   OpenCode 汉化版 - Windows 构建工具
echo ═══════════════════════════════════════════════════
echo.

echo [1/3] 正在验证环境...
echo   ✓ Bun 版本: 
bun --version

echo.
echo [2/3] 正在构建 Windows 二进制文件...
echo   这可能需要几分钟，请耐心等待...
echo.

cd /d "F:\AI-Tools\opencode\opencode-zh\packages\opencode"
bun run script/build.ts --windows-only

if errorlevel 1 (
    echo.
    echo ❌ 构建失败！
    pause
    exit /b 1
)

echo.
echo [3/3] 验证构建结果...
cd /d "F:\AI-Tools\opencode\opencode-zh\packages\opencode\dist"
dir *.zip /b

echo.
echo ═══════════════════════════════════════════════════
echo   ✅ 构建完成！
echo ═══════════════════════════════════════════════════
echo.
echo 输出位置: packages\opencode\dist\
echo.
echo 下一步:
echo   1. 访问 https://github.com/ev71h5n1-wq/opencode-zh/releases/new
echo   2. 创建标签 v1.1.65
echo   3. 上传 dist\ 目录中的 zip 文件
echo   4. 发布到 npm: bun run packages/opencode/script/publish-zh.ts
echo.
pause
