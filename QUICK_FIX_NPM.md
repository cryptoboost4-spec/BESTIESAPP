# Quick Fix: NPM Install Errors

## 🚀 Easiest Solution

**Double-click `install-dependencies.bat`** in your project root.

This will install all dependencies for both functions and frontend.

---

## 📝 Manual Steps (if batch file doesn't work)

### 1. Open Command Prompt (NOT PowerShell)

Press `Win + R`, type `cmd`, press Enter

### 2. Navigate to project
```cmd
cd C:\Users\user\Documents\BESTIESAPP
```

### 3. Install Functions dependencies
```cmd
cd functions
npm install
cd ..
```

### 4. Install Frontend dependencies
```cmd
cd frontend
npm install
cd ..
```

### 5. Deploy
```cmd
firebase deploy
```

---

## 🔧 If You Must Use PowerShell

Run PowerShell as Administrator, then:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try npm install again.

---

## ✅ Verify Installation

After installing, check:
```cmd
cd functions
npm list --depth=0
```

Should show all packages without errors.

---

**Recommendation**: Use **Command Prompt** or the **batch file** to avoid PowerShell issues.

