@echo off
title 老年康复辅助平台 - 停止
cd /d "%~dp0"

echo ==========================================
echo    老年康复辅助平台  停止服务
echo ==========================================
echo.

powershell -NoProfile -Command "foreach ($p in 3000,5173,5174) { $c = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue; if ($c) { $c | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Write-Host ('  已停止端口 ' + $p) } else { Write-Host ('  端口 ' + $p + ' 未被占用') } }"

rem 关闭前后端命令行窗口
taskkill /F /FI "WINDOWTITLE eq 康复平台-后端" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq 康复平台-前端" >nul 2>&1

echo.
echo 已全部停止。
ping -n 3 127.0.0.1 >nul
