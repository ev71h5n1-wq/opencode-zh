# OpenCode 汉化版 - npm 自动登录脚本
# 自动完成用户名、密码、邮箱的输入

$username = "ev71h5n1"
$password = "Ev-82111203"  
$email = "ev71h5n1@163.com"

Write-Host "🚀 npm 自动登录工具" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "即将自动输入以下信息：" -ForegroundColor Yellow
Write-Host "  用户名: $username" -ForegroundColor Gray
Write-Host "  密码: [已隐藏]" -ForegroundColor Gray
Write-Host "  邮箱: $email" -ForegroundColor Gray
Write-Host ""
Write-Host "当提示输入 'One-time password' 时，请：" -ForegroundColor Yellow
Write-Host "  1. 打开邮箱 ev71h5n1@163.com" -ForegroundColor White
Write-Host "  2. 查看来自 npm 的最新邮件" -ForegroundColor White
Write-Host "  3. 复制 8 位数字验证码" -ForegroundColor White
Write-Host "  4. 粘贴到此处回车" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# 使用 WScript.Shell 自动化输入
$wshell = New-Object -ComObject WScript.Shell

# 启动 npm login
$process = Start-Process -FilePath "npm" -ArgumentList "login" -PassThru -NoNewWindow

Start-Sleep -Seconds 2

# 输入用户名
$wshell.SendKeys($username)
$wshell.SendKeys("{ENTER}")
Write-Host "✓ 已输入用户名" -ForegroundColor Green

Start-Sleep -Seconds 1

# 输入密码
$wshell.SendKeys($password)
$wshell.SendKeys("{ENTER}")
Write-Host "✓ 已输入密码" -ForegroundColor Green

Start-Sleep -Seconds 1

# 输入邮箱
$wshell.SendKeys($email)
$wshell.SendKeys("{ENTER}")
Write-Host "✓ 已输入邮箱" -ForegroundColor Green

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "⚠ 现在请在命令行窗口输入验证码！" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

# 等待用户完成
$process.WaitForExit()

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "登录流程结束！" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

# 验证登录
try {
    $user = npm whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 登录成功！用户: $user" -ForegroundColor Green
    } else {
        Write-Host "✗ 登录失败，请重试" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ 登录失败: $_" -ForegroundColor Red
}

Write-Host ""
pause
