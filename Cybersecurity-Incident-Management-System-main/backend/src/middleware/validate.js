const ApiError = require('../utils/ApiError');

function requireFields(fields) {
  return (req, _res, next) => {
    const missing = fields.filter((field) => req.body[field] === undefined || req.body[field] === null);
    if (missing.length) {
      return next(new ApiError(400, `Missing required fields: ${missing.join(', ')}`));
    }
    return next();
  };
}

function validateEnum(field, allowedValues) {
  return (req, _res, next) => {
    const value = req.body[field];
    if (value === undefined) {
      return next();
    }
    if (!allowedValues.includes(value)) {
      return next(new ApiError(400, `Invalid ${field}. Allowed values: ${allowedValues.join(', ')}`));
    }
    return next();
  };
}

module.exports = {
  requireFields,
  validateEnum
};
