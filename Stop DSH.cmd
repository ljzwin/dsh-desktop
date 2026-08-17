@echo off
rem Stop the DSH web server started by the desktop launcher.
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found on PATH.
  pause
  exit /b 1
)

node stop.js
pause

endlocal
