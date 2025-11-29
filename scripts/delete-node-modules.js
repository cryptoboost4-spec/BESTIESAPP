#!/usr/bin/env node

/**
 * Node.js Node Modules Deletion Script
 * 
 * Cross-platform script to delete node_modules directories
 * in both frontend and functions folders.
 * 
 * Usage: node scripts/delete-node-modules.js
 * 
 * Exit codes:
 *   0 = Success
 *   1 = Permission denied
 *   2 = File in use / locked
 *   3 = Disk space / path too long
 *   99 = Unexpected error
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'cleanup-log.txt');
const SCRIPT_DIR = path.join(__dirname, '..');
const FRONTEND_DIR = path.join(SCRIPT_DIR, 'frontend', 'node_modules');
const FUNCTIONS_DIR = path.join(SCRIPT_DIR, 'functions', 'node_modules');

let errorCode = 0;

/**
 * Log a message to both console and log file
 */
function log(message) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logMessage = `[${timestamp}] ${message}`;
    console.log(message);
    fs.appendFileSync(LOG_FILE, logMessage + '\n', 'utf8');
}

/**
 * Get directory size (for reporting)
 */
function getDirSize(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) return 0;
        let size = 0;
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                size += getDirSize(filePath);
            } else {
                size += stats.size;
            }
        }
        return size;
    } catch (error) {
        return 0;
    }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Delete directory recursively
 */
function deleteDirectory(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            return { success: true, message: 'Directory does not exist' };
        }

        // Get size before deletion (for reporting)
        const size = getDirSize(dirPath);
        const sizeStr = formatBytes(size);

        // Delete directory
        fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });

        // Verify deletion
        if (fs.existsSync(dirPath)) {
            return { success: false, message: 'Directory still exists after deletion attempt', error: 'VERIFY_FAILED' };
        }

        return { success: true, message: `Deleted successfully (${sizeStr})` };
    } catch (error) {
        if (error.code === 'EACCES' || error.code === 'EPERM') {
            return { success: false, message: 'Permission denied', error: 'PERMISSION_DENIED', code: 1 };
        } else if (error.code === 'EBUSY' || error.code === 'ENOTEMPTY') {
            return { success: false, message: 'File or directory is in use', error: 'FILE_IN_USE', code: 2 };
        } else if (error.code === 'ENAMETOOLONG' || error.code === 'ENOSPC') {
            return { success: false, message: 'Path too long or disk full', error: 'PATH_TOO_LONG', code: 3 };
        } else {
            return { success: false, message: `Unexpected error: ${error.message}`, error: error.code || 'UNKNOWN', code: 99 };
        }
    }
}

/**
 * Main execution
 */
function main() {
    log('================================================');
    log('NODE_MODULES DELETION STARTED');
    log('================================================');
    log('');

    // Delete frontend/node_modules
    log('Checking frontend/node_modules...');
    const frontendResult = deleteDirectory(FRONTEND_DIR);
    
    if (frontendResult.success) {
        log(`✓ frontend/node_modules ${frontendResult.message}`);
    } else {
        log(`✗ frontend/node_modules - ${frontendResult.message}`);
        if (frontendResult.code && frontendResult.code > errorCode) {
            errorCode = frontendResult.code;
        }
    }
    log('');

    // Delete functions/node_modules
    log('Checking functions/node_modules...');
    const functionsResult = deleteDirectory(FUNCTIONS_DIR);
    
    if (functionsResult.success) {
        log(`✓ functions/node_modules ${functionsResult.message}`);
    } else {
        log(`✗ functions/node_modules - ${functionsResult.message}`);
        if (functionsResult.code && functionsResult.code > errorCode) {
            errorCode = functionsResult.code;
        }
    }
    log('');

    // Verify deletion
    log('Verifying deletion...');
    let verifyFailed = false;

    if (fs.existsSync(FRONTEND_DIR)) {
        log('WARNING: frontend/node_modules still exists!');
        verifyFailed = true;
        errorCode = 99;
    }

    if (fs.existsSync(FUNCTIONS_DIR)) {
        log('WARNING: functions/node_modules still exists!');
        verifyFailed = true;
        errorCode = 99;
    }

    if (!verifyFailed) {
        log('✓ Verification passed - all node_modules removed');
    }
    log('');

    // Final status
    if (errorCode === 0) {
        log('================================================');
        log('✅ DELETION COMPLETE - All node_modules removed');
        log('================================================');
    } else {
        log('================================================');
        log(`❌ DELETION FAILED - Error code: ${errorCode}`);
        log('================================================');
        log('Check cleanup-log.txt for details');
    }

    process.exit(errorCode);
}

// Run main function
main();


