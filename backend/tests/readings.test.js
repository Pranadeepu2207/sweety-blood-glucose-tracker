const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: { end: jest.fn() }
}));

const db = require('../src/config/db');
const app = require('../src/app');
const { JWT_SECRET } = require('../src/middleware/authMiddleware');

describe('Readings API (/api/readings)', () => {
  let userToken;
  const mockUser = { id: 42, email: 'user42@sweety.app', name: 'User 42', role: 'patient' };

  beforeAll(() => {
    userToken = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/readings (with Pagination)', () => {
    test('returns paginated readings matching ?page=1&limit=20', async () => {
      // Mock count query
      db.query.mockResolvedValueOnce({
        rows: [{ count: '25' }]
      });

      // Mock data query
      const sampleRows = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        user_id: 42,
        reading_date: '2026-10-15',
        slot: 'Morning (fasting)',
        value: 100 + i,
        created_at: new Date().toISOString()
      }));

      db.query.mockResolvedValueOnce({
        rows: sampleRows
      });

      const res = await request(app)
        .get('/api/readings?page=1&limit=20')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.readings).toHaveLength(20);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 25,
        totalPages: 2
      });

      // Check that user_id was passed to queries (User isolation)
      expect(db.query.mock.calls[0][1][0]).toBe(42);
      expect(db.query.mock.calls[1][1][0]).toBe(42);
    });

    test('supports filtering by date parameter', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '3' }] });
      db.query.mockResolvedValueOnce({
        rows: [
          { id: 1, user_id: 42, reading_date: '2026-10-15', slot: 'Morning (fasting)', value: 95 },
          { id: 2, user_id: 42, reading_date: '2026-10-15', slot: 'After breakfast', value: 130 },
          { id: 3, user_id: 42, reading_date: '2026-10-15', slot: 'After lunch', value: 118 }
        ]
      });

      const res = await request(app)
        .get('/api/readings?date=2026-10-15')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.readings).toHaveLength(3);
      // Query included the date parameter
      expect(db.query.mock.calls[0][1]).toContain('2026-10-15');
    });
  });

  describe('GET /api/readings/:id', () => {
    test('returns reading when owned by authenticated user', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          { id: 7, user_id: 42, reading_date: '2026-10-15', slot: 'After lunch', value: 122 }
        ]
      });

      const res = await request(app)
        .get('/api/readings/7')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.reading.id).toBe(7);
      expect(db.query.mock.calls[0][1]).toEqual([7, 42]);
    });

    test('returns 404 when reading belongs to someone else or does not exist', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/readings/999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Reading not found.');
    });
  });

  describe('DELETE /api/readings/:id', () => {
    test('deletes reading owned by user', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 7 }]
      });

      const res = await request(app)
        .delete('/api/readings/7')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Reading deleted successfully.');
      expect(db.query.mock.calls[0][1]).toEqual([7, 42]);
    });

    test('returns 404 if reading to delete is not found for this user', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete('/api/readings/999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Reading not found.');
    });
  });
});
