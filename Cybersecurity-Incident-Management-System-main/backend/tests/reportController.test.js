const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgres://test:test@localhost/test';

const db = require('../src/config/db');
const {
  openIncidentsBySeverity,
  analystWorkload,
  unpatchedVulnerabilitiesByAsset,
  incidentTimeline
} = require('../src/controllers/reportController');

function buildRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
}

// ---------- openIncidentsBySeverity ----------
test('openIncidentsBySeverity returns severity counts', async () => {
  const fakeData = [
    { severity: 'Critical', open_count: 3 },
    { severity: 'High', open_count: 5 }
  ];
  db.query = async () => ({ rows: fakeData });

  const req = {};
  const res = buildRes();
  await openIncidentsBySeverity(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.length, 2);
  assert.equal(res.body[0].severity, 'Critical');
  assert.equal(res.body[0].open_count, 3);
});

test('openIncidentsBySeverity passes correct status filters to query', async () => {
  const capturedParams = [];
  db.query = async (text, params) => {
    capturedParams.push(...(params || []));
    return { rows: [] };
  };

  const req = {};
  const res = buildRes();
  await openIncidentsBySeverity(req, res);

  assert.ok(capturedParams.includes('Open'));
  assert.ok(capturedParams.includes('In Progress'));
});

// ---------- analystWorkload ----------
test('analystWorkload returns analyst incident counts', async () => {
  const fakeData = [
    { analyst_id: 1, analyst_name: 'Alice', active_incidents: 4 },
    { analyst_id: 2, analyst_name: 'Bob', active_incidents: 2 }
  ];
  db.query = async () => ({ rows: fakeData });

  const req = {};
  const res = buildRes();
  await analystWorkload(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body[0].analyst_name, 'Alice');
  assert.equal(res.body[0].active_incidents, 4);
});

test('analystWorkload includes analysts with zero incidents', async () => {
  const fakeData = [
    { analyst_id: 3, analyst_name: 'Carol', active_incidents: 0 }
  ];
  db.query = async () => ({ rows: fakeData });

  const req = {};
  const res = buildRes();
  await analystWorkload(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body[0].active_incidents, 0);
});

// ---------- unpatchedVulnerabilitiesByAsset ----------
test('unpatchedVulnerabilitiesByAsset returns unpatched counts per asset', async () => {
  const fakeData = [
    { asset_id: 1, asset_type: 'Server', ip_address: '10.0.0.1', unpatched_vulnerability_count: 3 },
    { asset_id: 2, asset_type: 'Workstation', ip_address: '10.0.0.2', unpatched_vulnerability_count: 0 }
  ];
  db.query = async () => ({ rows: fakeData });

  const req = {};
  const res = buildRes();
  await unpatchedVulnerabilitiesByAsset(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.length, 2);
  assert.equal(res.body[0].unpatched_vulnerability_count, 3);
});

// ---------- incidentTimeline ----------
test('incidentTimeline returns events sorted by time', async () => {
  const fakeTimeline = [
    { event_type: 'incident_created', event_time: new Date('2024-01-01'), details: 'Incident created with status Open' },
    { event_type: 'remediation_action', event_time: new Date('2024-01-02'), details: 'Patched CVE-2024-001' }
  ];
  db.query = async () => ({ rows: fakeTimeline });

  const req = { params: { incidentId: '1' } };
  const res = buildRes();
  await incidentTimeline(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.length, 2);
  assert.equal(res.body[0].event_type, 'incident_created');
  assert.equal(res.body[1].event_type, 'remediation_action');
});

test('incidentTimeline passes incidentId as parameterized query', async () => {
  const capturedParams = [];
  db.query = async (text, params) => {
    capturedParams.push(...(params || []));
    return { rows: [] };
  };

  const req = { params: { incidentId: '7' } };
  const res = buildRes();
  await incidentTimeline(req, res);

  assert.ok(capturedParams.includes(7));
});
