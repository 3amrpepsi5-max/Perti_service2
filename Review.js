/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ⭐ Review Model
 * نموذج التقييمات
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const { query } = require('../config/database');

class Review {
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CREATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async create(reviewData) {
    try {
      // Validate rating
      if (reviewData.rating < 1 || reviewData.rating > 5) {
        throw new Error('التقييم يجب أن يكون بين 1 و 5');
      }
      
      // Check if user already reviewed this vendor
      const existingReview = await this.findByUserAndVendor(
        reviewData.user_id,
        reviewData.vendor_id
      );
      
      if (existingReview) {
        throw new Error('لقد قمت بتقييم هذا المزود من قبل');
      }
      
      const sql = `
        INSERT INTO reviews (
          vendor_id, user_id, rating, comment, images, is_verified
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const result = await query(sql, [
        reviewData.vendor_id,
        reviewData.user_id,
        reviewData.rating,
        reviewData.comment || null,
        reviewData.images ? JSON.stringify(reviewData.images) : null,
        reviewData.is_verified || false
      ]);
      
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
      SELECT r.*,
             u.name as user_name,
             u.avatar_url as user_avatar,
             v.business_name as vendor_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE r.id = ?
    `;
    
    const results = await query(sql, [id]);
    return results[0] || null;
  }
  
  static async findByUserAndVendor(userId, vendorId) {
    const sql = `
      SELECT * FROM reviews
      WHERE user_id = ? AND vendor_id = ?
    `;
    
    const results = await query(sql, [userId, vendorId]);
    return results[0] || null;
  }
  
  /**
   * Get all reviews with filters
   */
  static async getAll(filters = {}) {
    let sql = `
      SELECT r.*,
             u.name as user_name,
             u.avatar_url as user_avatar,
             v.business_name as vendor_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filters
    if (filters.vendor_id) {
      sql += ' AND r.vendor_id = ?';
      params.push(filters.vendor_id);
    }
    
    if (filters.user_id) {
      sql += ' AND r.user_id = ?';
      params.push(filters.user_id);
    }
    
    if (filters.rating) {
      sql += ' AND r.rating = ?';
      params.push(filters.rating);
    }
    
    if (filters.min_rating) {
      sql += ' AND r.rating >= ?';
      params.push(filters.min_rating);
    }
    
    if (filters.is_verified !== undefined) {
      sql += ' AND r.is_verified = ?';
      params.push(filters.is_verified);
    }
    
    if (filters.is_flagged !== undefined) {
      sql += ' AND r.is_flagged = ?';
      params.push(filters.is_flagged);
    }
    
    if (filters.has_response !== undefined) {
      if (filters.has_response) {
        sql += ' AND r.response IS NOT NULL';
      } else {
        sql += ' AND r.response IS NULL';
      }
    }
    
    // Sorting
    const sortBy = filters.sort || 'created_at';
    const sortOrder = filters.order || 'DESC';
    sql += ` ORDER BY r.${sortBy} ${sortOrder}`;
    
    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;
    
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const results = await query(sql, params);
    
    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM reviews WHERE 1=1';
    const countParams = [];
    
    if (filters.vendor_id) {
      countSql += ' AND vendor_id = ?';
      countParams.push(filters.vendor_id);
    }
    
    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;
    
    return {
      reviews: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Get vendor reviews
   */
  static async getVendorReviews(vendorId, filters = {}) {
    filters.vendor_id = vendorId;
    return await this.getAll(filters);
  }
  
  /**
   * Get user reviews
   */
  static async getUserReviews(userId, filters = {}) {
    filters.user_id = userId;
    return await this.getAll(filters);
  }
  
  /**
   * Get recent reviews
   */
  static async getRecentReviews(limit = 10) {
    const sql = `
      SELECT r.*,
             u.name as user_name,
             u.avatar_url as user_avatar,
             v.business_name as vendor_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE r.is_verified = TRUE AND r.is_flagged = FALSE
      ORDER BY r.created_at DESC
      LIMIT ?
    `;
    
    return await query(sql, [limit]);
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UPDATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async update(id, reviewData) {
    const allowedFields = ['rating', 'comment', 'images'];
    const updates = [];
    const params = [];
    
    for (const field of allowedFields) {
      if (reviewData[field] !== undefined) {
        if (field === 'images') {
          updates.push(`${field} = ?`);
          params.push(JSON.stringify(reviewData[field]));
        } else if (field === 'rating') {
          if (reviewData.rating < 1 || reviewData.rating > 5) {
            throw new Error('التقييم يجب أن يكون بين 1 و 5');
          }
          updates.push(`${field} = ?`);
          params.push(reviewData[field]);
        } else {
          updates.push(`${field} = ?`);
          params.push(reviewData[field]);
        }
      }
    }
    
    if (updates.length === 0) {
      throw new Error('لا توجد بيانات للتحديث');
    }
    
    params.push(id);
    
    const sql = `
      UPDATE reviews
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, params);
    return await this.findById(id);
  }
  
