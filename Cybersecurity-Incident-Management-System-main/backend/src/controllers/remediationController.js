const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const { enforceIncidentAccess } = require('./incidentController');

async function logRemediationAction(req, res) {
  const incidentId = Number(req.params.incidentId);
  const { analyst_id, action_taken, result } = req.body;

  await enforceIncidentAccess(incidentId, req.user);

  const { rows } = await db.query(
    `INSERT INTO remediation_actions (incident_id, analyst_id, action_taken, result)
     VALUES ($1, $2, $3, $4)
     RETURNING id, incident_id, analyst_id, action_taken, result, created_at`,
    [incidentId, analyst_id ?? req.user.id, action_taken, result]
  );

  res.status(201).json({ message: 'Remediation action logged', remediation_action: rows[0] });
}

async function getRemediationTrail(req, res) {
  const incidentId = Number(req.params.incidentId);
  await enforceIncidentAccess(incidentId, req.user);

  const { rows } = await db.query(
    `SELECT ra.id,
            ra.incident_id,
            ra.analyst_id,
            a.name AS analyst_name,
            ra.action_taken,
            ra.result,
            ra.created_at
     FROM remediation_actions ra
     LEFT JOIN analysts a ON a.analyst_id = ra.analyst_id
     WHERE ra.incident_id = $1
     ORDER BY ra.created_at ASC`,
    [incidentId]
  );

  if (!rows.length) {
    throw new ApiError(404, 'No remediation actions found for this incident');
  }

  res.status(200).json(rows);
}

async function getAllRemediations(_req, res) {
  const { rows } = await db.query(
    `SELECT ra.*, a.name as analyst_name, i.title as incident_title 
     FROM remediation_actions ra
     LEFT JOIN analysts a ON a.analyst_id = ra.analyst_id
     LEFT JOIN incidents i ON i.id = ra.incident_id
     ORDER BY ra.created_at DESC`
  );
  res.status(200).json(rows);
}

module.exports = {
  logRemediationAction,
  getRemediationTrail,
  getAllRemediations
};

