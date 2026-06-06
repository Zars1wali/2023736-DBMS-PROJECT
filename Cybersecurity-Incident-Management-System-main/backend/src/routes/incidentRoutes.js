const express = require('express');
const {
  createIncident,
  updateIncidentStatus,
  escalateIncident,
  getIncidentById,
  listIncidents
} = require('../controllers/incidentController');
const asyncHandler = require('../utils/asyncHandler');
const { authorize } = require('../middleware/authorize');
const { apiRateLimiter } = require('../middleware/rateLimit');
const { ROLES, INCIDENT_SEVERITIES, INCIDENT_STATUSES } = require('../utils/constants');
const { requireFields, validateEnum } = require('../middleware/validate');

const router = express.Router();
router.use(apiRateLimiter);

router.get('/', asyncHandler(listIncidents));
router.get('/:id', asyncHandler(getIncidentById));
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  requireFields(['organization_id', 'title', 'type', 'severity']),
  validateEnum('severity', INCIDENT_SEVERITIES),
  asyncHandler(createIncident)
);
router.patch(
  '/:id/status',
  validateEnum('status', INCIDENT_STATUSES),
  requireFields(['status']),
  asyncHandler(updateIncidentStatus)
);
router.patch(
  '/:id/escalate',
  validateEnum('severity', INCIDENT_SEVERITIES),
  requireFields(['severity']),
  asyncHandler(escalateIncident)
);

module.exports = router;
