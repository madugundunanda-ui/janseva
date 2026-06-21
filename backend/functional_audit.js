const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';

const config = {
  adminEmail: 'admin@janseva.gov.in',
  citizenEmail: 'citizen1@gmail.com',
  officerEmail: 'off-san1@sanitation.janseva.gov.in',
  supervisorEmail: 'sup-san@works.janseva.gov.in',
  password: 'password123',
  adminPassword: 'admin123'
};

const state = {
  tokens: {},
  complaintId: null,
  departments: [],
  officerId: null,
  supervisorId: null,
  citizenId: null,
  results: {
    passed: [],
    failed: []
  }
};

const logResult = (scenario, success, details) => {
  const result = { scenario, success, details };
  if (success) {
    console.log(`[PASS] ${scenario}`);
    state.results.passed.push(result);
  } else {
    console.error(`[FAIL] ${scenario} - ${details}`);
    state.results.failed.push(result);
  }
};

async function loginUser(email, password, role) {
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
    
    // Token is returned in httpOnly cookie 'token'
    let token = null;
    const setCookie = res.headers['set-cookie'];
    if (setCookie && setCookie.length > 0) {
      const tokenMatch = setCookie[0].match(/token=([^;]+)/);
      if (tokenMatch) {
        token = tokenMatch[1];
      }
    }
    
    state.tokens[role] = token;
    if (role === 'officer') {
      state.officerId = res.data.data?.user?._id || res.data.data?.user?.id;
      state.officerDepartment = res.data.data?.user?.department;
    }
    if (role === 'supervisor') state.supervisorId = res.data.data?.user?._id || res.data.data?.user?.id;
    if (role === 'citizen') state.citizenId = res.data.data?.user?._id || res.data.data?.user?.id;
    logResult(`Login ${role}`, !!token, token ? 'Login successful' : 'Login successful but token missing from cookie');
  } catch (err) {
    logResult(`Login ${role}`, false, err.response?.data?.message || err.message);
  }
}

async function runAudit() {
  console.log('Starting JANSEVA Functional API Audit...');
  await loginUser(config.adminEmail, config.adminPassword, 'admin');
  await loginUser(config.citizenEmail, config.password, 'citizen');
  await loginUser(config.officerEmail, config.password, 'officer');
  await loginUser(config.supervisorEmail, config.password, 'supervisor');
  
  // Fetch Departments
  try {
    const headers = { Authorization: `Bearer ${state.tokens.citizen}` };
    const res = await axios.get(`${BASE_URL}/departments`, { headers });
    state.departments = res.data.data.departments || res.data.data;
    console.log('Sample department:', state.departments[0]);
    logResult('Fetch Departments', true, `Found ${state.departments?.length || 0} departments`);
  } catch (err) {
    logResult('Fetch Departments', false, err.message);
  }
  
  await runScenario1();
  await runScenario2();
  await runScenario3();
  await runScenario4();
  await runScenario15_Security();
  
  console.log('\nWriting results to file...');
  fs.writeFileSync('audit_results.json', JSON.stringify(state.results, null, 2));
  console.log('Done!');
}

async function runScenario1() {
  console.log('\n--- Scenario 1: Citizen Complaint Flow ---');
  try {
    const FormData = require('form-data');
    const fs = require('fs');
    const form = new FormData();
    form.append('title', 'Water Pipe Leak');
    form.append('description', 'Severe water leak in sector 4');
    const deptId = state.officerDepartment || state.departments[0]?.id || state.departments[0]?._id;
    form.append('department', deptId);
    form.append('location[address]', 'Ward 1 Main Road');
    form.append('location[ward]', '1');
    form.append('image', fs.createReadStream('test-image.jpg'));
    
    const headers = { 
      Authorization: `Bearer ${state.tokens.citizen}`,
      ...form.getHeaders()
    };
    const res = await axios.post(`${BASE_URL}/complaints`, form, { headers });
    
    state.complaintId = res.data.data?.complaint?._id || res.data.data?._id;
    logResult('Citizen Submit Complaint', true, `Complaint ID: ${state.complaintId}`);
  } catch (err) {
    const errMsg = err.response?.data?.message || err.message;
    const details = err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : '';
    logResult('Citizen Submit Complaint', false, `${errMsg} ${details}`);
  }
}

async function runScenario2() {
  console.log('\n--- Scenario 2 & 11: Admin Access & User Management ---');
  try {
    const headers = { Authorization: `Bearer ${state.tokens.admin}` };
    const res = await axios.get(`${BASE_URL}/users`, { headers });
    const users = res.data.data?.users || res.data.users || [];
    logResult('Admin View Users', true, `Fetched ${users.length} users`);
  } catch (err) {
    logResult('Admin View Users', false, err.response?.data?.message || err.message);
  }
}

async function runScenario3() {
  console.log('\n--- Scenario 3 & 12: Admin Assignment Flow ---');
  if (!state.complaintId || !state.officerId) return logResult('Admin Assignment', false, 'Missing IDs');
  try {
    const headers = { Authorization: `Bearer ${state.tokens.admin}` };
    const res = await axios.patch(`${BASE_URL}/complaints/${state.complaintId}/assign-officer`, {
      officerId: state.officerId
    }, { headers });
    logResult('Admin Assign Officer', true, `Assigned to ${state.officerId}`);
  } catch (err) {
    logResult('Admin Assign Officer', false, err.response?.data?.message || err.message);
  }
}

async function runScenario4() {
  console.log('\n--- Scenario 4: Officer Workflow ---');
  if (!state.complaintId) return logResult('Officer Update', false, 'Missing complaintId');
  try {
    const headers = { Authorization: `Bearer ${state.tokens.officer}` };
    const res = await axios.patch(`${BASE_URL}/complaints/${state.complaintId}`, {
      status: 'resolved',
      priority: 'low'
    }, { headers });
    logResult('Officer Update Status', true, 'Status set to In Progress');
  } catch (err) {
    logResult('Officer Update Status', false, err.response?.data?.message || err.message);
  }
}

async function runScenario15_Security() {
  console.log('\n--- Scenario 15 & Security: Auth Audit ---');
  try {
    const headers = { Authorization: `Bearer ${state.tokens.citizen}` };
    await axios.get(`${BASE_URL}/users`, { headers });
    logResult('Security - Citizen accessing Admin route', false, 'Citizen was allowed to access /users');
  } catch (err) {
    if (err.response && (err.response.status === 403 || err.response.status === 401)) {
      logResult('Security - Citizen accessing Admin route', true, 'Access correctly denied (403/401)');
    } else {
      logResult('Security - Citizen accessing Admin route', false, `Unexpected error: ${err.message}`);
    }
  }
}

runAudit();
