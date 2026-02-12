/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🏪 Vendor Model
 * نموذج المزود
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const { query } = require('../config/database');

class Vendor {
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CREATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async create(vendorData) {
    const sql = `
      INSERT INTO vendors (
        user_id, business_name, business_type, description,
        address, city, area, latitude, longitude,
        phone, whatsapp, email, logo_url, cover_image_url,
        opening_time, closing_time, is_24_hours,
        has_delivery, payment_methods, subscription_plan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await query(sql, [
      vendorData.user_id,
      vendorData.business_name,
      vendorData.business_type,
      vendorData.description || null,
      vendorData.address,
      vendorData.city || null,
      vendorData.area || null,
      vendorData.latitude,
      vendorData.longitude,
      vendorData.phone,
      vendorData.whatsapp,
      vendorData.email || null,
      vendorData.logo_url || null,
      vendorData.cover_image_url || null,
      vendorData.opening_time || null,
      vendorData.closing_time || null,
      vendorData.is_24_hours || false,
      vendorData.has_delivery || false,
      JSON.stringify(vendorData.payment_methods || ['cash']),
      vendorData.subscription_plan || null
    ]);
    
    return await this.findById(result.insertId);
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // READ
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async findById(id) {
    const sql = 'SELECT * FROM vendors WHERE id = ?';
    const results = await query(sql, [id]);
    return results[0] || null;
  }
  
  static async findByUserId(userId) {
    const sql = 'SELECT * FROM vendors WHERE user_id = ?';
    const results = await query(sql, [userId]);
    return results[0] || null;
  }
  
  static async getAll(filters = {}) {
    let sql = `
      SELECT v.*, u.name as owner_name, u.email as owner_email
      FROM vendors v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filters
    if (filters.business_type) {
      sql += ' AND v.business_type = ?';
      params.push(filters.business_type);
    }
    
    if (filters.city) {
      sql += ' AND v.city = ?';
      params.push(filters.city);
    }
    
    if (filters.status) {
      sql += ' AND v.status = ?';
      params.push(filters.status);
    }
    
    if (filters.search) {
      sql += ' AND (v.business_name LIKE ? OR v.description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    if (filters.min_rating) {
      sql += ' AND v.average_rating >= ?';
      params.push(filters.min_rating);
    }
    
    // Location-based search
    if (filters.latitude && filters.longitude && filters.radius) {
      sql += ` AND (
        6371 * acos(
          cos(radians(?)) * cos(radians(v.latitude)) *
          cos(radians(v.longitude) - radians(?)) +
          sin(radians(?)) * sin(radians(v.latitude))
        )
      ) <= ?`;
      params.push(
        filters.latitude,
        filters.longitude,
        filters.latitude,
        filters.radius
      );
    }
    
    // Sorting
    const sortBy = filters.sort || 'created_at';
    const sortOrder = filters.order === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY v.${sortBy} ${sortOrder}`;
    
    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;
    
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const results = await query(sql, params);
    
    // Get total count
    const countResult = await query('SELECT COUNT(*) as total FROM vendors');
    const total = countResult[0].total;
    
    return {
      vendors: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UPDATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async update(id, vendorData) {
    const updates = [];
    const params = [];
    
    const allowedFields = [
      'business_name', 'description', 'address', 'city', 'area',
      'phone', 'whatsapp', 'email', 'logo_url', 'cover_image_url',
      'opening_time', 'closing_time', 'is_24_hours', 'has_delivery'
    ];
    
    for (const field of allowedFields) {
      if (vendorData[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(vendorData[field]);
      }
    }
    
    if (updates.length === 0) {
      throw new Error('لا توجد بيانات للتحديث');
    }
    
    params.push(id);
    
    const sql = `
      UPDATE vendors
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, params);
    return await this.findById(id);
  }
  
  static async incrementViews(id) {
    const sql = `
      UPDATE vendors
      SET total_views = total_views + 1
      WHERE id = ?
    `;
    await query(sql, [id]);
  }
  
  static async updateStatus(id, status) {
    const sql = `
      UPDATE vendors
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await query(sql, [status, id]);
    return await this.findById(id);
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DELETE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async delete(id) {
    const sql = 'DELETE FROM vendors WHERE id = ?';
    await query(sql, [id]);
    return true;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATISTICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async getStats(vendorId) {
    const sql = `
      SELECT 
        v.total_views,
        v.total_reviews,
        v.average_rating,
        v.total_orders,
        COUNT(DISTINCT o.id) as completed_orders,
        SUM(CASE WHEN o.status = 'completed' THEN o.total ELSE 0 END) as total_revenue
      FROM vendors v
      LEFT JOIN orders o ON v.id = o.vendor_id
      WHERE v.id = ?
      GROUP BY v.id
    `;
    
    const result = await query(sql, [vendorId]);
    return result[0] || null;
  }
}

module.exports = Vendor;
