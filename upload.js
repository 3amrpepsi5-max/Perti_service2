/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📤 Upload Middleware
 * وسيط رفع الملفات باستخدام Multer
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Upload directories
const UPLOAD_DIRS = {
  vendors: 'uploads/vendors',
  products: 'uploads/products',
  users: 'uploads/users',
  reviews: 'uploads/reviews',
  temp: 'uploads/temp'
};

// Create upload directories if they don't exist
Object.values(UPLOAD_DIRS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,      // 5MB
  document: 10 * 1024 * 1024,  // 10MB
  video: 50 * 1024 * 1024      // 50MB
};

// Allowed file types
const ALLOWED_IMAGE_TYPES = /jpeg|jpg|png|gif|webp/;
const ALLOWED_DOCUMENT_TYPES = /pdf|doc|docx|xls|xlsx|txt/;
const ALLOWED_VIDEO_TYPES = /mp4|avi|mov|wmv/;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STORAGE CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Configure storage for vendor images
 */
const vendorStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIRS.vendors);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `vendor-${uniqueSuffix}${ext}`);
  }
});

/**
 * Configure storage for product images
 */
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIRS.products);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

/**
 * Configure storage for user avatars
 */
const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIRS.users);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `user-${uniqueSuffix}${ext}`);
  }
});

/**
 * Configure storage for review images
 */
const reviewStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIRS.reviews);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `review-${uniqueSuffix}${ext}`);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILE FILTER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Filter for image files only
 */
const imageFileFilter = (req, file, cb) => {
  const extname = ALLOWED_IMAGE_TYPES.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = ALLOWED_IMAGE_TYPES.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مسموح! يجب أن يكون صورة (JPEG, JPG, PNG, GIF, WebP)'), false);
  }
};

/**
 * Filter for document files
 */
const documentFileFilter = (req, file, cb) => {
  const extname = ALLOWED_DOCUMENT_TYPES.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = ALLOWED_DOCUMENT_TYPES.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مسموح! يجب أن يكون مستند (PDF, DOC, DOCX, XLS, XLSX, TXT)'), false);
  }
};

/**
 * Filter for video files
 */
const videoFileFilter = (req, file, cb) => {
  const extname = ALLOWED_VIDEO_TYPES.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = ALLOWED_VIDEO_TYPES.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مسموح! يجب أن يكون فيديو (MP4, AVI, MOV, WMV)'), false);
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UPLOAD MIDDLEWARE EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Upload single vendor image
 * Usage: upload.vendorImage (field name: 'image')
 */
exports.vendorImage = multer({
  storage: vendorStorage,
  limits: { fileSize: FILE_SIZE_LIMITS.image },
  fileFilter: imageFileFilter
}).single('image');

/**
 * Upload multiple vendor images
 * Usage: upload.vendorImages (field name: 'images', max: 10)
 */
exports.vendorImages = multer({
  storage: vendorStorage,
  limits: { fileSize: FILE_SIZE_LIMITS.image },
  fileFilter: imageFileFilter
}).array('images', 10);

/**
 * Upload vendor logo and cover
 * Usage: upload.vendorLogoAndCover (fields: 'logo', 'cover')
 */
exports.vendorLogoAndCover = multer({
  storage: vendorStorage,
  limits: { fileSize: FILE_SIZE_LIMITS.image },
  fileFilter: imageFileFilter
}).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]);

/**
 * Upload single product image
 * Usage: upload.productImage (field name: 'image')
 */
exports.productImage = multer({
  storage: productStorage,
  limits: { fileSize: FILE_SIZE_LIMITS.image },
  fileFilter: imageFileFilter
}).single('image');

/**
 * Upload multiple product images
 * Usage: upload.productImages (field name: 'images', max: 10)
 */
exports.productImages = multer({
  storage: productStorage,
  limits: { fileSize: FILE_SIZE_LIMITS.image },
  fileFilter: imageFileFilter
}).array('images', 10);

/**
 * Upload user avatar
 * Usage: upload.userAvatar (field name: 'avatar')
 */
exports.userAvatar = multer({
  storage: userStorage,
  limits: { fileSize: FILE_SIZE_LIMITS.image },
  fileFilter: imageFileFilter
}).single('avatar');

/**
 * Upload review images
 * Usage: upload.reviewImages (field name: 'images', max: 5)
 */
exports.reviewImages = multer({
  storage: reviewStorage,
  limits: { fileSize: FILE_SIZE_LIMITS.image },
  fileFilter: imageFileFilter
}).array('images', 5);

/**
 * Upload any image (generic)
 * Usage: upload.anyImage (field name: 'file')
 */
exports.anyImage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIRS.temp);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `file-${uniqueSuffix}${ext}`);
    }
  }),
  limits: { fileSize: FILE_SIZE_LIMITS.image },
  fileFilter: imageFileFilter
}).single('file');

/**
 * Upload document
 * Usage: upload.document (field name: 'document')
 */
exports.document = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIRS.temp);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `doc-${uniqueSuffix}${ext}`);
    }
  }),
  limits: { fileSize: FILE_SIZE_LIMITS.document },
  fileFilter: documentFileFilter
}).single('document');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ERROR HANDLER MIDDLEWARE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Handle upload errors
 */
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'حجم الملف كبير جداً'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'عدد الملفات كبير جداً'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'حقل الملف غير متوقع'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    // Other errors
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Delete file from filesystem
 */
exports.deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Delete multiple files
 */
exports.deleteFiles = (filePaths) => {
  const results = filePaths.map(filePath => exports.deleteFile(filePath));
  return results.every(result => result === true);
};

/**
 * Get file extension
 */
exports.getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

/**
 * Generate unique filename
 */
exports.generateUniqueFilename = (originalname, prefix = 'file') => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(originalname);
  return `${prefix}-${uniqueSuffix}${ext}`;
};

/**
 * Validate file type
 */
exports.isValidImageType = (filename) => {
  return ALLOWED_IMAGE_TYPES.test(path.extname(filename).toLowerCase());
};

/**
 * Get upload directories
 */
exports.getUploadDirs = () => UPLOAD_DIRS;
