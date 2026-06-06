/**
 * Require Fields Middleware
 * Validates that request body contains all required fields
 */

const requireFields = (fields) => {
  return (req, res, next) => {
    try {
      const missingFields = fields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields: missingFields,
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Field validation error',
        error: error.message,
      });
    }
  };
};

module.exports = requireFields;
