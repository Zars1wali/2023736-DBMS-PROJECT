const db = require('../config/db');

async function openIncidentsBySeverity(_req, res) {
  const { rows } = await db.query(
    `SELECT severity, COUNT(*)::int AS open_count
     FROM incidents
     WHERE status IN ($1, $2)
     GROUP BY severity
     ORDER BY open_count DESC`,
    ['Open', 'In Progress']
  );

  res.status(200).json(rows);
}

async function analystWorkload(_req, res) {
  const { rows } = await db.query(
    `SELECT a.analyst_id,
            a.name AS analyst_name,
            COUNT(DISTINCT ia.incident_id)::int AS active_incidents
     FROM analysts a
     LEFT JOIN incident_analysts ia ON ia.analyst_id = a.analyst_id
     LEFT JOIN incidents i ON i.id = ia.incident_id AND i.status IN ($1, $2)
     GROUP BY a.analyst_id, a.name
     ORDER BY active_incidents DESC, analyst_name ASC`,
    ['Open', 'In Progress']
  );

  res.status(200).json(rows);
}

async function unpatchedVulnerabilitiesByAsset(_req, res) {
  const { rows } = await db.query(
    `SELECT a.asset_id,
            a.type AS asset_type,
            a.ip_address,
            COUNT(av.vulnerability_id)::int AS unpatched_vulnerability_count
     FROM assets a
     LEFT JOIN asset_vulnerabilities av ON av.asset_id = a.asset_id AND av.patch_status = $1
     GROUP BY a.asset_id, a.type, a.ip_address
     ORDER BY unpatched_vulnerability_count DESC`,
    ['Unpatched']
  );


  res.status(200).json(rows);
}

async function incidentTimeline(req, res) {
  const incidentId = Number(req.params.incidentId);

  const { rows } = await db.query(
    `SELECT 'incident_created' AS event_type,
            i.created_at AS event_time,
            CONCAT('Incident created with status ', i.status) AS details
     FROM incidents i
     WHERE i.id = $1
     UNION ALL
     SELECT 'remediation_action' AS event_type,
            ra.created_at AS event_time,
            ra.action_taken AS details
     FROM remediation_actions ra
     WHERE ra.incident_id = $1
     ORDER BY event_time ASC`,
    [incidentId]
  );

  res.status(200).json(rows);
}

module.exports = {
  openIncidentsBySeverity,
  analystWorkload,
  unpatchedVulnerabilitiesByAsset,
  incidentTimeline
};
