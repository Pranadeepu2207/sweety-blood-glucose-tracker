const fs = require('fs');
const path = require('path');
const { Client, Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
require('dotenv').config();

function getAdminConfig() {
  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      return {
        host: parsed.hostname || 'localhost',
        port: parseInt(parsed.port || '5432', 10),
        user: parsed.username || 'postgres',
        password: parsed.password || undefined,
        database: 'postgres',
        targetDb: (parsed.pathname || '/sweety_db').replace(/^\//, '') || 'sweety_db'
      };
    } catch (e) {
      // fallback
    }
  }

  return {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || undefined,
    database: 'postgres',
    targetDb: process.env.PGDATABASE || 'sweety_db'
  };
}

async function ensureDatabaseExists(adminConfig) {
  const client = new Client({
    host: adminConfig.host,
    port: adminConfig.port,
    user: adminConfig.user,
    password: adminConfig.password,
    database: 'postgres'
  });

  try {
    await client.connect();
    const checkRes = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [adminConfig.targetDb]
    );

    if (checkRes.rowCount === 0) {
      console.log(`[Migration] Database "${adminConfig.targetDb}" does not exist. Creating it now...`);
      await client.query(`CREATE DATABASE "${adminConfig.targetDb}"`);
      console.log(`[Migration] Database "${adminConfig.targetDb}" created successfully.`);
    } else {
      console.log(`[Migration] Database "${adminConfig.targetDb}" already exists.`);
    }
  } catch (err) {
    console.warn(`[Migration] Notice when checking/creating database: ${err.message}`);
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

async function migrate(shouldClosePool = false) {
  const adminConfig = getAdminConfig();
  console.log(`[Migration] Starting database migration for: ${adminConfig.targetDb}...`);

  await ensureDatabaseExists(adminConfig);

  // Connect to target database and apply schema
  const db = require('../config/db');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('[Migration] Applying schema.sql...');
    await db.query(schemaSql);
    console.log('[Migration] Database tables and indexes created successfully.');
  } catch (err) {
    console.error('[Migration] Failed to execute schema migration:', err);
    process.exit(1);
  } finally {
    if (shouldClosePool) {
      await db.pool.end();
    }
  }
}

if (require.main === module) {
  migrate(true).then(() => {
    console.log('[Migration] Done.');
    process.exit(0);
  });
}

module.exports = migrate;
