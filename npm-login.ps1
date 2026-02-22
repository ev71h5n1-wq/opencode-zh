# OpenCode 汉化版 - npm 自动登录脚本
$username = "ev71h5n1"
$password = "Ev-82111203"
$email = "ev71h5n1@163.com"

Write-Host "🚀 正在登录 npm..." -ForegroundColor Cyan
Write-Host "用户名: $username" -ForegroundColor Gray

# 使用 Start-Process 进行交互
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "npm"
$psi.Arguments = "login"
$psi.UseShellExecute = $false
$psi.RedirectStandardInput = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true

$process = [System.Diagnostics.Process]::Start($psi)

# 输入用户名
Start-Sleep -Milliseconds 500
$process.StandardInput.WriteLine($username)

# 输入密码
Start-Sleep -Milliseconds 500
$process.StandardInput.WriteLine($password)

# 输入邮箱
Start-Sleep -Milliseconds 500
$process.StandardInput.WriteLine($email)

# 等待完成
$process.WaitForExit()

Write-Host "✅ 登录完成！" -ForegroundColor Green
