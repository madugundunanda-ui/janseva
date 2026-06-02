const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Complaint = require('../src/models/Complaint');

// Mock aiService at the top level so that controller destructuring retrieves the mock functions
jest.mock('../src/services/aiService', () => {
  return {
    analyzeComplaintImage: jest.fn(),
    predictResolution: jest.fn(),
    calculateSeverity: jest.fn(),
    verifyResolutionProof: jest.fn(),
    submitFeedback: jest.fn(),
  };
});

// Mock VisionProviderFactory for unit tests of the actual aiService
jest.mock('../src/ai/providers/VisionProviderFactory', () => {
  return {
    getProvider: jest.fn().mockReturnValue({
      analyzeImage: jest.fn(),
      compareImages: jest.fn(),
    }),
  };
});

const aiServiceMock = require('../src/services/aiService');
const VisionProviderFactoryMock = require('../src/ai/providers/VisionProviderFactory');
const actualAiService = jest.requireActual('../src/services/aiService');

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/ai/severity', () => {
    it('should calculate severity using mocked AI service', async () => {
      const { token } = await setupAiTestCase();

      aiServiceMock.calculateSeverity.mockResolvedValue({
        severityScore: 82,
        priority: 'High',
        reason: ['Electrical hazard near public area'],
        confidence: 90
      });

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
      expect(aiServiceMock.calculateSeverity).toHaveBeenCalled();
    });

    it('should fallback gracefully when AI service/provider fails', async () => {
      const { token } = await setupAiTestCase();

      aiServiceMock.calculateSeverity.mockRejectedValue(new Error('Provider connection refused'));

      const res = await request(app)
        .post('/api/ai/severity')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Live wire dangling on street',
          description: 'Electric wire fell down on the road near park'
        });

      // Assert that when the service fails, the controller handles it gracefully or returns error code
      // We expect the controller to bubble up the rejection using asyncHandler
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/ai/predict-resolution', () => {
    it('should return estimated days using AI', async () => {
      const { token } = await setupAiTestCase();

      aiServiceMock.predictResolution.mockResolvedValue({
        estimatedDays: 3,
        delayRisk: 'Low',
        escalationProbability: 15,
        suggestedPriority: 'medium',
        confidence: 88
      });

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
      expect(aiServiceMock.predictResolution).toHaveBeenCalled();
    });
  });

  describe('POST /api/ai/feedback', () => {
    it('should submit feedback using mocked AI service', async () => {
      const { token } = await setupAiTestCase();

      aiServiceMock.submitFeedback.mockResolvedValue({
        success: true,
        message: 'Feedback logged successfully'
      });

      const res = await request(app)
        .post('/api/ai/feedback')
        .set('Authorization', `Bearer ${token}`)
        .send({
          originalPrediction: 'Tobacco Issue',
          correctedCategory: 'Garbage / Waste',
          imagePath: '/uploads/complaints/test.jpg'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.success).toBe(true);
      expect(aiServiceMock.submitFeedback).toHaveBeenCalled();
    });
  });
});

describe('Actual AI Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateSeverity rules', () => {
    it('should assign Critical priority and severity score 95 for emergency triggers', async () => {
      const payloads = [
        { title: 'Live wire dangling', description: 'safety hazard' },
        { title: 'transformer fire', description: 'smoke' },
        { title: 'water pipe broken', description: 'exposed wire danger' },
        { title: 'road collapse', description: 'pothole' }
      ];

      for (const payload of payloads) {
        const result = await actualAiService.calculateSeverity(payload);
        expect(result.priority).toBe('Critical');
        expect(result.severityScore).toBe(95);
      }
    });

    it('should assign Medium priority and severity score 45 for standard grievances', async () => {
      const payload = { title: 'Pothole on main road', description: 'Needs resurfacing' };
      const result = await actualAiService.calculateSeverity(payload);
      expect(result.priority).toBe('Medium');
      expect(result.severityScore).toBe(45);
    });
  });

  describe('predictResolution rules', () => {
    it('should estimate 1 day for urgent/critical priority', async () => {
      const result = await actualAiService.predictResolution({ priority: 'critical' });
      expect(result.estimatedDays).toBe(1);
      expect(result.delayRisk).toBe('Low');
    });

    it('should estimate 4 days for medium priority', async () => {
      const result = await actualAiService.predictResolution({ priority: 'medium' });
      expect(result.estimatedDays).toBe(4);
      expect(result.delayRisk).toBe('Medium');
    });

    it('should estimate 7 days for low priority', async () => {
      const result = await actualAiService.predictResolution({ priority: 'low' });
      expect(result.estimatedDays).toBe(7);
      expect(result.delayRisk).toBe('High');
    });
  });

  describe('analyzeComplaintImage with mock provider', () => {
    it('should delegate to active vision provider', async () => {
      const mockProvider = {
        analyzeImage: jest.fn().mockResolvedValue({
          title: 'Road Damage Mocked',
          category: 'Road Damage',
          department: 'Roads & Highways',
          severity: 'medium',
          priority: 'medium',
          confidence: 90,
          emergency: false,
          explanation: ['Visual crack']
        })
      };

      VisionProviderFactoryMock.getProvider.mockReturnValue(mockProvider);

      const mockFile = {
        path: 'dummy-path.jpg',
        mimetype: 'image/jpeg',
        filename: 'dummy-file.jpg'
      };

      // Mock fs.existsSync to return true so getFileHash/read file is bypassed or mocked
      const fs = require('fs');
      const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const readSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('dummy'));

      // Also need to clear/mock AiCache findOne to return null to force provider invocation
      const { AiCache } = require('../src/models');
      const findOneSpy = jest.spyOn(AiCache, 'findOne').mockResolvedValue(null);
      const createSpy = jest.spyOn(AiCache, 'create').mockResolvedValue({});

      const result = await actualAiService.analyzeComplaintImage(mockFile);

      expect(result.title).toBe('Road Damage Mocked');
      expect(mockProvider.analyzeImage).toHaveBeenCalledWith(mockFile);

      existsSpy.mockRestore();
      readSpy.mockRestore();
      findOneSpy.mockRestore();
      createSpy.mockRestore();
    });
  });
});
