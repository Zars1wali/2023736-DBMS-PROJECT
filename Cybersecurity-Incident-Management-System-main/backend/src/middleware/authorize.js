const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');

function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    return next();
  };
}

function canAccessAllIncidents(user) {
  return user.role === ROLES.ADMIN || user.role === ROLES.MANAGER;
}

module.exports = {
  authorize,
  canAccessAllIncidents
};
