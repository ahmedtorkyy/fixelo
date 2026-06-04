@echo off
cd /d "%~dp0"
set "LOG=%~dp0Fixelo_BuildLog.txt"

echo Fixelo Build Log> "%LOG%"
echo Generated: %DATE% %TIME%>> "%LOG%"
echo Folder: %~dp0>> "%LOG%"
echo.>> "%LOG%"

echo ===== SYSTEM INFO =====>> "%LOG%"
ver>> "%LOG%" 2>&1
echo Node version:>> "%LOG%"
node -v>> "%LOG%" 2>&1
echo npm version:>> "%LOG%"
call npm -v>> "%LOG%" 2>&1
echo.>> "%LOG%"

echo Collecting log... installing dependencies. This can take a few minutes. Please wait.
echo ===== NPM INSTALL =====>> "%LOG%"
call npm install>> "%LOG%" 2>&1
echo.>> "%LOG%"

echo Now building the project. Please wait.
echo ===== NPM RUN BUILD =====>> "%LOG%"
call npm run build>> "%LOG%" 2>&1
echo.>> "%LOG%"
echo ===== END OF LOG =====>> "%LOG%"

powershell -NoProfile -Command "Get-Content -Raw -LiteralPath '%LOG%' | Set-Clipboard"

echo.
echo ============================================================
echo DONE. The full log has been COPIED TO YOUR CLIPBOARD.
echo It is also saved as Fixelo_BuildLog.txt in this folder.
echo Now just paste it to Claude.
echo ============================================================
echo.
pause
