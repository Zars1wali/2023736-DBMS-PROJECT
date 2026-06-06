const ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  LEAD: 'Lead',
  SENIOR: 'Senior',
  JUNIOR: 'Junior'
};

const INCIDENT_STATUSES = ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'];
const INCIDENT_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const REMEDIATION_RESULTS = ['Pending', 'In Progress', 'Successful', 'Partial', 'Failed'];
const PATCH_STATUSES = ['Patched', 'Unpatched', 'Excluded', 'In Progress'];

module.exports = {
  ROLES,
  INCIDENT_STATUSES,
  INCIDENT_SEVERITIES,
  REMEDIATION_RESULTS,
  PATCH_STATUSES
};

