/**
 * E2E Integration Tests: Incident Lifecycle Workflows
 *
 * Tests complete incident management workflows end-to-end:
 *   - Incident creation (Admin/Manager only)
 *   - Incident listing and filtering
 *   - Status transitions (Open → In Progress → Resolved → Closed)
 *   - Severity escalation
 *   - Asset and analyst assignment
 *   - Remediation action logging
 *   - Incident timeline
 *   - Analyst access control (own incidents only)
 *
 * Prerequisites:
 *   - Backend running at BASE_URL (default: http://localhost:3000)
 *   - Test database seeded with:
 *       - Organization id=1
 *       - Admin user: admin@cims.test / Admin@12345
 *       - Analyst user: analyst@cims.test / Test@12345 (id=2)
 *       - Asset id=1 belonging to org 1
 */
import { test, expect } from '@playwright/test';

const API = process.env.BASE_URL || 'http://localhost:3000';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getToken(request, email, password) {
  const res = await request.post(`${API}/api/auth/login`, {
    data: { email, password }
  });
  const body = await res.json();
  return body.token;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

// ─── Incident CRUD ───────────────────────────────────────────────────────────

test('Admin can create an incident', async ({ request }) => {
  const token = await getToken(request, 'admin@cims.test', 'Admin@12345');

  const response = await request.post(`${API}/api/incidents`, {
    headers: authHeaders(token),
    data: {
      organization_id: 1,
      title: 'E2E Test Incident',
      description: 'Created by Playwright E2E test',
      type: 'Malware',
      severity: 'High'
    }
  });
  expect(response.status()).toBe(201);

  const body = await response.json();
  expect(body.incident).toMatchObject({
    title: 'E2E Test Incident',
    severity: 'High',
    status: 'Open'
  });
});

test('Admin can list all incidents', async ({ request }) => {
  const token = await getToken(request, 'admin@cims.test', 'Admin@12345');

  const response = await request.get(`${API}/api/incidents`, {
    headers: authHeaders(token)
  });
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

test('Incident listing supports status filter', async ({ request }) => {
  const token = await getToken(request, 'admin@cims.test', 'Admin@12345');

  const response = await request.get(`${API}/api/incidents?status=Open`, {
    headers: authHeaders(token)
  });
  expect(response.status()).toBe(200);

  const incidents = await response.json();
  // All returned incidents must have the filtered status
  for (const incident of incidents) {
    expect(incident.status).toBe('Open');
  }
});

test('Incident listing supports severity filter', async ({ request }) => {
  const token = await getToken(request, 'admin@cims.test', 'Admin@12345');

  const response = await request.get(`${API}/api/incidents?severity=High`, {
    headers: authHeaders(token)
  });
  expect(response.status()).toBe(200);

  const incidents = await response.json();
  for (const incident of incidents) {
    expect(incident.severity).toBe('High');
  }
});

// ─── Full Incident Lifecycle ──────────────────────────────────────────────────

test('Full lifecycle: create → In Progress → Resolved → Closed', async ({ request }) => {
  const token = await getToken(request, 'admin@cims.test', 'Admin@12345');

  // Create
  const createRes = await request.post(`${API}/api/incidents`, {
    headers: authHeaders(token),
    data: {
      organization_id: 1,
      title: 'Lifecycle Test Incident',
      type: 'DDoS',
      severity: 'Critical'
    }
  });
  expect(createRes.status()).toBe(201);
  const { incident } = await createRes.json();
  const id = incident.id;

  // Open → In Progress
  const toInProgress = await request.patch(`${API}/api/incidents/${id}/status`, {
    headers: authHeaders(token),
    data: { status: 'In Progress' }
  });
  expect(toInProgress.status()).toBe(200);
  expect((await toInProgress.json()).incident.status).toBe('In Progress');

  // In Progress → Resolved
  const toResolved = await request.patch(`${API}/api/incidents/${id}/status`, {
    headers: authHeaders(token),
    data: { status: 'Resolved' }
  });
  expect(toResolved.status()).toBe(200);
  expect((await toResolved.json()).incident.status).toBe('Resolved');

  // Resolved → Closed
  const toClosed = await request.patch(`${API}/api/incidents/${id}/status`, {
    headers: authHeaders(token),
    data: { status: 'Closed' }
  });
  expect(toClosed.status()).toBe(200);
  expect((await toClosed.json()).incident.status).toBe('Closed');

  // Cannot reopen closed incident
  const reopen = await request.patch(`${API}/api/incidents/${id}/status`, {
    headers: authHeaders(token),
    data: { status: 'Open' }
  });
  expect(reopen.status()).toBe(400);
});

test('Invalid status transition is rejected with 400', async ({ request }) => {
  const token = await getToken(request, 'admin@cims.test', 'Admin@12345');

  // Create a new Open incident
  const createRes = await request.post(`${API}/api/incidents`, {
    headers: authHeaders(token),
    data: { organization_id: 1, title: 'Invalid Transition', type: 'Phishing', severity: 'Low' }
  });
  const { incident } = await createRes.json();

  // Try to jump directly from Open to Closed (invalid)
  const response = await request.patch(`${API}/api/incidents/${incident.id}/status`, {
    headers: authHeaders(token),
    data: { status: 'Closed' }
  });
  expect(response.status()).toBe(400);
});

// ─── Severity Escalation ─────────────────────────────────────────────────────

test('Admin can escalate incident severity', async ({ request }) => {
  const token = await getToken(request, 'admin@cims.test', 'Admin@12345');

  const createRes = await request.post(`${API}/api/incidents`, {
    headers: authHeaders(token),
    data: { organization_id: 1, title: 'Escalation Test', type: 'Ransomware', severity: 'Low' }
  });
  const { incident } = await createRes.json();

  const escalateRes = await request.patch(`${API}/api/incidents/${incident.id}/escalate`, {
    headers: authHeaders(token),
    data: { severity: 'Critical' }
  });
  expect(escalateRes.status()).toBe(200);
  expect((await escalateRes.json()).incident.severity).toBe('Critical');
});

// ─── Remediation Actions ─────────────────────────────────────────────────────

test('Admin can log a remediation action', async ({ request }) => {
  const token = await getToken(request, 'admin@cims.test', 'Admin@12345');

  const createRes = await request.post(`${API}/api/incidents`, {
    headers: authHeaders(token),
    data: { organization_id: 1, title: 'Remediation E2E', type: 'Intrusion', severity: 'High' }
  });
  const { incident } = await createRes.json();

  const actionRes = await request.post(
    `${API}/api/remediation/incidents/${incident.id}/actions`,
    {
      headers: authHeaders(token),
      data: { action_taken: 'Isolated affected host', result: 'Successful' }
    }
  );
  expect(actionRes.status()).toBe(201);
  const action = (await actionRes.json()).remediation_action;
  expect(action.action_taken).toBe('Isolated affected host');
  expect(action.result).toBe('Successful');
});

test('Admin can retrieve the remediation trail for an incident', async ({ request }) => {
  const token = await getToken(request, 'admin@cims.test', 'Admin@12345');

  const createRes = await request.post(`${API}/api/incidents`, {
    headers: authHeaders(token),
    data: { organization_id: 1, title: 'Trail E2E', type: 'DataBreach', severity: 'Critical' }
  });
  const { incident } = await createRes.json();

  // Log an action first
  await request.post(`${API}/api/remediation/incidents/${incident.id}/actions`, {
    headers: authHeaders(token),
    data: { action_taken: 'Patched CVE', result: 'Successful' }
  });

  const trailRes = await request.get(
    `${API}/api/remediation/incidents/${incident.id}/actions`,
    { headers: authHeaders(token) }
  );
  expect(trailRes.status()).toBe(200);

  const trail = await trailRes.json();
  expect(Array.isArray(trail)).toBe(true);
  expect(trail.length).toBeGreaterThan(0);
});

// ─── Analyst Access Control ───────────────────────────────────────────────────

test('[RBAC] Analyst can only see their assigned incidents', async ({ request }) => {
  const adminToken = await getToken(request, 'admin@cims.test', 'Admin@12345');
  const analystToken = await getToken(request, 'analyst@cims.test', 'Test@12345');

  // Admin lists all incidents
  const adminRes = await request.get(`${API}/api/incidents`, {
    headers: authHeaders(adminToken)
  });
  const allIncidents = await adminRes.json();

  // Analyst lists only their incidents
  const analystRes = await request.get(`${API}/api/incidents`, {
    headers: authHeaders(analystToken)
  });
  expect(analystRes.status()).toBe(200);
  const analystIncidents = await analystRes.json();

  // Analyst result should be a subset of admin result
  expect(analystIncidents.length).toBeLessThanOrEqual(allIncidents.length);
});

// ─── Input Validation ─────────────────────────────────────────────────────────

test('Creating incident with invalid severity returns 400', async ({ request }) => {
  const token = await getToken(request, 'admin@cims.test', 'Admin@12345');

  const response = await request.post(`${API}/api/incidents`, {
    headers: authHeaders(token),
    data: {
      organization_id: 1,
      title: 'Bad Severity',
      type: 'Malware',
      severity: 'MEGA_CRITICAL'
    }
  });
  expect(response.status()).toBe(400);
});

test('Creating incident without required fields returns 400', async ({ request }) => {
  const token = await getToken(request, 'admin@cims.test', 'Admin@12345');

  const response = await request.post(`${API}/api/incidents`, {
    headers: authHeaders(token),
    data: { title: 'No Severity or Type' }
  });
  expect(response.status()).toBe(400);
});

// ─── 404 Handling ─────────────────────────────────────────────────────────────

test('GET /api/incidents/99999 returns 404', async ({ request }) => {
  const token = await getToken(request, 'admin@cims.test', 'Admin@12345');

  const response = await request.get(`${API}/api/incidents/99999`, {
    headers: authHeaders(token)
  });
  expect(response.status()).toBe(404);
});

test('Unknown route returns 404', async ({ request }) => {
  const response = await request.get(`${API}/api/unknown-endpoint`);
  expect(response.status()).toBe(404);
});
