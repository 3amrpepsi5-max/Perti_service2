/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🔔 Notification Model
 * نموذج الإشعارات
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const { query } = require('../config/database');

class Notification {
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CREATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async create(notificationData) {
    try {
      const sql = `
        INSERT INTO notifications (
          user_id, title, message, type, link, is_read
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const result = await query(sql, [
        notificationData.user_id,
        notificationData.title,
        notificationData.message,
        notificationData.type || 'system',
        notificationData.link || null,
        notificationData.is_read || false
      ]);
      
      return await this.findById(result.insertId);
      
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Create notification for multiple users
   */
  static async createBulk(userIds, notificationData) {
    try {
      const notifications = [];
      
      for (const userId of userIds) {
        const notification = await this.create({
          ...notificationData,
          user_id: userId
        });
        notifications.push(notification);
      }
      
      return notifications;
      
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Create order notification
   */
  static async createOrderNotification(userId, orderId, status, customMessage = null) {
    const messages = {
      pending: 'تم إنشاء طلب جديد',
      confirmed: 'تم تأكيد طلبك',
      in_progress: 'جاري تنفيذ طلبك',
      completed: 'تم إكمال طلبك بنجاح',
      cancelled: 'تم إلغاء طلبك'
    };
    
    return await this.create({
      user_id: userId,
      title: 'تحديث الطلب',
      message: customMessage || messages[status] || 'تحديث على طلبك',
      type: 'order',
      link: `/orders/${orderId}`
    });
  }
  
  /**
   * Create review notification
   */
  static async createReviewNotification(userId, vendorName, rating) {
    return await this.create({
      user_id: userId,
      title: 'تقييم جديد',
      message: `تلقيت تقييم ${rating} نجوم من ${vendorName}`,
      type: 'review',
      link: '/reviews'
    });
  }
  
  /**
   * Create subscription notification
   */
  static async createSubscriptionNotification(userId, type, daysRemaining = null) {
    const messages = {
      expiring: `اشتراكك سينتهي خلال ${daysRemaining} يوم`,
      expired: 'انتهى اشتراكك. قم بالتجديد للاستمرار',
      renewed: 'تم تجديد اشتراكك بنجاح',
      activated: 'تم تفعيل اشتراكك بنجاح'
    };
    
    return await this.create({
      user_id: userId,
      title: 'تحديث الاشتراك',
      message: messages[type] || 'تحديث على اشتراكك',
      type: 'subscription',
      link: '/subscription'
    });
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // READ
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async findById(id) {
    const sql = `
      SELECT n.*,
             u.name as user_name,
             u.email as user_email
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.id = ?
    `;
    
    const results = await query(sql, [id]);
    return results[0] || null;
  }
  
  /**
   * Get all notifications with filters
   */
  static async getAll(filters = {}) {
    let sql = `
      SELECT n.*,
             u.name as user_name
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filters
    if (filters.user_id) {
      sql += ' AND n.user_id = ?';
      params.push(filters.user_id);
    }
    
    if (filters.type) {
      sql += ' AND n.type = ?';
      params.push(filters.type);
    }
    
    if (filters.is_read !== undefined) {
      sql += ' AND n.is_read = ?';
      params.push(filters.is_read);
    }
    
    if (filters.date_from) {
      sql += ' AND n.created_at >= ?';
      params.push(filters.date_from);
    }
    
    if (filters.date_to) {
      sql += ' AND n.created_at <= ?';
      params.push(filters.date_to);
    }
    
    // Sorting
    sql += ' ORDER BY n.created_at DESC';
    
    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;
    
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const results = await query(sql, params);
    
    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM notifications WHERE 1=1';
    const countParams = [];
    
    if (filters.user_id) {
      countSql += ' AND user_id = ?';
      countParams.push(filters.user_id);
    }
    
    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;
    
    return {
      notifications: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Get user notifications
   */
  static async getUserNotifications(userId, filters = {}) {
    filters.user_id = userId;
    return await this.getAll(filters);
  }
  
  /**
   * Get unread notifications for user
   */
  static async getUnreadNotifications(userId, limit = 10) {
    const sql = `
      SELECT *
      FROM notifications
      WHERE user_id = ? AND is_read = FALSE
      ORDER BY created_at DESC
      LIMIT ?
    `;
    
    return await query(sql, [userId, limit]);
  }
  
  /**
   * Get recent notifications for user
   */
  static async getRecentNotifications(userId, limit = 10) {
    const sql = `
      SELECT *
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    
    return await query(sql, [userId, limit]);
  }
  
  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId) {
    const sql = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND is_read = FALSE
    `;
    
    const result = await query(sql, [userId]);
    return result[0].count;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UPDATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Mark notification as read
   */
  static async markAsRead(id) {
    const sql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = ?
    `;
    
    await query(sql, [id]);
    return await this.findById(id);
  }
  
  /**
   * Mark notification as unread
   */
  static async markAsUnread(id) {
    const sql = `
      UPDATE notifications
      SET is_read = FALSE
      WHERE id = ?
    `;
    
    await query(sql, [id]);
    return await this.findById(id);
  }
  
  /**
   * Mark all user notifications as read
   */
  static async markAllAsRead(userId) {
    const sql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = ? AND is_read = FALSE
    `;
    
    const result = await query(sql, [userId]);
    return result.affectedRows;
  }
  
  /**
   * Mark multiple notifications as read
   */
  static async markMultipleAsRead(notificationIds) {
    if (!notificationIds || notificationIds.length === 0) {
      return 0;
    }
    
    const placeholders = notificationIds.map(() => '?').join(',');
    const sql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id IN (${placeholders})
    `;
    
    const result = await query(sql, notificationIds);
    return result.affectedRows;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DELETE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async delete(id) {
    const sql = 'DELETE FROM notifications WHERE id = ?';
    await query(sql, [id]);
    return true;
  }
  
  /**
   * Delete all user notifications
   */
  static async deleteAllUserNotifications(userId) {
    const sql = 'DELETE FROM notifications WHERE user_id = ?';
    const result = await query(sql, [userId]);
    return result.affectedRows;
  }
  
  /**
   * Delete read notifications for user
   */
  static async deleteReadNotifications(userId) {
    const sql = 'DELETE FROM notifications WHERE user_id = ? AND is_read = TRUE';
    const result = await query(sql, [userId]);
    return result.affectedRows;
  }
  
  /**
   * Delete old notifications (cleanup)
   */
  static async deleteOldNotifications(days = 30) {
    const sql = `
      DELETE FROM notifications
      WHERE created_at < DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND is_read = TRUE
    `;
    
    const result = await query(sql, [days]);
    return result.affectedRows;
  }
  
  /**
   * Delete multiple notifications
   */
  static async deleteMultiple(notificationIds) {
    if (!notificationIds || notificationIds.length === 0) {
      return 0;
    }
    
    const placeholders = notificationIds.map(() => '?').join(',');
    const sql = `DELETE FROM notifications WHERE id IN (${placeholders})`;
    
    const result = await query(sql, notificationIds);
    return result.affectedRows;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATISTICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Get user notification statistics
   */
  static async getUserStats(userId) {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_read = TRUE THEN 1 ELSE 0 END) as read,
        SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN type = 'order' THEN 1 ELSE 0 END) as order_notifications,
        SUM(CASE WHEN type = 'review' THEN 1 ELSE 0 END) as review_notifications,
        SUM(CASE WHEN type = 'subscription' THEN 1 ELSE 0 END) as subscription_notifications,
        SUM(CASE WHEN type = 'system' THEN 1 ELSE 0 END) as system_notifications
      FROM notifications
      WHERE user_id = ?
    `;
    
    const result = await query(sql, [userId]);
    return result[0];
  }
  
  /**
   * Get overall statistics
   */
  static async getOverallStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_read = TRUE THEN 1 ELSE 0 END) as read,
        SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN type = 'order' THEN 1 ELSE 0 END) as order_notifications,
        SUM(CASE WHEN type = 'review' THEN 1 ELSE 0 END) as review_notifications,
        SUM(CASE WHEN type = 'subscription' THEN 1 ELSE 0 END) as subscription_notifications,
        SUM(CASE WHEN type = 'system' THEN 1 ELSE 0 END) as system_notifications
      FROM notifications
    `;
    
    const result = await query(sql);
    return result[0];
  }
  
  /**
   * Get notification activity by date
   */
  static async getActivityByDate(days = 30) {
    const sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN is_read = TRUE THEN 1 ELSE 0 END) as read,
        SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread
      FROM notifications
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    return await query(sql, [days]);
  }
  
  /**
   * Get notification distribution by type
   */
  static async getTypeDistribution() {
    const sql = `
      SELECT 
        type,
        COUNT(*) as count,
        SUM(CASE WHEN is_read = TRUE THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread_count
      FROM notifications
      GROUP BY type
    `;
    
    return await query(sql);
  }
}

module.exports = Notification;
