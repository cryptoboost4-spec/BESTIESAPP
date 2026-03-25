@echo off
setlocal

echo ================================================
echo RUNMUTHAFUKA - STARTING BESTIES LOCAL STACK
echo ================================================
echo.

set "ROOT=%~dp0"

if not exist "%ROOT%frontend\package.json" (
    echo ERROR: Could not find frontend\package.json
    echo Make sure this file is in your project root.
    pause
    exit /b 1
)

if not exist "%ROOT%functions\package.json" (
    echo ERROR: Could not find functions\package.json
    echo Make sure this file is in your project root.
    pause
    exit /b 1
)

echo Starting Functions emulator...
start "BESTIES Functions Emulator" cmd /k "cd /d "%ROOT%functions" && npm run serve"

echo Starting Frontend...
start "BESTIES Frontend" cmd /k "cd /d "%ROOT%frontend" && npm start"

echo Opening app in browser...
start "" http://localhost:3000

echo.
echo Launched:
echo - Functions emulator window
echo - Frontend window
echo - Browser on localhost:3000
echo.
echo Leave both terminal windows open while developing.
echo.

endlocal
exit /b 0
