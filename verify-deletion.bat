@echo off
setlocal enabledelayedexpansion

REM ================================================
REM VERIFY DELETION STATUS
REM ================================================
REM This script checks if node_modules directories
REM exist in frontend and functions folders.
REM 
REM Usage: verify-deletion.bat
REM ================================================

set "SCRIPT_DIR=%~dp0"
set "FRONTEND_DIR=%SCRIPT_DIR%frontend\node_modules"
set "FUNCTIONS_DIR=%SCRIPT_DIR%functions\node_modules"
set "ALL_CLEAR=1"

echo ================================================
echo VERIFYING NODE_MODULES DELETION STATUS
echo ================================================
echo.

REM Check frontend
if exist "%FRONTEND_DIR%" (
    echo ❌ frontend/node_modules EXISTS
    set "ALL_CLEAR=0"
) else (
    echo ✓ frontend/node_modules does not exist
)

REM Check functions
if exist "%FUNCTIONS_DIR%" (
    echo ❌ functions/node_modules EXISTS
    set "ALL_CLEAR=0"
) else (
    echo ✓ functions/node_modules does not exist
)

echo.

if !ALL_CLEAR! equ 1 (
    echo ================================================
    echo ✅ ALL CLEAR - No node_modules found
    echo ================================================
    endlocal
    exit /b 0
) else (
    echo ================================================
    echo ⚠️  WARNING - Some node_modules still exist
    echo ================================================
    echo Run delete-node-modules.bat to remove them
    endlocal
    exit /b 1
)


