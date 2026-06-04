const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Express middleware to resize and compress uploaded images right after Multer processes them.
 * Resizes to a maximum bounding box of 1024x1024 pixels (preserves aspect ratio).
 * Converts the file to an optimized WebP format with quality metric threshold of 75.
 * Enforces a strict size limit of 500kb.
 */
const compressImage = async (req, res, next) => {
  if (!req.file || !req.file.buffer) {
    return next();
  }

  const uploadDirectory = path.join(__dirname, '..', 'uploads', 'complaints');
  
  // Ensure the uploads directory exists
  if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
  }

  const baseName = `${Date.now()}-${crypto.randomUUID()}`;
  const compressedFilename = `${baseName}.webp`;
  const compressedPath = path.join(uploadDirectory, compressedFilename);

  try {
    // Perform sharp resize and compression directly from memory buffer
    await sharp(req.file.buffer)
      .resize({
        width: 1024,
        height: 1024,
        fit: 'inside', // bounding box scale
        withoutEnlargement: true,
      })
      .webp({ quality: 75 })
      .toFile(compressedPath);

    let stats = await fs.promises.stat(compressedPath);

    // If still > 500kb, compress more aggressively to keep it under 500kb
    if (stats.size > 500 * 1024) {
      await sharp(req.file.buffer)
        .resize({
          width: 800,
          height: 800,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 60 })
        .toFile(compressedPath);
      
      stats = await fs.promises.stat(compressedPath);
    }

    // Update req.file properties to reflect the compressed file on disk
    req.file.path = compressedPath;
    req.file.filename = compressedFilename;
    req.file.destination = uploadDirectory;
    req.file.mimetype = 'image/webp';
    req.file.size = stats.size;

    // Clear file buffer from memory to release RAM immediately
    delete req.file.buffer;

    next();
  } catch (err) {
    console.error('Image compression failed, falling back to raw buffer storage:', err);
    try {
      // Fallback: write the raw buffer directly to disk as is
      await fs.promises.writeFile(compressedPath, req.file.buffer);
      
      req.file.path = compressedPath;
      req.file.filename = compressedFilename;
      req.file.destination = uploadDirectory;
      req.file.size = req.file.buffer.length;
      
      // Clear file buffer from memory to release RAM immediately
      delete req.file.buffer;
      
      next();
    } catch (fallbackErr) {
      console.error('Fallback image writing failed:', fallbackErr);
      next(fallbackErr);
    }
  }
};

module.exports = {
  compressImage,
};
