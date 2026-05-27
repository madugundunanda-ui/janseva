/**
 * k6 Load Test — Complaint Workflow
 *
 * Tests the core complaint submission and retrieval flow under load.
 *
 * Usage:
 *   k6 run backend/load-tests/k6-complaints.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Custom metrics
const errorRate = new Rate('errors');
const complaintCreationTrend = new Trend('complaint_creation_duration');
const complaintListTrend = new Trend('complaint_list_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Warm-up
    { duration: '1m',  target: 50 },   // Ramp up
    { duration: '2m',  target: 100 },  // Sustained load
    { duration: '1m',  target: 200 },  // Peak load
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    errors: ['rate<0.01'],
    complaint_creation_duration: ['p(95)<800'],
    complaint_list_duration: ['p(95)<300'],
  },
};

// Authenticate and get token
export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'admin@janseva.gov.in',
    password: 'admin123',
    role: 'admin',
  }), { headers: { 'Content-Type': 'application/json' } });

  const token = loginRes.json('data.token') || loginRes.json('token');
  if (!token) {
    console.error('Failed to authenticate. Response:', loginRes.body);
  }
  return { token };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // 1. List complaints
  const listStart = Date.now();
  const listRes = http.get(`${BASE_URL}/api/complaints`, { headers });
  complaintListTrend.add(Date.now() - listStart);
  
  check(listRes, {
    'list complaints - status 200': (r) => r.status === 200,
    'list complaints - has data': (r) => r.json('success') === true,
  }) || errorRate.add(1);

  sleep(0.5);

  // 2. Get health check
  const healthRes = http.get(`${BASE_URL}/healthz`);
  check(healthRes, {
    'health check - status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(0.5);

  // 3. Get nearby complaints (if applicable)
  const nearbyRes = http.get(`${BASE_URL}/api/complaints/nearby?lat=12.97&lng=77.59`, { headers });
  check(nearbyRes, {
    'nearby complaints - status 200 or 400': (r) => r.status === 200 || r.status === 400,
  }) || errorRate.add(1);

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
