const express = require('express');
const { logRemediationAction, getRemediationTrail, getAllRemediations } = require('../controllers/remediationController');
const asyncHandler = require('../utils/asyncHandler');
const { requireFields, validateEnum } = require('../middleware/validate');
const { REMEDIATION_RESULTS } = require('../utils/constants');

const router = express.Router();

router.post(
  '/incidents/:incidentId/actions',
  requireFields(['action_taken', 'result']),
  validateEnum('result', REMEDIATION_RESULTS),
  asyncHandler(logRemediationAction)
);
router.get('/all', asyncHandler(getAllRemediations));
router.get('/incidents/:incidentId/actions', asyncHandler(getRemediationTrail));


module.exports = router;
