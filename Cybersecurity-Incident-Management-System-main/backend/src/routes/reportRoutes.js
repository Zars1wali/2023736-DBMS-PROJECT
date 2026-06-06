const express = require('express');
const {
  openIncidentsBySeverity,
  analystWorkload,
  unpatchedVulnerabilitiesByAsset,
  incidentTimeline
} = require('../controllers/reportController');
const asyncHandler = require('../utils/asyncHandler');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.get('/open-incidents-by-severity', authorize(ROLES.ADMIN, ROLES.MANAGER), asyncHandler(openIncidentsBySeverity));
router.get('/analyst-workload', authorize(ROLES.ADMIN, ROLES.MANAGER), asyncHandler(analystWorkload));
router.get('/unpatched-vulnerabilities-by-asset', authorize(ROLES.ADMIN, ROLES.MANAGER), asyncHandler(unpatchedVulnerabilitiesByAsset));
router.get('/incidents/:incidentId/timeline', asyncHandler(incidentTimeline));

module.exports = router;
