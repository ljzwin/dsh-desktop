@echo off
rem DeepSeek Harness desktop launcher (double-click this file).
rem Starts the local dsh web server if needed, then opens it in a chromeless window.
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found on PATH. Install Node.js and add it to PATH.
  echo.
  pause
  exit /b 1
)

node launch.js
if errorlevel 1 (
  echo.
  echo Failed to launch DeepSeek Harness.
  echo.
  pause
)

endlocal
