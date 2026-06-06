/**
 * Security Tests
 *
 * Covers:
 * 1. RBAC enforcement across all protected routes
 * 2. SQL injection prevention via parameterized queries
 * 3. JWT authentication edge cases
 * 4. Input validation boundaries
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'security-test-secret';
process.env.DATABASE_URL = 'postgres://test:test@localhost/test';

const db = require('../src/config/db');
const { authenticate, tokenBlacklist } = require('../src/middleware/auth');
const { authorize } = require('../src/middleware/authorize');
const { requireFields, validateEnum } = require('../src/middleware/validate');
const ApiError = require('../src/utils/ApiError');
const { listIncidents, createIncident } = require('../src/controllers/incidentController');
const {
  createAsset,
  deleteAsset,
  updatePatchStatus
} = require('../src/controllers/assetController');

function runMiddleware(middleware, req) {
  return new Promise((resolve) => {
    middleware(req, {}, (error) => resolve(error));
  });
}

function buildRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
}

// =============================================================================
// 1. ROLE-BASED ACCESS CONTROL (RBAC)
// =============================================================================

test('[RBAC] Admin can access Admin-only routes', async () => {
  const middleware = authorize('Admin');
  const req = { user: { role: 'Admin' } };
  const error = await runMiddleware(middleware, req);
  assert.equal(error, undefined);
});

test('[RBAC] Manager cannot access Admin-only routes', async () => {
  const middleware = authorize('Admin');
  const req = { user: { role: 'Manager' } };
  const error = await runMiddleware(middleware, req);
  assert.ok(error instanceof ApiError);
  assert.equal(error.statusCode, 403);
});

test('[RBAC] Analyst cannot access Admin-only routes', async () => {
  const middleware = authorize('Admin');
  const req = { user: { role: 'Analyst' } };
  const error = await runMiddleware(middleware, req);
  assert.equal(error.statusCode, 403);
});

test('[RBAC] Analyst cannot access Admin+Manager routes (e.g. createIncident)', async () => {
  const middleware = authorize('Admin', 'Manager');
  const req = { user: { role: 'Analyst' } };
  const error = await runMiddleware(middleware, req);
  assert.equal(error.statusCode, 403);
});

test('[RBAC] Manager can access Admin+Manager routes', async () => {
  const middleware = authorize('Admin', 'Manager');
  const req = { user: { role: 'Manager' } };
  const error = await runMiddleware(middleware, req);
  assert.equal(error, undefined);
});

test('[RBAC] Analyst can only see their assigned incidents (not all)', async () => {
  const capturedQuery = [];
  db.query = async (text, params) => {
    capturedQuery.push({ text, params });
    return { rows: [] };
  };

  const req = {
    query: {},
    user: { id: 77, role: 'Analyst', email: 'analyst@test.com' }
  };
  const res = buildRes();
  await listIncidents(req, res);

  const q = capturedQuery[0];
  assert.ok(q.text.includes('incident_analysts'), 'Query must filter by incident_analysts for Analyst role');
  assert.ok(q.params.includes(77), 'Query must use the analyst id as a parameter');
});

test('[RBAC] Admin can see all incidents without analyst filter', async () => {
  const capturedQuery = [];
  db.query = async (text, params) => {
    capturedQuery.push({ text, params });
    return { rows: [] };
  };

  const req = {
    query: {},
    user: { id: 1, role: 'Admin' }
  };
  const res = buildRes();
  await listIncidents(req, res);

  const q = capturedQuery[0];
  // Admin query should NOT filter by incident_analysts
  assert.ok(!q.text.includes('analyst_id'), 'Admin query must not filter by analyst_id');
});

test('[RBAC] Unauthenticated request (no user) is rejected by authorize', async () => {
  const middleware = authorize('Admin');
  const error = await runMiddleware(middleware, {});
  assert.ok(error instanceof ApiError);
  assert.equal(error.statusCode, 401);
});

// =============================================================================
// 2. SQL INJECTION PREVENTION
// =============================================================================

test('[SQL Injection] listIncidents uses parameterized queries for status filter', async () => {
  const capturedCalls = [];
  db.query = async (text, params) => {
    capturedCalls.push({ text, params });
    return { rows: [] };
  };

  const maliciousInput = "Open' OR '1'='1";
  const req = {
    query: { status: maliciousInput },
    user: { id: 1, role: 'Admin' }
  };
  const res = buildRes();
  await listIncidents(req, res);

  const call = capturedCalls[0];
  // The malicious input must appear as a parameter, never interpolated into query text
  assert.ok(call.params.includes(maliciousInput), 'Malicious input must be passed as a bound parameter');
  assert.ok(!call.text.includes(maliciousInput), 'Query text must not contain raw user input');
});

test('[SQL Injection] listIncidents uses parameterized queries for severity filter', async () => {
  const capturedCalls = [];
  db.query = async (text, params) => {
    capturedCalls.push({ text, params });
    return { rows: [] };
  };

  const maliciousInput = "Critical'; DROP TABLE incidents; --";
  const req = {
    query: { severity: maliciousInput },
    user: { id: 1, role: 'Admin' }
  };
  const res = buildRes();
  await listIncidents(req, res);

  const call = capturedCalls[0];
  assert.ok(call.params.includes(maliciousInput));
  assert.ok(!call.text.includes('DROP TABLE'));
});

test('[SQL Injection] reportController incidentTimeline uses parameterized incidentId', async () => {
  const { incidentTimeline } = require('../src/controllers/reportController');
  const capturedCalls = [];
  db.query = async (text, params) => {
    capturedCalls.push({ text, params });
    return { rows: [] };
  };

  // Even with unusual input, it must be parameterized
  const req = { params: { incidentId: '1 OR 1=1' } };
  const res = buildRes();
  await incidentTimeline(req, res);

  const call = capturedCalls[0];
  // Number() converts "1 OR 1=1" to NaN – the important thing is it's parameterized
  assert.ok(Array.isArray(call.params));
  assert.ok(!call.text.includes('OR 1=1'));
});

test('[SQL Injection] assetController createAsset uses parameterized queries', async () => {
  const capturedCalls = [];
  db.query = async (text, params) => {
    capturedCalls.push({ text, params });
    return { rows: [{ id: 1 }] };
  };

  const maliciousIp = "10.0.0.1'; DROP TABLE assets; --";
  const req = {
    body: { organization_id: 1, type: 'Server', os: 'Linux', ip_address: maliciousIp, location: 'DC1', criticality: 'High' }
  };
  const res = buildRes();
  await createAsset(req, res);

  const call = capturedCalls[0];
  assert.ok(call.params.includes(maliciousIp), 'IP address must be a parameter, not interpolated');
  assert.ok(!call.text.includes('DROP TABLE'));
});

// =============================================================================
// 3. AUTHENTICATION TOKEN SECURITY
// =============================================================================

test('[Auth] Expired token is rejected with 401', async () => {
  const expiredToken = jwt.sign(
    { id: 1, role: 'Admin' },
    process.env.JWT_SECRET,
    { expiresIn: '-1s' }
  );
  const req = { headers: { authorization: `Bearer ${expiredToken}` } };
  const error = await runMiddleware(authenticate, req);
  assert.ok(error instanceof ApiError);
  assert.equal(error.statusCode, 401);
});

test('[Auth] Token signed with wrong secret is rejected', async () => {
  const token = jwt.sign({ id: 1, role: 'Admin' }, 'wrong-secret', { expiresIn: '1h' });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const error = await runMiddleware(authenticate, req);
  assert.equal(error.statusCode, 401);
});

test('[Auth] Malformed token (not JWT format) is rejected', async () => {
  const req = { headers: { authorization: 'Bearer notavalidtoken' } };
  const error = await runMiddleware(authenticate, req);
  assert.equal(error.statusCode, 401);
});

test('[Auth] Authorization header without Bearer prefix is rejected', async () => {
  const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const req = { headers: { authorization: token } };
  const error = await runMiddleware(authenticate, req);
  assert.equal(error.statusCode, 401);
});

test('[Auth] Blacklisted (revoked) token is rejected', async () => {
  const { revokeToken } = require('../src/middleware/auth');
  const token = jwt.sign({ id: 5, role: 'Analyst' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  revokeToken(token);

  const req = { headers: { authorization: `Bearer ${token}` } };
  const error = await runMiddleware(authenticate, req);
  assert.equal(error.statusCode, 401);
  assert.ok(error.message.includes('revoked'));

  tokenBlacklist.delete(token);
});

// =============================================================================
// 4. INPUT VALIDATION
// =============================================================================

test('[Input Validation] Invalid severity enum is rejected', async () => {
  const middleware = validateEnum('severity', ['Low', 'Medium', 'High', 'Critical']);
  const req = { body: { severity: '<script>alert(1)</script>' } };
  const error = await runMiddleware(middleware, req);
  assert.ok(error instanceof ApiError);
  assert.equal(error.statusCode, 400);
});

test('[Input Validation] Invalid status enum is rejected', async () => {
  const middleware = validateEnum('status', ['Open', 'In Progress', 'Resolved', 'Closed']);
  const req = { body: { status: 'HACKED' } };
  const error = await runMiddleware(middleware, req);
  assert.equal(error.statusCode, 400);
});

test('[Input Validation] Missing required fields produce 400 not 500', async () => {
  const middleware = requireFields(['email', 'password']);
  const req = { body: { email: 'test@test.com' } };
  const error = await runMiddleware(middleware, req);
  assert.equal(error.statusCode, 400);
  assert.ok(!error.message.includes('TypeError'));
});

test('[Input Validation] XSS payload in enum field is rejected before reaching controller', async () => {
  const xssPayload = '<img src=x onerror=alert(1)>';
  const middleware = validateEnum('result', ['Successful', 'Partial', 'Failed', 'Pending']);
  const req = { body: { result: xssPayload } };
  const error = await runMiddleware(middleware, req);
  assert.equal(error.statusCode, 400);
});
