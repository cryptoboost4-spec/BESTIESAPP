@echo off
echo ================================================
echo BESTIES APP - ONE-TIME SETUP
echo ================================================
echo.

REM Check if config already exists
if exist "credentials.config" (
    echo Found existing credentials.config
    echo.
    set /p use_existing="Use existing credentials? (y/n): "
    if /i "%use_existing%"=="n" goto setup
    goto apply
)

:setup
echo Let's set up your credentials (only needed once!)
echo.
echo NOTE: Admin UID is already configured in firestore.rules
echo.

REM Get Twilio credentials
echo.
echo 1. GET TWILIO CREDENTIALS:
echo    - Go to: https://console.twilio.com/
echo    - Copy Account SID and Auth Token
echo.
set /p TWILIO_SID="Enter Twilio Account SID: "
set /p TWILIO_TOKEN="Enter Twilio Auth Token: "
set /p TWILIO_PHONE="Enter Twilio Phone Number (e.g., +1234567890): "

REM Get SendGrid API key
echo.
echo 2. GET SENDGRID API KEY:
echo    - Go to: https://app.sendgrid.com/
echo    - Settings, API Keys, Create API Key
echo.
set /p SENDGRID_KEY="Enter SendGrid API Key: "

REM Save to config file
echo.
echo Saving credentials to credentials.config...
(
echo TWILIO_SID=%TWILIO_SID%
echo TWILIO_TOKEN=%TWILIO_TOKEN%
echo TWILIO_PHONE=%TWILIO_PHONE%
echo SENDGRID_KEY=%SENDGRID_KEY%
) > credentials.config

echo.
echo ✅ Credentials saved!
echo.

:apply
REM Load credentials
for /f "tokens=1,2 delims==" %%a in (credentials.config) do (
    set %%a=%%b
)

echo Applying credentials...
echo.

REM Set Firebase functions config
echo.
echo Setting Firebase Functions config...
call firebase functions:config:set twilio.account_sid="%TWILIO_SID%"
call firebase functions:config:set twilio.auth_token="%TWILIO_TOKEN%"
call firebase functions:config:set twilio.phone_number="%TWILIO_PHONE%"
call firebase functions:config:set sendgrid.api_key="%SENDGRID_KEY%"

echo.
echo ================================================
echo ✅ SETUP COMPLETE!
echo ================================================
echo.
echo Your credentials are saved in credentials.config
echo This file is in .gitignore (safe from git)
echo.
echo Next time you extract a new zip:
echo 1. Just run: setup.bat
echo 2. Press Y to use existing credentials
echo 3. Your config is automatically applied!
echo.
echo Ready to deploy? Run:
echo   npm run build
echo   firebase deploy
echo.
pause
