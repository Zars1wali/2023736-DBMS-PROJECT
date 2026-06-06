const express = require('express');
const { createAnalyst, getAnalysts, updateAnalyst, deleteAnalyst } = require('../controllers/analystController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');
const {authorize} = require('../middleware/authorize');
const { requireFields } = require('../middleware/validate');

const router = express.Router();

// All analyst routes require authentication
router.use(authenticate);

// Only Admins and Managers can view all analysts
router.get('/', authorize('Admin', 'Manager'), asyncHandler(getAnalysts));

// Only Admins can create, update, or delete analysts
router.post('/', authorize('Admin'), requireFields(['org_id', 'name', 'email', 'role', 'password']), asyncHandler(createAnalyst));
router.put('/:id', authorize('Admin'), asyncHandler(updateAnalyst));
router.delete('/:id', authorize('Admin'), asyncHandler(deleteAnalyst));

module.exports = router;
