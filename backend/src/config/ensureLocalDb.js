const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Automatically ensures the local standalone PostgreSQL cluster is running
 * if using backend/.local_pg_data on port 5433.
 */
function ensurePostgresRunning() {
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
