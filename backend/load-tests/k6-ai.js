/**
 * k6 Load Test — AI Endpoints
 *
 * Tests the performance and response latency of AI endpoints under load.
 *
 * Usage:
 *   k6 run backend/load-tests/k6-ai.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

const errorRate = new Rate('errors');
const severityLatency = new Trend('severity_latency');
const resolutionLatency = new Trend('resolution_latency');

export const options = {
  stages: [
    { duration: '30s', target: 5 },    // Warm-up
    { duration: '1m',  target: 20 },   // Ramp up
    { duration: '1m',  target: 50 },   // Peak load
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    errors: ['rate<0.02'], // Max 2% error rate
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1s (includes fallback)
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

  // Payloads with a unique seed to prevent caching and test raw service performance
  const uniqueSeed = Math.random();

  // 1. Severity endpoint
  const severityPayload = JSON.stringify({
    title: `Pothole found on main road ${uniqueSeed}`,
    description: 'Dangerous pothole causing traffic and accidents',
    department: 'Roads & Traffic',
    peopleAffected: 50
  });

  const severityStart = Date.now();
  const severityRes = http.post(`${BASE_URL}/api/ai/severity`, severityPayload, { headers });
  severityLatency.add(Date.now() - severityStart);

  check(severityRes, {
    'severity - status 200': (r) => r.status === 200,
    'severity - has score': (r) => r.json('data.severityScore') !== undefined,
  }) || errorRate.add(1);

  sleep(0.5);

  // 2. Predict Resolution endpoint
  const resolutionPayload = JSON.stringify({
    title: `Streetlight broken ${uniqueSeed}`,
    department: 'Electricity'
  });

  const resolutionStart = Date.now();
  const resolutionRes = http.post(`${BASE_URL}/api/ai/predict-resolution`, resolutionPayload, { headers });
  resolutionLatency.add(Date.now() - resolutionStart);

  check(resolutionRes, {
    'resolution - status 200': (r) => r.status === 200,
    'resolution - has estimatedDays': (r) => r.json('data.estimatedDays') !== undefined,
  }) || errorRate.add(1);

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
