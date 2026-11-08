const request = require('supertest');
const bcrypt = require('bcryptjs');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: { end: jest.fn() },
  checkConnection: jest.fn()
}));

const db = require('../src/config/db');
const app = require('../src/app');

describe('Authentication API (/api/auth)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('successfully registers user with hashed password and returns token', async () => {
      // Mock email existence check (0 rows found)
      db.query.mockResolvedValueOnce({ rows: [] });

      // Mock user insert
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: 'Jane Doe',
            email: 'jane@example.com',
            role: 'patient',
            created_at: new Date().toISOString()
          }
        ]
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'SecurePassword123'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toEqual({
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'patient'
      });

      // Verify bcrypt was used in the INSERT query
      const insertCall = db.query.mock.calls[1];
      const insertedPasswordHash = insertCall[1][2];
      expect(insertedPasswordHash).not.toBe('SecurePassword123');
      expect(insertedPasswordHash.startsWith('$2')).toBe(true);
      expect(await bcrypt.compare('SecurePassword123', insertedPasswordHash)).toBe(true);
    });

    test('rejects registration when email is already taken', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 99, email: 'taken@example.com' }]
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'taken@example.com',
          password: 'SecurePassword123'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('An account with this email already exists.');
    });

    test('rejects short passwords', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Password must be at least 6 characters long.');
    });
  });

  describe('POST /api/auth/login', () => {
    test('successfully logs in with valid credentials and returns JWT token', async () => {
      const password = 'Password123!';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: 'Demo Patient',
            email: 'demo@sweety.app',
            password_hash: hashedPassword,
            role: 'patient'
          }
        ]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@sweety.app',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('demo@sweety.app');
    });

    test('rejects login with wrong password', async () => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('CorrectPassword', salt);

      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: 'Demo Patient',
            email: 'demo@sweety.app',
            password_hash: hashedPassword,
            role: 'patient'
          }
        ]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@sweety.app',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password.');
    });

    test('rejects login with non-existent email', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@sweety.app',
          password: 'SomePassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password.');
    });
  });

  describe('Protected Route: GET /api/auth/me', () => {
    test('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required. Please log in.');
    });
  });
});
