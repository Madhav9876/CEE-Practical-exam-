@echo off
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 >nul
del /f /q data\cee.db* >nul 2>&1
echo === SEEDING ===
node server/seed.js
echo === STARTING SERVER ===
start /b node server/index.js > server.log 2>&1
timeout /t 3 >nul
echo === RUNNING TEST ===
node server/test-workflow.js
echo === TEST EXIT CODE: %ERRORLEVEL% ===
echo === SERVER LOG (last 5 lines) ===
for /f "delims=" %%i in ('echo quit^| powershell "Get-Content server.log -Tail 5"') do @echo %%i
taskkill /F /IM node.exe >nul 2>&1
