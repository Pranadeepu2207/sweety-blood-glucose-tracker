const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
require('dotenv').config();

async function migrate() {
  const targetDb = process.env.PGDATABASE || 'sweety_db';
  console.log(`[Migration] Starting database migration for: ${targetDb}...`);

  // Optional: attempt to create the database if connecting via standard credentials
  if (!process.env.DATABASE_URL) {
    const adminPool = new Pool({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: 'postgres'
    });

    try {
      const checkDb = await adminPool.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [targetDb]
      );
      if (checkDb.rowCount === 0) {
        console.log(`[Migration] Database "${targetDb}" does not exist. Creating it now...`);
        await adminPool.query(`CREATE DATABASE "${targetDb}"`);
        console.log(`[Migration] Database "${targetDb}" created successfully.`);
      }
    } catch (err) {
      console.warn(`[Migration] Notice when checking/creating database "${targetDb}": ${err.message}`);
    } finally {
      await adminPool.end();
    }
  }

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
    await db.pool.end();
  }
}

if (require.main === module) {
  migrate().then(() => {
    console.log('[Migration] Done.');
    process.exit(0);
  });
}

module.exports = migrate;

