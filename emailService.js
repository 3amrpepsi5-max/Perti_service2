/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📧 Email Service
 * خدمة إرسال البريد الإلكتروني
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  
  constructor() {
    // Create transporter
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // Default from address
    this.fromAddress = process.env.SMTP_FROM || 'noreply@nozha2.com';
    this.fromName = process.env.SMTP_FROM_NAME || 'Nozha 2';
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CORE FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Send email
   */
  async sendEmail({ to, subject, html, text, attachments = [] }) {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to,
        subject,
        text,
        html,
        attachments
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent:', info.messageId);
      return {
        success: true,
        messageId: info.messageId
      };
      
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Verify transporter connection
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service ready');
      return true;
    } catch (error) {
      console.error('❌ Email service error:', error.message);
      return false;
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // AUTHENTICATION EMAILS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    const subject = 'مرحباً بك في نزهة 2 - Welcome to Nozha 2';
    
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #4CAF50; }
          .header h1 { color: #4CAF50; margin: 0; }
          .content { padding: 30px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 مرحباً بك في نزهة 2</h1>
          </div>
          <div class="content">
            <h2>مرحباً ${user.name}،</h2>
            <p>شكراً لانضمامك إلى منصة نزهة 2 للخدمات المنزلية!</p>
            <p>نحن سعداء بوجودك معنا. يمكنك الآن الوصول إلى مئات الخدمات والمزودين في منطقتك.</p>
            <p>ابدأ الآن بتصفح الخدمات المتاحة:</p>
            <center>
              <a href="${process.env.APP_URL || 'http://localhost:3000'}" class="button">تصفح الخدمات</a>
            </center>
            <p>إذا كان لديك أي استفسار، لا تتردد في التواصل معنا.</p>
            <p>تحياتنا،<br>فريق نزهة 2</p>
          </div>
          <div class="footer">
            <p>© 2024 Nozha 2. جميع الحقوق محفوظة.</p>
            <p>هذا البريد تم إرساله إلى ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await this.sendEmail({
      to: user.email,
      subject,
      html,
      text: `مرحباً ${user.name}، شكراً لانضمامك إلى منصة نزهة 2!`
    });
  }
  
  /**
   * Send email verification
   */
  async sendEmailVerification(user, verificationToken) {
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;
    const subject = 'تأكيد البريد الإلكتروني - Email Verification';
    
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
          .header { text-align: center; padding: 20px 0; }
          .content { padding: 20px 0; }
          .button { display: inline-block; padding: 15px 40px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .code { background: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ تأكيد البريد الإلكتروني</h1>
          </div>
          <div class="content">
            <h2>مرحباً ${user.name}،</h2>
            <p>شكراً لتسجيلك في نزهة 2. يرجى تأكيد بريدك الإلكتروني بالنقر على الزر أدناه:</p>
            <center>
              <a href="${verificationUrl}" class="button">تأكيد البريد الإلكتروني</a>
            </center>
            <p>أو يمكنك نسخ الرابط التالي ولصقه في المتصفح:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p><strong>ملاحظة:</strong> هذا الرابط صالح لمدة 24 ساعة فقط.</p>
            <p>إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذا البريد.</p>
          </div>
          <div class="footer">
            <p>© 2024 Nozha 2. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await this.sendEmail({
      to: user.email,
      subject,
      html,
      text: `تأكيد البريد الإلكتروني: ${verificationUrl}`
    });
  }
  
  /**
   * Send password reset email
   */
  async sendPasswordReset(user, resetToken) {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    const subject = 'إعادة تعيين كلمة المرور - Password Reset';
    
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
          .header { text-align: center; padding: 20px 0; }
          .content { padding: 20px 0; }
          .button { display: inline-block; padding: 15px 40px; background: #FF5722; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .warning { background: #fff3cd; padding: 15px; border-right: 4px solid #ffc107; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 إعادة تعيين كلمة المرور</h1>
          </div>
          <div class="content">
            <h2>مرحباً ${user.name}،</h2>
            <p>تلقينا طلباً لإعادة تعيين كلمة مرور حسابك. انقر على الزر أدناه لإعادة تعيين كلمة المرور:</p>
            <center>
              <a href="${resetUrl}" class="button">إعادة تعيين كلمة المرور</a>
            </center>
            <div class="warning">
              <strong>⚠️ تنبيه أمني:</strong>
              <p>هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.</p>
            </div>
            <p>للأمان، لن نطلب منك أبداً كلمة المرور عبر البريد الإلكتروني.</p>
          </div>
          <div class="footer">
            <p>© 2024 Nozha 2. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await this.sendEmail({
      to: user.email,
      subject,
      html,
      text: `إعادة تعيين كلمة المرور: ${resetUrl}`
    });
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ORDER EMAILS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(order, user) {
    const subject = `تأكيد الطلب #${order.order_number}`;
    
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
          .header { text-align: center; padding: 20px 0; background: #4CAF50; color: white; border-radius: 10px 10px 0 0; margin: -30px -30px 20px; }
          .order-details { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; color: #4CAF50; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ تم تأكيد طلبك</h1>
          </div>
          <div class="content">
            <h2>مرحباً ${user.name}،</h2>
            <p>شكراً لك! تم تأكيد طلبك بنجاح.</p>
            <div class="order-details">
              <h3>تفاصيل الطلب:</h3>
              <div class="detail-row">
                <span>رقم الطلب:</span>
                <strong>${order.order_number}</strong>
              </div>
              <div class="detail-row">
                <span>المزود:</span>
                <strong>${order.vendor_name}</strong>
              </div>
              <div class="detail-row">
                <span>التاريخ المحدد:</span>
                <strong>${order.scheduled_date || 'غير محدد'}</strong>
              </div>
              <div class="detail-row">
                <span>المبلغ:</span>
                <strong>${order.amount} جنيه</strong>
              </div>
              ${order.delivery_fee > 0 ? `
              <div class="detail-row">
                <span>رسوم التوصيل:</span>
                <strong>${order.delivery_fee} جنيه</strong>
              </div>
              ` : ''}
              <div class="detail-row total">
                <span>المجموع:</span>
                <strong>${order.total} جنيه</strong>
              </div>
            </div>
            <p>سيتم التواصل معك قريباً من قبل المزود لتأكيد تفاصيل الخدمة.</p>
          </div>
          <div class="footer">
            <p>© 2024 Nozha 2. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await this.sendEmail({
      to: user.email,
      subject,
      html,
      text: `تم تأكيد طلبك رقم ${order.order_number}`
    });
  }
  
  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(order, user, status) {
    const statusMessages = {
      confirmed: 'تم تأكيد طلبك',
      in_progress: 'جاري تنفيذ طلبك',
      completed: 'تم إكمال طلبك',
      cancelled: 'تم إلغاء طلبك'
    };
    
    const subject = `${statusMessages[status]} - طلب #${order.order_number}`;
    
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
          .status-badge { display: inline-block; padding: 10px 20px; border-radius: 5px; color: white; font-weight: bold; }
          .status-confirmed { background: #2196F3; }
          .status-in_progress { background: #FF9800; }
          .status-completed { background: #4CAF50; }
          .status-cancelled { background: #f44336; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>تحديث حالة الطلب</h1>
          <div style="text-align: center; margin: 20px 0;">
            <span class="status-badge status-${status}">${statusMessages[status]}</span>
          </div>
          <h2>مرحباً ${user.name}،</h2>
          <p>${statusMessages[status]} رقم <strong>${order.order_number}</strong></p>
          <p>المزود: <strong>${order.vendor_name}</strong></p>
          ${order.vendor_notes ? `<p><strong>ملاحظات المزود:</strong> ${order.vendor_notes}</p>` : ''}
          <div class="footer">
            <p>© 2024 Nozha 2. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await this.sendEmail({
      to: user.email,
      subject,
      html,
      text: `${statusMessages[status]} رقم ${order.order_number}`
    });
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SUBSCRIPTION EMAILS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Send subscription expiry warning
   */
  async sendSubscriptionExpiryWarning(vendor, user, daysRemaining) {
    const subject = `⚠️ اشتراكك سينتهي خلال ${daysRemaining} يوم`;
    
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
          .warning { background: #fff3cd; padding: 20px; border-right: 4px solid #ffc107; margin: 20px 0; }
          .button { display: inline-block; padding: 15px 40px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚠️ تنبيه انتهاء الاشتراك</h1>
          <div class="warning">
            <h2>مرحباً ${user.name}،</h2>
            <p>اشتراكك في نزهة 2 سينتهي خلال <strong>${daysRemaining} يوم</strong>.</p>
            <p>تاريخ الانتهاء: <strong>${vendor.subscription_end}</strong></p>
          </div>
          <p>لضمان استمرار ظهور خدماتك على المنصة، يرجى تجديد اشتراكك قبل انتهاء الصلاحية.</p>
          <center>
            <a href="${process.env.APP_URL}/subscription/renew" class="button">جدد اشتراكك الآن</a>
          </center>
          <div class="footer">
            <p>© 2024 Nozha 2. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await this.sendEmail({
      to: user.email,
      subject,
      html,
      text: `اشتراكك سينتهي خلال ${daysRemaining} يوم. جدد الآن!`
    });
  }
  
  /**
   * Send subscription renewal confirmation
   */
  async sendSubscriptionRenewal(subscription, user) {
    const subject = '✅ تم تجديد اشتراكك بنجاح';
    
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
          .success { background: #d4edda; padding: 20px; border-right: 4px solid #4CAF50; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ تم تجديد الاشتراك</h1>
          <div class="success">
            <h2>مرحباً ${user.name}،</h2>
            <p>تم تجديد اشتراكك في نزهة 2 بنجاح!</p>
            <p>الخطة: <strong>${subscription.plan}</strong></p>
            <p>تاريخ الانتهاء الجديد: <strong>${subscription.end_date}</strong></p>
          </div>
          <p>شكراً لثقتك بنا!</p>
          <div class="footer">
            <p>© 2024 Nozha 2. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await this.sendEmail({
      to: user.email,
      subject,
      html,
      text: `تم تجديد اشتراكك بنجاح حتى ${subscription.end_date}`
    });
  }
}

// Export singleton instance
module.exports = new EmailService();
