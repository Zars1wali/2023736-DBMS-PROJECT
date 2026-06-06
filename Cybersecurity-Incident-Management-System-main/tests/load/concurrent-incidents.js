/**
 * Load Test: Concurrent Incident Reporting
 *
 * Tool:    k6 (https://k6.io)
 * Install: https://k6.io/docs/get-started/installation/
 * Run:     k6 run tests/load/concurrent-incidents.js \
 *              --env BASE_URL=http://localhost:3000 \
 *              --env ADMIN_EMAIL=admin@cims.test \
 *              --env ADMIN_PASSWORD=Admin@12345
 *
 * Purpose:
 *   Simulates 50 concurrent users submitting incidents simultaneously.
 *   Validates that the system handles the load without errors and
 *   meets the < 200ms p95 response time target.
 *
 * Performance Targets:
 *   - p95 response time  < 200ms
 *   - error rate          < 1%
 *   - throughput          >= 50 req/s
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ──────────────────────────────────────────────────────────
const errorRate = new Rate('error_rate');
const createDuration = new Trend('incident_create_duration', true);

// ─── Test Configuration ───────────────────────────────────────────────────────
export const options = {
  scenarios: {
    concurrent_submissions: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },  // Ramp up to 50 concurrent users
        { duration: '2m',  target: 50 },  // Sustain 50 VUs for 2 minutes
        { duration: '30s', target: 0 }    // Ramp down
      ]
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<200'],  // 95th percentile < 200ms
    error_rate:        ['rate<0.01'],  // Error rate < 1%
    http_req_failed:   ['rate<0.01']   // HTTP failures < 1%
  }
};

const BASE_URL      = __ENV.BASE_URL       || 'http://localhost:3000';
const ADMIN_EMAIL   = __ENV.ADMIN_EMAIL    || 'admin@cims.test';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin@12345';

// ─── Setup: Authenticate once, reuse token ────────────────────────────────────
export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, { 'login succeeded': (r) => r.status === 200 });

  const { token } = loginRes.json();
  if (!token) {
    throw new Error('Setup failed: could not obtain auth token');
  }
  return { token };
}

// ─── Main VU Scenario ────────────────────────────────────────────────────────
export default function main({ token }) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const severity = ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)];
  const type     = ['Malware', 'Phishing', 'DDoS', 'Ransomware', 'Intrusion'][Math.floor(Math.random() * 5)];

  const payload = JSON.stringify({
    organization_id: 1,
    title: `Load Test Incident ${Date.now()}`,
    description: 'Automated load test incident submission',
    type,
    severity
  });

  const start = Date.now();
  const createRes = http.post(`${BASE_URL}/api/incidents`, payload, { headers });
  createDuration.add(Date.now() - start);

  const ok = check(createRes, {
    'incident created (201)':       (r) => r.status === 201,
    'response has incident object': (r) => r.json('incident') !== null,
    'response time < 500ms':        (r) => r.timings.duration < 500
  });

  errorRate.add(!ok);

  // Brief pause between submissions (realistic user behaviour)
  sleep(Math.random() * 0.5);
}

// ─── Teardown ─────────────────────────────────────────────────────────────────
export function teardown(data) {
  console.log('Load test complete. Auth token used:', data.token ? 'yes' : 'no');
}
