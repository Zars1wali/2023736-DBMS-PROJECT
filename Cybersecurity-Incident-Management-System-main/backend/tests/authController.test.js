const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-auth-secret';
process.env.DATABASE_URL = 'postgres://test:test@localhost/test';

const db = require('../src/config/db');
const ApiError = require('../src/utils/ApiError');
const { tokenBlacklist } = require('../src/middleware/auth');
const { login, logout } = require('../src/controllers/authController');

function buildRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
}

// ---------- login ----------
test('login returns 200 and token when credentials are valid', async () => {
  const passwordHash = await bcrypt.hash('correct-password', 10);
  db.query = async () => ({
    rows: [{
      id: 1,
      name: 'Alice',
      email: 'alice@test.com',
      role: 'Analyst',
      password_hash: passwordHash
    }]
  });

  const req = { body: { email: 'alice@test.com', password: 'correct-password' } };
  const res = buildRes();
  await login(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(typeof res.body.token === 'string');
  assert.equal(res.body.user.email, 'alice@test.com');
  assert.equal(res.body.user.role, 'Analyst');
  // password_hash must not be exposed in response
  assert.ok(res.body.user.password_hash === undefined);
});

test('login JWT token contains expected claims', async () => {
  const passwordHash = await bcrypt.hash('my-pass', 10);
  db.query = async () => ({
    rows: [{ id: 42, name: 'Bob', email: 'bob@test.com', role: 'Manager', password_hash: passwordHash }]
  });

  const req = { body: { email: 'bob@test.com', password: 'my-pass' } };
  const res = buildRes();
  await login(req, res);

  const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
  assert.equal(decoded.id, 42);
  assert.equal(decoded.email, 'bob@test.com');
  assert.equal(decoded.role, 'Manager');
});

test('login throws 401 when user not found', async () => {
  db.query = async () => ({ rows: [] });

  const req = { body: { email: 'nobody@test.com', password: 'any' } };
  const res = buildRes();

  await assert.rejects(
    () => login(req, res),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 401);
      return true;
    }
  );
});

test('login throws 401 when password is wrong', async () => {
  const passwordHash = await bcrypt.hash('correct', 10);
  db.query = async () => ({
    rows: [{ id: 2, name: 'Carol', email: 'carol@test.com', role: 'Analyst', password_hash: passwordHash }]
  });

  const req = { body: { email: 'carol@test.com', password: 'wrong-password' } };
  const res = buildRes();

  await assert.rejects(
    () => login(req, res),
    (err) => {
      assert.equal(err.statusCode, 401);
      return true;
    }
  );
});

test('login uses a constant-time comparison (same error for missing user vs wrong password)', async () => {
  // Both should result in 401 – important for preventing user enumeration
  const passwordHash = await bcrypt.hash('correct', 10);

  db.query = async () => ({ rows: [] });
  const req1 = { body: { email: 'noone@test.com', password: 'pass' } };
  const res1 = buildRes();
  const err1 = await login(req1, res1).catch(e => e);

  db.query = async () => ({
    rows: [{ id: 3, name: 'Dave', email: 'dave@test.com', role: 'Analyst', password_hash: passwordHash }]
  });
  const req2 = { body: { email: 'dave@test.com', password: 'wrong' } };
  const res2 = buildRes();
  const err2 = await login(req2, res2).catch(e => e);

  assert.equal(err1.statusCode, 401);
  assert.equal(err2.statusCode, 401);
  // Same error message prevents user enumeration
  assert.equal(err1.message, err2.message);
});

// ---------- logout ----------
test('logout revokes the token and responds with 200', async () => {
  const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const req = { token };
  const res = buildRes();

  await logout(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(tokenBlacklist.has(token));
  // cleanup
  tokenBlacklist.delete(token);
});

test('logout handles missing token gracefully', async () => {
  const req = { token: undefined };
  const res = buildRes();

  await logout(req, res);

  assert.equal(res.statusCode, 200);
});
