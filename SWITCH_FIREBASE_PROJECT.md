# Switching Firebase Project

**Issue**: Deploying to 'claudebestiesweb' instead of 'bestiesapp'

---

## ✅ Fixed

Updated `.firebaserc` to set `bestiesapp` as the default project.

---

## 🔧 Manual Switch (if needed)

If you need to switch projects manually, use:

```bash
firebase use bestiesapp
```

Or to use the alias:
```bash
firebase use bestiescursor
```

---

## 📝 Check Current Project

To see which project is currently active:
```bash
firebase use
```

---

## 🚀 Deploy Now

Now you can deploy:
```bash
firebase deploy
```

It should deploy to **bestiesapp** instead of claudebestiesweb.

---

**Note**: If you get PowerShell execution policy errors, you may need to run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Or use Command Prompt instead of PowerShell.

