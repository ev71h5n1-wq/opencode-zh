@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════
echo   OpenCode 汉化版 - npm 登录与发布工具
echo ═══════════════════════════════════════════════════
echo.
echo 请按提示输入以下信息：
echo   用户名: ev71h5n1
echo   密码: Ev-82111203
echo   邮箱: ev71h5n1@163.com
echo.
pause
echo.
echo 正在执行 npm login...
npm login
echo.
if errorlevel 1 (
    echo 登录失败，请重试
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════
echo   登录成功！正在发布到 npm...
echo ═══════════════════════════════════════════════════
echo.

cd /d "F:\AI-Tools\opencode\opencode-zh\packages\opencode"
echo 当前目录: %CD%
echo.

echo 正在发布 opencode-zh...
npm publish --access public

if errorlevel 1 (
    echo.
    echo 发布失败
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════
echo   ✅ 发布成功！
echo ═══════════════════════════════════════════════════
echo.
echo 现在可以使用以下命令安装：
echo   npm i -g opencode-zh
echo.
pause
