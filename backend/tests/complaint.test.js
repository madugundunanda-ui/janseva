const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Complaint = require('../src/models/Complaint');

let app;

beforeAll(() => {
  app = require('../src/app');
});

async function setupBaseData() {
  const dept = await Department.create({
    name: 'Sanitation',
    description: 'Waste management and hygiene'
  });

  const citizen = await User.create({
    name: 'Citizen Jane',
    email: 'jane@example.com',
    password: 'password123',
    role: 'citizen'
  });

  const officer = await User.create({
    name: 'Officer Bob',
    email: 'bob@sanitation.janseva.gov.in',
    password: 'password123',
    role: 'officer',
    department: dept._id
  });

  const supervisor = await User.create({
    name: 'Supervisor Alice',
    email: 'alice@works.janseva.gov.in',
    password: 'password123',
    role: 'supervisor',
    department: dept._id
  });

  const cRes = await request(app).post('/api/auth/login').send({ email: 'jane@example.com', password: 'password123' });
  const oRes = await request(app).post('/api/auth/login').send({ email: 'bob@sanitation.janseva.gov.in', password: 'password123' });
  const sRes = await request(app).post('/api/auth/login').send({ email: 'alice@works.janseva.gov.in', password: 'password123' });

  return {
    departmentId: dept._id.toString(),
    citizenToken: cRes.body.data.token,
    officerToken: oRes.body.data.token,
    supervisorToken: sRes.body.data.token,
    citizenId: citizen._id.toString(),
    officerId: officer._id.toString(),
    supervisorId: supervisor._id.toString()
  };
}

async function createTestComplaint(baseData) {
  const complaint = await Complaint.create({
    title: 'Garbage Overflow',
    description: 'Huge pile of garbage near the park',
    department: baseData.departmentId,
    citizen: baseData.citizenId,
    image: 'test.jpg',
    location: {
      address: 'Park Street',
      latitude: 12.9716,
      longitude: 77.5946
    }
  });
  return complaint;
}

describe('Complaint API Endpoints', () => {
  describe('POST /api/complaints', () => {
    it('should allow a citizen to create a complaint', async () => {
      const baseData = await setupBaseData();
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${baseData.citizenToken}`)
        .field('title', 'Garbage Overflow')
        .field('description', 'Huge pile of garbage near the park')
        .field('department', baseData.departmentId)
        .field('priority', 'medium')
        .field('location', JSON.stringify({
          address: 'Park Street',
          latitude: 12.9716,
          longitude: 77.5946
        }))
        .attach('image', Buffer.from('dummy image content'), 'test.jpg');

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complaint).toBeDefined();
      expect(res.body.data.complaint.title).toBe('Garbage Overflow');
    });

    it('should fail complaint creation with missing fields', async () => {
      const baseData = await setupBaseData();
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${baseData.citizenToken}`)
        .send({
          title: 'Short'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/complaints', () => {
    it('should list complaints', async () => {
      const baseData = await setupBaseData();
      await createTestComplaint(baseData);

      const res = await request(app)
        .get('/api/complaints')
        .set('Authorization', `Bearer ${baseData.citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complaints.length).toBeGreaterThan(0);
    });

    it('should get complaint by ID', async () => {
      const baseData = await setupBaseData();
      const complaint = await createTestComplaint(baseData);

      const res = await request(app)
        .get(`/api/complaints/${complaint._id}`)
        .set('Authorization', `Bearer ${baseData.citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complaint._id).toBe(complaint._id.toString());
    });
  });

  describe('POST /api/complaints/:id/validate', () => {
    it('should allow validation votes on the complaint', async () => {
      const baseData = await setupBaseData();
      const complaint = await createTestComplaint(baseData);

      const res = await request(app)
        .post(`/api/complaints/${complaint._id}/validate`)
        .set('Authorization', `Bearer ${baseData.citizenToken}`)
        .send({
          voteType: 'confirm',
          comment: 'Confirmed this issue'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complaint.communityVotes.confirm).toBe(1);
    });
  });

  describe('PATCH /api/complaints/:id/assign-officer', () => {
    it('should allow supervisor to assign an officer', async () => {
      const baseData = await setupBaseData();
      const complaint = await createTestComplaint(baseData);

      const res = await request(app)
        .patch(`/api/complaints/${complaint._id}/assign-officer`)
        .set('Authorization', `Bearer ${baseData.supervisorToken}`)
        .send({
          officerId: baseData.officerId
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const assignedOfficerId = res.body.data.complaint.assignedOfficer._id || res.body.data.complaint.assignedOfficer;
      expect(assignedOfficerId).toBe(baseData.officerId);
    });
  });

  describe('PATCH /api/complaints/:id', () => {
    it('should allow officer to update complaint resolution details', async () => {
      const baseData = await setupBaseData();
      const complaint = await createTestComplaint(baseData);

      const res = await request(app)
        .patch(`/api/complaints/${complaint._id}`)
        .set('Authorization', `Bearer ${baseData.officerToken}`)
        .field('status', 'resolved')
        .field('resolutionNote', 'Trash cleared and area cleaned.')
        .attach('afterImage', Buffer.from('dummy image content'), 'after.jpg');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complaint.status).toBe('resolved');
    });
  });
});
