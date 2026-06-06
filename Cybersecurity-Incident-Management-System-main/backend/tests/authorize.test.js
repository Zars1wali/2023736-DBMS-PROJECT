const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-secret';

const { authorize, canAccessAllIncidents } = require('../src/middleware/authorize');
const ApiError = require('../src/utils/ApiError');

function runMiddleware(middleware, req) {
  return new Promise((resolve) => {
    middleware(req, {}, (error) => resolve(error));
  });
}

// authorize() middleware
test('authorize rejects request with no user attached', async () => {
  const middleware = authorize('Admin');
  const error = await runMiddleware(middleware, {});
  assert.ok(error instanceof ApiError);
  assert.equal(error.statusCode, 401);
});

test('authorize allows request when user role matches', async () => {
  const middleware = authorize('Admin', 'Manager');
  const req = { user: { role: 'Admin' } };
  const error = await runMiddleware(middleware, req);
  assert.equal(error, undefined);
});

test('authorize allows any of the listed roles', async () => {
  const middleware = authorize('Admin', 'Manager', 'Analyst');
  const req = { user: { role: 'Analyst' } };
  const error = await runMiddleware(middleware, req);
  assert.equal(error, undefined);
});

test('authorize rejects user whose role is not in the allowed list', async () => {
  const middleware = authorize('Admin');
  const req = { user: { role: 'Analyst' } };
  const error = await runMiddleware(middleware, req);
  assert.ok(error instanceof ApiError);
  assert.equal(error.statusCode, 403);
});

test('authorize rejects Manager when only Admin is allowed', async () => {
  const middleware = authorize('Admin');
  const req = { user: { role: 'Manager' } };
  const error = await runMiddleware(middleware, req);
  assert.equal(error.statusCode, 403);
});

// canAccessAllIncidents()
test('canAccessAllIncidents returns true for Admin', () => {
  assert.equal(canAccessAllIncidents({ role: 'Admin' }), true);
});

test('canAccessAllIncidents returns true for Manager', () => {
  assert.equal(canAccessAllIncidents({ role: 'Manager' }), true);
});

test('canAccessAllIncidents returns false for Analyst', () => {
  assert.equal(canAccessAllIncidents({ role: 'Analyst' }), false);
});
