@echo off
REM Build script for local deployment (Windows)
REM Usage: build-local.bat

echo Building frontend for local deployment...

cd frontend

REM Build with local API URL
set VITE_API_URL=http://localhost/timeline/backend/api
call npm run build

echo.
echo Build complete!
echo.
echo Next steps:
echo 1. Copy frontend/dist/* to C:\xampp\htdocs\timeline\frontend\
echo 2. Copy backend/api/* to C:\xampp\htdocs\timeline\backend\api\
echo 3. Configure database.php with local credentials
echo 4. Test: http://localhost/timeline/frontend/
echo.
pause
