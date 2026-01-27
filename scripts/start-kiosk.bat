@echo off
REM =====================================================
REM Landbouw Museum Kiosk - Start Script
REM =====================================================
REM Dit script start de applicatie in kiosk mode
REM Vereisten: XAMPP/WAMP voor PHP backend, Node.js voor frontend build
REM =====================================================

echo.
echo  ========================================
echo   LANDBOUW MUSEUM - KIOSK MODE START
echo  ========================================
echo.

REM Configuratie
set FRONTEND_PORT=5173
set BACKEND_PATH=C:\xampp\htdocs\Landbouw-Interactieve-Scherm\backend
set BROWSER_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"

REM Check of Chrome bestaat, anders gebruik Edge
if not exist %BROWSER_PATH% (
    set BROWSER_PATH="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)

echo [1/4] Backend pad: %BACKEND_PATH%
echo [2/4] Frontend poort: %FRONTEND_PORT%
echo.

REM Start XAMPP Apache (indien niet al gestart)
echo [3/4] Controleren of Apache draait...
tasklist /FI "IMAGENAME eq httpd.exe" 2>NUL | find /I /N "httpd.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo       Apache draait al!
) else (
    echo       Apache starten...
    start "" "C:\xampp\xampp_start.exe"
    timeout /t 3 /nobreak > NUL
)

REM Ga naar frontend folder en start development server
echo [4/4] Frontend starten...
cd /d "%~dp0..\frontend"

REM Build als dist folder niet bestaat
if not exist "dist" (
    echo       Frontend builden (eerste keer)...
    call npm run build
)

REM Start preview server in background
start /B "" npm run preview -- --port %FRONTEND_PORT% --host

REM Wacht even tot server is opgestart
timeout /t 3 /nobreak > NUL

REM Start browser in kiosk mode
echo.
echo  ========================================
echo   BROWSER STARTEN IN KIOSK MODE
echo  ========================================
echo.

start "" %BROWSER_PATH% --kiosk --disable-pinch --overscroll-history-navigation=0 --disable-translate --noerrdialogs --disable-infobars --no-first-run --start-fullscreen "http://localhost:%FRONTEND_PORT%"

echo.
echo  ========================================
echo   APPLICATIE GESTART!
echo   Druk op Ctrl+C om te stoppen
echo  ========================================
echo.

REM Hou het venster open
pause
