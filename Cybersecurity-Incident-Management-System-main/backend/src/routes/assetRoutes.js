const express = require('express');
const {
  createAsset,
  updateAsset,
  deleteAsset,
  linkAssetToOrganization,
  addOrUpdateAssetVulnerability,
  updatePatchStatus,
  getUnpatchedCriticalVulnerabilities,
  getAllAssets,
  getAllVulnerabilities
} = require('../controllers/assetController');

const asyncHandler = require('../utils/asyncHandler');
const { authorize } = require('../middleware/authorize');
const { ROLES, PATCH_STATUSES } = require('../utils/constants');
const { requireFields, validateEnum } = require('../middleware/validate');

const router = express.Router();

router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER), requireFields(['organization_id', 'type', 'ip_address']), asyncHandler(createAsset));
router.put('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER), asyncHandler(updateAsset));
router.delete('/:id', authorize(ROLES.ADMIN), asyncHandler(deleteAsset));
router.patch('/:id/organization', authorize(ROLES.ADMIN, ROLES.MANAGER), requireFields(['organization_id']), asyncHandler(linkAssetToOrganization));
router.post(
  '/:id/vulnerabilities',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  requireFields(['cve_id', 'cvss_score', 'patch_status']),
  validateEnum('patch_status', PATCH_STATUSES),
  asyncHandler(addOrUpdateAssetVulnerability)
);
router.patch(
  '/:id/vulnerabilities/:vulnerabilityId/patch',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  requireFields(['patch_status']),
  validateEnum('patch_status', PATCH_STATUSES),
  asyncHandler(updatePatchStatus)
);
router.get('/', asyncHandler(getAllAssets));
router.get('/vulnerabilities', asyncHandler(getAllVulnerabilities));
router.get('/vulnerabilities/unpatched-critical', asyncHandler(getUnpatchedCriticalVulnerabilities));


module.exports = router;
