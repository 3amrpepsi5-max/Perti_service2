/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🛣️ User Routes
 * مسارات المستخدمين
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { validateUser, validateUpdatePassword } = require('../middleware/validation');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATISTICS (Admin only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/users/stats
 * @desc    الحصول على إحصائيات المستخدمين
 * @access  Private/Admin
 */
router.get('/stats', protect, authorize('admin'), userController.getUserStats);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USER MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/users
 * @desc    الحصول على جميع المستخدمين
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin'), userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    الحصول على مستخدم محدد
 * @access  Private
 */
router.get('/:id', protect, userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    تحديث معلومات المستخدم
 * @access  Private
 */
router.put('/:id', protect, validateUser, userController.updateUser);

/**
 * @route   PUT /api/users/:id/password
 * @desc    تغيير كلمة المرور
 * @access  Private
 */
router.put('/:id/password', protect, validateUpdatePassword, userController.updatePassword);

/**
 * @route   DELETE /api/users/:id
 * @desc    حذف مستخدم
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

/**
 * @route   PUT /api/users/:id/deactivate
 * @desc    تعطيل حساب مستخدم
 * @access  Private/Admin
 */
router.put('/:id/deactivate', protect, authorize('admin'), userController.deactivateUser);

/**
 * @route   PUT /api/users/:id/activate
 * @desc    تفعيل حساب مستخدم
 * @access  Private/Admin
 */
router.put('/:id/activate', protect, authorize('admin'), userController.activateUser);

module.exports = router;
