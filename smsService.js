/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📱 SMS Service
 * خدمة إرسال الرسائل النصية
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const twilio = require('twilio');
require('dotenv').config();

class SMSService {
  
  constructor() {
    // Initialize Twilio client
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
      this.enabled = true;
    } else {
      console.warn('⚠️  SMS service disabled: Twilio credentials not found');
      this.enabled = false;
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CORE FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Send SMS
   */
  async sendSMS(to, message) {
    if (!this.enabled) {
      console.warn('⚠️  SMS service is disabled');
      return {
        success: false,
        error: 'SMS service is not configured'
      };
    }
    
    try {
      // Normalize phone number (add +20 for Egypt if not present)
      let phoneNumber = to.trim();
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;
        phoneNumber = `+20${phoneNumber}`;
      }
      
      const response = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });
      
      console.log('✅ SMS sent:', response.sid);
      return {
        success: true,
        sid: response.sid,
        status: response.status
      };
      
    } catch (error) {
      console.error('❌ SMS sending failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Send bulk SMS
   */
  async sendBulkSMS(phoneNumbers, message) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'SMS service is not configured'
      };
    }
    
    const results = [];
    
    for (const phone of phoneNumbers) {
      const result = await this.sendSMS(phone, message);
      results.push({
        phone,
        ...result
      });
      
      // Add delay to avoid rate limiting
      await this.delay(1000);
    }
    
    return results;
  }
  
  /**
   * Send WhatsApp message (via Twilio)
   */
  async sendWhatsApp(to, message) {
    if (!this.enabled) {
      return {
        success: false,
        error: 'SMS service is not configured'
      };
    }
    
    try {
      // Normalize phone number
      let phoneNumber = to.trim();
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;
        phoneNumber = `+20${phoneNumber}`;
      }
      
      const response = await this.client.messages.create({
        body: message,
        from: `whatsapp:${this.fromNumber}`,
        to: `whatsapp:${phoneNumber}`
      });
      
      console.log('✅ WhatsApp message sent:', response.sid);
      return {
        success: true,
        sid: response.sid,
        status: response.status
      };
      
    } catch (error) {
      console.error('❌ WhatsApp message failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VERIFICATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Send verification code
   */
  async sendVerificationCode(phone, code) {
    const message = `رمز التحقق الخاص بك في نزهة 2 هو: ${code}\nالرمز صالح لمدة 10 دقائق.`;
    
    return await this.sendSMS(phone, message);
  }
  
  /**
   * Generate verification code
   */
  generateVerificationCode(length = 6) {
    const digits = '0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return code;
  }
  
  /**
   * Send and store verification code
   */
  async sendAndStoreVerificationCode(phone) {
    const code = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    const result = await this.sendVerificationCode(phone, code);
    
    if (result.success) {
      // Store code in memory/cache or database
      // For now, returning code for manual verification
      return {
        success: true,
        code, // In production, don't return code directly
        expiresAt,
        phone
      };
    }
    
    return result;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ORDER NOTIFICATIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Send order confirmation SMS
   */
  async sendOrderConfirmation(order, customerPhone) {
    const message = `نزهة 2: تم تأكيد طلبك #${order.order_number}. المزود: ${order.vendor_name}. المبلغ: ${order.total} جنيه. شكراً لثقتك بنا!`;
    
    return await this.sendSMS(customerPhone, message);
  }
  
  /**
   * Send order status update SMS
   */
  async sendOrderStatusUpdate(order, customerPhone, status) {
    const statusMessages = {
      confirmed: 'تم تأكيد',
      in_progress: 'جاري تنفيذ',
      completed: 'تم إكمال',
      cancelled: 'تم إلغاء'
    };
    
    const message = `نزهة 2: ${statusMessages[status]} طلبك #${order.order_number}. المزود: ${order.vendor_name}`;
    
    return await this.sendSMS(customerPhone, message);
  }
  
  /**
   * Send new order notification to vendor
   */
  async sendNewOrderToVendor(order, vendorPhone) {
    const message = `نزهة 2: طلب جديد #${order.order_number} من ${order.customer_name}. المبلغ: ${order.total} جنيه. راجع التطبيق للتفاصيل.`;
    
    return await this.sendSMS(vendorPhone, message);
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SUBSCRIPTION NOTIFICATIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Send subscription expiry warning
   */
  async sendSubscriptionExpiryWarning(vendorPhone, daysRemaining) {
    const message = `نزهة 2: اشتراكك سينتهي خلال ${daysRemaining} يوم. جدد الآن للاستمرار في الظهور على المنصة.`;
    
    return await this.sendSMS(vendorPhone, message);
  }
  
  /**
   * Send subscription expired notification
   */
  async sendSubscriptionExpired(vendorPhone) {
    const message = `نزهة 2: انتهى اشتراكك. خدماتك لن تظهر للعملاء حتى التجديد. جدد الآن!`;
    
    return await this.sendSMS(vendorPhone, message);
  }
  
  /**
   * Send subscription renewal confirmation
   */
  async sendSubscriptionRenewal(vendorPhone, endDate) {
    const message = `نزهة 2: تم تجديد اشتراكك بنجاح! صالح حتى ${endDate}. شكراً لثقتك بنا!`;
    
    return await this.sendSMS(vendorPhone, message);
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // REVIEW NOTIFICATIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Send new review notification to vendor
   */
  async sendNewReviewNotification(vendorPhone, rating, customerName) {
    const stars = '⭐'.repeat(rating);
    const message = `نزهة 2: تقييم جديد! ${stars} (${rating}/5) من ${customerName}. راجع التطبيق للتفاصيل.`;
    
    return await this.sendSMS(vendorPhone, message);
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GENERAL NOTIFICATIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Send welcome SMS
   */
  async sendWelcomeSMS(phone, name) {
    const message = `مرحباً ${name}! أهلاً بك في نزهة 2 🎉 منصة الخدمات المنزلية الأولى. ابدأ الآن بتصفح الخدمات المتاحة.`;
    
    return await this.sendSMS(phone, message);
  }
  
  /**
   * Send custom notification
   */
  async sendCustomNotification(phone, title, message) {
    const fullMessage = `نزهة 2 - ${title}: ${message}`;
    
    return await this.sendSMS(phone, fullMessage);
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HELPER FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Validate Egyptian phone number
   */
  validateEgyptianPhone(phone) {
    // Remove spaces and dashes
    phone = phone.replace(/[\s-]/g, '');
    
    // Check if it's a valid Egyptian phone number
    const egyptianPhoneRegex = /^(\+20|0)?1[0125]\d{8}$/;
    
    return egyptianPhoneRegex.test(phone);
  }
  
  /**
   * Format Egyptian phone number
   */
  formatEgyptianPhone(phone) {
    // Remove spaces, dashes, and country code
    phone = phone.replace(/[\s-]/g, '');
    phone = phone.replace(/^\+20/, '');
    phone = phone.replace(/^20/, '');
    
    // Add leading zero if not present
    if (!phone.startsWith('0')) {
      phone = '0' + phone;
    }
    
    return phone;
  }
  
  /**
   * Delay helper for rate limiting
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Check service status
   */
  isEnabled() {
    return this.enabled;
  }
  
  /**
   * Get account balance (Twilio)
   */
  async getBalance() {
    if (!this.enabled) {
      return null;
    }
    
    try {
      const account = await this.client.api.accounts(this.accountSid).fetch();
      return {
        balance: account.balance,
        currency: account.currency
      };
    } catch (error) {
      console.error('Error fetching balance:', error.message);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new SMSService();
