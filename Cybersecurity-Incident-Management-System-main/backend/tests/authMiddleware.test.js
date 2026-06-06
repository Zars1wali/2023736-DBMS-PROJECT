const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret';

const { authenticate, revokeToken, tokenBlacklist } = require('../src/middleware/auth');

function runMiddleware(req) {
  return new Promise((resolve) => {
    authenticate(req, {}, (error) => resolve(error));
  });
}

test('authenticate rejects missing authorization header', async () => {
  const error = await runMiddleware({ headers: {} });
  assert.equal(error.statusCode, 401);
});

test('authenticate accepts valid bearer token', async () => {
  const token = jwt.sign({ id: 1, role: 'Analyst' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const error = await runMiddleware(req);

  assert.equal(error, undefined);
  assert.equal(req.user.id, 1);
  assert.equal(req.user.role, 'Analyst');
});

test('authenticate rejects revoked token', async () => {
  const token = jwt.sign({ id: 2, role: 'Manager' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  revokeToken(token);
  const req = { headers: { authorization: `Bearer ${token}` } };

  const error = await runMiddleware(req);
  assert.equal(error.statusCode, 401);

  tokenBlacklist.delete(token);
});
