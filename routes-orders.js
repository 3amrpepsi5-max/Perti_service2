/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🛣️ Order Routes
 * مسارات الطلبات
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { validateOrder, validateOrderStatus } = require('../middleware/validation');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROTECTED ROUTES (All order routes require authentication)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/orders/stats
 * @desc    الحصول على إحصائيات الطلبات
 * @access  Private/Vendor/Admin
 */
router.get('/stats', protect, orderController.getOrderStats);

/**
 * @route   GET /api/orders/my-orders
 * @desc    الحصول على طلبات المستخدم الحالي
 * @access  Private
 */
router.get('/my-orders', protect, orderController.getMyOrders);

/**
 * @route   GET /api/orders/by-date
 * @desc    الحصول على الطلبات حسب التاريخ
 * @access  Private/Vendor/Admin
 */
router.get('/by-date', protect, orderController.getOrdersByDate);

/**
 * @route   GET /api/orders/vendor/:vendorId
 * @desc    الحصول على طلبات مزود
 * @access  Private/Vendor/Admin
 */
router.get('/vendor/:vendorId', protect, orderController.getVendorOrders);

/**
 * @route   GET /api/orders
 * @desc    الحصول على جميع الطلبات (مع فلاتر)
 * @access  Private
 */
router.get('/', protect, orderController.getAllOrders);

/**
 * @route   POST /api/orders
 * @desc    إنشاء طلب جديد
 * @access  Private
 */
router.post('/', protect, validateOrder, orderController.createOrder);

/**
 * @route   GET /api/orders/:id
 * @desc    الحصول على طلب محدد
 * @access  Private
 */
router.get('/:id', protect, orderController.getOrderById);

/**
 * @route   PUT /api/orders/:id
 * @desc    تحديث طلب
 * @access  Private
 */
router.put('/:id', protect, validateOrder, orderController.updateOrder);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    تحديث حالة الطلب
 * @access  Private/Vendor/Admin
 */
router.put('/:id/status', protect, validateOrderStatus, orderController.updateOrderStatus);

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    إلغاء طلب
 * @access  Private
 */
router.post('/:id/cancel', protect, orderController.cancelOrder);

/**
 * @route   DELETE /api/orders/:id
 * @desc    حذف طلب
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), orderController.deleteOrder);

module.exports = router;
