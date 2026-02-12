/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🛣️ Review Routes
 * مسارات التقييمات
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { validateReview, validateReviewResponse } = require('../middleware/validation');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUBLIC ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/reviews/vendor/:vendorId
 * @desc    الحصول على تقييمات مزود
 * @access  Public
 */
router.get('/vendor/:vendorId', reviewController.getVendorReviews);

/**
 * @route   GET /api/reviews/vendor/:vendorId/stats
 * @desc    الحصول على إحصائيات التقييمات لمزود
 * @access  Public
 */
router.get('/vendor/:vendorId/stats', reviewController.getVendorReviewStats);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROTECTED ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/reviews
 * @desc    الحصول على جميع التقييمات (مع فلاتر)
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin'), reviewController.getAllReviews);

/**
 * @route   POST /api/reviews
 * @desc    إنشاء تقييم جديد
 * @access  Private
 */
router.post('/', protect, validateReview, reviewController.createReview);

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    الحصول على تقييمات مستخدم
 * @access  Private
 */
router.get('/user/:userId', protect, reviewController.getUserReviews);

/**
 * @route   GET /api/reviews/:id
 * @desc    الحصول على تقييم محدد
 * @access  Public
 */
router.get('/:id', reviewController.getReviewById);

/**
 * @route   PUT /api/reviews/:id
 * @desc    تحديث تقييم
 * @access  Private
 */
router.put('/:id', protect, validateReview, reviewController.updateReview);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    حذف تقييم
 * @access  Private
 */
router.delete('/:id', protect, reviewController.deleteReview);

/**
 * @route   POST /api/reviews/:id/response
 * @desc    إضافة رد المزود على التقييم
 * @access  Private/Vendor
 */
router.post('/:id/response', protect, authorize('vendor', 'admin'), validateReviewResponse, reviewController.addVendorResponse);

/**
 * @route   POST /api/reviews/:id/flag
 * @desc    الإبلاغ عن تقييم
 * @access  Private
 */
router.post('/:id/flag', protect, reviewController.flagReview);

/**
 * @route   POST /api/reviews/:id/unflag
 * @desc    إلغاء الإبلاغ عن تقييم
 * @access  Private/Admin
 */
router.post('/:id/unflag', protect, authorize('admin'), reviewController.unflagReview);

/**
 * @route   PUT /api/reviews/:id/verify
 * @desc    التحقق من التقييم
 * @access  Private/Admin
 */
router.put('/:id/verify', protect, authorize('admin'), reviewController.verifyReview);

module.exports = router;
