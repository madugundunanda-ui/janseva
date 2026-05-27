const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Complaint = require('../src/models/Complaint');
const Department = require('../src/models/Department');
const Hotspot = require('../src/models/Hotspot');

let app;

beforeAll(() => {
  app = require('../src/app');
});

async function setupGeoTestCase() {
  const dept = await Department.create({
    name: 'Roads & Traffic',
    description: 'Road repair and traffic management'
  });

  const user = await User.create({
    name: 'Citizen Jane',
    email: 'jane@example.com',
    password: 'password123',
    role: 'citizen',
    latitude: 12.9716,
    longitude: 77.5946
  });

  const loginRes = await request(app).post('/api/auth/login').send({ email: 'jane@example.com', password: 'password123' });
  const token = loginRes.body.data.token;

  return {
    token,
    departmentId: dept._id.toString(),
    citizenId: user._id.toString()
  };
}

describe('Geo API Endpoints', () => {
  let fetchSpy;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('POST /api/geo/reverse', () => {
    it('should return location name from coordinates', async () => {
      const { token } = await setupGeoTestCase();

      fetchSpy.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            display_name: 'MG Road, Bangalore, Karnataka, India',
            address: {
              road: 'MG Road',
              suburb: 'Central Area',
              city: 'Bengaluru',
              state: 'Karnataka',
              postcode: '560001'
            }
          })
        })
      );

      const res = await request(app)
        .post('/api/geo/reverse')
        .set('Authorization', `Bearer ${token}`)
        .send({
          lat: 12.9716,
          lng: 77.5946
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/geo/nearby', () => {
    it('should return only nearby issues', async () => {
      const { token, departmentId, citizenId } = await setupGeoTestCase();

      // Create a complaint nearby
      await Complaint.create({
        title: 'Pothole on MG Road',
        description: 'Dangerous pothole near metro station',
        department: departmentId,
        citizen: citizenId,
        image: 'pothole.jpg',
        location: {
          address: 'MG Road, Bangalore',
          latitude: 12.9718, // nearby
          longitude: 77.5948
        }
      });

      // Create a complaint far away
      await Complaint.create({
        title: 'Drainage Issue',
        description: 'Sewer block far away',
        department: departmentId,
        citizen: citizenId,
        image: 'drain.jpg',
        location: {
          address: 'Far Street, Bangalore',
          latitude: 13.0500, // far
          longitude: 77.6500
        }
      });

      const res = await request(app)
        .get('/api/geo/nearby')
        .set('Authorization', `Bearer ${token}`)
        .query({
          lat: 12.9716,
          lng: 77.5946
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complaints).toBeDefined();
      const titles = res.body.data.complaints.map(c => c.title);
      expect(titles).toContain('Pothole on MG Road');
      expect(titles).not.toContain('Drainage Issue');
    });
  });

  describe('GET /api/geo/hotspots', () => {
    it('should retrieve hotspots list', async () => {
      const { token } = await setupGeoTestCase();

      await Hotspot.create({
        area: 'MG Road Metro',
        latitude: 12.9716,
        longitude: 77.5946,
        complaintsCount: 5,
        priority: 'high'
      });

      const res = await request(app)
        .get('/api/geo/hotspots')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hotspots.length).toBeGreaterThan(0);
      expect(res.body.data.hotspots[0].area).toBe('MG Road Metro');
    });
  });
});
