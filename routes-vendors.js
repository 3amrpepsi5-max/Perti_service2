/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🛣️ Vendor Routes
 * مسارات المزودين
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { validateVendor } = require('../middleware/validation');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUBLIC ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/vendors
 * @desc    الحصول على جميع المزودين (مع فلاتر)
 * @access  Public
 */
router.get('/', optionalAuth, vendorController.getAllVendors);

/**
 * @route   GET /api/vendors/nearby
 * @desc    البحث عن مزودين قريبين
 * @access  Public
 */
router.get('/nearby', optionalAuth, vendorController.getNearbyVendors);

/**
 * @route   GET /api/vendors/top-rated
 * @desc    الحصول على أفضل المزودين
 * @access  Public
 */
router.get('/top-rated', vendorController.getTopRatedVendors);

/**
 * @route   GET /api/vendors/featured
 * @desc    الحصول على المزودين المميزين
 * @access  Public
 */
router.get('/featured', vendorController.getFeaturedVendors);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROTECTED ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/vendors/me
 * @desc    الحصول على ملف المزود للمستخدم الحالي
 * @access  Private/Vendor
 */
router.get('/me', protect, authorize('vendor', 'admin'), vendorController.getMyVendorProfile);

/**
 * @route   POST /api/vendors
 * @desc    إنشاء ملف مزود جديد
 * @access  Private
 */
router.post('/', protect, validateVendor, vendorController.createVendor);

/**
 * @route   GET /api/vendors/:id
 * @desc    الحصول على مزود محدد
 * @access  Public
 */
router.get('/:id', optionalAuth, vendorController.getVendorById);

/**
 * @route   PUT /api/vendors/:id
 * @desc    تحديث معلومات المزود
 * @access  Private/Vendor/Admin
 */
router.put('/:id', protect, validateVendor, vendorController.updateVendor);

/**
 * @route   DELETE /api/vendors/:id
 * @desc    حذف مزود
 * @access  Private/Vendor/Admin
 */
router.delete('/:id', protect, vendorController.deleteVendor);

/**
 * @route   PUT /api/vendors/:id/status
 * @desc    تحديث حالة المزود
 * @access  Private/Admin
 */
router.put('/:id/status', protect, authorize('admin'), vendorController.updateVendorStatus);

/**
 * @route   PUT /api/vendors/:id/verify
 * @desc    تحديث حالة التحقق
 * @access  Private/Admin
 */
router.put('/:id/verify', protect, authorize('admin'), vendorController.verifyVendor);

/**
 * @route   PUT /api/vendors/:id/featured
 * @desc    تحديث حالة المميز
 * @access  Private/Admin
 */
router.put('/:id/featured', protect, authorize('admin'), vendorController.updateFeaturedStatus);

/**
 * @route   GET /api/vendors/:id/stats
 * @desc    الحصول على إحصائيات المزود
 * @access  Private/Vendor/Admin
 */
router.get('/:id/stats', protect, vendorController.getVendorStats);

module.exports = router;
