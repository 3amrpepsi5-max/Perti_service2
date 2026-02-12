/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🔐 Authentication Configuration
 * إعدادات JWT والمصادقة
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

require('dotenv').config();

module.exports = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRE || '7d',
    cookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE) || 7,
    algorithm: 'HS256'
  },

  // Password Configuration
  password: {
    saltRounds: 10,
    minLength: 8,
    requireNumbers: true,
    requireSpecialChars: false,
    requireUppercase: true
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  },

  // Token Blacklist (for logout)
  tokenBlacklist: new Set(),

  // Rate Limiting for Login
  loginAttempts: {
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutes
  },

  // Email Verification
  emailVerification: {
    enabled: true,
    tokenExpiry: 24 * 60 * 60 * 1000 // 24 hours
  },

  // Password Reset
  passwordReset: {
    tokenExpiry: 1 * 60 * 60 * 1000, // 1 hour
    maxRequests: 3 // per day
  },

  // OAuth Providers (for future use)
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback'
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: '/auth/facebook/callback'
    }
  }
};
