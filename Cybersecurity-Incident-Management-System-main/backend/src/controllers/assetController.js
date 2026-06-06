const db = require('../config/db');
const ApiError = require('../utils/ApiError');

async function createAsset(req, res) {
  const { organization_id, type, os, ip_address, location, criticality } = req.body;
  const { rows } = await db.query(
    `INSERT INTO assets (organization_id, type, os, ip_address, location, criticality)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [organization_id, type, os, ip_address, location, criticality]
  );

  res.status(201).json({ message: 'Asset created', asset: rows[0] });
}

async function updateAsset(req, res) {
  const assetId = Number(req.params.id);
  const { type, os, ip_address, location, criticality } = req.body;

  const { rows } = await db.query(
    `UPDATE assets
     SET type = $1, os = $2, ip_address = $3, location = $4, criticality = $5, updated_at = NOW()
     WHERE asset_id = $6
     RETURNING *`,
    [type, os, ip_address, location, criticality, assetId]
  );

  if (!rows[0]) {
    throw new ApiError(404, 'Asset not found');
  }

  res.status(200).json({ message: 'Asset updated', asset: rows[0] });
}

async function deleteAsset(req, res) {
  const assetId = Number(req.params.id);
  const { rowCount } = await db.query('DELETE FROM assets WHERE asset_id = $1', [assetId]);

  if (!rowCount) {
    throw new ApiError(404, 'Asset not found');
  }

  res.status(200).json({ message: 'Asset deleted' });
}

async function linkAssetToOrganization(req, res) {
  const assetId = Number(req.params.id);
  const { organization_id } = req.body;

  const { rows } = await db.query(
    'UPDATE assets SET organization_id = $1, updated_at = NOW() WHERE asset_id = $2 RETURNING *',
    [organization_id, assetId]
  );

  if (!rows[0]) {
    throw new ApiError(404, 'Asset not found');
  }

  res.status(200).json({ message: 'Asset linked to organization', asset: rows[0] });
}

async function addOrUpdateAssetVulnerability(req, res) {
  const assetId = Number(req.params.id);
  const { cve_id, description, cvss_score, patch_status } = req.body;

  const vulnerabilityResult = await db.query(
    `INSERT INTO vulnerabilities (cve_id, description, cvss_score)
     VALUES ($1, $2, $3)
     ON CONFLICT (cve_id)
     DO UPDATE SET description = EXCLUDED.description, cvss_score = EXCLUDED.cvss_score
     RETURNING id, cve_id, description, cvss_score`,
    [cve_id, description, cvss_score]
  );

  const vulnerability = vulnerabilityResult.rows[0];

  const linkageResult = await db.query(
    `INSERT INTO asset_vulnerabilities (asset_id, vulnerability_id, patch_status)
     VALUES ($1, $2, $3)
     ON CONFLICT (asset_id, vulnerability_id)
     DO UPDATE SET patch_status = EXCLUDED.patch_status, updated_at = NOW()
     RETURNING *`,
    [assetId, vulnerability.id, patch_status]
  );

  res.status(201).json({
    message: 'Asset vulnerability upserted',
    vulnerability,
    asset_vulnerability: linkageResult.rows[0]
  });
}

async function updatePatchStatus(req, res) {
  const assetId = Number(req.params.id);
  const vulnerabilityId = Number(req.params.vulnerabilityId);
  const { patch_status } = req.body;

  const { rows } = await db.query(
    `UPDATE asset_vulnerabilities
     SET patch_status = $1, updated_at = NOW()
     WHERE asset_id = $2 AND vulnerability_id = $3
     RETURNING *`,
    [patch_status, assetId, vulnerabilityId]
  );

  if (!rows[0]) {
    throw new ApiError(404, 'Asset vulnerability mapping not found');
  }

  res.status(200).json({ message: 'Patch status updated', asset_vulnerability: rows[0] });
}

async function getUnpatchedCriticalVulnerabilities(_req, res) {
  const { rows } = await db.query(
    `SELECT a.asset_id,
            a.type AS asset_type,
            a.ip_address,
            v.id AS vulnerability_id,
            v.cve_id,
            v.cvss_score,
            av.patch_status
     FROM asset_vulnerabilities av
     JOIN assets a ON a.asset_id = av.asset_id
     JOIN vulnerabilities v ON v.id = av.vulnerability_id
     WHERE av.patch_status = $1 AND v.cvss_score >= $2
     ORDER BY v.cvss_score DESC NULLS LAST`,
    ['Unpatched', 9.0]
  );

  res.status(200).json(rows);
}

async function getAllAssets(_req, res) {
  const { rows } = await db.query(
    'SELECT a.*, o.name as organization_name FROM assets a LEFT JOIN organizations o ON a.organization_id = o.org_id ORDER BY a.asset_id'
  );
  res.status(200).json(rows);
}

async function getAllVulnerabilities(_req, res) {
  const { rows } = await db.query('SELECT * FROM vulnerabilities ORDER BY cvss_score DESC');
  res.status(200).json(rows);
}


module.exports = {
  createAsset,
  updateAsset,
  deleteAsset,
  linkAssetToOrganization,
  addOrUpdateAssetVulnerability,
  updatePatchStatus,
  getUnpatchedCriticalVulnerabilities,
  getAllAssets,
  getAllVulnerabilities
};


