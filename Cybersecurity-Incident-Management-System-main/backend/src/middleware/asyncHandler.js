function asyncHandler(handler) {
  return (req, res, next) => {
    try {
      return Promise.resolve(handler(req, res, next)).catch(next);
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = asyncHandler;
