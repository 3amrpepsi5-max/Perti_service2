/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ⚠️ Error Handler Middleware
 * معالج الأخطاء الشامل
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * فئة الأخطاء المخصصة
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * معالج الأخطاء العام
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  
  // Log error for debugging
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ Error:', err);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    error.message = 'القيمة مستخدمة بالفعل';
    error.statusCode = 400;
  }
  
  // MySQL foreign key constraint error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error.message = 'المرجع غير موجود';
    error.statusCode = 400;
  }
  
  // MySQL data too long error
  if (err.code === 'ER_DATA_TOO_LONG') {
    error.message = 'البيانات طويلة جداً';
    error.statusCode = 400;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'رمز غير صالح';
    error.statusCode = 401;
  }
  
  if (err.name === 'TokenExpiredError') {
    error.message = 'رمز منتهي الصلاحية';
    error.statusCode = 401;
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'بيانات غير صالحة';
    error.statusCode = 400;
  }
  
  // Cast errors
  if (err.name === 'CastError') {
    error.message = 'معرف غير صالح';
    error.statusCode = 400;
  }
  
  // Send response
  res.status(error.statusCode).json({
    success: false,
    message: error.message || 'خطأ في الخادم',
    ...(process.env.NODE_ENV === 'development' && {
      error: err,
      stack: err.stack
    })
  });
};

/**
 * معالج الطلبات غير الموجودة (404)
 */
const notFound = (req, res, next) => {
  const error = new AppError(`المسار غير موجود - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * معالج الأخطاء غير المتوقعة
 */
const handleUnexpectedErrors = () => {
  // Unhandled Promise Rejection
  process.on('unhandledRejection', (err) => {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ UNHANDLED REJECTION! Shutting down...');
    console.error(err);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  });
  
  // Uncaught Exception
  process.on('uncaughtException', (err) => {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  });
};

/**
 * معالج أخطاء Async
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * إنشاء خطأ مخصص
 */
const createError = (message, statusCode = 500) => {
  return new AppError(message, statusCode);
};

/**
 * معالج أخطاء قاعدة البيانات
 */
const handleDatabaseError = (error) => {
  const errors = {
    // MySQL errors
    'ER_DUP_ENTRY': 'القيمة مستخدمة بالفعل',
    'ER_NO_REFERENCED_ROW': 'المرجع غير موجود',
    'ER_NO_REFERENCED_ROW_2': 'المرجع غير موجود',
    'ER_ROW_IS_REFERENCED': 'لا يمكن الحذف - البيانات مرتبطة بعناصر أخرى',
    'ER_ROW_IS_REFERENCED_2': 'لا يمكن الحذف - البيانات مرتبطة بعناصر أخرى',
    'ER_DATA_TOO_LONG': 'البيانات طويلة جداً',
    'ER_BAD_NULL_ERROR': 'قيمة مطلوبة لا يمكن أن تكون فارغة',
    'ER_PARSE_ERROR': 'خطأ في صياغة الاستعلام',
    'ECONNREFUSED': 'فشل الاتصال بقاعدة البيانات',
    'PROTOCOL_CONNECTION_LOST': 'فقد الاتصال بقاعدة البيانات'
  };
  
  return errors[error.code] || 'خطأ في قاعدة البيانات';
};

/**
 * تنسيق رسائل الأخطاء للإنتاج
 */
const formatErrorForProduction = (error) => {
  // Don't send sensitive info in production
  if (process.env.NODE_ENV === 'production') {
    return {
      success: false,
      message: error.isOperational ? error.message : 'حدث خطأ في الخادم'
    };
  }
  
  // Development mode - send detailed error info
  return {
    success: false,
    message: error.message,
    error: error,
    stack: error.stack
  };
};

/**
 * معالج أخطاء التحقق من الصحة
 */
const handleValidationError = (errors) => {
  const messages = errors.map(err => err.message || err);
  return new AppError(messages.join(', '), 400);
};

/**
 * معالج أخطاء الصلاحيات
 */
const handleAuthError = (message = 'غير مصرح') => {
  return new AppError(message, 401);
};

/**
 * معالج أخطاء الوصول المحظور
 */
const handleForbiddenError = (message = 'ممنوع - ليس لديك صلاحية الوصول') => {
  return new AppError(message, 403);
};

/**
 * معالج أخطاء العناصر غير الموجودة
 */
const handleNotFoundError = (resource = 'العنصر') => {
  return new AppError(`${resource} غير موجود`, 404);
};

/**
 * معالج أخطاء الطلبات السيئة
 */
const handleBadRequestError = (message = 'طلب غير صالح') => {
  return new AppError(message, 400);
};

/**
 * معالج أخطاء الخادم الداخلية
 */
const handleServerError = (message = 'خطأ في الخادم') => {
  return new AppError(message, 500);
};

/**
 * Logger للأخطاء
 */
const logError = (error, req) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    error: {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode
    }
  };
  
  // في الإنتاج، يمكن حفظ هذا في ملف أو قاعدة بيانات
  if (process.env.NODE_ENV === 'production') {
    // TODO: حفظ في ملف log أو خدمة monitoring
    console.error(JSON.stringify(errorLog));
  } else {
    console.error('Error Log:', errorLog);
  }
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
  handleUnexpectedErrors,
  asyncHandler,
  createError,
  handleDatabaseError,
  formatErrorForProduction,
  handleValidationError,
  handleAuthError,
  handleForbiddenError,
  handleNotFoundError,
  handleBadRequestError,
  handleServerError,
  logError
};
