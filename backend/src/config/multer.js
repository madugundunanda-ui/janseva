const path = require('path');
const multer = require('multer');
const AppError = require('../utils/AppError');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpeg', '.jpg', '.png', '.webp'];
  const isValidExtension = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());
  const isValidMimeType = allowedMimeTypes.includes(file.mimetype);

  if (isValidExtension && isValidMimeType) {
    cb(null, true);
    return;
  }

  cb(new AppError('Only image files are allowed. Supported formats: JPG, JPEG, PNG, WEBP', 400));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;
