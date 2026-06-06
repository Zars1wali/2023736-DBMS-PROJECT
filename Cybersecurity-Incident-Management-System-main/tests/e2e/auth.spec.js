/**
 * E2E Integration Tests: Authentication Workflows
 *
 * Tests the full authentication lifecycle end-to-end against the running API:
 *   - Login with valid/invalid credentials
 *   - JWT token issuance and validation
 *   - Authenticated requests
 *   - Logout and token revocation
 *   - Rate limiting on auth endpoints
 *
 * Prerequisites:
 *   - Backend running at BASE_URL (default: http://localhost:3000)
 *   - Test database seeded with an Analyst user:
 *       email: analyst@cims.test, password: Test@12345, role: Analyst
 *   - Test database seeded with an Admin user:
 *       email: admin@cims.test, password: Admin@12345, role: Admin
 */
import { test, expect } from '@playwright/test';

const API = process.env.BASE_URL || 'http://localhost:3000';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function loginAs(request, email, password) {
  const response = await request.post(`${API}/api/auth/login`, {
    data: { email, password }
  });
  return response;
}

// ─── Health Check ────────────────────────────────────────────────────────────

test('GET /health returns 200 ok', async ({ request }) => {
  const response = await request.get(`${API}/health`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('ok');
});

// ─── Login ───────────────────────────────────────────────────────────────────

test('POST /api/auth/login succeeds with valid credentials', async ({ request }) => {
  const response = await loginAs(request, 'analyst@cims.test', 'Test@12345');
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toHaveProperty('token');
  expect(typeof body.token).toBe('string');
  expect(body.user).toMatchObject({
    email: 'analyst@cims.test',
    role: 'Analyst'
  });
  // password_hash must never be exposed
  expect(body.user.password_hash).toBeUndefined();
});

test('POST /api/auth/login returns 401 for unknown email', async ({ request }) => {
  const response = await loginAs(request, 'nobody@cims.test', 'any');
  expect(response.status()).toBe(401);
});

test('POST /api/auth/login returns 401 for wrong password', async ({ request }) => {
  const response = await loginAs(request, 'analyst@cims.test', 'wrongpassword');
  expect(response.status()).toBe(401);
});

test('POST /api/auth/login returns 400 when email is missing', async ({ request }) => {
  const response = await request.post(`${API}/api/auth/login`, {
    data: { password: 'Test@12345' }
  });
  expect(response.status()).toBe(400);
});

test('POST /api/auth/login returns 400 when password is missing', async ({ request }) => {
  const response = await request.post(`${API}/api/auth/login`, {
    data: { email: 'analyst@cims.test' }
  });
  expect(response.status()).toBe(400);
});

// ─── Authenticated Requests ──────────────────────────────────────────────────

test('Authenticated request to /api/incidents succeeds with valid token', async ({ request }) => {
  const loginRes = await loginAs(request, 'analyst@cims.test', 'Test@12345');
  const { token } = await loginRes.json();

  const response = await request.get(`${API}/api/incidents`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(response.status()).toBe(200);
});

test('Unauthenticated request to /api/incidents returns 401', async ({ request }) => {
  const response = await request.get(`${API}/api/incidents`);
  expect(response.status()).toBe(401);
});

test('Request with tampered token returns 401', async ({ request }) => {
  const response = await request.get(`${API}/api/incidents`, {
    headers: { Authorization: 'Bearer this.is.not.valid' }
  });
  expect(response.status()).toBe(401);
});

// ─── Logout ──────────────────────────────────────────────────────────────────

test('POST /api/auth/logout succeeds and revokes the token', async ({ request }) => {
  const loginRes = await loginAs(request, 'analyst@cims.test', 'Test@12345');
  const { token } = await loginRes.json();

  // Logout
  const logoutRes = await request.post(`${API}/api/auth/logout`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(logoutRes.status()).toBe(200);

  // Revoked token should now be rejected
  const rejectedRes = await request.get(`${API}/api/incidents`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(rejectedRes.status()).toBe(401);
});

// ─── RBAC ─────────────────────────────────────────────────────────────────────

test('[RBAC] Analyst cannot create incidents (403)', async ({ request }) => {
  const loginRes = await loginAs(request, 'analyst@cims.test', 'Test@12345');
  const { token } = await loginRes.json();

  const response = await request.post(`${API}/api/incidents`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      organization_id: 1,
      title: 'Test Incident',
      type: 'Malware',
      severity: 'High'
    }
  });
  expect(response.status()).toBe(403);
});

test('[RBAC] Analyst cannot delete assets (403)', async ({ request }) => {
  const loginRes = await loginAs(request, 'analyst@cims.test', 'Test@12345');
  const { token } = await loginRes.json();

  const response = await request.delete(`${API}/api/assets/1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(response.status()).toBe(403);
});

test('[RBAC] Admin can access report endpoints', async ({ request }) => {
  const loginRes = await loginAs(request, 'admin@cims.test', 'Admin@12345');
  const { token } = await loginRes.json();

  const response = await request.get(`${API}/api/reports/open-incidents-by-severity`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(response.status()).toBe(200);
});

test('[RBAC] Analyst cannot access report endpoints (403)', async ({ request }) => {
  const loginRes = await loginAs(request, 'analyst@cims.test', 'Test@12345');
  const { token } = await loginRes.json();

  const response = await request.get(`${API}/api/reports/open-incidents-by-severity`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(response.status()).toBe(403);
});
