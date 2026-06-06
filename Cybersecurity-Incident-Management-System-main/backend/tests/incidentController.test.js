const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgres://test:test@localhost/test';

const db = require('../src/config/db');
const ApiError = require('../src/utils/ApiError');

function buildRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
}

function adminUser() {
  return { id: 1, role: 'Admin', email: 'admin@test.com', name: 'Admin User' };
}

function analystUser() {
  return { id: 10, role: 'Analyst', email: 'analyst@test.com', name: 'Test Analyst' };
}

// Patch pool.connect to return a mock client
function mockPoolClient(queryFn) {
  const client = {
    query: queryFn,
    release: () => {}
  };
  db.pool = { connect: async () => client };
  return client;
}

const {
  createIncident,
  updateIncidentStatus,
  escalateIncident,
  getIncidentById,
  listIncidents
} = require('../src/controllers/incidentController');

// ---------- listIncidents ----------
test('listIncidents returns all incidents for Admin', async () => {
  const fakeIncidents = [
    { id: 1, title: 'Breach', severity: 'High', status: 'Open' },
    { id: 2, title: 'Malware', severity: 'Critical', status: 'In Progress' }
  ];
  db.query = async () => ({ rows: fakeIncidents });

  const req = { query: {}, user: adminUser() };
  const res = buildRes();
  await listIncidents(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, fakeIncidents);
});

test('listIncidents filters by assigned analyst for Analyst role', async () => {
  const fakeIncidents = [{ id: 3, title: 'Phishing', severity: 'Medium', status: 'Open' }];
  const capturedQuery = [];
  db.query = async (text, params) => {
    capturedQuery.push({ text, params });
    return { rows: fakeIncidents };
  };

  const req = { query: {}, user: analystUser() };
  const res = buildRes();
  await listIncidents(req, res);

  assert.equal(res.statusCode, 200);
  // Should include analyst_id filter in WHERE clause
  assert.ok(capturedQuery[0].text.includes('incident_analysts'));
  assert.ok(capturedQuery[0].params.includes(10));
});

test('listIncidents applies status query filter', async () => {
  const capturedParams = [];
  db.query = async (text, params) => {
    capturedParams.push(...(params || []));
    return { rows: [] };
  };

  const req = { query: { status: 'Open' }, user: adminUser() };
  const res = buildRes();
  await listIncidents(req, res);

  assert.ok(capturedParams.includes('Open'));
});

test('listIncidents applies severity query filter', async () => {
  const capturedParams = [];
  db.query = async (text, params) => {
    capturedParams.push(...(params || []));
    return { rows: [] };
  };

  const req = { query: { severity: 'Critical' }, user: adminUser() };
  const res = buildRes();
  await listIncidents(req, res);

  assert.ok(capturedParams.includes('Critical'));
});

// ---------- updateIncidentStatus ----------
test('updateIncidentStatus transitions Open -> In Progress successfully', async () => {
  let callCount = 0;
  db.query = async (text, params) => {
    callCount++;
    if (text.includes('SELECT id, status')) {
      return { rows: [{ id: 1, status: 'Open' }] };
    }
    if (text.includes('incident_analysts')) {
      return { rows: [{ incident_id: 1, analyst_id: 1 }] };
    }
    if (text.includes('UPDATE incidents')) {
      return { rows: [{ id: 1, status: 'In Progress', updated_at: new Date() }] };
    }
    if (text.includes('INSERT INTO remediation_actions')) {
      return { rows: [] };
    }
    return { rows: [] };
  };

  const req = {
    params: { id: '1' },
    body: { status: 'In Progress' },
    user: adminUser()
  };
  const res = buildRes();
  await updateIncidentStatus(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.message.includes('updated'));
});

test('updateIncidentStatus throws 404 when incident not found', async () => {
  db.query = async () => ({ rows: [] });

  const req = { params: { id: '999' }, body: { status: 'In Progress' }, user: adminUser() };
  const res = buildRes();

  await assert.rejects(
    () => updateIncidentStatus(req, res),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 404);
      return true;
    }
  );
});

test('updateIncidentStatus rejects invalid status transition', async () => {
  db.query = async (text) => {
    if (text.includes('SELECT id, status')) {
      return { rows: [{ id: 1, status: 'Open' }] };
    }
    if (text.includes('incident_analysts')) {
      return { rows: [{ incident_id: 1, analyst_id: 1 }] };
    }
    return { rows: [] };
  };

  const req = {
    params: { id: '1' },
    body: { status: 'Closed' },
    user: adminUser()
  };
  const res = buildRes();

  await assert.rejects(
    () => updateIncidentStatus(req, res),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 400);
      assert.ok(err.message.includes('transition'));
      return true;
    }
  );
});

