require('dotenv').config();
const ensureLocalDb = require('./config/ensureLocalDb');
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Make sure local Postgres is active before accepting requests
  ensureLocalDb();

  try {
    // Run migrations on boot so tables always exist
    const migrate = require('./db/migrate');
    await migrate(false);

    // Verify DB connectivity
    const dbTime = await db.checkConnection();
    console.log(`[Sweety API] Connected to PostgreSQL at ${dbTime.now}`);

    app.listen(PORT, () => {
      console.log(`[Sweety API] Server running on port ${PORT} (http://localhost:${PORT})`);
    });
  } catch (err) {
    console.error('[Sweety API] Database connection failed on startup:', err.message);
    console.log('[Sweety API] Starting HTTP server anyway in case DB reconnects...');
    app.listen(PORT, () => {
      console.log(`[Sweety API] Server listening on port ${PORT}`);
    });
  }
}

startServer();
