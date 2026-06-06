const express = require('express');
const { createOrganization, getOrganizations, getOrganizationById, updateOrganization } = require('../controllers/organizationController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');
const {authorize} = require('../middleware/authorize');
const { requireFields } = require('../middleware/validate');

const router = express.Router();

// All organization routes require authentication
router.use(authenticate);

// Only Admins can manage organizations
router.post('/', authorize('Admin'), requireFields(['name', 'contact_email']), asyncHandler(createOrganization));
router.get('/', asyncHandler(getOrganizations));
router.get('/:id', asyncHandler(getOrganizationById));
router.put('/:id', authorize('Admin'), asyncHandler(updateOrganization));

module.exports = router;
