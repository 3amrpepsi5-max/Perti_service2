/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 💳 Subscription Model
 * نموذج الاشتراكات
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const { query } = require('../config/database');

class Subscription {
  
  // Subscription plans pricing (can be moved to config)
  static PLANS = {
    monthly: {
      name: 'شهري',
      name_en: 'Monthly',
      price: 100,
      duration_months: 1
    },
    quarterly: {
      name: 'ربع سنوي',
      name_en: 'Quarterly',
      price: 270,
      duration_months: 3
    },
    semiannual: {
      name: 'نصف سنوي',
      name_en: 'Semi-Annual',
      price: 500,
      duration_months: 6
    },
    annual: {
      name: 'سنوي',
      name_en: 'Annual',
      price: 900,
      duration_months: 12
    }
  };
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CREATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async create(subscriptionData) {
    try {
      // Validate plan
      if (!this.PLANS[subscriptionData.plan]) {
        throw new Error('خطة الاشتراك غير صحيحة');
      }
      
      // Get plan details
      const planDetails = this.PLANS[subscriptionData.plan];
      const price = subscriptionData.price || planDetails.price;
      
      // Calculate dates
      const startDate = subscriptionData.start_date || new Date();
      const endDate = this.calculateEndDate(startDate, planDetails.duration_months);
      
      const sql = `
        INSERT INTO subscriptions (
          vendor_id, plan, price, start_date, end_date,
          payment_method, transaction_id, payment_status,
          status, auto_renew
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await query(sql, [
        subscriptionData.vendor_id,
        subscriptionData.plan,
        price,
        startDate,
        endDate,
        subscriptionData.payment_method || null,
        subscriptionData.transaction_id || null,
        subscriptionData.payment_status || 'pending',
        subscriptionData.status || 'active',
        subscriptionData.auto_renew || false
      ]);
      
      // Update vendor subscription info
      await this.updateVendorSubscription(subscriptionData.vendor_id);
      
      return await this.findById(result.insertId);
      
    } catch (error) {
      throw error;
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // READ
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async findById(id) {
    const sql = `
      SELECT s.*,
             v.business_name as vendor_name,
             v.phone as vendor_phone,
             u.name as owner_name,
             u.email as owner_email
      FROM subscriptions s
      LEFT JOIN vendors v ON s.vendor_id = v.id
      LEFT JOIN users u ON v.user_id = u.id
      WHERE s.id = ?
    `;
    
    const results = await query(sql, [id]);
    return results[0] || null;
  }
  
  /**
   * Get all subscriptions with filters
   */
  static async getAll(filters = {}) {
    let sql = `
      SELECT s.*,
             v.business_name as vendor_name,
             v.phone as vendor_phone,
             u.name as owner_name
      FROM subscriptions s
      LEFT JOIN vendors v ON s.vendor_id = v.id
      LEFT JOIN users u ON v.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filters
    if (filters.vendor_id) {
      sql += ' AND s.vendor_id = ?';
      params.push(filters.vendor_id);
    }
    
    if (filters.plan) {
      sql += ' AND s.plan = ?';
      params.push(filters.plan);
    }
    
    if (filters.status) {
      sql += ' AND s.status = ?';
      params.push(filters.status);
    }
    
    if (filters.payment_status) {
      sql += ' AND s.payment_status = ?';
      params.push(filters.payment_status);
    }
    
    if (filters.expiring_soon) {
      // Get subscriptions expiring in next 7 days
      sql += ' AND s.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)';
      sql += ' AND s.status = "active"';
    }
    
    if (filters.expired) {
      sql += ' AND s.end_date < CURDATE()';
      sql += ' AND s.status = "active"';
    }
    
    // Sorting
    const sortBy = filters.sort || 'created_at';
    const sortOrder = filters.order || 'DESC';
    sql += ` ORDER BY s.${sortBy} ${sortOrder}`;
    
    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;
    
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const results = await query(sql, params);
    
    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM subscriptions WHERE 1=1';
    const countParams = [];
    
    if (filters.vendor_id) {
      countSql += ' AND vendor_id = ?';
      countParams.push(filters.vendor_id);
    }
    
    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;
    
    return {
      subscriptions: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Get vendor subscriptions
   */
  static async getVendorSubscriptions(vendorId, filters = {}) {
    filters.vendor_id = vendorId;
    return await this.getAll(filters);
  }
  
  /**
   * Get active subscription for vendor
   */
  static async getActiveSubscription(vendorId) {
    const sql = `
      SELECT s.*,
             DATEDIFF(s.end_date, CURDATE()) as days_remaining
      FROM subscriptions s
      WHERE s.vendor_id = ?
        AND s.status = 'active'
        AND s.payment_status = 'completed'
        AND s.end_date >= CURDATE()
      ORDER BY s.end_date DESC
      LIMIT 1
    `;
    
    const results = await query(sql, [vendorId]);
    return results[0] || null;
  }
  
  /**
   * Get expiring subscriptions
   */
  static async getExpiringSubscriptions(days = 7) {
    const sql = `
      SELECT s.*,
             v.business_name as vendor_name,
             v.phone as vendor_phone,
             u.email as owner_email,
             DATEDIFF(s.end_date, CURDATE()) as days_remaining
      FROM subscriptions s
      LEFT JOIN vendors v ON s.vendor_id = v.id
      LEFT JOIN users u ON v.user_id = u.id
      WHERE s.status = 'active'
        AND s.payment_status = 'completed'
        AND s.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY s.end_date ASC
    `;
    
    return await query(sql, [days]);
  }
  
  /**
   * Get expired subscriptions
   */
  static async getExpiredSubscriptions() {
    const sql = `
      SELECT s.*,
             v.business_name as vendor_name,
             v.phone as vendor_phone,
             u.email as owner_email
      FROM subscriptions s
      LEFT JOIN vendors v ON s.vendor_id = v.id
      LEFT JOIN users u ON v.user_id = u.id
      WHERE s.status = 'active'
        AND s.end_date < CURDATE()
      ORDER BY s.end_date DESC
    `;
    
    return await query(sql);
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UPDATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async update(id, subscriptionData) {
    const allowedFields = ['payment_method', 'transaction_id', 'auto_renew'];
    const updates = [];
    const params = [];
    
    for (const field of allowedFields) {
      if (subscriptionData[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(subscriptionData[field]);
      }
    }
    
    if (updates.length === 0) {
      throw new Error('لا توجد بيانات للتحديث');
    }
    
    params.push(id);
    
    const sql = `
      UPDATE subscriptions
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, params);
    return await this.findById(id);
  }
  
  /**
   * Update payment status
   */
  static async updatePaymentStatus(id, paymentStatus, transactionId = null) {
    const validStatuses = ['pending', 'completed', 'failed'];
    
    if (!validStatuses.includes(paymentStatus)) {
      throw new Error('حالة الدفع غير صحيحة');
    }
    
    let sql = `
      UPDATE subscriptions
      SET payment_status = ?, updated_at = CURRENT_TIMESTAMP
    `;
    
    const params = [paymentStatus];
    
    if (transactionId) {
      sql += ', transaction_id = ?';
      params.push(transactionId);
    }
    
    sql += ' WHERE id = ?';
    params.push(id);
    
    await query(sql, params);
    
    // Update vendor subscription if payment completed
    if (paymentStatus === 'completed') {
      const subscription = await this.findById(id);
      await this.updateVendorSubscription(subscription.vendor_id);
    }
    
    return await this.findById(id);
  }
  
  /**
   * Activate subscription
   */
  static async activate(id) {
    const sql = `
      UPDATE subscriptions
      SET status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [id]);
    
    const subscription = await this.findById(id);
    await this.updateVendorSubscription(subscription.vendor_id);
    
    return subscription;
  }
  
  /**
   * Expire subscription
   */
  static async expire(id) {
    const sql = `
      UPDATE subscriptions
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [id]);
    
    const subscription = await this.findById(id);
    await this.updateVendorSubscription(subscription.vendor_id);
    
    return subscription;
  }
  
  /**
   * Cancel subscription
   */
  static async cancel(id) {
    const sql = `
      UPDATE subscriptions
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [id]);
    
    const subscription = await this.findById(id);
    await this.updateVendorSubscription(subscription.vendor_id);
    
    return subscription;
  }
  
  /**
   * Renew subscription (create new subscription)
   */
  static async renew(vendorId, plan = null) {
    // Get current subscription
    const currentSubscription = await this.getActiveSubscription(vendorId);
    
    if (!currentSubscription) {
      throw new Error('لا يوجد اشتراك نشط للتجديد');
    }
    
    // Use current plan if not specified
    const renewalPlan = plan || currentSubscription.plan;
    
    // Create new subscription starting from current end date
    const newSubscription = await this.create({
      vendor_id: vendorId,
      plan: renewalPlan,
      start_date: currentSubscription.end_date,
      auto_renew: currentSubscription.auto_renew,
      payment_status: 'pending',
      status: 'active'
    });
    
    return newSubscription;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DELETE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async delete(id) {
    // Only allow deletion of cancelled or failed payment subscriptions
    const subscription = await this.findById(id);
    
    if (!subscription) {
      throw new Error('الاشتراك غير موجود');
    }
    
    if (subscription.status === 'active' && subscription.payment_status === 'completed') {
      throw new Error('لا يمكن حذف اشتراك نشط ومدفوع');
    }
    
    const sql = 'DELETE FROM subscriptions WHERE id = ?';
    await query(sql, [id]);
    return true;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HELPER METHODS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Calculate end date based on plan duration
   */
  static calculateEndDate(startDate, durationMonths) {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    return endDate;
  }
  
  /**
   * Update vendor subscription information
   */
  static async updateVendorSubscription(vendorId) {
    const activeSubscription = await this.getActiveSubscription(vendorId);
    
    let vendorStatus = 'pending';
    let subscriptionPlan = null;
    let subscriptionStart = null;
    let subscriptionEnd = null;
    
    if (activeSubscription) {
      vendorStatus = 'active';
      subscriptionPlan = activeSubscription.plan;
      subscriptionStart = activeSubscription.start_date;
      subscriptionEnd = activeSubscription.end_date;
    } else {
      // Check if expired
      const expiredCheck = await query(
        'SELECT * FROM subscriptions WHERE vendor_id = ? ORDER BY end_date DESC LIMIT 1',
        [vendorId]
      );
      
      if (expiredCheck.length > 0 && expiredCheck[0].end_date < new Date()) {
        vendorStatus = 'expired';
      }
    }
    
    const sql = `
      UPDATE vendors
      SET subscription_plan = ?,
          subscription_start = ?,
          subscription_end = ?,
          status = ?
      WHERE id = ?
    `;
    
    await query(sql, [
      subscriptionPlan,
      subscriptionStart,
      subscriptionEnd,
      vendorStatus,
      vendorId
    ]);
  }
  
  /**
   * Check and update expired subscriptions (cron job helper)
   */
  static async updateExpiredSubscriptions() {
    const expiredSubs = await this.getExpiredSubscriptions();
    
    for (const sub of expiredSubs) {
      await this.expire(sub.id);
    }
    
    return expiredSubs.length;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATISTICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN payment_status = 'completed' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_payment,
        SUM(CASE WHEN payment_status = 'failed' THEN 1 ELSE 0 END) as failed_payment,
        SUM(CASE WHEN payment_status = 'completed' THEN price ELSE 0 END) as total_revenue,
        SUM(CASE WHEN plan = 'monthly' THEN 1 ELSE 0 END) as monthly_count,
        SUM(CASE WHEN plan = 'quarterly' THEN 1 ELSE 0 END) as quarterly_count,
        SUM(CASE WHEN plan = 'semiannual' THEN 1 ELSE 0 END) as semiannual_count,
        SUM(CASE WHEN plan = 'annual' THEN 1 ELSE 0 END) as annual_count
      FROM subscriptions
    `;
    
    const result = await query(sql);
    return result[0];
  }
  
  /**
   * Get revenue by month
   */
  static async getMonthlyRevenue(months = 12) {
    const sql = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as subscription_count,
        SUM(CASE WHEN payment_status = 'completed' THEN price ELSE 0 END) as revenue
      FROM subscriptions
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `;
    
    return await query(sql, [months]);
  }
  
  /**
   * Get plan distribution
   */
  static async getPlanDistribution() {
    const sql = `
      SELECT 
        plan,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN payment_status = 'completed' THEN price ELSE 0 END) as total_revenue
      FROM subscriptions
      GROUP BY plan
    `;
    
    return await query(sql);
  }
}

module.exports = Subscription;
