const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../src/models/User');

let app;

beforeAll(() => {
  app = require('../src/app');
});

describe('Auth API Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new citizen user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
          role: 'citizen',
          phone: '0987654321'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('jane@example.com');
      expect(res.body.data.user.password).toBeUndefined();

      const user = await User.findOne({ email: 'jane@example.com' });
      expect(user).not.toBeNull();
      expect(user.role).toBe('citizen');
    });

    it('should fail registration with existing email', async () => {
      await User.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        role: 'citizen'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
          role: 'citizen'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        role: 'citizen'
      });
    });

    it('should login an existing user and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should fail login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Jane Me',
        email: 'janeme@example.com',
        password: 'password123',
        role: 'citizen'
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'janeme@example.com',
          password: 'password123'
        });
      token = loginRes.body.data.token;
    });

    it('should return the logged-in user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('janeme@example.com');
    });

    it('should reject requests without a token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
