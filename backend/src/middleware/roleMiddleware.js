const AppError = require('../utils/AppError');

const authorizeRoles = (...roles) => (req, res, next) => {
  const allowedRoles = roles.flat();

  if (!req.user) {
    next(new AppError('Authentication is required', 401));
    return;
  }

  if (!allowedRoles.includes(req.user.role)) {
    next(new AppError('You do not have permission to access this resource', 403));
    return;
  }

  next();
};

module.exports = { authorizeRoles };
