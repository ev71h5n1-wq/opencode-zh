# OpenCode 汉化版安装脚本 (PowerShell)
# 用法: iwr https://raw.githubusercontent.com/ev71h5n1-wq/opencode-zh/main/install-zh.ps1 | iex

param(
    [string]$Version = "",
    [string]$InstallDir = "",
    [switch]$Help
)

$ErrorActionPreference = "Stop"

if ($Help) {
    Write-Host "OpenCode 汉化版安装器"
    Write-Host ""
    Write-Host "用法: install-zh.ps1 [-Version <版本>] [-InstallDir <目录>]"
    Write-Host ""
    Write-Host "选项:"
    Write-Host "  -Version      安装指定版本 (例如: 1.0.0)"
    Write-Host "  -InstallDir   指定安装目录"
    Write-Host ""
    Write-Host "示例:"
    Write-Host "  iwr https://raw.githubusercontent.com/ev71h5n1-wq/opencode-zh/main/install-zh.ps1 | iex"
    Write-Host "  ./install-zh.ps1 -Version 1.0.0"
    exit 0
}

# 设置安装目录
if ([string]::IsNullOrEmpty($InstallDir)) {
    $InstallDir = "$env:USERPROFILE\.opencode-zh\bin"
}

Write-Host ""
Write-Host "   OpenCode 汉化版安装器" -ForegroundColor Cyan
Write-Host ""

# 检查架构
$arch = "x64"
$cpuInfo = Get-CimInstance -ClassName Win32_Processor
if ($cpuInfo.AddressWidth -ne 64) {
    Write-Host "错误: 仅支持 64 位 Windows 系统" -ForegroundColor Red
    exit 1
}

# 检测 AVX2 支持
$needsBaseline = $false
try {
    $cpuFeatures = Get-CimInstance -ClassName Win32_Processor | Select-Object -ExpandProperty Name
    # 如果 CPU 名称包含某些旧型号关键字，使用 baseline 版本
    if ($cpuFeatures -match "Pentium|Celeron|Atom") {
        $needsBaseline = $true
    }
} catch {
    # 无法检测，默认使用标准版本
}

# 构建目标名称
$target = if ($needsBaseline) { "windows-x64-baseline" } else { "windows-x64" }
$filename = "opencode-zh-$target.zip"

# 获取最新版本信息
if ([string]::IsNullOrEmpty($Version)) {
    Write-Host "正在获取最新版本信息..." -ForegroundColor Gray
    
    try {
        $releaseInfo = Invoke-RestMethod -Uri "https://api.github.com/repos/ev71h5n1-wq/opencode-zh/releases/latest" -ErrorAction Stop
        $Version = $releaseInfo.tag_name -replace "^v", ""
        $downloadUrl = "https://github.com/ev71h5n1-wq/opencode-zh/releases/download/v$Version/$filename"
    } catch {
        Write-Host "错误: 无法获取版本信息" -ForegroundColor Red
        Write-Host "请检查网络连接或稍后重试" -ForegroundColor Gray
        exit 1
    }
} else {
    $Version = $Version -replace "^v", ""
    $downloadUrl = "https://github.com/ev71h5n1-wq/opencode-zh/releases/download/v$Version/$filename"
}

Write-Host "安装版本: $Version" -ForegroundColor Green
Write-Host "目标平台: $target" -ForegroundColor Gray
Write-Host "安装目录: $InstallDir" -ForegroundColor Gray
Write-Host ""

# 创建安装目录
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

# 创建临时目录
$tempDir = Join-Path $env:TEMP "opencode-zh-install-$PID"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# 下载文件
Write-Host "正在下载..." -ForegroundColor Gray
$zipPath = Join-Path $tempDir $filename

try {
    # 使用 WebClient 以支持进度条
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($downloadUrl, $zipPath)
    Write-Host "下载完成!" -ForegroundColor Green
} catch {
    Write-Host "错误: 下载失败" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Gray
    Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
    exit 1
}

# 解压文件
Write-Host "正在解压..." -ForegroundColor Gray
try {
    Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force
} catch {
    Write-Host "错误: 解压失败" -ForegroundColor Red
    Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
    exit 1
}

# 查找可执行文件
$exePath = Get-ChildItem -Path $tempDir -Filter "*.exe" -Recurse | Select-Object -First 1
if (-not $exePath) {
    # 尝试查找没有扩展名的可执行文件
    $exePath = Get-ChildItem -Path $tempDir -Filter "opencode*" -Recurse | Where-Object { -not $_.PSIsContainer } | Select-Object -First 1
}

if (-not $exePath) {
    Write-Host "错误: 未找到可执行文件" -ForegroundColor Red
    Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
    exit 1
}

# 复制到安装目录
$targetExe = Join-Path $InstallDir "opencode-zh.exe"
Copy-Item -Path $exePath.FullName -Destination $targetExe -Force

# 清理临时文件
Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue

# 检查 PATH
$pathDirs = $env:PATH -split ";"
$InstallDirNormalized = (Resolve-Path $InstallDir -ErrorAction SilentlyContinue).Path
if ($InstallDirNormalized -and $pathDirs -notcontains $InstallDirNormalized) {
    Write-Host ""
    Write-Host "提示: 安装目录不在 PATH 中" -ForegroundColor Yellow
    Write-Host "请手动添加以下目录到系统 PATH:" -ForegroundColor Gray
    Write-Host "  $InstallDir" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "或运行以下命令添加到用户 PATH:" -ForegroundColor Gray
    Write-Host "  `$env:PATH += `";$InstallDir`"" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✓ 安装完成!" -ForegroundColor Green
Write-Host ""
Write-Host "使用方法:" -ForegroundColor Gray
Write-Host "  cd <项目目录>" -ForegroundColor Cyan
Write-Host "  opencode-zh" -ForegroundColor Cyan
Write-Host ""
Write-Host "更多信息: https://github.com/ev71h5n1-wq/opencode-zh" -ForegroundColor Gray
Write-Host ""
