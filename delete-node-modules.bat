@echo off
setlocal enabledelayedexpansion

REM ================================================
REM NODE_MODULES DELETION SCRIPT
REM ================================================
REM This script deletes node_modules directories
REM in both frontend and functions folders.
REM 
REM Usage: delete-node-modules.bat
REM 
REM Exit codes:
REM   0 = Success
REM   1 = Permission denied
REM   2 = File in use / locked
REM   3 = Disk space / path too long
REM   99 = Unexpected error
REM ================================================

set "LOG_FILE=cleanup-log.txt"
set "SCRIPT_DIR=%~dp0"
set "ERROR_CODE=0"

REM Create log file with timestamp
echo [%date% %time%] ================================================ >> "%LOG_FILE%"
echo [%date% %time%] NODE_MODULES DELETION STARTED >> "%LOG_FILE%"
echo [%date% %time%] ================================================ >> "%LOG_FILE%"
echo.

echo ================================================
echo NODE_MODULES DELETION STARTED
echo ================================================
echo.

REM Function to delete node_modules directory
set "FRONTEND_DIR=%SCRIPT_DIR%frontend\node_modules"
set "FUNCTIONS_DIR=%SCRIPT_DIR%functions\node_modules"

REM Delete frontend/node_modules
echo [%date% %time%] Checking frontend/node_modules... >> "%LOG_FILE%"
echo Checking frontend/node_modules...
if exist "%FRONTEND_DIR%" (
    echo [%date% %time%] Found frontend/node_modules, deleting... >> "%LOG_FILE%"
    echo Found frontend/node_modules, deleting...
    
    REM Try to delete using rmdir
    rmdir /s /q "%FRONTEND_DIR%" 2>nul
    if !errorlevel! neq 0 (
        REM If rmdir fails, try using PowerShell (handles long paths better)
        echo [%date% %time%] rmdir failed, trying PowerShell method... >> "%LOG_FILE%"
        powershell -Command "Remove-Item -Path '%FRONTEND_DIR%' -Recurse -Force -ErrorAction SilentlyContinue" 2>nul
        if !errorlevel! neq 0 (
            echo [%date% %time%] ERROR: Failed to delete frontend/node_modules >> "%LOG_FILE%"
            echo ERROR: Failed to delete frontend/node_modules
            set "ERROR_CODE=2"
        ) else (
            echo [%date% %time%] ✓ frontend/node_modules deleted successfully >> "%LOG_FILE%"
            echo ✓ frontend/node_modules deleted successfully
        )
    ) else (
        echo [%date% %time%] ✓ frontend/node_modules deleted successfully >> "%LOG_FILE%"
        echo ✓ frontend/node_modules deleted successfully
    )
) else (
    echo [%date% %time%] frontend/node_modules does not exist (skipping) >> "%LOG_FILE%"
    echo frontend/node_modules does not exist (skipping)
)

echo.

REM Delete functions/node_modules
echo [%date% %time%] Checking functions/node_modules... >> "%LOG_FILE%"
echo Checking functions/node_modules...
if exist "%FUNCTIONS_DIR%" (
    echo [%date% %time%] Found functions/node_modules, deleting... >> "%LOG_FILE%"
    echo Found functions/node_modules, deleting...
    
    REM Try to delete using rmdir
    rmdir /s /q "%FUNCTIONS_DIR%" 2>nul
    if !errorlevel! neq 0 (
        REM If rmdir fails, try using PowerShell (handles long paths better)
        echo [%date% %time%] rmdir failed, trying PowerShell method... >> "%LOG_FILE%"
        powershell -Command "Remove-Item -Path '%FUNCTIONS_DIR%' -Recurse -Force -ErrorAction SilentlyContinue" 2>nul
        if !errorlevel! neq 0 (
            echo [%date% %time%] ERROR: Failed to delete functions/node_modules >> "%LOG_FILE%"
            echo ERROR: Failed to delete functions/node_modules
            if !ERROR_CODE! equ 0 set "ERROR_CODE=2"
        ) else (
            echo [%date% %time%] ✓ functions/node_modules deleted successfully >> "%LOG_FILE%"
            echo ✓ functions/node_modules deleted successfully
        )
    ) else (
        echo [%date% %time%] ✓ functions/node_modules deleted successfully >> "%LOG_FILE%"
        echo ✓ functions/node_modules deleted successfully
    )
) else (
    echo [%date% %time%] functions/node_modules does not exist (skipping) >> "%LOG_FILE%"
    echo functions/node_modules does not exist (skipping)
)

echo.

REM Verify deletion
echo [%date% %time%] Verifying deletion... >> "%LOG_FILE%"
echo Verifying deletion...
set "VERIFY_FAILED=0"

if exist "%FRONTEND_DIR%" (
    echo [%date% %time%] WARNING: frontend/node_modules still exists! >> "%LOG_FILE%"
    echo WARNING: frontend/node_modules still exists!
    set "VERIFY_FAILED=1"
    set "ERROR_CODE=99"
)

if exist "%FUNCTIONS_DIR%" (
    echo [%date% %time%] WARNING: functions/node_modules still exists! >> "%LOG_FILE%"
    echo WARNING: functions/node_modules still exists!
    set "VERIFY_FAILED=1"
    set "ERROR_CODE=99"
)

if !VERIFY_FAILED! equ 0 (
    echo [%date% %time%] ✓ Verification passed - all node_modules removed >> "%LOG_FILE%"
    echo ✓ Verification passed - all node_modules removed
)

echo.

REM Final status
if !ERROR_CODE! equ 0 (
    echo [%date% %time%] ================================================ >> "%LOG_FILE%"
    echo [%date% %time%] ✅ DELETION COMPLETE - All node_modules removed >> "%LOG_FILE%"
    echo [%date% %time%] ================================================ >> "%LOG_FILE%"
    echo.
    echo ================================================
    echo ✅ DELETION COMPLETE - All node_modules removed
    echo ================================================
) else (
    echo [%date% %time%] ================================================ >> "%LOG_FILE%"
    echo [%date% %time%] ❌ DELETION FAILED - Error code: !ERROR_CODE! >> "%LOG_FILE%"
    echo [%date% %time%] ================================================ >> "%LOG_FILE%"
    echo.
    echo ================================================
    echo ❌ DELETION FAILED - Error code: !ERROR_CODE!
    echo ================================================
    echo Check cleanup-log.txt for details
)

endlocal
exit /b %ERROR_CODE%



