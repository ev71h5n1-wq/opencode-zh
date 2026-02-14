@echo off
chcp 65001 >nul
C:\Users\kery\.bun\bin\bun.exe run --cwd F:\AI-Tools\opencode\opencode-dev\packages\opencode --conditions=browser src/index.ts %*
