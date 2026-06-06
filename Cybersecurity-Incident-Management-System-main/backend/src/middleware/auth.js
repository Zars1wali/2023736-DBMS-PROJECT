const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

const tokenBlacklist = new Set();

function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Missing or invalid authorization header'));
  }

  const token = authHeader.split(' ')[1];
  if (tokenBlacklist.has(token)) {
    return next(new ApiError(401, 'Token has been revoked'));
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    req.token = token;
    return next();
  } catch (_error) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

function revokeToken(token) {
  if (token) {
    tokenBlacklist.add(token);
  }
}

module.exports = {
  authenticate,
  revokeToken,
  tokenBlacklist
};
