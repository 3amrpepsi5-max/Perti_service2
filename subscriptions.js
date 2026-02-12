/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🛣️ Subscription Routes
 * مسارات الاشتراكات
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect, authorize } = require('../middleware/auth');
const { validateSubscription, validatePaymentStatus } = require('../middleware/validation');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUBLIC ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/subscriptions/plans
 * @desc    الحصول على خطط الاشتراك المتاحة
 * @access  Public
 */
router.get('/plans', subscriptionController.getPlans);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROTECTED ROUTES (Require Authentication)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/subscriptions/stats
 * @desc    الحصول على إحصائيات الاشتراكات
 * @access  Private/Admin
 */
router.get('/stats', protect, authorize('admin'), subscriptionController.getSubscriptionStats);

/**
 * @route   GET /api/subscriptions/revenue
 * @desc    الحصول على الإيرادات الشهرية
 * @access  Private/Admin
 */
router.get('/revenue', protect, authorize('admin'), subscriptionController.getMonthlyRevenue);

/**
 * @route   GET /api/subscriptions/distribution
 * @desc    الحصول على توزيع الخطط
 * @access  Private/Admin
 */
router.get('/distribution', protect, authorize('admin'), subscriptionController.getPlanDistribution);

/**
 * @route   GET /api/subscriptions/expiring
 * @desc    الحصول على الاشتراكات التي توشك على الانتهاء
 * @access  Private/Admin
 */
router.get('/expiring', protect, authorize('admin'), subscriptionController.getExpiringSubscriptions);

/**
 * @route   POST /api/subscriptions/update-expired
 * @desc    تحديث الاشتراكات المنتهية (CRON Job)
 * @access  Private/Admin
 */
router.post('/update-expired', protect, authorize('admin'), subscriptionController.updateExpiredSubscriptions);

/**
 * @route   GET /api/subscriptions/vendor/:vendorId
 * @desc    الحصول على جميع اشتراكات مزود
 * @access  Private/Vendor/Admin
 */
router.get('/vendor/:vendorId', protect, subscriptionController.getVendorSubscriptions);

/**
 * @route   GET /api/subscriptions/vendor/:vendorId/active
 * @desc    الحصول على الاشتراك النشط لمزود
 * @access  Private/Vendor/Admin
 */
router.get('/vendor/:vendorId/active', protect, subscriptionController.getActiveSubscription);

/**
 * @route   POST /api/subscriptions/vendor/:vendorId/renew
 * @desc    تجديد اشتراك مزود
 * @access  Private/Vendor/Admin
 */
router.post('/vendor/:vendorId/renew', protect, subscriptionController.renewSubscription);

/**
 * @route   GET /api/subscriptions
 * @desc    الحصول على جميع الاشتراكات (مع فلاتر)
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin'), subscriptionController.getAllSubscriptions);

/**
 * @route   POST /api/subscriptions
 * @desc    إنشاء اشتراك جديد
 * @access  Private/Admin
 */
router.post('/', protect, authorize('admin'), validateSubscription, subscriptionController.createSubscription);

/**
 * @route   GET /api/subscriptions/:id
 * @desc    الحصول على اشتراك محدد
 * @access  Private/Vendor/Admin
 */
router.get('/:id', protect, subscriptionController.getSubscriptionById);

/**
 * @route   PUT /api/subscriptions/:id
 * @desc    تحديث اشتراك
 * @access  Private/Admin
 */
router.put('/:id', protect, authorize('admin'), validateSubscription, subscriptionController.updateSubscription);

/**
 * @route   PUT /api/subscriptions/:id/payment-status
 * @desc    تحديث حالة الدفع
 * @access  Private/Admin
 */
router.put('/:id/payment-status', protect, authorize('admin'), validatePaymentStatus, subscriptionController.updatePaymentStatus);

/**
 * @route   POST /api/subscriptions/:id/activate
 * @desc    تفعيل اشتراك
 * @access  Private/Admin
 */
router.post('/:id/activate', protect, authorize('admin'), subscriptionController.activateSubscription);

/**
 * @route   POST /api/subscriptions/:id/cancel
 * @desc    إلغاء اشتراك
 * @access  Private/Vendor/Admin
 */
router.post('/:id/cancel', protect, subscriptionController.cancelSubscription);

/**
 * @route   DELETE /api/subscriptions/:id
 * @desc    حذف اشتراك
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), subscriptionController.deleteSubscription);

module.exports = router;
