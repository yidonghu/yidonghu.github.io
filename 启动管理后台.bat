@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title yidonghu blog - admin

set "NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\nodejs\node.exe" (
    set "NODE=C:\Program Files\nodejs\node.exe"
  ) else (
    echo   [x] 未找到 Node.js，请先安装：https://nodejs.org/
    echo.
    pause
    exit /b 1
  )
)

rem 端口来自 app.config.json 的 local.adminPort，缺失时脚本自己回退 7788
set "PORT="
"%NODE%" "scripts\port.mjs" admin > "%TEMP%\yidonghu-port.txt" 2>nul
if exist "%TEMP%\yidonghu-port.txt" set /p PORT=<"%TEMP%\yidonghu-port.txt"
del "%TEMP%\yidonghu-port.txt" >nul 2>nul
if not defined PORT set "PORT=7788"
set "URL=http://127.0.0.1:%PORT%"

echo.
echo   ==========================================
echo     yidonghu blog  本地管理后台
echo     %URL%
echo   ==========================================
echo.

if not exist "node_modules" (
  echo   [ ] 首次运行，正在安装依赖（约 1 分钟）...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo   [x] 依赖安装失败，请检查网络后重试
    pause
    exit /b 1
  )
)

powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri '%URL%/api/state' -UseBasicParsing -TimeoutSec 3; exit 0 } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 (
  echo   [i] 后台已在运行，直接打开浏览器
  start "" "%URL%"
  timeout /t 1 >nul
  exit /b 0
)

echo   [ ] 正在启动服务，就绪后自动打开浏览器
echo       关闭本窗口即停止服务
echo.

start "opener" /min powershell -NoProfile -WindowStyle Hidden -Command "$u='%URL%'; $s=Get-Date; while (((Get-Date)-$s).TotalSeconds -lt 40) { try { $r=Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 1; break } catch { Start-Sleep -Milliseconds 500 } }; Start-Process $u"

"%NODE%" "admin\server.mjs"

echo.
echo   [ ] 服务已退出
pause