  /**
   * Add vendor response to review
   */
  static async addResponse(id, response) {
    const sql = `
      UPDATE reviews
      SET response = ?, 
          response_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [response, id]);
    return await this.findById(id);
  }
  
  /**
   * Verify review
   */
  static async verify(id) {
    const sql = `
      UPDATE reviews
      SET is_verified = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [id]);
    return await this.findById(id);
  }
  
  /**
   * Flag review
   */
  static async flag(id, reason) {
    const sql = `
      UPDATE reviews
      SET is_flagged = TRUE,
          flag_reason = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [reason, id]);
    return await this.findById(id);
  }
  
  /**
   * Unflag review
   */
  static async unflag(id) {
    const sql = `
      UPDATE reviews
      SET is_flagged = FALSE,
          flag_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [id]);
    return await this.findById(id);
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DELETE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async delete(id) {
    const sql = 'DELETE FROM reviews WHERE id = ?';
    await query(sql, [id]);
    return true;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATISTICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Get vendor rating statistics
   */
  static async getVendorStats(vendorId) {
    const sql = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star,
        SUM(CASE WHEN is_verified = TRUE THEN 1 ELSE 0 END) as verified_reviews,
        SUM(CASE WHEN response IS NOT NULL THEN 1 ELSE 0 END) as responded_reviews
      FROM reviews
      WHERE vendor_id = ?
    `;
    
    const result = await query(sql, [vendorId]);
    return result[0];
  }
  
  /**
   * Get overall statistics
   */
  static async getOverallStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        AVG(rating) as average_rating,
        SUM(CASE WHEN is_verified = TRUE THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN is_flagged = TRUE THEN 1 ELSE 0 END) as flagged,
        SUM(CASE WHEN response IS NOT NULL THEN 1 ELSE 0 END) as with_response
      FROM reviews
    `;
    
    const result = await query(sql);
    return result[0];
  }
  
  /**
   * Get rating distribution for a vendor
   */
  static async getRatingDistribution(vendorId) {
    const stats = await this.getVendorStats(vendorId);
    
    const total = stats.total_reviews || 1;
    
    return {
      5: {
        count: stats.five_star || 0,
        percentage: ((stats.five_star || 0) / total * 100).toFixed(1)
      },
      4: {
        count: stats.four_star || 0,
        percentage: ((stats.four_star || 0) / total * 100).toFixed(1)
      },
      3: {
        count: stats.three_star || 0,
        percentage: ((stats.three_star || 0) / total * 100).toFixed(1)
      },
      2: {
        count: stats.two_star || 0,
        percentage: ((stats.two_star || 0) / total * 100).toFixed(1)
      },
      1: {
        count: stats.one_star || 0,
        percentage: ((stats.one_star || 0) / total * 100).toFixed(1)
      }
    };
  }
}

module.exports = Review;
