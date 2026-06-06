const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgres://test:test@localhost/test';

const db = require('../src/config/db');
const ApiError = require('../src/utils/ApiError');
const { logRemediationAction, getRemediationTrail } = require('../src/controllers/remediationController');

function buildRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
}

function adminUser() {
  return { id: 1, role: 'Admin', email: 'admin@test.com', name: 'Admin' };
}

// ---------- logRemediationAction ----------
test('logRemediationAction creates a remediation action for an accessible incident', async () => {
  const fakeAction = {
    id: 1,
    incident_id: 5,
    analyst_id: 1,
    action_taken: 'Isolated the host',
    result: 'Successful',
    created_at: new Date()
  };

  db.query = async (text) => {
    // Access check: admin bypasses incident_analysts lookup
    if (text.includes('incident_analysts')) return { rows: [{ incident_id: 5, analyst_id: 1 }] };
    if (text.includes('INSERT INTO remediation_actions')) return { rows: [fakeAction] };
    return { rows: [] };
  };

  const req = {
    params: { incidentId: '5' },
    body: { action_taken: 'Isolated the host', result: 'Successful' },
    user: adminUser()
  };
  const res = buildRes();
  await logRemediationAction(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.remediation_action.action_taken, 'Isolated the host');
});

test('logRemediationAction uses req.user.id as analyst_id when not explicitly provided', async () => {
  const capturedParams = [];
  db.query = async (text, params) => {
    capturedParams.push({ text, params });
    if (text.includes('incident_analysts')) return { rows: [{ incident_id: 5, analyst_id: 1 }] };
    if (text.includes('INSERT INTO remediation_actions')) {
      return { rows: [{ id: 2, incident_id: 5, analyst_id: params[1], action_taken: params[2], result: params[3] }] };
    }
    return { rows: [] };
  };

  const req = {
    params: { incidentId: '5' },
    body: { action_taken: 'Blocked IP', result: 'Successful' },
    user: adminUser()
  };
  const res = buildRes();
  await logRemediationAction(req, res);

  const insertCall = capturedParams.find(c => c.text.includes('INSERT INTO remediation_actions'));
  assert.ok(insertCall);
  assert.equal(insertCall.params[1], 1); // req.user.id
});

test('logRemediationAction accepts explicit analyst_id override', async () => {
  const capturedParams = [];
  db.query = async (text, params) => {
    capturedParams.push({ text, params });
    if (text.includes('incident_analysts')) return { rows: [{ incident_id: 5, analyst_id: 1 }] };
    if (text.includes('INSERT INTO remediation_actions')) {
      return { rows: [{ id: 3, incident_id: 5, analyst_id: params[1] }] };
    }
    return { rows: [] };
  };

  const req = {
    params: { incidentId: '5' },
    body: { analyst_id: 99, action_taken: 'Patched', result: 'Successful' },
    user: adminUser()
  };
  const res = buildRes();
  await logRemediationAction(req, res);

  const insertCall = capturedParams.find(c => c.text.includes('INSERT INTO remediation_actions'));
  assert.equal(insertCall.params[1], 99);
});

// ---------- getRemediationTrail ----------
test('getRemediationTrail returns sorted list of actions', async () => {
  const fakeTrail = [
    { id: 1, incident_id: 5, analyst_id: 1, analyst_name: 'Alice', action_taken: 'Detected', result: 'Pending', created_at: new Date() },
    { id: 2, incident_id: 5, analyst_id: 1, analyst_name: 'Alice', action_taken: 'Isolated', result: 'Successful', created_at: new Date() }
  ];

  db.query = async (text) => {
    if (text.includes('incident_analysts')) return { rows: [{ incident_id: 5, analyst_id: 1 }] };
    if (text.includes('FROM remediation_actions')) return { rows: fakeTrail };
    return { rows: [] };
  };

  const req = { params: { incidentId: '5' }, user: adminUser() };
  const res = buildRes();
  await getRemediationTrail(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.length, 2);
  assert.equal(res.body[0].action_taken, 'Detected');
});

test('getRemediationTrail throws 404 when no actions exist', async () => {
  db.query = async (text) => {
    if (text.includes('incident_analysts')) return { rows: [{ incident_id: 9, analyst_id: 1 }] };
    return { rows: [] };
  };

  const req = { params: { incidentId: '9' }, user: adminUser() };
  const res = buildRes();

  await assert.rejects(
    () => getRemediationTrail(req, res),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 404);
      return true;
    }
  );
});
