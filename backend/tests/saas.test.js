const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Complaint = require('../src/models/Complaint');

let app;

beforeAll(() => {
  app = require('../src/app');
});

async function clearDatabase() {
  await User.deleteMany({});
  await Department.deleteMany({});
  await Complaint.deleteMany({});
}

describe('SaaS Multi-Tenancy & Onboarding API', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
  });

  it('should onboard a new municipality and enforce tenancy isolation', async () => {
    // 1. Create a System Admin (in the default tenant) to execute onboarding
    const sysAdmin = await User.create({
      name: 'System Admin',
      email: 'admin@janseva.gov.in',
      password: 'password123',
      role: 'admin',
      tenantId: 'default-municipality'
    });

    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@janseva.gov.in', password: 'password123', role: 'admin' });

    expect(adminLoginRes.status).toBe(200);
    const adminToken = adminLoginRes.body.data.token;

    // 2. Onboard "mysore-municipal-corporation"
    const onboardRes = await request(app)
      .post('/api/admin/onboard-municipality')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tenantId: 'mysore-municipal-corporation',
        name: 'Mysore Municipal Corporation',
        adminEmail: 'mysore.admin@janseva.gov.in',
        adminPassword: 'password123',
        district: 'Mysore',
        ward: 'Ward 1'
      });

    expect(onboardRes.status).toBe(201);
    expect(onboardRes.body.success).toBe(true);
    expect(onboardRes.body.data.tenantId).toBe('mysore-municipal-corporation');
    expect(onboardRes.body.data.departments).toHaveLength(5);
    expect(onboardRes.body.data.bootstrapStaff).toBeDefined();

    // Verify departments were actually created with correct tenantId
    const mysoreDepts = await Department.find({ tenantId: 'mysore-municipal-corporation' });
    expect(mysoreDepts).toHaveLength(5);

    // Verify compound uniqueness index: trying to onboard again with same tenantId should fail
    const duplicateOnboardRes = await request(app)
      .post('/api/admin/onboard-municipality')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tenantId: 'mysore-municipal-corporation',
        name: 'Mysore Municipal Corporation Duplicate',
        adminEmail: 'mysore.admin2@janseva.gov.in',
        adminPassword: 'password123'
      });
    expect(duplicateOnboardRes.status).toBe(409);

    // 3. Log in as bootstrap staff or new Admin
    const mysoreAdminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'mysore.admin@janseva.gov.in', password: 'password123', role: 'admin' });

    expect(mysoreAdminLogin.status).toBe(200);
    const mysoreAdminToken = mysoreAdminLogin.body.data.token;

    // 4. Verify department query isolation: Mysore Admin should only see Mysore departments
    const deptsRes = await request(app)
      .get('/api/departments')
      .set('Authorization', `Bearer ${mysoreAdminToken}`);

    expect(deptsRes.status).toBe(200);
    expect(deptsRes.body.data.departments.every(d => d.tenantId === 'mysore-municipal-corporation')).toBe(true);

    // 5. Verify Complaint creation and visibility isolation
    const mysoreCitizen = await User.create({
      name: 'Mysore Citizen',
      email: 'citizen@mysore.com',
      password: 'password123',
      role: 'citizen',
      tenantId: 'mysore-municipal-corporation'
    });

    const defaultCitizen = await User.create({
      name: 'Default Citizen',
      email: 'citizen@default.com',
      password: 'password123',
      role: 'citizen',
      tenantId: 'default-municipality'
    });

    const mysoreCitizenLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@mysore.com', password: 'password123', role: 'citizen' });

    const defaultCitizenLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@default.com', password: 'password123', role: 'citizen' });

    const mysoreCitizenToken = mysoreCitizenLogin.body.data.token;
    const defaultCitizenToken = defaultCitizenLogin.body.data.token;

    // Create a complaint for Mysore Citizen
    const firstMysoreDept = mysoreDepts[0];
    const newComplaintRes = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${mysoreCitizenToken}`)
      .field('title', 'Water Clog Mysore')
      .field('description', 'Pipes are broken on main road')
      .field('department', firstMysoreDept._id.toString())
      .field('priority', 'medium')
      .field('location', JSON.stringify({
        address: 'Mysore Road',
        latitude: 12.2958,
        longitude: 76.6394
      }))
      .attach('image', Buffer.from('dummy image content'), 'clog.jpg');

    expect(newComplaintRes.status).toBe(202);
    const complaintId = newComplaintRes.body.complaint.id;

    // Retrieve complaints as Mysore Citizen
    const mysoreComplaintsRes = await request(app)
      .get('/api/complaints')
      .set('Authorization', `Bearer ${mysoreCitizenToken}`);

    expect(mysoreComplaintsRes.status).toBe(200);
    expect(mysoreComplaintsRes.body.data.complaints).toHaveLength(1);
    expect(mysoreComplaintsRes.body.data.complaints[0].id).toBe(complaintId);
    expect(mysoreComplaintsRes.body.data.complaints[0].tenantId).toBe('mysore-municipal-corporation');

    // Retrieve complaints as Default Citizen: should be empty (isolated)
    const defaultComplaintsRes = await request(app)
      .get('/api/complaints')
      .set('Authorization', `Bearer ${defaultCitizenToken}`);

    expect(defaultComplaintsRes.status).toBe(200);
    expect(defaultComplaintsRes.body.data.complaints).toHaveLength(0);

    // Try to get Mysore complaint directly by ID as Default Citizen: should be forbidden (403 tenant mismatch)
    const getByIdRes = await request(app)
      .get(`/api/complaints/${complaintId}`)
      .set('Authorization', `Bearer ${defaultCitizenToken}`);

    expect(getByIdRes.status).toBe(403);
    expect(getByIdRes.body.message).toContain('tenant mismatch');
  });
});
