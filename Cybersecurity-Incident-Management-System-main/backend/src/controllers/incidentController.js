const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const { canAccessAllIncidents } = require('../middleware/authorize');
const { canTransitionStatus } = require('../utils/incidentWorkflow');

async function isAssignedIncident(incidentId, analystId) {
  const { rows } = await db.query(
    'SELECT 1 FROM incident_analysts WHERE incident_id = $1 AND analyst_id = $2 LIMIT 1',
    [incidentId, analystId]
  );
  return Boolean(rows[0]);
}

async function enforceIncidentAccess(incidentId, user) {
  if (canAccessAllIncidents(user)) return;
  const assigned = await isAssignedIncident(incidentId, user.id);
  if (!assigned) {
    throw new ApiError(403, 'You can only access incidents assigned to you');
  }
}

async function createIncident(req, res) {
  const {
    organization_id,
    title,
    description,
    type,
    severity,
    status = 'Open',
    affected_asset_ids = [],
    assigned_analyst_ids = []
  } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const incidentResult = await client.query(
      `INSERT INTO incidents (organization_id, title, description, type, severity, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, organization_id, title, description, type, severity, status, created_by, created_at`,
      [organization_id, title, description, type, severity, status, req.user.id]
    );

    const incident = incidentResult.rows[0];

    for (const assetId of affected_asset_ids) {
      await client.query(
        'INSERT INTO incident_assets (incident_id, asset_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [incident.id, assetId]
      );
    }

    for (const analystId of assigned_analyst_ids) {
      await client.query(
        'INSERT INTO incident_analysts (incident_id, analyst_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [incident.id, analystId]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Incident created',
      incident
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateIncidentStatus(req, res) {
  const incidentId = Number(req.params.id);
  const { status } = req.body;

  const incidentResult = await db.query('SELECT id, status FROM incidents WHERE id = $1', [incidentId]);
  const incident = incidentResult.rows[0];
  if (!incident) {
    throw new ApiError(404, 'Incident not found');
  }

  await enforceIncidentAccess(incidentId, req.user);

  if (!canTransitionStatus(incident.status, status)) {
    throw new ApiError(400, `Invalid status transition from ${incident.status} to ${status}`);
  }

  const { rows } = await db.query(
    'UPDATE incidents SET status = $1 WHERE id = $2 RETURNING id, status',
    [status, incidentId]
  );

  await db.query(
    'INSERT INTO remediation_actions (incident_id, analyst_id, action_taken, result) VALUES ($1, $2, $3, $4)',
    [incidentId, req.user.id, `Status changed from ${incident.status} to ${status}`, 'Pending']
  );

  res.status(200).json({
    message: 'Incident status updated',
    incident: rows[0]
  });
}

async function escalateIncident(req, res) {
  const incidentId = Number(req.params.id);
  const { severity } = req.body;

  const incidentResult = await db.query('SELECT id, severity FROM incidents WHERE id = $1', [incidentId]);
  const incident = incidentResult.rows[0];
  if (!incident) {
    throw new ApiError(404, 'Incident not found');
  }

  await enforceIncidentAccess(incidentId, req.user);

  const updateResult = await db.query(
    'UPDATE incidents SET severity = $1 WHERE id = $2 RETURNING id, severity',
    [severity, incidentId]
  );

  const assignedResult = await db.query(
    `SELECT a.analyst_id, a.name, a.email
     FROM analysts a
     JOIN incident_analysts ia ON ia.analyst_id = a.analyst_id
     WHERE ia.incident_id = $1`,
    [incidentId]
  );

  await db.query(
    'INSERT INTO remediation_actions (incident_id, analyst_id, action_taken, result) VALUES ($1, $2, $3, $4)',
    [incidentId, req.user.id, `Severity escalated from ${incident.severity} to ${severity}`, 'Pending']
  );

  res.status(200).json({
    message: 'Incident escalated and analysts notified',
    incident: updateResult.rows[0],
    notified_analysts: assignedResult.rows
  });
}

async function getIncidentById(req, res) {
  const incidentId = Number(req.params.id);
  await enforceIncidentAccess(incidentId, req.user);

  const incidentResult = await db.query('SELECT * FROM incidents WHERE id = $1', [incidentId]);
  const incident = incidentResult.rows[0];
  if (!incident) {
    throw new ApiError(404, 'Incident not found');
  }

  const [assets, analysts, remediationActions] = await Promise.all([
    db.query(
      `SELECT a.*
       FROM assets a
       JOIN incident_assets ia ON ia.asset_id = a.asset_id
       WHERE ia.incident_id = $1`,
      [incidentId]
    ),
    db.query(
      `SELECT an.analyst_id, an.name, an.email, an.role
       FROM analysts an
       JOIN incident_analysts ia ON ia.analyst_id = an.analyst_id
       WHERE ia.incident_id = $1`,
      [incidentId]
    ),
    db.query(
      `SELECT id, incident_id, analyst_id, action_taken, result, created_at
       FROM remediation_actions
       WHERE incident_id = $1
       ORDER BY created_at ASC`,
      [incidentId]
    )
  ]);

  res.status(200).json({
    ...incident,
    assets: assets.rows,
    analysts: analysts.rows,
    remediation_actions: remediationActions.rows
  });
}

async function listIncidents(req, res) {
  const { status, severity, startDate, endDate } = req.query;
  const values = [];
  const whereParts = [];

  if (!canAccessAllIncidents(req.user)) {
    values.push(req.user.id);
    whereParts.push(`i.id IN (SELECT incident_id FROM incident_analysts WHERE analyst_id = $${values.length})`);
  }

  if (status) {
    values.push(status);
    whereParts.push(`i.status = $${values.length}`);
  }

  if (severity) {
    values.push(severity);
    whereParts.push(`i.severity = $${values.length}`);
  }

  if (startDate) {
    values.push(startDate);
    whereParts.push(`i.created_at >= $${values.length}`);
  }

  if (endDate) {
    values.push(endDate);
    whereParts.push(`i.created_at <= $${values.length}`);
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
  const query = `SELECT i.* FROM incidents i ${whereClause} ORDER BY i.created_at DESC`;
  const { rows } = await db.query(query, values);

  res.status(200).json(rows);
}

module.exports = {
  createIncident,
  updateIncidentStatus,
  escalateIncident,
  getIncidentById,
  listIncidents,
  enforceIncidentAccess
};
