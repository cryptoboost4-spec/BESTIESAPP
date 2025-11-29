@echo off
setlocal enabledelayedexpansion

REM ================================================
REM CLEAN INSTALL SCRIPT
REM ================================================
REM This script performs a clean reinstall:
REM 1. Deletes all node_modules directories
REM 2. Reinstalls all dependencies
REM 
REM Usage: clean-install.bat
REM ================================================

set "LOG_FILE=cleanup-log.txt"
set "ERROR_CODE=0"

echo ================================================
echo CLEAN INSTALL - Delete and Reinstall
echo ================================================
echo.

REM Step 1: Delete node_modules
echo [%date% %time%] ================================================ >> "%LOG_FILE%"
echo [%date% %time%] CLEAN INSTALL STARTED >> "%LOG_FILE%"
echo [%date% %time%] ================================================ >> "%LOG_FILE%"
echo.

echo Step 1: Deleting node_modules...
echo [%date% %time%] Step 1: Deleting node_modules... >> "%LOG_FILE%"
call delete-node-modules.bat
set "DELETE_CODE=!errorlevel!"

if !DELETE_CODE! neq 0 (
    echo [%date% %time%] ERROR: Failed to delete node_modules (exit code: !DELETE_CODE!) >> "%LOG_FILE%"
    echo ERROR: Failed to delete node_modules
    echo Check cleanup-log.txt for details
    endlocal
    exit /b !DELETE_CODE!
)

echo.
echo Step 2: Installing dependencies...
echo [%date% %time%] Step 2: Installing dependencies... >> "%LOG_FILE%"
call install-dependencies.bat
set "INSTALL_CODE=!errorlevel!"

if !INSTALL_CODE! neq 0 (
    echo [%date% %time%] ERROR: Failed to install dependencies (exit code: !INSTALL_CODE!) >> "%LOG_FILE%"
    echo ERROR: Failed to install dependencies
    echo Check cleanup-log.txt for details
    endlocal
    exit /b !INSTALL_CODE!
)

echo.
echo [%date% %time%] ================================================ >> "%LOG_FILE%"
echo [%date% %time%] ✅ CLEAN INSTALL COMPLETE >> "%LOG_FILE%"
echo [%date% %time%] ================================================ >> "%LOG_FILE%"
echo.
echo ================================================
echo ✅ CLEAN INSTALL COMPLETE
echo ================================================
echo All node_modules deleted and dependencies reinstalled
echo.

endlocal
exit /b 0



