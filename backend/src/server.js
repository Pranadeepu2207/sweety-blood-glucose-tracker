require('dotenv').config();
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connection on startup
    const dbTime = await db.checkConnection();
    console.log(`[Sweety API] Connected to PostgreSQL successfully at ${dbTime.now}`);

    app.listen(PORT, () => {
      console.log(`[Sweety API] Server running on port ${PORT} (http://localhost:${PORT})`);
    });
  } catch (err) {
    console.error('[Sweety API] Could not connect to PostgreSQL on startup:', err.message);
    console.error('[Sweety API] Please ensure PostgreSQL is running and credentials in .env are correct.');
    console.log(`[Sweety API] Starting server anyway on port ${PORT}...`);
    app.listen(PORT, () => {
      console.log(`[Sweety API] Server listening on port ${PORT} (Database pending connection)`);
    });
  }
}

startServer();
