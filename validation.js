/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ✅ Validation Middleware
 * التحقق من صحة البيانات
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * التحقق من صحة بيانات المستخدم
 */
exports.validateUser = (req, res, next) => {
  const { name, email, phone } = req.body;
  const errors = [];
  
  // Validate name
  if (name !== undefined) {
    if (!name || name.trim().length < 2) {
      errors.push('الاسم يجب أن يكون على الأقل حرفين');
    }
    if (name && name.length > 100) {
      errors.push('الاسم يجب أن يكون أقل من 100 حرف');
    }
  }
  
  // Validate email
  if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.push('البريد الإلكتروني غير صالح');
    }
  }
  
  // Validate phone
  if (phone !== undefined) {
    const phoneRegex = /^(010|011|012|015)\d{8}$/;
    if (!phone || !phoneRegex.test(phone)) {
      errors.push('رقم الهاتف غير صالح (يجب أن يبدأ بـ 010, 011, 012, أو 015)');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صالحة',
      errors
    });
  }
  
  next();
};

/**
 * التحقق من صحة تغيير كلمة المرور
 */
exports.validateUpdatePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const errors = [];
  
  if (!currentPassword) {
    errors.push('كلمة المرور الحالية مطلوبة');
  }
  
  if (!newPassword) {
    errors.push('كلمة المرور الجديدة مطلوبة');
  } else {
    if (newPassword.length < 6) {
      errors.push('كلمة المرور الجديدة يجب أن تكون على الأقل 6 أحرف');
    }
    if (newPassword.length > 100) {
      errors.push('كلمة المرور الجديدة يجب أن تكون أقل من 100 حرف');
    }
  }
  
  if (currentPassword === newPassword) {
    errors.push('كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صالحة',
      errors
    });
  }
  
  next();
};

/**
 * التحقق من صحة بيانات المزود
 */
exports.validateVendor = (req, res, next) => {
  const { business_name, business_type, address, phone, whatsapp } = req.body;
  const errors = [];
  
  // Validate business name
  if (business_name !== undefined) {
    if (!business_name || business_name.trim().length < 3) {
      errors.push('اسم العمل يجب أن يكون على الأقل 3 أحرف');
    }
    if (business_name && business_name.length > 200) {
      errors.push('اسم العمل يجب أن يكون أقل من 200 حرف');
    }
  }
  
  // Validate business type
  if (business_type !== undefined) {
    if (!business_type) {
      errors.push('نوع العمل مطلوب');
    }
  }
  
  // Validate address
  if (address !== undefined) {
    if (!address || address.trim().length < 10) {
      errors.push('العنوان يجب أن يكون على الأقل 10 أحرف');
    }
  }
  
  // Validate phone
  if (phone !== undefined) {
    const phoneRegex = /^(010|011|012|015)\d{8}$/;
    if (phone && !phoneRegex.test(phone)) {
      errors.push('رقم الهاتف غير صالح');
    }
  }
  
  // Validate whatsapp
  if (whatsapp !== undefined) {
    const phoneRegex = /^(010|011|012|015)\d{8}$/;
    if (whatsapp && !phoneRegex.test(whatsapp)) {
      errors.push('رقم الواتساب غير صالح');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صالحة',
      errors
    });
  }
  
  next();
};

/**
 * التحقق من صحة التقييم
 */
exports.validateReview = (req, res, next) => {
  const { vendor_id, rating, comment } = req.body;
  const errors = [];
  
  // Validate vendor_id (only for create)
  if (req.method === 'POST' && !vendor_id) {
    errors.push('معرف المزود مطلوب');
  }
  
  // Validate rating
  if (rating !== undefined) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      errors.push('التقييم يجب أن يكون رقماً بين 1 و 5');
    }
  } else if (req.method === 'POST') {
    errors.push('التقييم مطلوب');
  }
  
  // Validate comment
  if (comment !== undefined && comment !== null) {
    if (comment.length > 1000) {
      errors.push('التعليق يجب أن يكون أقل من 1000 حرف');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صالحة',
      errors
    });
  }
  
  next();
};

/**
 * التحقق من رد المزود على التقييم
 */
exports.validateReviewResponse = (req, res, next) => {
  const { response } = req.body;
  const errors = [];
  
  if (!response) {
    errors.push('الرد مطلوب');
  } else {
    if (response.trim().length < 3) {
      errors.push('الرد يجب أن يكون على الأقل 3 أحرف');
    }
    if (response.length > 1000) {
      errors.push('الرد يجب أن يكون أقل من 1000 حرف');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صالحة',
      errors
    });
  }
  
  next();
};

/**
 * التحقق من صحة الطلب
 */
exports.validateOrder = (req, res, next) => {
  const { vendor_id, service_description, phone } = req.body;
  const errors = [];
  
  // Validate vendor_id (only for create)
  if (req.method === 'POST' && !vendor_id) {
    errors.push('معرف المزود مطلوب');
  }
  
  // Validate service description
  if (service_description !== undefined) {
    if (!service_description || service_description.trim().length < 10) {
      errors.push('وصف الخدمة يجب أن يكون على الأقل 10 أحرف');
    }
    if (service_description && service_description.length > 1000) {
      errors.push('وصف الخدمة يجب أن يكون أقل من 1000 حرف');
    }
  } else if (req.method === 'POST') {
    errors.push('وصف الخدمة مطلوب');
  }
  
  // Validate phone
  if (phone !== undefined) {
    const phoneRegex = /^(010|011|012|015)\d{8}$/;
    if (phone && !phoneRegex.test(phone)) {
      errors.push('رقم الهاتف غير صالح');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صالحة',
      errors
    });
  }
  
  next();
};

/**
 * التحقق من صحة تحديث حالة الطلب
 */
exports.validateOrderStatus = (req, res, next) => {
  const { status } = req.body;
  const errors = [];
  
  if (!status) {
    errors.push('حالة الطلب مطلوبة');
  } else {
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      errors.push('حالة الطلب غير صالحة');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صالحة',
      errors
    });
  }
  
  next();
};

/**
 * التحقق من صحة البريد الإلكتروني
 */
exports.validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * التحقق من صحة رقم الهاتف المصري
 */
exports.validatePhone = (phone) => {
  const phoneRegex = /^(010|011|012|015)\d{8}$/;
  return phoneRegex.test(phone);
};

/**
 * تنظيف البيانات من HTML tags
 */
exports.sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/<[^>]*>/g, '').trim();
};

/**
 * التحقق من الأرقام الموجبة
 */
exports.validatePositiveNumber = (value, fieldName = 'القيمة') => {
  if (value === undefined || value === null) return null;
  
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) {
    return `${fieldName} يجب أن يكون رقماً موجباً`;
  }
  
  return null;
};

/**
 * التحقق من التاريخ
 */
exports.validateDate = (dateString, fieldName = 'التاريخ') => {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return `${fieldName} غير صالح`;
  }
  
  return null;
};