// ---------- escalateIncident ----------
test('escalateIncident updates severity successfully', async () => {
  db.query = async (text) => {
    if (text.includes('SELECT id, severity')) {
      return { rows: [{ id: 1, severity: 'Low' }] };
    }
    if (text.includes('incident_analysts')) {
      return { rows: [{ incident_id: 1, analyst_id: 1 }] };
    }
    if (text.includes('UPDATE incidents')) {
      return { rows: [{ id: 1, severity: 'Critical', updated_at: new Date() }] };
    }
    if (text.includes('JOIN incident_analysts')) {
      return { rows: [{ id: 1, name: 'Alice', email: 'alice@test.com' }] };
    }
    if (text.includes('INSERT INTO remediation_actions')) {
      return { rows: [] };
    }
    return { rows: [] };
  };

  const req = {
    params: { id: '1' },
    body: { severity: 'Critical' },
    user: adminUser()
  };
  const res = buildRes();
  await escalateIncident(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.message.includes('escalated'));
});

test('escalateIncident throws 404 when incident not found', async () => {
  db.query = async () => ({ rows: [] });

  const req = { params: { id: '404' }, body: { severity: 'High' }, user: adminUser() };
  const res = buildRes();

  await assert.rejects(
    () => escalateIncident(req, res),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    }
  );
});

// ---------- getIncidentById ----------
test('getIncidentById returns incident with assets, analysts, remediation actions', async () => {
  const fakeIncident = { id: 5, title: 'DDoS', severity: 'High', status: 'Open' };

  db.query = async (text) => {
    if (text.includes('incident_analysts WHERE incident_id') && text.includes('analyst_id = $2')) {
      return { rows: [{ incident_id: 5, analyst_id: 1 }] };
    }
    if (text.includes('SELECT * FROM incidents')) {
      return { rows: [fakeIncident] };
    }
    // parallel queries: assets, analysts, remediation
    if (text.includes('FROM assets')) return { rows: [{ id: 1, type: 'Server' }] };
    if (text.includes('FROM analysts')) return { rows: [{ id: 1, name: 'Alice', role: 'Analyst' }] };
    if (text.includes('FROM remediation_actions')) return { rows: [] };
    return { rows: [] };
  };

  const req = { params: { id: '5' }, user: adminUser() };
  const res = buildRes();
  await getIncidentById(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.id, 5);
  assert.ok(Array.isArray(res.body.assets));
  assert.ok(Array.isArray(res.body.analysts));
  assert.ok(Array.isArray(res.body.remediation_actions));
});

test('getIncidentById throws 404 when incident not found', async () => {
  db.query = async (text) => {
    if (text.includes('incident_analysts') && text.includes('analyst_id = $2')) {
      return { rows: [{ incident_id: 999, analyst_id: 1 }] };
    }
    return { rows: [] };
  };

  const req = { params: { id: '999' }, user: adminUser() };
  const res = buildRes();

  await assert.rejects(
    () => getIncidentById(req, res),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    }
  );
});

// ---------- createIncident ----------
test('createIncident creates incident, links assets and analysts in a transaction', async () => {
  const fakeIncident = {
    id: 7,
    organization_id: 1,
    title: 'New Incident',
    severity: 'High',
    status: 'Open',
    created_by: 1,
    created_at: new Date(),
    updated_at: new Date()
  };

  const clientQueries = [];
  const mockClient = {
    query: async (text, params) => {
      clientQueries.push({ text, params });
      if (text === 'BEGIN' || text === 'COMMIT') return {};
      if (text.includes('INSERT INTO incidents')) return { rows: [fakeIncident] };
      return { rows: [] };
    },
    release: () => {}
  };
  db.pool = { connect: async () => mockClient };

  const req = {
    body: {
      organization_id: 1,
      title: 'New Incident',
      description: 'Test',
      type: 'Malware',
      severity: 'High',
      affected_asset_ids: [10, 11],
      assigned_analyst_ids: [5]
    },
    user: adminUser()
  };
  const res = buildRes();
  await createIncident(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.incident.id, 7);
  // Transaction: BEGIN and COMMIT were called
  assert.ok(clientQueries.some(q => q.text === 'BEGIN'));
  assert.ok(clientQueries.some(q => q.text === 'COMMIT'));
  // Asset and analyst links
  assert.ok(clientQueries.some(q => q.text.includes('incident_assets')));
  assert.ok(clientQueries.some(q => q.text.includes('incident_analysts')));
});

test('createIncident rolls back transaction on error', async () => {
  const clientQueries = [];
  const mockClient = {
    query: async (text) => {
      clientQueries.push(text);
      if (text === 'BEGIN' || text === 'ROLLBACK') return {};
      throw new Error('DB failure');
    },
    release: () => {}
  };
  db.pool = { connect: async () => mockClient };

  const req = {
    body: {
      organization_id: 1,
      title: 'Fail Incident',
      type: 'DDoS',
      severity: 'Critical'
    },
    user: adminUser()
  };
  const res = buildRes();

  await assert.rejects(() => createIncident(req, res));
  assert.ok(clientQueries.includes('ROLLBACK'));
});
