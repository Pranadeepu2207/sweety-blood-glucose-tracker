const express = require('express');
const request = require('supertest');

// Mock db module
jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: { end: jest.fn() }
}));

const db = require('../src/config/db');
const { validateReading } = require('../src/middleware/validateReading');

// Setup small express app for testing the middleware
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Mock authenticated user
  app.use((req, res, next) => {
    req.user = { id: 1, email: 'patient@sweety.app' };
    next();
  });

  app.post('/api/test-reading', validateReading, (req, res) => {
    res.status(200).json({ success: true, reading: req.body });
  });

  return app;
}

describe('Glucose Reading Validation Middleware', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });

  // Rule 1: Value is required -> "Please enter a glucose value."
  describe('Rule 1: Value is required', () => {
    test('rejects missing value with "Please enter a glucose value."', async () => {
      const res = await request(app)
        .post('/api/test-reading')
        .send({
          reading_date: '2026-10-15',
          slot: 'Morning (fasting)'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Please enter a glucose value.');
    });

    test('rejects empty string value with "Please enter a glucose value."', async () => {
      const res = await request(app)
        .post('/api/test-reading')
        .send({
          reading_date: '2026-10-15',
          slot: 'Morning (fasting)',
          value: '   '
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Please enter a glucose value.');
    });
  });

  // Rule 2: Value must be a whole number between 40 and 600 -> "Value must be between 40 and 600 mg/dl."
  describe('Rule 2: Whole number between 40 and 600', () => {
    test('rejects values below 40 with "Value must be between 40 and 600 mg/dl."', async () => {
      const res = await request(app)
        .post('/api/test-reading')
        .send({
          reading_date: '2026-10-15',
          slot: 'After breakfast',
          value: 39
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');
    });

    test('rejects values above 600 with "Value must be between 40 and 600 mg/dl."', async () => {
      const res = await request(app)
        .post('/api/test-reading')
        .send({
          reading_date: '2026-10-15',
          slot: 'After breakfast',
          value: 601
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');
    });

    test('rejects decimal numbers with "Value must be between 40 and 600 mg/dl."', async () => {
      const res = await request(app)
        .post('/api/test-reading')
        .send({
          reading_date: '2026-10-15',
          slot: 'After breakfast',
          value: 120.5
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');
    });

    test('rejects non-numeric strings with "Value must be between 40 and 600 mg/dl."', async () => {
      const res = await request(app)
        .post('/api/test-reading')
        .send({
          reading_date: '2026-10-15',
          slot: 'After breakfast',
          value: 'high'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');
    });
  });

  // Rule 3: Only one reading per slot per day -> "You already have an After lunch reading for this date."
  describe('Rule 3: Only one reading per slot per day', () => {
    test('rejects duplicate slot on same date with exact formatted message', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 10, slot: 'After lunch' }]
      });

      const res = await request(app)
        .post('/api/test-reading')
        .send({
          reading_date: '2026-10-15',
          slot: 'After lunch',
          value: 130
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('You already have an After lunch reading for this date.');
    });

    test('rejects duplicate Morning (fasting) slot with "You already have a Morning (fasting) reading for this date."', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 11, slot: 'Morning (fasting)' }]
      });

      const res = await request(app)
        .post('/api/test-reading')
        .send({
          reading_date: '2026-10-15',
          slot: 'Morning (fasting)',
          value: 95
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('You already have a Morning (fasting) reading for this date.');
    });
  });

  // Rule 4: Maximum 4 readings per day -> "You can add only 4 readings per day."
  describe('Rule 4: Maximum 4 readings per day', () => {
    test('rejects when 4 readings already exist on that date', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          { id: 1, slot: 'Morning (fasting)' },
          { id: 2, slot: 'After breakfast' },
          { id: 3, slot: 'After lunch' },
          { id: 4, slot: 'After dinner' }
        ]
      });

      const res = await request(app)
        .post('/api/test-reading')
        .send({
          reading_date: '2026-10-15',
          slot: 'Morning (fasting)',
          value: 100
        });

      expect(res.status).toBe(400);
      // Fails duplicate slot first or max 4 readings
      expect([
        'You already have a Morning (fasting) reading for this date.',
        'You can add only 4 readings per day.'
      ]).toContain(res.body.error);
    });

    test('rejects with "You can add only 4 readings per day." when max reached', async () => {
      // Simulate 4 slots already filled with different names
      db.query.mockResolvedValueOnce({
        rows: [
          { id: 1, slot: 'Slot 1' },
          { id: 2, slot: 'Slot 2' },
          { id: 3, slot: 'Slot 3' },
          { id: 4, slot: 'Slot 4' }
        ]
      });

      const res = await request(app)
        .post('/api/test-reading')
        .send({
          reading_date: '2026-10-15',
          slot: 'Morning (fasting)',
          value: 100
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('You can add only 4 readings per day.');
    });
  });

  // Rule 5: Date cannot be in the future -> "Date cannot be in the future."
  describe('Rule 5: Date cannot be in the future', () => {
    test('rejects future date with "Date cannot be in the future."', async () => {
      // Pick a date far in the future
      const farFuture = '2099-12-31';

      const res = await request(app)
        .post('/api/test-reading')
        .send({
          reading_date: farFuture,
          slot: 'Morning (fasting)',
          value: 100
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Date cannot be in the future.');
    });
  });

  describe('Valid reading submission', () => {
    test('accepts valid reading on valid date with whole number within 40-600', async () => {
      db.query.mockResolvedValueOnce({
        rows: [] // No existing readings on this date
      });

      const res = await request(app)
        .post('/api/test-reading')
        .send({
          reading_date: '2026-10-15',
          slot: 'After breakfast',
          value: 125
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reading.parsedValue).toBe(125);
    });
  });
});

