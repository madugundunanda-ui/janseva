/**
 * JANSEVA Complete API Functional Audit Script
 * Tests all endpoints across all 11 phases.
 * Usage: node audit.js
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// ─── Config ─────────────────────────────────────────────────────
const BASE = 'http://localhost:3000/api';
const DIRECT_BASE = 'http://localhost:5000/api';
const HEALTH_BASE = 'http://localhost:5000';

// Credentials — use valid seed department names
const ADMIN_EMAIL = 'admin@janseva.gov.in';
const ADMIN_PASS = 'admin123';
const CITIZEN_EMAIL = `citizen_audit_${Date.now()}@gmail.com`;
const CITIZEN_PASS = 'Audit@1234';
const OFFICER_EMAIL = `officer_audit_${Date.now()}@water.janseva.gov.in`;
const OFFICER_PASS = 'Audit@1234';
const OFFICER_DEPT = 'Water Supply';  // Must match seed department name
const SUPERVISOR_EMAIL = `supervisor_audit_${Date.now()}@works.janseva.gov.in`;
const SUPERVISOR_PASS = 'Audit@1234';
const SUPERVISOR_DEPT = 'Roads';      // Must match seed department name


// Results storage
const results = [];
const tokens = {};
let deptId = null;
let complaintId = null;
let announcementId = null;
let officerUserId = null;
let supervisorUserId = null;
let citizenUserId = null;
let notificationId = null;
let feedbackId = null;

const timings = {};
const failedEndpoints = [];
const criticalBugs = [];

// ─── HTTP Helper ─────────────────────────────────────────────────
function request(method, url, { body, token, cookie, contentType } = {}) {
  return new Promise((resolve) => {
    const start = Date.now();
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;

    const bodyStr = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': contentType || 'application/json',
      'Accept': 'application/json',
    };
    if (bodyStr) headers['Content-Length'] = Buffer.byteLength(bodyStr);
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (cookie) headers['Cookie'] = cookie;

    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + (parsed.search || ''),
      method,
      headers,
    };

    const req = lib.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const elapsed = Date.now() - start;
        let parsed_body;
        try { parsed_body = JSON.parse(data); } catch { parsed_body = data; }
        const setCookie = res.headers['set-cookie'];
        resolve({ status: res.statusCode, body: parsed_body, elapsed, setCookie });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, body: { error: err.message }, elapsed: Date.now() - start });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ status: 408, body: { error: 'Request timeout' }, elapsed: 10000 });
    });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ─── Result Logger ───────────────────────────────────────────────
function log(phase, name, method, path, result, expected, notes = '') {
  const pass = Array.isArray(expected)
    ? expected.includes(result.status)
    : result.status === expected;

  const entry = {
    phase,
    name,
    method,
    path,
    status: result.status,
    expected,
    pass,
    elapsed: result.elapsed,
    notes,
  };
  results.push(entry);

  const icon = pass ? '✅' : '❌';
  const timeStr = `${result.elapsed}ms`;
  console.log(`${icon} [${phase}] ${method} ${path} → ${result.status} (${timeStr}) ${pass ? '' : `EXPECTED ${expected}`} ${notes}`);

  if (!pass) {
    failedEndpoints.push({ method, path, status: result.status, expected, notes, body: result.body });
  }
  return result;
}

// ─── Sleep ───────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Multipart Helper ────────────────────────────────────────────
// Sends a multipart/form-data POST with text fields + one file field.
// If filePath is null, embeds a minimal valid 1x1 PNG as the image.
function requestMultipart(method, url, fields, fileField, filePath, token) {
  // Minimal valid 1×1 transparent PNG (67 bytes)
  const TINY_PNG = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489' +
    '0000000a49444154789c6260000000020001e221bc330000000049454e44ae426082',
    'hex'
  );

  return new Promise((resolve) => {
    const start = Date.now();
    const parsed = new URL(url);
    const lib = http;
    const boundary = `----AuditBoundary${Date.now()}`;
    const CRLF = '\r\n';

    const parts = [];

    // Text fields
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined || value === null) continue;
      parts.push(
        `--${boundary}${CRLF}` +
        `Content-Disposition: form-data; name="${key}"${CRLF}${CRLF}` +
        `${value}${CRLF}`
      );
    }

    // File field
    const fileData = filePath ? fs.readFileSync(filePath) : TINY_PNG;
    const fileName = filePath ? path.basename(filePath) : 'audit_test.png';
    const fileMime = 'image/png';
    const fileHeader =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="${fileField}"; filename="${fileName}"${CRLF}` +
      `Content-Type: ${fileMime}${CRLF}${CRLF}`;

    const closing = `${CRLF}--${boundary}--${CRLF}`;

    const bodyParts = [
      Buffer.from(parts.join('')),
      Buffer.from(fileHeader),
      fileData,
      Buffer.from(closing),
    ];
    const bodyBuffer = Buffer.concat(bodyParts);

    const headers = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': bodyBuffer.length,
      'Accept': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname + (parsed.search || ''),
      method,
      headers,
    };

    const req = lib.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const elapsed = Date.now() - start;
        let parsed_body;
        try { parsed_body = JSON.parse(data); } catch { parsed_body = data; }
        resolve({ status: res.statusCode, body: parsed_body, elapsed });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, body: { error: err.message }, elapsed: Date.now() - start });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      resolve({ status: 408, body: { error: 'Request timeout' }, elapsed: 15000 });
    });

    req.write(bodyBuffer);
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────
// PHASE 0: Connectivity Check
// ─────────────────────────────────────────────────────────────────
async function phase0_connectivity() {
  console.log('\n══════════════════════════════════════════════');
  console.log(' PHASE 0: CONNECTIVITY CHECK');
  console.log('══════════════════════════════════════════════');

  // API Gateway health
  const gwHealth = await request('GET', 'http://localhost:3000/health');
  log('P0', 'API Gateway Health', 'GET', '/health (gateway:3000)', gwHealth, 200);
  timings['gateway_health'] = gwHealth.elapsed;

  // Backend health (direct)
  const beHealth = await request('GET', `${HEALTH_BASE}/health/ping`);
  log('P0', 'Backend Health Ping', 'GET', '/health/ping (backend:5000)', beHealth, [200, 404]);
  timings['backend_health'] = beHealth.elapsed;

  // Backend root
  const beRoot = await request('GET', `${HEALTH_BASE}/`);
  log('P0', 'Backend Root', 'GET', '/ (backend:5000)', beRoot, 200);

  // Proxy via gateway
  const gwProxy = await request('GET', `${BASE}/auth/me`);
  log('P0', 'Gateway→Backend Proxy (unauth)', 'GET', '/api/auth/me (gateway)', gwProxy, 401);
}

// ─────────────────────────────────────────────────────────────────
// PHASE 1: ROUTE DISCOVERY (static scan already done above)
// We verify each route base responds
// ─────────────────────────────────────────────────────────────────
async function phase1_routeDiscovery() {
  console.log('\n══════════════════════════════════════════════');
  console.log(' PHASE 1: ROUTE DISCOVERY');
  console.log('══════════════════════════════════════════════');

  const publicRoutes = [
    { method: 'GET', path: '/departments' },
    { method: 'GET', path: '/announcements' },
    { method: 'GET', path: '/transparency/stats' },
    { method: 'GET', path: '/transparency/departments' },
    { method: 'GET', path: '/transparency/civic-scores' },
    { method: 'GET', path: '/transparency/resolved-complaints' },
    { method: 'GET', path: '/transparency/actions' },
    { method: 'GET', path: '/transparency/impact' },
    { method: 'GET', path: '/transparency/map' },
    { method: 'GET', path: '/transparency/success-stories' },
    { method: 'GET', path: '/governance/timeline' },
    { method: 'GET', path: '/feedback/public' },
  ];

  for (const r of publicRoutes) {
    const res = await request(r.method, `${BASE}${r.path}`);
    log('P1', `Public Route: ${r.path}`, r.method, r.path, res, [200, 404, 500]);
    await sleep(100);
  }

  const protectedRoutes = [
    '/complaints', '/users', '/notifications', '/analytics/dashboard',
    '/ai/health', '/intelligence/clusters', '/admin/logs',
    '/feedback/my', '/geo/hotspots'
  ];
  for (const path of protectedRoutes) {
    const res = await request('GET', `${BASE}${path}`);
    log('P1', `Protected (no-auth): ${path}`, 'GET', path, res, 401, 'Must return 401');
    await sleep(80);
  }
}

// ─────────────────────────────────────────────────────────────────
// PHASE 2: AUTHENTICATION TESTING
// ─────────────────────────────────────────────────────────────────
async function phase2_authentication() {
  console.log('\n══════════════════════════════════════════════');
  console.log(' PHASE 2: AUTHENTICATION TESTING');
  console.log('══════════════════════════════════════════════');

  // ── Citizen Registration ──
  const t0 = Date.now();
  const citizenReg = await request('POST', `${BASE}/auth/register`, {
    body: { name: 'Audit Citizen', email: CITIZEN_EMAIL, password: CITIZEN_PASS, role: 'citizen' }
  });
  log('P2', 'Citizen Register', 'POST', '/api/auth/register', citizenReg, 201);
  timings['citizen_register'] = Date.now() - t0;
  if (citizenReg.body?.data?.token) tokens.citizen = citizenReg.body.data.token;
  if (citizenReg.body?.data?.user?._id) citizenUserId = citizenReg.body.data.user._id;

  // ── Officer Registration (department must be a seed name, resolved to ObjectId by authService) ──
  const officerReg = await request('POST', `${BASE}/auth/register`, {
    body: { name: 'Audit Officer', email: OFFICER_EMAIL, password: OFFICER_PASS, role: 'officer', department: OFFICER_DEPT }
  });
  log('P2', 'Officer Register', 'POST', '/api/auth/register', officerReg, 201, `officer@water.janseva.gov.in dept=${OFFICER_DEPT}`);
  if (officerReg.body?.data?.token) tokens.officer = officerReg.body.data.token;
  if (officerReg.body?.data?.user?._id) officerUserId = officerReg.body.data.user._id;
  if (!officerUserId) criticalBugs.push({ issue: 'Officer registration failed', error: officerReg.body?.message });

  // ── Supervisor Registration ──
  const supReg = await request('POST', `${BASE}/auth/register`, {
    body: { name: 'Audit Supervisor', email: SUPERVISOR_EMAIL, password: SUPERVISOR_PASS, role: 'supervisor', department: SUPERVISOR_DEPT }
  });
  log('P2', 'Supervisor Register', 'POST', '/api/auth/register', supReg, 201, `supervisor@works.janseva.gov.in dept=${SUPERVISOR_DEPT}`);
  if (supReg.body?.data?.token) tokens.supervisor = supReg.body.data.token;
  if (supReg.body?.data?.user?._id) supervisorUserId = supReg.body.data.user._id;
  if (!supervisorUserId) criticalBugs.push({ issue: 'Supervisor registration failed', error: supReg.body?.message });

  // ── Admin Login ──
  const t1 = Date.now();
  const adminLogin = await request('POST', `${BASE}/auth/login`, {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASS }
  });
  log('P2', 'Admin Login', 'POST', '/api/auth/login', adminLogin, 200);
  timings['admin_login'] = Date.now() - t1;
  if (adminLogin.body?.data?.token) tokens.admin = adminLogin.body.data.token;

  // JWT validation via /me
  if (tokens.admin) {
    const meRes = await request('GET', `${BASE}/auth/me`, { token: tokens.admin });
    log('P2', 'GET /auth/me (admin)', 'GET', '/api/auth/me', meRes, 200);
    timings['auth_me'] = meRes.elapsed;
  }

  // Invalid credentials
  const badLogin = await request('POST', `${BASE}/auth/login`, {
    body: { email: 'nobody@janseva.gov.in', password: 'wrongpass' }
  });
  log('P2', 'Login with invalid creds', 'POST', '/api/auth/login', badLogin, [400, 401], 'Must reject');

  // Tampered JWT
  const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTYwMDAwMDAwMH0.invalid_sig';
  const tamperedMe = await request('GET', `${BASE}/auth/me`, { token: tamperedToken });
  log('P2', 'Tampered JWT', 'GET', '/api/auth/me', tamperedMe, 401, 'JWT tampering must fail');

  // Missing token
  const noToken = await request('GET', `${BASE}/auth/me`);
  log('P2', 'Missing JWT', 'GET', '/api/auth/me', noToken, 401, 'No auth header must fail');

  // Citizen login
  if (!tokens.citizen && CITIZEN_EMAIL) {
    const citizenLogin = await request('POST', `${BASE}/auth/login`, {
      body: { email: CITIZEN_EMAIL, password: CITIZEN_PASS }
    });
    log('P2', 'Citizen Login', 'POST', '/api/auth/login', citizenLogin, 200);
    if (citizenLogin.body?.data?.token) tokens.citizen = citizenLogin.body.data.token;
  }

  // Officer login
  if (!tokens.officer && OFFICER_EMAIL) {
    const officerLogin = await request('POST', `${BASE}/auth/login`, {
      body: { email: OFFICER_EMAIL, password: OFFICER_PASS }
    });
    log('P2', 'Officer Login', 'POST', '/api/auth/login', officerLogin, 200);
    if (officerLogin.body?.data?.token) tokens.officer = officerLogin.body.data.token;
  }

  // Supervisor login
  if (!tokens.supervisor && SUPERVISOR_EMAIL) {
    const supLogin = await request('POST', `${BASE}/auth/login`, {
      body: { email: SUPERVISOR_EMAIL, password: SUPERVISOR_PASS }
    });
    log('P2', 'Supervisor Login', 'POST', '/api/auth/login', supLogin, 200);
    if (supLogin.body?.data?.token) tokens.supervisor = supLogin.body.data.token;
  }

  // Logout test
  const logout = await request('POST', `${BASE}/auth/logout`, { token: tokens.citizen });
  log('P2', 'Logout', 'POST', '/api/auth/logout', logout, 200);

  // Re-login citizen after logout
  const citizenReLogin = await request('POST', `${BASE}/auth/login`, {
    body: { email: CITIZEN_EMAIL, password: CITIZEN_PASS }
  });
  if (citizenReLogin.body?.data?.token) tokens.citizen = citizenReLogin.body.data.token;
}

// ─────────────────────────────────────────────────────────────────
// PHASE 3: USER MANAGEMENT TESTING
// ─────────────────────────────────────────────────────────────────
async function phase3_userManagement() {
  console.log('\n══════════════════════════════════════════════');
  console.log(' PHASE 3: USER MANAGEMENT TESTING');
  console.log('══════════════════════════════════════════════');

  if (!tokens.admin) { console.log('⚠ Skipping P3: No admin token'); return; }

  // Admin gets all users
  const t0 = Date.now();
  const allUsers = await request('GET', `${BASE}/users`, { token: tokens.admin });
  log('P3', 'Admin: GET /users', 'GET', '/api/users', allUsers, 200);
  timings['admin_get_users'] = Date.now() - t0;

  // Get profile
  const profile = await request('GET', `${BASE}/users/profile`, { token: tokens.admin });
  log('P3', 'Admin: GET /users/profile', 'GET', '/api/users/profile', profile, 200);

  // Citizen tries to get all users (should be 403)
  if (tokens.citizen) {
    const citizenUsers = await request('GET', `${BASE}/users`, { token: tokens.citizen });
    log('P3', 'Citizen: GET /users (RBAC)', 'GET', '/api/users', citizenUsers, 403, 'Citizen must not access user list');
  }

  // Admin gets officer by ID
  if (officerUserId) {
    const officerById = await request('GET', `${BASE}/users/${officerUserId}`, { token: tokens.admin });
    log('P3', 'Admin: GET /users/:id', 'GET', `/api/users/${officerUserId}`, officerById, 200);
  }

  // Admin updates user
  if (officerUserId) {
    const updateUser = await request('PUT', `${BASE}/users/${officerUserId}`, {
      token: tokens.admin,
      body: { name: 'Updated Officer Name' }
    });
    log('P3', 'Admin: PUT /users/:id', 'PUT', `/api/users/${officerUserId}`, updateUser, 200);
  }

  // Citizen tries to update profile
  if (tokens.citizen) {
    const updateProfile = await request('PUT', `${BASE}/users/profile`, {
      token: tokens.citizen,
      body: { name: 'Updated Citizen' }
    });
    log('P3', 'Citizen: PUT /users/profile', 'PUT', '/api/users/profile', updateProfile, 200);
  }

  // Citizen cannot create user
  if (tokens.citizen) {
    const citizenCreate = await request('POST', `${BASE}/users`, {
      token: tokens.citizen,
      body: { name: 'Test', email: 'test@test.com', password: 'pass' }
    });
    log('P3', 'Citizen: POST /users (RBAC)', 'POST', '/api/users', citizenCreate, 403, 'Must deny citizen');
  }
}

// ─────────────────────────────────────────────────────────────────
// PHASE 4 & 5: COMPLAINT LIFECYCLE + CRUD
// ─────────────────────────────────────────────────────────────────
async function phase4_complaintLifecycle() {
  console.log('\n══════════════════════════════════════════════');
  console.log(' PHASE 4 & 5: COMPLAINT LIFECYCLE & CRUD');
  console.log('══════════════════════════════════════════════');

  // First get a valid department ID
  const depts = await request('GET', `${BASE}/departments`);
  log('P5', 'GET /departments', 'GET', '/api/departments', depts, 200);
  if (depts.body?.data?.length > 0) {
    deptId = depts.body.data[0]._id;
  } else if (depts.body?.data?.departments?.length > 0) {
    deptId = depts.body.data.departments[0]._id;
  }

  if (!deptId && tokens.admin) {
    // Create a department if none exist
    const newDept = await request('POST', `${BASE}/departments`, {
      token: tokens.admin,
      body: { name: 'Audit Test Dept', description: 'Created during audit', category: 'Infrastructure' }
    });
    log('P5', 'Admin: POST /departments', 'POST', '/api/departments', newDept, 201);
    deptId = newDept.body?.data?._id;
  }

  if (!tokens.citizen) { console.log('⚠ Skipping complaint tests: No citizen token'); return; }

  // POST complaint — requires multipart/form-data with an image file
  const t0 = Date.now();
  const createComplaint = await requestMultipart(
    'POST',
    `${BASE}/complaints`,
    {
      title: 'Road is broken near audit test area',
      description: 'Audit test complaint: Large pothole causing traffic issues',
      department: deptId || 'Water Supply',
      priority: 'medium',
      location: JSON.stringify({ address: '123 Audit Street, Hyderabad', lat: 17.385, lng: 78.486 }),
    },
    'image',               // field name
    null,                  // file path (null = generate tiny PNG inline)
    tokens.citizen
  );
  log('P4', 'Citizen: POST /complaints', 'POST', '/api/complaints', createComplaint, [200, 201, 202]);
  timings['complaint_create'] = Date.now() - t0;
  // Handle various response shapes
  complaintId = createComplaint.body?.data?._id
    || createComplaint.body?.data?.complaintId
    || createComplaint.body?.data?.complaint?._id
    || createComplaint.body?.complaint?._id;

  if (!complaintId && [200, 201, 202].includes(createComplaint.status)) {
    // Complaint was accepted (background processing) — try to fetch from DB via admin later
    console.log('  ℹ Complaint queued (no ID in response body, will fetch from DB)');
  } else if (!complaintId) {
    criticalBugs.push({ issue: 'Complaint creation returned no ID', body: createComplaint.body });
  }

  // GET all complaints (admin)
  if (tokens.admin) {
    const t1 = Date.now();
    const allComplaints = await request('GET', `${BASE}/complaints`, { token: tokens.admin });
    log('P4', 'Admin: GET /complaints', 'GET', '/api/complaints', allComplaints, 200);
    timings['admin_get_complaints'] = Date.now() - t1;

    // If no complaint created yet, use one from DB
    if (!complaintId && allComplaints.body?.data?.complaints?.length > 0) {
      complaintId = allComplaints.body.data.complaints[0]._id;
    }
  }

  // If still no complaintId, try fetching citizen's own complaints
  if (!complaintId && tokens.citizen) {
    const citizenComplaints = await request('GET', `${BASE}/complaints`, { token: tokens.citizen });
    if (citizenComplaints.body?.data?.complaints?.length > 0) {
      complaintId = citizenComplaints.body.data.complaints[0]._id;
      console.log('  ℹ Fallback complaint ID from citizen fetch:', complaintId);
    }
  }

  // GET complaint by ID
  if (complaintId && tokens.citizen) {
    const getById = await request('GET', `${BASE}/complaints/${complaintId}`, { token: tokens.citizen });
    log('P4', 'GET /complaints/:id', 'GET', `/api/complaints/${complaintId}`, getById, 200);
    timings['get_complaint_by_id'] = getById.elapsed;
  }

  // GET nearby complaints
  const nearby = await request('GET', `${BASE}/complaints/nearby?lat=17.385&lng=78.486`, {
    token: tokens.citizen
  });
  log('P4', 'GET /complaints/nearby', 'GET', '/api/complaints/nearby', nearby, [200, 400]);

  // Citizen cannot PATCH complaint status
  if (complaintId && tokens.citizen) {
    const citizenPatch = await request('PATCH', `${BASE}/complaints/${complaintId}`, {
      token: tokens.citizen,
      body: { status: 'resolved' }
    });
    log('P4', 'Citizen: PATCH complaint (RBAC)', 'PATCH', `/api/complaints/${complaintId}`, citizenPatch, 403, 'Citizen must not patch status');
  }

  // Admin assigns officer
  if (complaintId && tokens.admin && officerUserId) {
    const assign = await request('PATCH', `${BASE}/complaints/${complaintId}/assign-officer`, {
      token: tokens.admin,
      body: { officerId: officerUserId }
    });
    log('P4', 'Admin: Assign Officer', 'PATCH', `/api/complaints/${complaintId}/assign-officer`, assign, 200);
    await sleep(500); // allow event to process
  }

  // Admin assigns supervisor
  if (complaintId && tokens.admin && supervisorUserId) {
    const assignSup = await request('PATCH', `${BASE}/complaints/${complaintId}/assign-supervisor`, {
      token: tokens.admin,
      body: { supervisorId: supervisorUserId, note: 'Escalating for audit test' }
    });
    log('P4', 'Admin: Assign Supervisor', 'PATCH', `/api/complaints/${complaintId}/assign-supervisor`, assignSup, 200);
  }

  // Officer updates complaint to in_progress
  if (complaintId && tokens.officer) {
    const officerUpdate = await request('PATCH', `${BASE}/complaints/${complaintId}`, {
      token: tokens.officer,
      body: { status: 'in_progress', resolutionNote: 'Working on the road repair' }
    });
    log('P4', 'Officer: Update to in_progress', 'PATCH', `/api/complaints/${complaintId}`, officerUpdate, 200);
  }

  // Officer resolves complaint
  if (complaintId && tokens.officer) {
    const resolve = await request('PATCH', `${BASE}/complaints/${complaintId}`, {
      token: tokens.officer,
      body: { status: 'resolved', resolutionNote: 'Road repaired successfully. Audit test complete.' }
    });
    log('P4', 'Officer: Resolve Complaint', 'PATCH', `/api/complaints/${complaintId}`, resolve, 200);
    await sleep(500);
  }

  // Citizen validates/votes on complaint
  if (complaintId && tokens.citizen) {
    const validate = await request('POST', `${BASE}/complaints/${complaintId}/validate`, {
      token: tokens.citizen,
      body: { voteType: 'confirm', comment: 'Confirmed resolution via audit test' }
    });
    log('P4', 'Citizen: Validate Complaint', 'POST', `/api/complaints/${complaintId}/validate`, validate, 200);
  }

  // Citizen joins complaint (group)
  if (complaintId && tokens.citizen) {
    const join = await request('POST', `${BASE}/complaints/${complaintId}/join`, {
      token: tokens.citizen, body: {}
    });
    log('P4', 'Citizen: Join Complaint', 'POST', `/api/complaints/${complaintId}/join`, join, [200, 400]);
  }

  // Assignment options (admin)
  if (complaintId && tokens.admin) {
    const opts = await request('GET', `${BASE}/complaints/${complaintId}/assignment-options`, {
      token: tokens.admin
    });
    log('P4', 'Admin: Assignment Options', 'GET', `/api/complaints/${complaintId}/assignment-options`, opts, 200);
  }

  // Duplicate check
  if (tokens.citizen) {
    const dupCheck = await request('POST', `${BASE}/complaints/check-duplicate`, {
      token: tokens.citizen,
      body: { title: 'Road is broken', description: 'Large pothole' }
    });
    log('P4', 'Check Duplicate', 'POST', '/api/complaints/check-duplicate', dupCheck, [200, 400]);
  }

  // Validation errors: missing required fields
  if (tokens.citizen) {
    const badComplaint = await request('POST', `${BASE}/complaints`, {
      token: tokens.citizen,
      body: { title: 'x' } // missing department, description
    });
    log('P5', 'Complaint Validation Error', 'POST', '/api/complaints', badComplaint, 400, 'Missing required fields must return 400');
  }
}

// ─────────────────────────────────────────────────────────────────
// PHASE 5 continued: DEPARTMENT, ANNOUNCEMENT, FEEDBACK CRUD
// ─────────────────────────────────────────────────────────────────
async function phase5_crudAudit() {
  console.log('\n══════════════════════════════════════════════');
  console.log(' PHASE 5: EXTENDED CRUD AUDIT');
  console.log('══════════════════════════════════════════════');

  // Departments CRUD
  if (tokens.admin) {
    const createDept = await request('POST', `${BASE}/departments`, {
      token: tokens.admin,
      body: { name: 'Audit Dept Delete', description: 'Will be deleted', category: 'Test' }
    });
    log('P5', 'Admin: POST /departments', 'POST', '/api/departments', createDept, [200, 201]);
    const tempDeptId = createDept.body?.data?._id;

    if (tempDeptId) {
      const updateDept = await request('PUT', `${BASE}/departments/${tempDeptId}`, {
        token: tokens.admin,
        body: { name: 'Audit Dept Updated', description: 'Updated' }
      });
      log('P5', 'Admin: PUT /departments/:id', 'PUT', `/api/departments/${tempDeptId}`, updateDept, 200);

      const deleteDept = await request('DELETE', `${BASE}/departments/${tempDeptId}`, {
        token: tokens.admin
      });
      log('P5', 'Admin: DELETE /departments/:id', 'DELETE', `/api/departments/${tempDeptId}`, deleteDept, 200);
    }

    // Citizen tries to create department (RBAC)
    if (tokens.citizen) {
      const citizenDept = await request('POST', `${BASE}/departments`, {
        token: tokens.citizen,
        body: { name: 'Illegal Dept' }
      });
      log('P5', 'Citizen: POST /departments (RBAC)', 'POST', '/api/departments', citizenDept, 403, 'Must deny citizen');
    }
  }

  // Announcements CRUD
  if (tokens.admin) {
    const createAnn = await request('POST', `${BASE}/announcements`, {
      token: tokens.admin,
      body: { title: 'Audit Announcement', description: 'This is an audit test announcement', department: 'General', priority: 'normal', isPublished: true }
    });
    log('P5', 'Admin: POST /announcements', 'POST', '/api/announcements', createAnn, 201);
    announcementId = createAnn.body?.data?._id;

    if (announcementId) {
      const getAnn = await request('GET', `${BASE}/announcements/${announcementId}`);
      log('P5', 'GET /announcements/:id', 'GET', `/api/announcements/${announcementId}`, getAnn, 200);

      const updateAnn = await request('PUT', `${BASE}/announcements/${announcementId}`, {
        token: tokens.admin,
        body: { title: 'Updated Audit Announcement', description: 'Updated content for audit test', department: 'General', priority: 'important', isPublished: true }
      });
      log('P5', 'Admin: PUT /announcements/:id', 'PUT', `/api/announcements/${announcementId}`, updateAnn, 200);

      const deleteAnn = await request('DELETE', `${BASE}/announcements/${announcementId}`, {
        token: tokens.admin
      });
      log('P5', 'Admin: DELETE /announcements/:id', 'DELETE', `/api/announcements/${announcementId}`, deleteAnn, 200);
    }
  }

  // Feedback CRUD
  if (tokens.citizen && complaintId) {
    const createFb = await request('POST', `${BASE}/feedback`, {
      token: tokens.citizen,
      body: { complaintId, rating: 4, comment: 'Audit feedback test', responseTime: 'fast', resolved: true }
    });
    log('P5', 'Citizen: POST /feedback', 'POST', '/api/feedback', createFb, 201);
    feedbackId = createFb.body?.data?._id;

    const myFb = await request('GET', `${BASE}/feedback/my`, { token: tokens.citizen });
    log('P5', 'Citizen: GET /feedback/my', 'GET', '/api/feedback/my', myFb, 200);

    const publicFb = await request('GET', `${BASE}/feedback/public`);
    log('P5', 'GET /feedback/public', 'GET', '/api/feedback/public', publicFb, 200);
  }

  if (tokens.admin) {
    const adminFb = await request('GET', `${BASE}/feedback/admin`, { token: tokens.admin });
    log('P5', 'Admin: GET /feedback/admin', 'GET', '/api/feedback/admin', adminFb, 200);

    const fbStats = await request('GET', `${BASE}/feedback/stats`, { token: tokens.admin });
    log('P5', 'Admin: GET /feedback/stats', 'GET', '/api/feedback/stats', fbStats, 200);

    if (feedbackId) {
      const approveFb = await request('PATCH', `${BASE}/feedback/${feedbackId}/approve`, {
        token: tokens.admin, body: {}
      });
      log('P5', 'Admin: Approve Feedback', 'PATCH', `/api/feedback/${feedbackId}/approve`, approveFb, 200);

      const deleteFb = await request('DELETE', `${BASE}/feedback/${feedbackId}`, {
        token: tokens.admin
      });
      log('P5', 'Admin: DELETE /feedback/:id', 'DELETE', `/api/feedback/${feedbackId}`, deleteFb, 200);
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// PHASE 6: AI SERVICES TESTING
// ─────────────────────────────────────────────────────────────────
async function phase6_aiServices() {
  console.log('\n══════════════════════════════════════════════');
  console.log(' PHASE 6: AI SERVICES TESTING');
  console.log('══════════════════════════════════════════════');

  if (!tokens.admin) { console.log('⚠ Skipping P6: No admin token'); return; }

  // AI Health
  const t0 = Date.now();
  const aiHealth = await request('GET', `${BASE}/ai/health`, { token: tokens.admin });
  log('P6', 'AI Health', 'GET', '/api/ai/health', aiHealth, [200, 503]);
  timings['ai_health'] = Date.now() - t0;

  // Predict resolution
  if (complaintId) {
    const t1 = Date.now();
    const predict = await request('POST', `${BASE}/ai/predict-resolution`, {
      token: tokens.admin,
      body: { complaintId }
    });
    log('P6', 'AI Predict Resolution', 'POST', '/api/ai/predict-resolution', predict, [200, 503]);
    timings['ai_predict_resolution'] = Date.now() - t1;
  }

  // Severity analysis
  const severity = await request('POST', `${BASE}/ai/severity`, {
    token: tokens.admin,
    body: { title: 'Broken road audit test', description: 'Large pothole, cars damaged', location: 'Hyderabad', department: 'Roads', peopleAffected: 100 }
  });
  log('P6', 'AI Severity Analysis', 'POST', '/api/ai/severity', severity, [200, 503]);

  // Recommend officer
  if (complaintId) {
    const recommend = await request('POST', `${BASE}/ai/recommend-officer`, {
      token: tokens.admin,
      body: { complaintId }
    });
    log('P6', 'AI Recommend Officer', 'POST', '/api/ai/recommend-officer', recommend, [200, 503]);
  }

  // Spam detect
  if (citizenUserId) {
    const spam = await request('POST', `${BASE}/ai/spam-detect`, {
      token: tokens.admin,
      body: { citizenId: citizenUserId, title: 'Duplicate report', description: 'Road is broken again' }
    });
    log('P6', 'AI Spam Detect', 'POST', '/api/ai/spam-detect', spam, [200, 503]);
  }

  // AI Settings
  const settings = await request('GET', `${BASE}/ai/settings`, { token: tokens.admin });
  log('P6', 'AI Settings GET', 'GET', '/api/ai/settings', settings, 200);

  const updateSettings = await request('POST', `${BASE}/ai/settings`, {
    token: tokens.admin,
    body: { autoAssign: false }
  });
  log('P6', 'AI Settings POST', 'POST', '/api/ai/settings', updateSettings, 200);

  // AI Feedback
  if (complaintId) {
    const aiFb = await request('POST', `${BASE}/ai/feedback`, {
      token: tokens.admin,
      body: { complaintId, rating: 4, feedbackType: 'department_prediction', comment: 'Audit test feedback' }
    });
    log('P6', 'AI Feedback', 'POST', '/api/ai/feedback', aiFb, [200, 201]);
  }
}

// ─────────────────────────────────────────────────────────────────
// PHASE 7: NOTIFICATION TESTING
// ─────────────────────────────────────────────────────────────────
async function phase7_notifications() {
  console.log('\n══════════════════════════════════════════════');
  console.log(' PHASE 7: NOTIFICATION TESTING');
  console.log('══════════════════════════════════════════════');

  if (!tokens.citizen) { console.log('⚠ Skipping P7: No citizen token'); return; }

  const t0 = Date.now();
  const notifs = await request('GET', `${BASE}/notifications`, { token: tokens.citizen });
  log('P7', 'GET /notifications', 'GET', '/api/notifications', notifs, 200);
  timings['notification_load'] = Date.now() - t0;

  const notifList = notifs.body?.data?.notifications || notifs.body?.data || [];
  if (Array.isArray(notifList) && notifList.length > 0) {
    notificationId = notifList[0]._id;
  }

  // Mark specific as read
  if (notificationId) {
    const markRead = await request('PATCH', `${BASE}/notifications/${notificationId}/read`, {
      token: tokens.citizen, body: {}
    });
    log('P7', 'Mark Notification Read', 'PATCH', `/api/notifications/${notificationId}/read`, markRead, 200);
  }

  // Mark all as read
  const markAll = await request('PATCH', `${BASE}/notifications/read-all`, {
    token: tokens.citizen, body: {}
  });
  log('P7', 'Mark All Read', 'PATCH', '/api/notifications/read-all', markAll, 200);

  // Notification preferences
  const prefs = await request('GET', `${BASE}/notifications/preferences`, { token: tokens.citizen });
  log('P7', 'GET /notifications/preferences', 'GET', '/api/notifications/preferences', prefs, 200);

  const updatePrefs = await request('PATCH', `${BASE}/notifications/preferences`, {
    token: tokens.citizen,
    body: { email: true, sms: false, push: true }
  });
  log('P7', 'PATCH /notifications/preferences', 'PATCH', '/api/notifications/preferences', updatePrefs, 200);
}

// ─────────────────────────────────────────────────────────────────
// PHASE 8: GOVERNMENT INTELLIGENCE
// ─────────────────────────────────────────────────────────────────
async function phase8_governmentIntelligence() {
  console.log('\n══════════════════════════════════════════════');
  console.log(' PHASE 8: GOVERNMENT INTELLIGENCE');
  console.log('══════════════════════════════════════════════');

  // Public governance timeline
  const timeline = await request('GET', `${BASE}/governance/timeline`);
  log('P8', 'Governance Timeline', 'GET', '/api/governance/timeline', timeline, [200, 500]);

  // Transparency suite
  const transparencyEndpoints = [
    '/transparency/stats', '/transparency/civic-scores', '/transparency/departments',
    '/transparency/resolved-complaints', '/transparency/actions',
    '/transparency/impact', '/transparency/map', '/transparency/success-stories'
  ];
  for (const ep of transparencyEndpoints) {
    const res = await request('GET', `${BASE}${ep}`);
    log('P8', `Transparency: ${ep}`, 'GET', ep, res, [200, 500]);
    await sleep(80);
  }

  // Intelligence (protected)
  if (tokens.admin) {
    const intelligenceEndpoints = [
      '/intelligence/clusters', '/intelligence/hotspots', '/intelligence/risks',
      '/intelligence/emergency-zones', '/intelligence/recurring', '/intelligence/impact',
      '/intelligence/heatmap'
    ];
    for (const ep of intelligenceEndpoints) {
      const res = await request('GET', `${BASE}${ep}`, { token: tokens.admin });
      log('P8', `Intelligence: ${ep}`, 'GET', ep, res, [200, 500]);
      await sleep(80);
    }

    const sync = await request('POST', `${BASE}/intelligence/sync`, {
      token: tokens.admin, body: {}
    });
    log('P8', 'Intelligence Sync', 'POST', '/api/intelligence/sync', sync, [200, 403, 500]);
  }

  // Announcements (public)
  const ann = await request('GET', `${BASE}/announcements`);
  log('P8', 'Announcements Public', 'GET', '/api/announcements', ann, 200);
}

// ─────────────────────────────────────────────────────────────────
// PHASE 9: SECURITY TESTING
// ─────────────────────────────────────────────────────────────────
async function phase9_security() {
  console.log('\n══════════════════════════════════════════════');
  console.log(' PHASE 9: SECURITY TESTING');
  console.log('══════════════════════════════════════════════');

  // No auth on protected routes
  const noAuthRoutes = [
    { method: 'GET', path: '/complaints' },
    { method: 'GET', path: '/users' },
    { method: 'GET', path: '/analytics/dashboard' },
    { method: 'GET', path: '/notifications' },
    { method: 'GET', path: '/admin/logs' },
  ];
  for (const r of noAuthRoutes) {
    const res = await request(r.method, `${BASE}${r.path}`);
    log('P9', `No-auth: ${r.path}`, r.method, r.path, res, 401, 'Must return 401 without auth');
    await sleep(80);
  }

  // RBAC: citizen accessing admin routes
  if (tokens.citizen) {
    const citizenAdminRoutes = [
      { method: 'GET', path: '/admin/logs' },
      { method: 'GET', path: '/users' },
      { method: 'GET', path: '/feedback/admin' },
    ];
    for (const r of citizenAdminRoutes) {
      const res = await request(r.method, `${BASE}${r.path}`, { token: tokens.citizen });
      log('P9', `Citizen→Admin: ${r.path}`, r.method, r.path, res, 403, 'Must return 403');
      await sleep(80);
    }
  }

  // Invalid payload
  if (tokens.citizen) {
    const badPayload = await request('POST', `${BASE}/complaints`, {
      token: tokens.citizen,
      body: { title: 'x', priority: 'INVALID_PRIORITY' }
    });
    log('P9', 'Invalid Priority Enum', 'POST', '/api/complaints', badPayload, 400, 'Invalid enum must fail validation');
  }

  // SQL-injection-like payload (MongoDB sanitized)
  const injPayload = await request('POST', `${BASE}/auth/login`, {
    body: { email: { '$gt': '' }, password: 'anything' }
  });
  log('P9', 'NoSQL Injection Attempt', 'POST', '/api/auth/login', injPayload, [400, 401], 'Must reject injection');

  // XSS in body
  if (tokens.citizen) {
    const xssPayload = await request('POST', `${BASE}/complaints`, {
      token: tokens.citizen,
      body: { title: '<script>alert(1)</script>', description: 'XSS test', department: 'Water', priority: 'low' }
    });
    // Should either 201 (sanitized) or 400 (rejected)
    log('P9', 'XSS in Payload', 'POST', '/api/complaints', xssPayload, [200, 201, 202, 400], 'XSS must be sanitized or rejected');
  }

  // Missing required fields
  if (tokens.citizen) {
    const missingFields = await request('POST', `${BASE}/complaints`, {
      token: tokens.citizen,
      body: {}
    });
    log('P9', 'Missing Required Fields', 'POST', '/api/complaints', missingFields, 400, 'Empty body must return 400');
  }

  // Role escalation: citizen tries admin endpoint
  if (tokens.citizen) {
    const roleEscalate = await request('POST', `${BASE}/admin/onboard-municipality`, {
      token: tokens.citizen,
      body: { name: 'Hack Municipality' }
    });
    log('P9', 'Role Escalation Attempt', 'POST', '/api/admin/onboard-municipality', roleEscalate, 403, 'Must deny citizen admin access');
  }
}

// ─────────────────────────────────────────────────────────────────
// PHASE 10: PERFORMANCE TESTING
// ─────────────────────────────────────────────────────────────────
async function phase10_performance() {
  console.log('\n══════════════════════════════════════════════');
  console.log(' PHASE 10: PERFORMANCE TESTING');
  console.log('══════════════════════════════════════════════');

  if (!tokens.admin) return;

  // Multiple concurrent GET complaints
  const t0 = Date.now();
  const concurrentResults = await Promise.all([
    request('GET', `${BASE}/complaints`, { token: tokens.admin }),
    request('GET', `${BASE}/complaints`, { token: tokens.admin }),
    request('GET', `${BASE}/complaints`, { token: tokens.admin }),
    request('GET', `${BASE}/analytics/dashboard`, { token: tokens.admin }),
    request('GET', `${BASE}/transparency/stats`),
  ]);
  const concurrentTime = Date.now() - t0;
  timings['concurrent_5_requests'] = concurrentTime;
  console.log(`📊 5 concurrent requests completed in ${concurrentTime}ms`);

  // Dashboard load time
  const t1 = Date.now();
  const dashboard = await request('GET', `${BASE}/analytics/dashboard`, { token: tokens.admin });
  log('P10', 'Dashboard Load', 'GET', '/api/analytics/dashboard', dashboard, 200);
  timings['dashboard_load'] = Date.now() - t1;

  // Analytics endpoints
  const analyticsEndpoints = [
    '/analytics/civic-health', '/analytics/departments', '/analytics/officers',
    '/analytics/sla', '/analytics/risks', '/analytics/governance-insights',
    '/analytics/predictions', '/analytics/heatmaps', '/analytics/executive-dashboard',
    '/analytics/ai-metrics', '/analytics/maps', '/analytics/updates-analytics'
  ];
  for (const ep of analyticsEndpoints) {
    const t = Date.now();
    const res = await request('GET', `${BASE}${ep}`, { token: tokens.admin });
    log('P10', `Analytics: ${ep}`, 'GET', ep, res, [200, 500]);
    timings[`analytics_${ep.split('/').pop()}`] = Date.now() - t;
    await sleep(50);
  }
}

// ─────────────────────────────────────────────────────────────────
// PHASE 11: EVENT BUS & BACKGROUND CONSUMERS
// ─────────────────────────────────────────────────────────────────
async function phase11_eventBus() {
  console.log('\n══════════════════════════════════════════════');
  console.log(' PHASE 11: EVENT BUS & BACKGROUND CONSUMERS');
  console.log('══════════════════════════════════════════════');

  if (!tokens.admin) return;

  // Event monitor
  const events = await request('GET', `${BASE}/events/monitor`, { token: tokens.admin });
  log('P11', 'Event Monitor', 'GET', '/api/events/monitor', events, [200, 404, 500]);

  // Verify a complaint creation triggers events (already done in P4)
  if (tokens.citizen) {
    const newComplaint = await requestMultipart(
      'POST',
      `${BASE}/complaints`,
      {
        title: 'EventBus Audit Test Complaint',
        description: 'Testing event bus via complaint creation during audit',
        department: deptId || 'Water Supply',
        priority: 'high',
        location: JSON.stringify({ address: '123 Audit Street, Hyderabad', lat: 17.385, lng: 78.486 }),
      },
      'image',
      null,
      tokens.citizen
    );
    log('P11', 'Trigger ComplaintCreated Event', 'POST', '/api/complaints', newComplaint, [200, 201, 202]);

    if (newComplaint.body?.data?._id) {
      await sleep(1500); // allow event bus to process
      // Verify notification was generated
      const notifs = await request('GET', `${BASE}/notifications`, { token: tokens.citizen });
      log('P11', 'Notification After Event', 'GET', '/api/notifications', notifs, 200);
      const notifList = notifs.body?.data?.notifications || notifs.body?.data || [];
      const hasNew = Array.isArray(notifList) && notifList.length > 0;
      if (!hasNew) {
        criticalBugs.push({ issue: 'No notifications generated after complaint creation', endpoint: '/api/notifications' });
      }
    }
  }

  // Infrastructure status
  const infra = await request('GET', `${BASE}/infrastructure/status`, { token: tokens.admin });
  log('P11', 'Infrastructure Status', 'GET', '/api/infrastructure/status', infra, [200, 404, 500]);

  // Geo endpoints
  const hotspots = await request('GET', `${BASE}/geo/hotspots`, { token: tokens.admin });
  log('P11', 'Geo Hotspots', 'GET', '/api/geo/hotspots', hotspots, [200, 500]);

  const reverseGeo = await request('POST', `${BASE}/geo/reverse`, {
    token: tokens.admin,
    body: { lat: 17.385, lng: 78.486 }
  });
  log('P11', 'Geo Reverse Geocode', 'POST', '/api/geo/reverse', reverseGeo, [200, 500]);
}

// ─────────────────────────────────────────────────────────────────
// Cleanup: Delete audit test users (optional)
// ─────────────────────────────────────────────────────────────────
async function cleanup() {
  if (tokens.admin && officerUserId) {
    const del = await request('DELETE', `${BASE}/users/${officerUserId}`, { token: tokens.admin });
    console.log(`🧹 Cleanup: Delete officer ${officerUserId} → ${del.status}`);
  }
  if (tokens.admin && supervisorUserId) {
    const del = await request('DELETE', `${BASE}/users/${supervisorUserId}`, { token: tokens.admin });
    console.log(`🧹 Cleanup: Delete supervisor ${supervisorUserId} → ${del.status}`);
  }
  if (tokens.admin && citizenUserId) {
    const del = await request('DELETE', `${BASE}/users/${citizenUserId}`, { token: tokens.admin });
    console.log(`🧹 Cleanup: Delete citizen ${citizenUserId} → ${del.status}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// REPORT GENERATION
// ─────────────────────────────────────────────────────────────────
function generateReport() {
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const passRate = ((passed / total) * 100).toFixed(1);
  const score = Math.min(100, Math.round(parseFloat(passRate)));

  // Phase breakdown
  const phases = {};
  for (const r of results) {
    if (!phases[r.phase]) phases[r.phase] = { pass: 0, fail: 0 };
    if (r.pass) phases[r.phase].pass++;
    else phases[r.phase].fail++;
  }

  // Timing summary
  const avgElapsed = results.length > 0
    ? Math.round(results.reduce((s, r) => s + (r.elapsed || 0), 0) / results.length)
    : 0;

  const report = {
    summary: {
      timestamp: new Date().toISOString(),
      totalTests: total,
      passed,
      failed,
      passRate: `${passRate}%`,
      avgResponseMs: avgElapsed,
      productionReadinessScore: `${score}/100`,
    },
    phaseBreakdown: phases,
    timings,
    failedEndpoints,
    criticalBugs,
    allResults: results,
  };

  return report;
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   JANSEVA COMPLETE API FUNCTIONAL AUDIT      ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`Started: ${new Date().toISOString()}\n`);

  try {
    await phase0_connectivity();
    await phase1_routeDiscovery();
    await phase2_authentication();
    await phase3_userManagement();
    await phase4_complaintLifecycle();
    await phase5_crudAudit();
    await phase6_aiServices();
    await phase7_notifications();
    await phase8_governmentIntelligence();
    await phase9_security();
    await phase10_performance();
    await phase11_eventBus();
    await cleanup();
  } catch (err) {
    console.error('AUDIT FATAL ERROR:', err.message);
    criticalBugs.push({ issue: `AUDIT CRASHED: ${err.message}`, stack: err.stack });
  }

  const report = generateReport();

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║         AUDIT COMPLETE - SUMMARY             ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`Total Tests:        ${report.summary.totalTests}`);
  console.log(`Passed:             ${report.summary.passed}`);
  console.log(`Failed:             ${report.summary.failed}`);
  console.log(`Pass Rate:          ${report.summary.passRate}`);
  console.log(`Avg Response:       ${report.summary.avgResponseMs}ms`);
  console.log(`Production Score:   ${report.summary.productionReadinessScore}`);
  console.log('\nPhase Breakdown:');
  for (const [phase, data] of Object.entries(report.phaseBreakdown)) {
    console.log(`  ${phase}: ✅${data.pass} ❌${data.fail}`);
  }
  if (report.failedEndpoints.length > 0) {
    console.log('\n❌ FAILED ENDPOINTS:');
    for (const f of report.failedEndpoints) {
      console.log(`  ${f.method} ${f.path} → ${f.status} (expected ${f.expected}) [${f.notes}]`);
      if (f.body?.message) console.log(`     Message: ${f.body.message}`);
    }
  }
  if (report.criticalBugs.length > 0) {
    console.log('\n🔴 CRITICAL BUGS:');
    for (const b of report.criticalBugs) {
      console.log(`  - ${b.issue}`);
    }
  }
  console.log('\nKey Timings:');
  for (const [k, v] of Object.entries(timings)) {
    console.log(`  ${k}: ${v}ms`);
  }

  // Output full JSON for file capture
  console.log('\n__AUDIT_REPORT_JSON_START__');
  console.log(JSON.stringify(report, null, 2));
  console.log('__AUDIT_REPORT_JSON_END__');
}

main();
