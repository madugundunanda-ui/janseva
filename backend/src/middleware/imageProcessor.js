const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Express middleware to resize and compress uploaded images right after Multer processes them.
 * Resizes to a maximum bounding box of 800x800 pixels (preserves aspect ratio).
 * Converts the file to an optimized WebP format with quality metric threshold of 75.
 */
const compressImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const originalPath = req.file.path;
  const directory = path.dirname(originalPath);
  const ext = path.extname(req.file.filename);
  const baseName = path.basename(req.file.filename, ext);
  
  const compressedFilename = `${baseName}.webp`;
  const compressedPath = path.join(directory, compressedFilename);

  try {
    // Perform sharp resize and compression
    await sharp(originalPath)
      .resize({
        width: 800,
        height: 800,
        fit: 'inside', // bounding box scale
        withoutEnlargement: true,
      })
      .webp({ quality: 75 })
      .toFile(compressedPath);

    // Asynchronously delete the original file if it is different from the compressed file
    if (originalPath !== compressedPath && fs.existsSync(originalPath)) {
      await fs.promises.unlink(originalPath);
    }

    // Update req.file properties to reflect the compressed file
    req.file.path = compressedPath;
    req.file.filename = compressedFilename;
    req.file.mimetype = 'image/webp';
    
    const stats = await fs.promises.stat(compressedPath);
    req.file.size = stats.size;

    next();
  } catch (err) {
    // Gracefully handle processing failure: keep original file and proceed
    console.error('Image compression failed, proceeding with original file:', err);
    next();
  }
};

module.exports = {
  compressImage,
};
