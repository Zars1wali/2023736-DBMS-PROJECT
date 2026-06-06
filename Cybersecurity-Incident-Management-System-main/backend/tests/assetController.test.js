const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgres://test:test@localhost/test';

const db = require('../src/config/db');
const ApiError = require('../src/utils/ApiError');
const {
  createAsset,
  updateAsset,
  deleteAsset,
  linkAssetToOrganization,
  addOrUpdateAssetVulnerability,
  updatePatchStatus,
  getUnpatchedCriticalVulnerabilities
} = require('../src/controllers/assetController');

function buildRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
}

// ---------- createAsset ----------
test('createAsset returns 201 and the new asset', async () => {
  const fakeAsset = { id: 1, organization_id: 1, type: 'Server', ip_address: '10.0.0.1' };
  db.query = async () => ({ rows: [fakeAsset] });

  const req = {
    body: { organization_id: 1, type: 'Server', os: 'Ubuntu', ip_address: '10.0.0.1', location: 'DC1', criticality: 'High' }
  };
  const res = buildRes();
  await createAsset(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.asset.id, 1);
});

// ---------- updateAsset ----------
test('updateAsset returns 200 and updated asset', async () => {
  const updated = { id: 2, type: 'Workstation', os: 'Windows', ip_address: '10.0.0.2' };
  db.query = async () => ({ rows: [updated] });

  const req = {
    params: { id: '2' },
    body: { type: 'Workstation', os: 'Windows', ip_address: '10.0.0.2', location: 'HQ', criticality: 'Low' }
  };
  const res = buildRes();
  await updateAsset(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.asset.type, 'Workstation');
});

test('updateAsset throws 404 when asset not found', async () => {
  db.query = async () => ({ rows: [] });

  const req = { params: { id: '999' }, body: { type: 'Router' } };
  const res = buildRes();

  await assert.rejects(
    () => updateAsset(req, res),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 404);
      return true;
    }
  );
});

// ---------- deleteAsset ----------
test('deleteAsset returns 200 on success', async () => {
  db.query = async () => ({ rowCount: 1 });

  const req = { params: { id: '1' } };
  const res = buildRes();
  await deleteAsset(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.message.includes('deleted'));
});

test('deleteAsset throws 404 when asset does not exist', async () => {
  db.query = async () => ({ rowCount: 0 });

  const req = { params: { id: '999' } };
  const res = buildRes();

  await assert.rejects(
    () => deleteAsset(req, res),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    }
  );
});

// ---------- linkAssetToOrganization ----------
test('linkAssetToOrganization returns 200 with updated asset', async () => {
  const updated = { id: 3, organization_id: 5 };
  db.query = async () => ({ rows: [updated] });

  const req = { params: { id: '3' }, body: { organization_id: 5 } };
  const res = buildRes();
  await linkAssetToOrganization(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.asset.organization_id, 5);
});

test('linkAssetToOrganization throws 404 when asset not found', async () => {
  db.query = async () => ({ rows: [] });

  const req = { params: { id: '999' }, body: { organization_id: 1 } };
  const res = buildRes();

  await assert.rejects(
    () => linkAssetToOrganization(req, res),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    }
  );
});

// ---------- addOrUpdateAssetVulnerability ----------
test('addOrUpdateAssetVulnerability upserts vulnerability and linkage', async () => {
  const fakeVuln = { id: 1, cve_id: 'CVE-2024-1234', description: 'Test vuln', cvss_score: 9.8 };
  const fakeLinkage = { asset_id: 1, vulnerability_id: 1, patch_status: 'unpatched' };

  let callCount = 0;
  db.query = async () => {
    callCount++;
    if (callCount === 1) return { rows: [fakeVuln] };
    return { rows: [fakeLinkage] };
  };

  const req = {
    params: { id: '1' },
    body: { cve_id: 'CVE-2024-1234', description: 'Test vuln', cvss_score: 9.8, patch_status: 'unpatched' }
  };
  const res = buildRes();
  await addOrUpdateAssetVulnerability(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.vulnerability.cve_id, 'CVE-2024-1234');
  assert.equal(res.body.asset_vulnerability.patch_status, 'unpatched');
});

// ---------- updatePatchStatus ----------
test('updatePatchStatus returns 200 when mapping exists', async () => {
  const updated = { asset_id: 1, vulnerability_id: 2, patch_status: 'patched' };
  db.query = async () => ({ rows: [updated] });

  const req = {
    params: { id: '1', vulnerabilityId: '2' },
    body: { patch_status: 'patched' }
  };
  const res = buildRes();
  await updatePatchStatus(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.asset_vulnerability.patch_status, 'patched');
});

test('updatePatchStatus throws 404 when mapping not found', async () => {
  db.query = async () => ({ rows: [] });

  const req = { params: { id: '999', vulnerabilityId: '999' }, body: { patch_status: 'patched' } };
  const res = buildRes();

  await assert.rejects(
    () => updatePatchStatus(req, res),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    }
  );
});

// ---------- getUnpatchedCriticalVulnerabilities ----------
test('getUnpatchedCriticalVulnerabilities returns list of critical unpatched vulns', async () => {
  const fakeVulns = [
    { asset_id: 1, cve_id: 'CVE-2024-0001', cvss_score: 9.9, patch_status: 'unpatched' },
    { asset_id: 2, cve_id: 'CVE-2024-0002', cvss_score: 9.1, patch_status: 'unpatched' }
  ];
  db.query = async () => ({ rows: fakeVulns });

  const req = {};
  const res = buildRes();
  await getUnpatchedCriticalVulnerabilities(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.length, 2);
  assert.equal(res.body[0].cve_id, 'CVE-2024-0001');
});
