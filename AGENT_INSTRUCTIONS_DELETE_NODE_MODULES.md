# Agent Instructions: Delete node_modules

## Task Overview
Delete all `node_modules` directories in both `frontend` and `functions` folders. This task must be completed fully before contacting the user.

## Critical Instructions
**DO NOT contact the user until:**
- The task is 100% complete AND successful, OR
- A critical, unrecoverable error occurs (exit code 99)

## Execution Command
```cmd
delete-node-modules.bat
```

## Expected Behavior
1. Script runs completely non-interactively (no prompts, no pauses)
2. Takes 1-5 minutes depending on node_modules size
3. Creates/updates `cleanup-log.txt` with detailed progress
4. Exits with code 0 on success
5. Exits with non-zero code on failure

## Success Criteria
All of the following must be true:
- ✅ Exit code is 0
- ✅ `cleanup-log.txt` contains "DELETION COMPLETE"
- ✅ `frontend/node_modules` does not exist (verify with `verify-deletion.bat`)
- ✅ `functions/node_modules` does not exist (verify with `verify-deletion.bat`)

## Verification Steps
After running the script, verify completion:
```cmd
verify-deletion.bat
```
This should show "ALL CLEAR - No node_modules found"

## Error Handling

### Exit Code 0: Success
- Task complete
- Log shows "DELETION COMPLETE"
- No action needed
- **DO NOT contact user** - task successful

### Exit Code 1: Permission Denied
- **Action:** Log the error, wait 30 seconds, retry once
- If retry fails, log error and exit with code 1
- **DO NOT contact user** - log the issue for review

### Exit Code 2: File In Use / Locked
- **Action:** Log the error, wait 60 seconds, retry once
- If retry fails, log error and exit with code 2
- **DO NOT contact user** - log the issue for review

### Exit Code 3: Disk Space / Path Too Long
- **Action:** Log the error, exit with code 3
- **DO NOT contact user** - log the issue for review

### Exit Code 99: Unexpected Error
- **Action:** Log full error details from `cleanup-log.txt`
- **ONLY THEN contact user** with:
  - Error code: 99
  - Full error message from log
  - What was attempted
  - What failed

## Log File Location
`cleanup-log.txt` in the project root directory

## Alternative Method (if batch file fails)
If `delete-node-modules.bat` fails repeatedly, try:
```cmd
node scripts/delete-node-modules.js
```

## Expected Log Output (Success)
```
[YYYY-MM-DD HH:MM:SS] ================================================
[YYYY-MM-DD HH:MM:SS] NODE_MODULES DELETION STARTED
[YYYY-MM-DD HH:MM:SS] ================================================
[YYYY-MM-DD HH:MM:SS] Checking frontend/node_modules...
[YYYY-MM-DD HH:MM:SS] ✓ frontend/node_modules deleted successfully
[YYYY-MM-DD HH:MM:SS] Checking functions/node_modules...
[YYYY-MM-DD HH:MM:SS] ✓ functions/node_modules deleted successfully
[YYYY-MM-DD HH:MM:SS] Verifying deletion...
[YYYY-MM-DD HH:MM:SS] ✓ Verification passed - all node_modules removed
[YYYY-MM-DD HH:MM:SS] ================================================
[YYYY-MM-DD HH:MM:SS] ✅ DELETION COMPLETE - All node_modules removed
[YYYY-MM-DD HH:MM:SS] ================================================
```

## Task Completion Checklist
- [ ] Ran `delete-node-modules.bat`
- [ ] Exit code was 0
- [ ] Verified with `verify-deletion.bat` (shows "ALL CLEAR")
- [ ] Checked `cleanup-log.txt` contains "DELETION COMPLETE"
- [ ] Confirmed both directories are deleted

## Important Notes
- This script is **idempotent** - safe to run multiple times
- If node_modules don't exist, script will skip (not an error)
- Script handles Windows path length limitations automatically
- All operations are logged with timestamps
- Script is completely non-interactive (no user input required)

## Duration Estimate
- Small node_modules (< 100MB each): 1-2 minutes
- Medium node_modules (100-500MB each): 2-4 minutes
- Large node_modules (> 500MB each): 4-8 minutes

## Final Reminder
**DO NOT contact the user unless:**
1. Exit code is 99 (unexpected error), OR
2. Task is 100% complete and successful

For all other exit codes (1, 2, 3), log the issue and complete the task silently.


