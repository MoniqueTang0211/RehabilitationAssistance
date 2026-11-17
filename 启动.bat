@echo off
title 老年康复辅助平台 - 启动
cd /d "%~dp0"

echo ==========================================
echo    老年康复辅助平台  一键启动
echo ==========================================
echo.

rem 1. 检查并安装依赖
if not exist "server\node_modules" (
  echo [1/3] 后端依赖未安装，正在安装...
  pushd server
  call npm install --registry=https://registry.npmmirror.com --cache "%~dp0..\.npm-cache"
  popd
) else (
  echo [1/3] 后端依赖已就绪
)

if not exist "client\node_modules" (
  echo [1/3] 前端依赖未安装，正在安装...
  pushd client
  call npm install --registry=https://registry.npmmirror.com --cache "%~dp0..\.npm-cache"
  popd
) else (
  echo [1/3] 前端依赖已就绪
)

rem 2. 生成后端环境变量
if not exist "server\.env" (
  copy "server\.env.example" "server\.env" >nul
  echo       已生成 server\.env
)

rem 3. 启动前后端
echo [2/3] 启动后端（http://localhost:3000）...
start "康复平台-后端" /D "%~dp0server" cmd /k npm run dev

echo [3/3] 启动前端（http://localhost:5173）...
start "康复平台-前端" /D "%~dp0client" cmd /k npm run dev -- --host

echo.
echo 等待服务启动...
ping -n 7 127.0.0.1 >nul
start "" http://localhost:5173

echo.
echo ==========================================
echo  启动完成
echo  前端地址：http://localhost:5173
echo  后端地址：http://localhost:3000
echo  测试账号：test / 123456
echo  停止服务：双击「停止.bat」
echo ==========================================
pause
