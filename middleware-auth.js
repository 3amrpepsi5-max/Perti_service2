/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🔒 Authentication Middleware
 * التحقق من المصادقة والصلاحيات
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authConfig = require('../config/auth');

/**
 * التحقق من وجود وصلاحية JWT Token
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Or from cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح - يرجى تسجيل الدخول'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, authConfig.jwt.secret);
      
      // Get user from token
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }
      
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'الحساب معطل'
        });
      }
      
      // Add user to request
      req.user = user;
      next();
      
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'رمز غير صالح أو منتهي الصلاحية'
      });
    }
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في التحقق من الصلاحية'
    });
  }
};

/**
 * التحقق من الصلاحيات (Roles)
 * @param  {...string} roles - الأدوار المسموحة
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح - يرجى تسجيل الدخول'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح - ليس لديك صلاحية الوصول'
      });
    }
    
    next();
  };
};

/**
 * التحقق من ملكية المورد
 */
exports.checkOwnership = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'المورد غير موجود'
        });
      }
      
      // Admin can access everything
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }
      
      // Check if user owns the resource
      if (resource.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح - ليس لديك صلاحية الوصول'
        });
      }
      
      req.resource = resource;
      next();
      
    } catch (error) {
      console.error('Check ownership error:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في التحقق من الصلاحية'
      });
    }
  };
};

/**
 * التحقق من تأكيد البريد الإلكتروني
 */
exports.requireEmailVerification = (req, res, next) => {
  if (!req.user.email_verified) {
    return res.status(403).json({
      success: false,
      message: 'يجب تأكيد البريد الإلكتروني أولاً'
    });
  }
  next();
};

/**
 * Optional auth - لا يفشل إذا لم يكن مصادقاً
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (token) {
      try {
        const decoded = jwt.verify(token, authConfig.jwt.secret);
        const user = await User.findById(decoded.id);
        if (user && user.is_active) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid, but continue anyway
      }
    }
    
    next();
    
  } catch (error) {
    next();
  }
};
