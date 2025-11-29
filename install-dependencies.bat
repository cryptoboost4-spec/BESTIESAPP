@echo off
echo ================================================
echo INSTALLING ALL DEPENDENCIES
echo ================================================
echo.

echo Installing Functions dependencies...
cd functions
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install functions dependencies
    pause
    exit /b 1
)
echo.

echo Installing Frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo.

echo ================================================
echo ✅ ALL DEPENDENCIES INSTALLED!
echo ================================================
echo.
echo You can now run: firebase deploy
echo.
pause

