const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

async function seed() {
  console.log('[Seed] Starting database seeding for Sweety...');

  try {
    // 1. Ensure tables exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'patient',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS readings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reading_date DATE NOT NULL,
        slot VARCHAR(50) NOT NULL,
        value INTEGER NOT NULL CHECK (value >= 40 AND value <= 600),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_user_date_slot UNIQUE (user_id, reading_date, slot)
      );

      CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings(user_id, reading_date);
    `);

    // 2. Create or update Demo User
    const demoEmail = 'demo@sweety.app';
    const demoPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(demoPassword, 10);

    const userRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name
       RETURNING id, name, email`,
      ['Demo Patient', demoEmail, passwordHash, 'patient']
    );

    const demoUserId = userRes.rows[0].id;
    console.log(`[Seed] Demo user active: ID ${demoUserId} (${demoEmail})`);

    // 3. Clear existing readings for clean reproducible demo data
    await db.query('DELETE FROM readings WHERE user_id = $1', [demoUserId]);

    // 4. Generate sample readings
    // Current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const currentDay = now.getDate();

    const sampleReadings = [];

    // Helper to format YYYY-MM-DD
    const formatDate = (y, m, d) => {
      const mm = String(m + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    };

    // Slots definition
    const slots = [
      'Morning (fasting)',
      'After breakfast',
      'After lunch',
      'After dinner'
    ];

    // Readings for Today (up to after lunch or all 4 slots)
    const todayDateStr = formatDate(currentYear, currentMonth, currentDay);
    sampleReadings.push(
      { date: todayDateStr, slot: slots[0], value: 92 },
      { date: todayDateStr, slot: slots[1], value: 138 },
      { date: todayDateStr, slot: slots[2], value: 122 }
    );

    // Readings for previous days this month (Month-to-Date)
    const startDay = Math.max(1, currentDay - 7);
    for (let d = startDay; d < currentDay; d++) {
      const dateStr = formatDate(currentYear, currentMonth, d);
      sampleReadings.push(
        { date: dateStr, slot: slots[0], value: 90 + ((d * 3) % 25) },
        { date: dateStr, slot: slots[1], value: 125 + ((d * 7) % 35) },
        { date: dateStr, slot: slots[2], value: 115 + ((d * 5) % 30) },
        { date: dateStr, slot: slots[3], value: 130 + ((d * 4) % 32) }
      );
    }

    // Readings for Whole Previous Month (Monthly Report)
    let prevYear = currentYear;
    let prevMonth = currentMonth - 1;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = currentYear - 1;
    }

    // Number of days in previous month
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

    // Sample several days across previous month
    const sampleDaysPrevMonth = [1, 5, 10, 15, 20, 25, daysInPrevMonth];
    for (const d of sampleDaysPrevMonth) {
      const dateStr = formatDate(prevYear, prevMonth, d);
      sampleReadings.push(
        { date: dateStr, slot: slots[0], value: 88 + ((d * 2) % 20) },
        { date: dateStr, slot: slots[1], value: 120 + ((d * 4) % 30) },
        { date: dateStr, slot: slots[2], value: 110 + ((d * 3) % 25) },
        { date: dateStr, slot: slots[3], value: 128 + ((d * 5) % 28) }
      );
    }

    // Insert all readings
    for (const r of sampleReadings) {
      await db.query(
        `INSERT INTO readings (user_id, reading_date, slot, value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, reading_date, slot) DO NOTHING`,
        [demoUserId, r.date, r.slot, r.value]
      );
    }

    console.log(`[Seed] Successfully inserted ${sampleReadings.length} sample readings.`);
    console.log('----------------------------------------------------');
    console.log('Demo Account Credentials:');
    console.log(`Email:    ${demoEmail}`);
    console.log(`Password: ${demoPassword}`);
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

if (require.main === module) {
  seed().then(() => {
    console.log('[Seed] Seeding finished successfully.');
    process.exit(0);
  });
}

module.exports = seed;
