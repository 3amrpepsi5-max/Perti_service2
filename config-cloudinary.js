/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ☁️ Cloudinary Configuration
 * إعدادات رفع وإدارة الصور
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLOUDINARY CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UPLOAD PRESETS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const uploadPresets = {
  // Logo images
  logo: {
    folder: 'nozha2/logos',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
    allowed_formats: ['jpg', 'png', 'webp']
  },

  // Cover images
  cover: {
    folder: 'nozha2/covers',
    transformation: [
      { width: 1200, height: 400, crop: 'fill', gravity: 'auto' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
    allowed_formats: ['jpg', 'png', 'webp']
  },

  // Gallery images
  gallery: {
    folder: 'nozha2/gallery',
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
    allowed_formats: ['jpg', 'png', 'webp']
  },

  // Review images
  review: {
    folder: 'nozha2/reviews',
    transformation: [
      { width: 600, height: 600, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
    allowed_formats: ['jpg', 'png', 'webp']
  },

  // User avatars
  avatar: {
    folder: 'nozha2/avatars',
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
    allowed_formats: ['jpg', 'png', 'webp']
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UPLOAD FUNCTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Upload image to Cloudinary
 * @param {string} file - File path or base64 string
 * @param {string} type - Upload type (logo, cover, gallery, etc.)
 * @returns {Promise<object>}
 */
async function uploadImage(file, type = 'gallery') {
  try {
    const preset = uploadPresets[type] || uploadPresets.gallery;
    
    const result = await cloudinary.uploader.upload(file, {
      folder: preset.folder,
      transformation: preset.transformation,
      allowed_formats: preset.allowed_formats,
      resource_type: 'image'
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    };

  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);
    throw new Error('فشل رفع الصورة');
  }
}

/**
 * Upload multiple images
 * @param {array} files - Array of file paths
 * @param {string} type - Upload type
 * @returns {Promise<array>}
 */
async function uploadMultipleImages(files, type = 'gallery') {
  try {
    const uploadPromises = files.map(file => uploadImage(file, type));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('❌ Multiple upload error:', error.message);
    throw error;
  }
}

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Image public ID
 * @returns {Promise<boolean>}
 */
async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('❌ Delete image error:', error.message);
    return false;
  }
}

/**
 * Delete multiple images
 * @param {array} publicIds - Array of public IDs
 * @returns {Promise<boolean>}
 */
async function deleteMultipleImages(publicIds) {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result.deleted;
  } catch (error) {
    console.error('❌ Delete multiple images error:', error.message);
    return false;
  }
}

/**
 * Get image info
 * @param {string} publicId - Image public ID
 * @returns {Promise<object>}
 */
async function getImageInfo(publicId) {
  try {
    const result = await cloudinary.api.resource(publicId);
    return {
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      size: result.bytes,
      createdAt: result.created_at
    };
  } catch (error) {
    console.error('❌ Get image info error:', error.message);
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  cloudinary,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  getImageInfo,
  uploadPresets
};
