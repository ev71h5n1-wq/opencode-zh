# OpenCode 汉化版启动脚本
$Cwd = "F:\AI-Tools\opencode\opencode-dev\packages\opencode"
$UserDir = Get-Location
$Bun = "C:\Users\kery\.bun\bin\bun.exe"

& $Bun run --cwd $Cwd --conditions=browser src/index.ts --dir $UserDir @args
