/**
 * JANSEVA Automated Database Backup Script
 *
 * Runs `mongodump` to backup the database and manages a rolling retention policy.
 * Optionally triggers a webhook on completion or failure.
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '14', 10);
const WEBHOOK_URL = process.env.BACKUP_WEBHOOK_URL;

async function notifyWebhook(success, message) {
  if (!WEBHOOK_URL) return;
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'janseva-backup-service',
        success,
        message,
        timestamp: new Date().toISOString()
      })
    });
  } catch (err) {
    logger.error('Failed to send backup status to webhook', { error: err.message });
  }
}

function runBackup() {
  if (!MONGO_URI) {
    logger.error('MONGO_URI env var not set. Backup failed.');
    process.exit(1);
  }

  // Create backups directory if it doesn't exist
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

  logger.info(`Starting database backup to ${backupPath}...`);

  // Format mongodump command
  // Compatible with both standalone URIs and Atlas SRV records
  const cmd = `mongodump --uri="${MONGO_URI}" --out="${backupPath}" --gzip`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      logger.error('Database backup failed', { error: error.message, stderr });
      notifyWebhook(false, `Backup failed: ${error.message}`);
      return;
    }

    logger.info('Database backup completed successfully', { stdout });
    notifyWebhook(true, `Backup completed successfully. Saved to backup-${timestamp}`);

    // Manage retention: Delete backups older than RETENTION_DAYS
    cleanOldBackups();
  });
}

function cleanOldBackups() {
  fs.readdir(BACKUP_DIR, (err, files) => {
    if (err) {
      logger.error('Failed to read backups directory for clean up', { error: err.message });
      return;
    }

    const now = Date.now();
    const thresholdMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

    files.forEach((file) => {
      const filePath = path.join(BACKUP_DIR, file);
      fs.stat(filePath, (statErr, stats) => {
        if (statErr) {
          logger.error(`Failed to stat file ${file}`, { error: statErr.message });
          return;
        }

        const ageMs = now - stats.mtimeMs;
        if (ageMs > thresholdMs) {
          logger.info(`Deleting old backup: ${file} (Age: ${Math.round(ageMs / (24 * 60 * 60 * 1000))} days)`);
          fs.rm(filePath, { recursive: true, force: true }, (rmErr) => {
            if (rmErr) {
              logger.error(`Failed to delete old backup ${file}`, { error: rmErr.message });
            }
          });
        }
      });
    });
  });
}

// Run if called directly
if (require.main === module) {
  runBackup();
}

module.exports = { runBackup, cleanOldBackups };
