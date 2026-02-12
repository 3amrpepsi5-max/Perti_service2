/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🛡️ Rate Limiter Middleware
 * وسيط الحماية من الطلبات المتكررة
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REDIS CLIENT (OPTIONAL)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let redisClient = null;

// Create Redis client if REDIS_URL is configured
if (process.env.REDIS_URL) {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      legacyMode: true
    });

    redisClient.connect().catch(err => {
      console.error('❌ Redis connection failed:', err.message);
      redisClient = null;
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected for rate limiting');
    });
  } catch (error) {
    console.error('❌ Redis initialization failed:', error.message);
    redisClient = null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RATE LIMITER CONFIGURATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Store configuration (Redis or Memory)
 */
const getStore = () => {
  if (redisClient) {
    return new RedisStore({
      client: redisClient,
      prefix: 'rl:' // rate limit prefix
    });
  }
  return undefined; // Use default memory store
};

/**
 * Standard error message
 */
const standardMessage = {
  success: false,
  message: 'تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقاً'
};

/**
 * Custom handler for rate limit exceeded
 */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    ...standardMessage,
    retryAfter: req.rateLimit.resetTime
  });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GENERAL API RATE LIMITER
// محدد عام لجميع الطلبات
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 100 requests per 15 minutes
  message: standardMessage,
  handler: rateLimitHandler,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: getStore(),
  skip: (req) => {
    // Skip rate limiting for admin users if needed
    return req.user && req.user.role === 'admin';
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTHENTICATION RATE LIMITER
// محدد خاص بطلبات المصادقة (تسجيل دخول، إنشاء حساب)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    message: 'تم تجاوز عدد محاولات تسجيل الدخول، يرجى المحاولة بعد 15 دقيقة'
  },
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  skipSuccessfulRequests: true // Don't count successful requests
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PASSWORD RESET RATE LIMITER
// محدد خاص بطلبات إعادة تعيين كلمة المرور
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exports.passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    message: 'تم تجاوز عدد محاولات إعادة تعيين كلمة المرور، يرجى المحاولة بعد ساعة'
  },
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore()
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REGISTRATION RATE LIMITER
// محدد خاص بطلبات التسجيل
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exports.registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    success: false,
    message: 'تم تجاوز عدد محاولات التسجيل، يرجى المحاولة بعد ساعة'
  },
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore()
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMAIL/SMS VERIFICATION RATE LIMITER
// محدد خاص بطلبات إرسال رموز التحقق
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exports.verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 verification codes per hour
  message: {
    success: false,
    message: 'تم تجاوز عدد محاولات إرسال رمز التحقق، يرجى المحاولة بعد ساعة'
  },
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore()
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SEARCH RATE LIMITER
// محدد خاص بطلبات البحث
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exports.searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 search requests per minute
  message: {
    success: false,
    message: 'تم تجاوز عدد محاولات البحث، يرجى المحاولة بعد قليل'
  },
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore()
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UPLOAD RATE LIMITER
// محدد خاص بطلبات رفع الملفات
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exports.uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: {
    success: false,
    message: 'تم تجاوز عدد محاولات رفع الملفات، يرجى المحاولة بعد ساعة'
  },
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore()
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API CREATION RATE LIMITER
// محدد خاص بطلبات الإنشاء (طلبات، حجوزات، تعليقات)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exports.createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 creation requests per hour
  message: {
    success: false,
    message: 'تم تجاوز عدد محاولات الإنشاء، يرجى المحاولة بعد ساعة'
  },
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore()
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REVIEW/RATING RATE LIMITER
// محدد خاص بطلبات التقييمات والمراجعات
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exports.reviewLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // 10 reviews per day
  message: {
    success: false,
    message: 'تم تجاوز عدد محاولات إضافة التقييمات، يرجى المحاولة غداً'
  },
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user ? `review_${req.user.id}` : req.ip;
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAYMENT RATE LIMITER
// محدد خاص بطلبات الدفع
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exports.paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 payment requests per 15 minutes
  message: {
    success: false,
    message: 'تم تجاوز عدد محاولات الدفع، يرجى المحاولة بعد 15 دقيقة'
  },
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore()
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN OPERATIONS LIMITER (Less restrictive for admins)
// محدد خاص بعمليات المسؤولين
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exports.adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute for admins
  message: standardMessage,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore()
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CUSTOM RATE LIMITER FACTORY
// مصنع لإنشاء محددات مخصصة
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Create a custom rate limiter
 * @param {Object} options - Rate limiter options
 * @returns {Function} Rate limiter middleware
 */
exports.createLimiter = (options) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = standardMessage,
    skipSuccessfulRequests = false,
    keyGenerator = null
  } = options;

  return rateLimit({
    windowMs,
    max,
    message,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    store: getStore(),
    skipSuccessfulRequests,
    ...(keyGenerator && { keyGenerator })
  });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SLOWDOWN MIDDLEWARE (Alternative to rate limiting)
// وسيط التباطؤ (بديل للحد من الطلبات)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const slowDown = require('express-slow-down');

/**
 * Speed limiter - slows down responses instead of blocking
 */
exports.speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request above delayAfter
  maxDelayMs: 5000, // Maximum delay of 5 seconds
  store: getStore()
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLEANUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Close Redis connection gracefully
 */
exports.closeRedisConnection = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('✅ Redis connection closed');
    } catch (error) {
      console.error('❌ Error closing Redis connection:', error);
    }
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORT REDIS CLIENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exports.redisClient = redisClient;
