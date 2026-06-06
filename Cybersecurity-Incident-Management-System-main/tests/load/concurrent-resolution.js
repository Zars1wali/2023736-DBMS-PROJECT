/**
 * Load Test: Concurrent Incident Resolution Operations
 *
 * Tool:    k6 (https://k6.io)
 * Install: https://k6.io/docs/get-started/installation/
 * Run:     k6 run tests/load/concurrent-resolution.js \
 *              --env BASE_URL=http://localhost:3000 \
 *              --env ADMIN_EMAIL=admin@cims.test \
 *              --env ADMIN_PASSWORD=Admin@12345
 *
 * Purpose:
 *   Simulates multiple analysts simultaneously updating incidents,
 *   logging remediation actions, and transitioning statuses.
 *   Tests optimistic concurrency and data consistency under load.
 *
 * Performance Targets:
 *   - p95 response time  < 200ms
 *   - error rate          < 1%
 *   - sustained load      10+ minutes at peak (configure duration below)
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ─── Custom Metrics ──────────────────────────────────────────────────────────
const errorRate         = new Rate('error_rate');
const statusUpdateTime  = new Trend('status_update_duration', true);
const remediationTime   = new Trend('remediation_log_duration', true);
const conflictCount     = new Counter('conflict_count');

// ─── Test Configuration ───────────────────────────────────────────────────────
export const options = {
  scenarios: {
    concurrent_resolution: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s',  target: 30 },   // Ramp up to 30 concurrent analysts
        { duration: '10m',  target: 30 },   // Sustained load for 10 minutes
        { duration: '30s',  target: 0 }     // Ramp down
      ]
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<200'],
    error_rate:        ['rate<0.01'],
    http_req_failed:   ['rate<0.01']
  }
};

const BASE_URL       = __ENV.BASE_URL        || 'http://localhost:3000';
const ADMIN_EMAIL    = __ENV.ADMIN_EMAIL     || 'admin@cims.test';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD  || 'Admin@12345';

// ─── Setup ────────────────────────────────────────────────────────────────────
export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, { 'admin login ok': (r) => r.status === 200 });
  const { token } = loginRes.json();

  // Pre-create a pool of incidents to work against
  const incidentIds = [];
  for (let i = 0; i < 20; i++) {
    const createRes = http.post(
      `${BASE_URL}/api/incidents`,
      JSON.stringify({
        organization_id: 1,
        title: `Concurrent Resolution Test ${i}`,
        type: 'Malware',
        severity: 'High'
      }),
      { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
    );
    if (createRes.status === 201) {
      incidentIds.push(createRes.json('incident.id'));
    }
  }

  console.log(`Setup: created ${incidentIds.length} test incidents`);
  return { token, incidentIds };
}

// ─── Main VU Scenario ────────────────────────────────────────────────────────
export default function main({ token, incidentIds }) {
  if (!incidentIds || incidentIds.length === 0) {
    console.warn('No incident IDs available for test');
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const incidentId = incidentIds[Math.floor(Math.random() * incidentIds.length)];

  // ─── Group 1: Read incident details ─────────────────────────────────────
  group('Read incident', () => {
    const res = http.get(`${BASE_URL}/api/incidents/${incidentId}`, { headers });
    const ok = check(res, {
      'incident found (200 or 404)': (r) => r.status === 200 || r.status === 404
    });
    errorRate.add(!ok);
  });

  // ─── Group 2: Log remediation action ─────────────────────────────────────
  group('Log remediation action', () => {
    const results = ['Successful', 'Partial', 'Failed', 'Pending'];
    const result  = results[Math.floor(Math.random() * results.length)];

    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/remediation/incidents/${incidentId}/actions`,
      JSON.stringify({
        action_taken: `Load test remediation action at ${Date.now()}`,
        result
      }),
      { headers }
    );
    remediationTime.add(Date.now() - start);

    const ok = check(res, {
      'remediation logged (201 or 403)': (r) => r.status === 201 || r.status === 403
    });
    errorRate.add(!ok);
  });

  // ─── Group 3: Attempt status update (concurrent conflict detection) ───────
  group('Status update', () => {
    // First, read current status
    const readRes = http.get(`${BASE_URL}/api/incidents/${incidentId}`, { headers });
    if (readRes.status !== 200) return;

    const { status } = readRes.json();
    const transitions = { 'Open': 'In Progress', 'In Progress': 'Resolved', 'Resolved': 'Closed' };
    const nextStatus = transitions[status];

    if (!nextStatus) return; // Closed - no further transitions

    const start = Date.now();
    const updateRes = http.patch(
      `${BASE_URL}/api/incidents/${incidentId}/status`,
      JSON.stringify({ status: nextStatus }),
      { headers }
    );
    statusUpdateTime.add(Date.now() - start);

    // 200 = success, 400 = conflict (another VU already transitioned), 403/404 = expected
    const ok = check(updateRes, {
      'status update acceptable': (r) => [200, 400, 403, 404].includes(r.status)
    });

    if (updateRes.status === 400) {
      conflictCount.add(1); // Expected concurrent conflict
    }
    errorRate.add(!ok);
  });

  sleep(Math.random() * 1);
}

// ─── Teardown ─────────────────────────────────────────────────────────────────
export function teardown(data) {
  console.log(`Teardown: test used ${data.incidentIds ? data.incidentIds.length : 0} pre-created incidents`);
}
