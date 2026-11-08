const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../.local_pg_data');
const envPath = path.join(__dirname, '../.env');

// Search for initdb / pg_ctl in common paths or PATH
function findPgBin() {
  const commonPaths = [
    'C:\\Program Files\\PostgreSQL\\18\\bin',
    'C:\\Program Files\\PostgreSQL\\17\\bin',
    'C:\\Program Files\\PostgreSQL\\16\\bin',
    'C:\\Program Files\\PostgreSQL\\15\\bin'
  ];

  for (const p of commonPaths) {
    if (fs.existsSync(path.join(p, 'initdb.exe'))) {
      return p;
    }
  }

  // Check if available in PATH
  try {
    execSync('initdb --version', { stdio: 'ignore' });
    return '';
  } catch (e) {
    return null;
  }
}

const binDir = findPgBin();

if (binDir === null) {
  console.error('[Local DB] PostgreSQL binaries (initdb/pg_ctl) were not found.');
  console.error('[Local DB] Please configure your existing PostgreSQL password in backend/.env instead.');
  process.exit(1);
}

const initdbCmd = binDir ? `"${path.join(binDir, 'initdb.exe')}"` : 'initdb';
const pgctlCmd = binDir ? `"${path.join(binDir, 'pg_ctl.exe')}"` : 'pg_ctl';

console.log('[Local DB] Initializing standalone, passwordless PostgreSQL cluster on port 5433...');

if (!fs.existsSync(dataDir)) {
  try {
    execSync(`${initdbCmd} -D "${dataDir}" -U postgres -A trust -E UTF8`, { stdio: 'inherit' });
    console.log('[Local DB] Local database cluster initialized with trust authentication.');
  } catch (err) {
    console.error('[Local DB] Failed to run initdb:', err.message);
    process.exit(1);
  }
} else {
  console.log('[Local DB] Local cluster directory already exists.');
}

// Start cluster
try {
  console.log('[Local DB] Starting PostgreSQL on port 5433...');
  execSync(`${pgctlCmd} -D "${dataDir}" -l "${path.join(dataDir, 'server.log')}" -o "-p 5433" start`, { stdio: 'inherit' });
  console.log('[Local DB] Server started on port 5433!');
} catch (err) {
  console.warn('[Local DB] pg_ctl start notice:', err.message);
}

// Write backend/.env configured for port 5433 with no password
const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Standalone Local PostgreSQL (Port 5433, Trust Authentication)
DATABASE_URL=postgres://postgres@localhost:5433/sweety_db
PGHOST=localhost
PGPORT=5433
PGUSER=postgres
PGPASSWORD=
PGDATABASE=sweety_db

# Authentication
JWT_SECRET=super_secret_sweety_jwt_key_replace_in_production
JWT_EXPIRES_IN=7d
`;

fs.writeFileSync(envPath, envContent, 'utf8');
console.log('[Local DB] Created backend/.env with port 5433 credentials.');
console.log('[Local DB] You can now run: npm run migrate');
