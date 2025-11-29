# Fix NPM Install Errors

**Issue**: PowerShell execution policy blocking npm commands

---

## 🔧 Quick Fix Options

### Option 1: Use Command Prompt (Easiest) ✅

1. Open **Command Prompt** (not PowerShell)
2. Navigate to your project:
   ```cmd
   cd C:\Users\user\Documents\BESTIESAPP
   ```

3. Install functions dependencies:
   ```cmd
   cd functions
   npm install
   ```

4. Install frontend dependencies:
   ```cmd
   cd ..\frontend
   npm install
   ```

---

### Option 2: Fix PowerShell Execution Policy

Run PowerShell **as Administrator**, then:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try npm install again.

---

### Option 3: Bypass for Single Command

In PowerShell, run:
```powershell
powershell -ExecutionPolicy Bypass -Command "cd functions; npm install"
```

---

## 📦 What to Install

### Functions Dependencies
```cmd
cd C:\Users\user\Documents\BESTIESAPP\functions
npm install
```

**This installs**:
- firebase-admin
- firebase-functions
- twilio
- @sendgrid/mail
- stripe
- node-fetch
- jest (dev)

### Frontend Dependencies
```cmd
cd C:\Users\user\Documents\BESTIESAPP\frontend
npm install
```

---

## ✅ Verify Installation

After installing, check:
```cmd
cd functions
npm list --depth=0
```

Should show all packages installed.

---

## 🚀 Then Deploy

Once dependencies are installed:
```cmd
cd C:\Users\user\Documents\BESTIESAPP
firebase deploy
```

---

**Recommendation**: Use **Command Prompt** instead of PowerShell to avoid execution policy issues.

