const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper to start the local cluster if someone is using port 5433 during local dev
function ensurePostgresRunning() {
  // Never run local cluster script in production or on non-Windows production containers
  if (process.env.NODE_ENV === 'production' || process.platform !== 'win32') return;

  const localDataDir = path.join(__dirname, '../../.local_pg_data');
  if (!fs.existsSync(localDataDir)) return;

  const port = process.env.PGPORT || '5433';
  if (port !== '5433') return;

  const commonPaths = [
    'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_ctl.exe',
    'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_ctl.exe',
    'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_ctl.exe',
    'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_ctl.exe'
  ];

  let pgCtl = commonPaths.find((p) => fs.existsSync(p)) || 'pg_ctl';

  try {
    execSync(`"${pgCtl}" -D "${localDataDir}" status`, { stdio: 'ignore' });
  } catch (err) {
    try {
      console.log(`[Sweety API] Starting local PostgreSQL on port ${port}...`);
      execSync(`"${pgCtl}" -D "${localDataDir}" -o "-p ${port}" -w start`, { stdio: 'inherit' });
      console.log(`[Sweety API] Local PostgreSQL active on port ${port}.`);
    } catch (e) {
      console.warn(`[Sweety API] Notice while starting PostgreSQL: ${e.message}`);
    }
  }
}

module.exports = ensurePostgresRunning;
