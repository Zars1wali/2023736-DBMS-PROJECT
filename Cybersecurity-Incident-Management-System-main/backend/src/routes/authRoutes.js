const express = require('express');
const { login, logout } = require('../controllers/authController');
const asyncHandler = require('../utils/asyncHandler');
const { requireFields } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/login', authRateLimiter, requireFields(['email', 'password']), asyncHandler(login));
router.post('/logout', authRateLimiter, authenticate, asyncHandler(logout));

module.exports = router;
