const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Complaint = require('../src/models/Complaint');

let app;

beforeAll(() => {
  app = require('../src/app');
});

async function setupAiTestCase() {
  const dept = await Department.create({
    name: 'Electricity',
    description: 'Electrical grid maintenance'
  });

  const citizen = await User.create({
    name: 'Citizen Jane',
    email: 'jane@example.com',
    password: 'password123',
    role: 'citizen'
  });

  const loginRes = await request(app).post('/api/auth/login').send({ email: 'jane@example.com', password: 'password123' });
  const token = loginRes.body.data.token;

  const complaint = await Complaint.create({
    title: 'Broken Streetlight',
    description: 'Streetlight is flickering continuously',
    department: dept._id.toString(),
    citizen: citizen._id.toString(),
    image: 'light.jpg'
  });

  return {
    token,
    departmentId: dept._id.toString(),
    complaintId: complaint._id.toString()
  };
}

describe('AI API Endpoints & Circuit Breaker', () => {
  let fetchSpy;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('POST /api/ai/severity', () => {
    it('should calculate severity using mocked AI service', async () => {
      const { token } = await setupAiTestCase();

      fetchSpy.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            severityScore: 82,
            priority: 'High',
            reason: ['Electrical hazard near public area'],
            confidence: 90
          })
        })
      );

      const res = await request(app)
        .post('/api/ai/severity')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Live wire dangling',
          description: 'Electric wire fell down on the road'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.severityScore).toBe(82);
      expect(res.body.data.priority).toBe('High');
    });

    it('should fallback gracefully when AI service is down', async () => {
      const { token } = await setupAiTestCase();

      fetchSpy.mockImplementation(() => Promise.reject(new Error('Connection refused')));

      const res = await request(app)
        .post('/api/ai/severity')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Live wire dangling on street',
          description: 'Electric wire fell down on the road near park'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.severityScore).toBe(94);
      expect(res.body.data.priority).toBe('Critical');
    });
  });

  describe('POST /api/ai/predict-resolution', () => {
    it('should return estimated days using AI', async () => {
      const { token } = await setupAiTestCase();

      fetchSpy.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            estimatedDays: 3,
            delayRisk: 'Low',
            escalationProbability: 15,
            suggestedPriority: 'medium',
            confidence: 88
          })
        })
      );

      const res = await request(app)
        .post('/api/ai/predict-resolution')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Water pipe leak',
          department: 'Water Supply'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estimatedDays).toBe(3);
    });
  });
});
