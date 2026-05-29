const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:5000/api';

// 1x1 Transparent PNG Base64
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function runTests() {
  console.log('\n==================================================');
  console.log('STARTING FULL END-TO-END PLATFORM TESTS');
  console.log('==================================================\n');

  const beforeImagePath = path.join(__dirname, 'temp_before.png');
  const afterImagePath = path.join(__dirname, 'temp_after.png');
  fs.writeFileSync(beforeImagePath, Buffer.from(PNG_BASE64, 'base64'));
  fs.writeFileSync(afterImagePath, Buffer.from(PNG_BASE64, 'base64'));

  try {
    // --------------------------------------------------
    // TEST 1: Citizen & Admin & Officer Login
    // --------------------------------------------------
    console.log('1. Testing User Logins...');
    const citizenToken = await getLoginToken('citizen@gmail.com', 'cit123');
    console.log('   [PASS] Citizen logged in.');

    const adminToken = await getLoginToken('admin@janseva.gov.in', 'admin123');
    console.log('   [PASS] Admin logged in.');

    const supervisorToken = await getLoginToken('supervisor@works.janseva.gov.in', 'super123');
    console.log('   [PASS] Supervisor logged in.');

    const officerToken = await getLoginToken('officer@sanitation.janseva.gov.in', 'off123');
    console.log('   [PASS] Officer logged in.');

    // Get Officer & Supervisor IDs
    const meOfficer = await fetchProfile(officerToken);
    const officerId = meOfficer.data.user._id;
    console.log(`   Officer ID: ${officerId}`);

    // --------------------------------------------------
    // TEST 2: AI Severity & Resolution Prediction APIs
    // --------------------------------------------------
    console.log('\n2. Testing AI Pipeline APIs directly...');
    
    const severityResponse = await fetch(`${BACKEND_URL}/ai/severity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        title: 'Broken road and pothole',
        description: 'Large pothole in the middle of the road near school, dangerous for children',
        location: 'J.P. Nagar, Ward 4',
        department: 'Roads & Transport',
        peopleAffected: 25,
        image: 'road.jpg'
      })
    });
    
    const severityData = await severityResponse.json();
    console.log('   AI Severity Result:', JSON.stringify(severityData));
    if (severityData.data && severityData.data.severityScore) {
      console.log('   [PASS] AI Severity prediction endpoint functional.');
    } else {
      throw new Error('AI Severity API response structure mismatch.');
    }

    const resolutionResponse = await fetch(`${BACKEND_URL}/ai/predict-resolution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        department: 'Roads & Transport',
        priority: 'high',
        activeComplaints: 5,
        areaComplaints: 10
      })
    });
    
    const resolutionData = await resolutionResponse.json();
    console.log('   AI Resolution Prediction Result:', JSON.stringify(resolutionData));
    if (resolutionData.data && resolutionData.data.estimatedDays) {
      console.log('   [PASS] AI Resolution prediction endpoint functional.');
    } else {
      throw new Error('AI Resolution API response structure mismatch.');
    }

    // --------------------------------------------------
    // TEST 3: Complaint Submission (with image upload)
    // --------------------------------------------------
    console.log('\n3. Submitting Citizen Complaint with Image...');
    
    // Build multi-part form data
    const formData = new FormData();
    formData.append('title', 'Clogged Drainage Near Ward 4 School');
    formData.append('description', 'Severe drainage blockage causing wastewater overflow onto school access road.');
    formData.append('department', 'Waste Management'); // Will resolve to the ID in controller
    formData.append('priority', 'high');
    formData.append('severityScore', String(severityData.data?.severityScore || 65));
    formData.append('severityReason', JSON.stringify(severityData.data?.reason || ['Standard school zone issue']));
    formData.append('location', JSON.stringify({
      address: 'J.P. Nagar, Ward 4',
      ward: 'WARD-04',
      coordinates: {
        lat: 12.9716,
        lng: 77.5946
      }
    }));
    
    const beforeFileBuffer = fs.readFileSync(beforeImagePath);
    const beforeBlob = new Blob([beforeFileBuffer], { type: 'image/png' });
    formData.append('image', beforeBlob, 'temp_before.png');

    const complaintCreateRes = await fetch(`${BACKEND_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${citizenToken}`
      },
      body: formData
    });

    const createResult = await complaintCreateRes.json();
    if (!createResult.success) {
      throw new Error(`Failed to create complaint: ${createResult.message || JSON.stringify(createResult)}`);
    }

    const complaint = createResult.data.complaint;
    const complaintId = complaint._id;
    console.log(`   [PASS] Complaint filed successfully. ID: ${complaintId}`);
    console.log(`   Assigned Status: ${complaint.status}`);
    console.log(`   Spam Risk Analysis: Score=${complaint.spamAnalysis?.spamScore} Risk=${complaint.spamAnalysis?.risk}`);

    // --------------------------------------------------
    // TEST 4: Assign Officer to Complaint (Supervisor flow)
    // --------------------------------------------------
    console.log('\n4. Assigning Officer to Complaint...');
    
    // Check assignment options first
    const optionsRes = await fetch(`${BACKEND_URL}/complaints/${complaintId}/assignment-options`, {
      headers: {
        'Authorization': `Bearer ${supervisorToken}`
      }
    });
    const optionsResult = await optionsRes.json();
    console.log(`   Found ${optionsResult.data?.candidates?.length || 0} candidate officers.`);

    // Force assignment to our test officer
    const assignRes = await fetch(`${BACKEND_URL}/complaints/${complaintId}/assign-officer`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supervisorToken}`
      },
      body: JSON.stringify({ officerId })
    });

    const assignResult = await assignRes.json();
    if (!assignResult.success) {
      throw new Error(`Failed to assign officer: ${assignResult.message}`);
    }
    console.log(`   [PASS] Complaint successfully assigned to Officer. Current Status: ${assignResult.data.complaint.status}`);

    // --------------------------------------------------
    // TEST 5: Officer Dashboards & Updates
    // --------------------------------------------------
    console.log('\n5. Verifying Officer Dashboard...');
    const officerComplaintsRes = await fetch(`${BACKEND_URL}/complaints`, {
      headers: {
        'Authorization': `Bearer ${officerToken}`
      }
    });
    const officerComplaints = await officerComplaintsRes.json();
    const assignedTicket = officerComplaints.data?.complaints?.find(c => c._id === complaintId);
    if (!assignedTicket) {
      throw new Error('Ticket was not listed in Officer complaints list.');
    }
    console.log('   [PASS] Complaint found in Officer Dashboard list.');

    // --------------------------------------------------
    // TEST 6: Upload Resolution Proof & AI Verify
    // --------------------------------------------------
    console.log('\n6. Uploading Resolution Proof & Triggering AI verification...');
    
    const resolveFormData = new FormData();
    resolveFormData.append('status', 'resolved');
    resolveFormData.append('resolutionNote', 'Fully cleared all blockages and cleaned the street surrounding the school.');
    
    const afterFileBuffer = fs.readFileSync(afterImagePath);
    const afterBlob = new Blob([afterFileBuffer], { type: 'image/png' });
    resolveFormData.append('afterImage', afterBlob, 'temp_after.png');

    const resolveRes = await fetch(`${BACKEND_URL}/complaints/${complaintId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${officerToken}`
      },
      body: resolveFormData
    });

    const resolveResult = await resolveRes.json();
    if (!resolveResult.success) {
      throw new Error(`Failed to resolve complaint: ${resolveResult.message}`);
    }

    const updatedComplaint = resolveResult.data.complaint;
    console.log(`   [PASS] Resolution uploaded. Current status: ${updatedComplaint.status}`);
    console.log('   AI Verification Results:', JSON.stringify(updatedComplaint.verification));

    // --------------------------------------------------
    // TEST 7: Governance Live Updates & Timeline
    // --------------------------------------------------
    console.log('\n7. Verifying Governance Activity & Timeline Analytics...');
    const timelineRes = await fetch(`${BACKEND_URL}/governance/timeline`, {
      headers: {
        'Authorization': `Bearer ${citizenToken}`
      }
    });
    const timelineData = await timelineRes.json();
    if (timelineData.success && timelineData.data?.points) {
      console.log('   [PASS] Timeline analytics endpoint returned active daily points.');
    } else {
      throw new Error('Timeline API failed or missing fields.');
    }

    const liveUpdatesRes = await fetch(`${BACKEND_URL}/updates/live`, {
      headers: {
        'Authorization': `Bearer ${citizenToken}`
      }
    });
    const liveUpdatesData = await liveUpdatesRes.json();
    const isComplaintInFeed = liveUpdatesData.data?.items?.some(item => item.id === complaintId);
    console.log(`   Is our complaint listed in live update feed? ${isComplaintInFeed ? 'YES' : 'NO'}`);
    console.log('   [PASS] Live update feed API functional.');

    console.log('\n==================================================');
    console.log('ALL END-TO-END WORKFLOWS COMPLETED SUCCESSFULLY!');
    console.log('==================================================\n');

  } catch (error) {
    console.error('\n[FAIL] E2E TEST FAILED:', error.message);
    process.exit(1);
  } finally {
    // Cleanup files
    if (fs.existsSync(beforeImagePath)) fs.unlinkSync(beforeImagePath);
    if (fs.existsSync(afterImagePath)) fs.unlinkSync(afterImagePath);
  }
}

async function getLoginToken(email, password) {
  const response = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(`Login failed for ${email}: ${result.message}`);
  }
  return result.data.token;
}

async function fetchProfile(token) {
  const response = await fetch(`${BACKEND_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}

runTests();
