@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════
echo   OpenCode 汉化版 - npm 发布工具
echo ═══════════════════════════════════════════════════
echo.
echo 请先在邮箱查看 npm 验证码
echo 邮箱: ev71h5n1@163.com
echo.
set /p OTP="请输入 8 位验证码: "
echo.
echo 正在发布 opencode-zh@1.1.65 ...
cd /d "F:\npm-publish-opencode-zh"
npm publish --access public --otp=%OTP%
if errorlevel 1 (
    echo.
    echo ❌ 发布失败
    pause
    exit /b 1
)
echo.
echo ═══════════════════════════════════════════════════
echo   ✅ 发布成功！
echo ═══════════════════════════════════════════════════
echo.
echo 现在可以使用: npm i -g opencode-zh
echo.
pause
