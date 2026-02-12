/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🔐 Authentication Controller
 * معالج المصادقة
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const User = require('../models/User');

/**
 * تسجيل مستخدم جديد
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    
    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول مطلوبة'
      });
    }
    
    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مستخدم بالفعل'
      });
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || 'customer'
    });
    
    // Generate token
    const token = User.generateToken(user);
    
    // Update last login
    await User.updateLastLogin(user.id);
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: {
        user,
        token
      }
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'حدث خطأ في التسجيل'
    });
  }
};

/**
 * تسجيل الدخول
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني وكلمة المرور مطلوبة'
      });
    }
    
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }
    
    // Check if active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'الحساب معطل، يرجى التواصل مع الدعم'
      });
    }
    
    // Verify password
    const isPasswordValid = await User.comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }
    
    // Generate token
    const token = User.generateToken(user);
    
    // Update last login
    await User.updateLastLogin(user.id);
    
    // Remove password from response
    delete user.password_hash;
    
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user,
        token
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تسجيل الدخول'
    });
  }
};

/**
 * تسجيل الخروج
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    // يمكن إضافة التوكن إلى قائمة سوداء هنا
    
    res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تسجيل الخروج'
    });
  }
};

/**
 * الحصول على بيانات المستخدم الحالي
 * GET /api/auth/me
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
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
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب البيانات'
    });
  }
};

/**
 * استعادة كلمة المرور
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مطلوب'
      });
    }
    
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'البريد الإلكتروني غير مسجل'
      });
    }
    
    // TODO: إرسال بريد إلكتروني مع رابط إعادة تعيين كلمة المرور
    
    res.json({
      success: true,
      message: 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني'
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إرسال البريد'
    });
  }
};

/**
 * إعادة تعيين كلمة المرور
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'الرمز وكلمة المرور الجديدة مطلوبة'
      });
    }
    
    // TODO: التحقق من صلاحية الرمز وإعادة تعيين كلمة المرور
    
    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تغيير كلمة المرور'
    });
  }
};

/**
 * تأكيد البريد الإلكتروني
 * POST /api/auth/verify-email
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    // TODO: التحقق من الرمز وتفعيل البريد الإلكتروني
    
    res.json({
      success: true,
      message: 'تم تأكيد البريد الإلكتروني بنجاح'
    });
    
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تأكيد البريد'
    });
  }
};
