@echo off
REM =====================================================
REM Landbouw Museum Kiosk - Stop Script
REM =====================================================

echo.
echo  ========================================
echo   LANDBOUW MUSEUM - KIOSK STOPPEN
echo  ========================================
echo.

REM Stop Chrome/Edge kiosk windows
echo Browsers sluiten...
taskkill /F /IM chrome.exe 2>NUL
taskkill /F /IM msedge.exe 2>NUL

REM Stop Node.js server
echo Node.js stoppen...
taskkill /F /IM node.exe 2>NUL

echo.
echo Applicatie gestopt!
echo.
pause
