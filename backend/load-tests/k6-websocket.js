/**
 * k6 Load Test — WebSocket Connections
 *
 * Tests the WebSocket server under concurrent connection load.
 *
 * Usage:
 *   k6 run backend/load-tests/k6-websocket.js
 */

import ws from 'k6/ws';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const HTTP_URL = __ENV.BASE_URL || 'http://localhost:5000';
const WS_URL = __ENV.WS_URL || 'ws://localhost:5000';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Warm-up
    { duration: '1m',  target: 50 },   // Ramp up
    { duration: '1m',  target: 100 },  // Sustained load
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    errors: ['rate<0.05'], // Max 5% errors
  },
};

// Authenticate and get token
export function setup() {
  const loginRes = http.post(`${HTTP_URL}/api/auth/login`, JSON.stringify({
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
  // If authentication failed in setup, try to run without it (will fail, which is correct)
  const token = data.token || '';
  const url = `${WS_URL}?token=${token}`;

  const response = ws.connect(url, {}, function (socket) {
    socket.on('open', function open() {
      // Send a ping message
      socket.send(JSON.stringify({ type: 'ping', message: 'Hello from k6' }));

      // Setup a periodic heartbeat
      socket.setInterval(function () {
        socket.send(JSON.stringify({ type: 'heartbeat' }));
      }, 10000);
    });

    socket.on('message', function (msg) {
      const data = JSON.parse(msg);
      check(data, {
        'message type received': (d) => d && d.type !== undefined,
      }) || errorRate.add(1);
    });

    socket.on('close', function () {
      // Clean exit
    });

    socket.on('error', function (err) {
      console.error(`WebSocket error: ${err.error()}`);
      errorRate.add(1);
    });

    // Stay connected for 15 seconds
    sleep(15);
    socket.close();
  });

  check(response, {
    'websocket handshake status is 101': (r) => r && r.status === 101,
  }) || errorRate.add(1);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
