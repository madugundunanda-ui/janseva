const sendSuccess = (res, statusCode = 200, message = 'Operation successful', data = {}) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

module.exports = { sendSuccess };
