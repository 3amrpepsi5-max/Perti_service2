/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 👤 User Controller
 * معالج المستخدمين
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const User = require('../models/User');

/**
 * الحصول على جميع المستخدمين
 * GET /api/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const filters = {
      role: req.query.role,
      search: req.query.search,
      is_active: req.query.is_active,
      page: req.query.page,
      limit: req.query.limit
    };
    
    const result = await User.getAll(filters);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب المستخدمين'
    });
  }
};

/**
 * الحصول على مستخدم محدد
 * GET /api/users/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    res.json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب بيانات المستخدم'
    });
  }
};

/**
 * تحديث معلومات المستخدم
 * PUT /api/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, avatar_url } = req.body;
    
    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    // Check authorization (user can update own profile or admin can update any)
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح - ليس لديك صلاحية التعديل'
      });
    }
    
    // Update user
    const updatedUser = await User.update(id, {
      name,
      email,
      phone,
      avatar_url
    });
    
    res.json({
      success: true,
      message: 'تم تحديث البيانات بنجاح',
      data: { user: updatedUser }
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ في تحديث البيانات'
    });
  }
};

/**
 * تغيير كلمة المرور
 * PUT /api/users/:id/password
 */
exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الحالية والجديدة مطلوبة'
      });
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح - ليس لديك صلاحية التعديل'
      });
    }
    
    // Get user with password
    const user = await User.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    // Verify current password
    const isPasswordValid = await User.comparePassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة'
      });
    }
    
    // Update password
    await User.updatePassword(id, newPassword);
    
    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });
    
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تغيير كلمة المرور'
    });
  }
};

/**
 * حذف مستخدم
 * DELETE /api/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    // Delete user
    await User.delete(id);
    
    res.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في حذف المستخدم'
    });
  }
};

/**
 * تعطيل حساب مستخدم
 * PUT /api/users/:id/deactivate
 */
exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    await User.deactivate(id);
    
    res.json({
      success: true,
      message: 'تم تعطيل الحساب بنجاح'
    });
    
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تعطيل الحساب'
    });
  }
};

/**
 * تفعيل حساب مستخدم
 * PUT /api/users/:id/activate
 */
exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }
    
    await User.activate(id);
    
    res.json({
      success: true,
      message: 'تم تفعيل الحساب بنجاح'
    });
    
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تفعيل الحساب'
    });
  }
};

/**
 * الحصول على إحصائيات المستخدمين
 * GET /api/users/stats
 */
exports.getUserStats = async (req, res) => {
  try {
    const stats = await User.getStats();
    
    res.json({
      success: true,
      data: { stats }
    });
    
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب الإحصائيات'
    });
  }
};
