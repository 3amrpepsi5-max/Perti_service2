/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📂 Category Model
 * نموذج الفئات
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const { query } = require('../config/database');

class Category {
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CREATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async create(categoryData) {
    try {
      const sql = `
        INSERT INTO categories (
          name, name_en, slug, icon, color, description,
          parent_id, sort_order, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await query(sql, [
        categoryData.name,
        categoryData.name_en || null,
        categoryData.slug,
        categoryData.icon || null,
        categoryData.color || null,
        categoryData.description || null,
        categoryData.parent_id || null,
        categoryData.sort_order || 0,
        categoryData.is_active !== undefined ? categoryData.is_active : true
      ]);
      
      return await this.findById(result.insertId);
      
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('اسم الفئة أو الـ slug مستخدم بالفعل');
      }
      throw error;
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // READ
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async findById(id) {
    const sql = 'SELECT * FROM categories WHERE id = ?';
    const results = await query(sql, [id]);
    return results[0] || null;
  }
  
  static async findBySlug(slug) {
    const sql = 'SELECT * FROM categories WHERE slug = ?';
    const results = await query(sql, [slug]);
    return results[0] || null;
  }
  
  static async getAll(filters = {}) {
    let sql = `
      SELECT c.*, 
             (SELECT COUNT(*) FROM vendors WHERE category_id = c.id) as vendor_count,
             parent.name as parent_name
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filters
    if (filters.parent_id !== undefined) {
      if (filters.parent_id === null) {
        sql += ' AND c.parent_id IS NULL';
      } else {
        sql += ' AND c.parent_id = ?';
        params.push(filters.parent_id);
      }
    }
    
    if (filters.is_active !== undefined) {
      sql += ' AND c.is_active = ?';
      params.push(filters.is_active);
    }
    
    if (filters.search) {
      sql += ' AND (c.name LIKE ? OR c.name_en LIKE ? OR c.slug LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Sorting
    sql += ' ORDER BY c.sort_order ASC, c.name ASC';
    
    const results = await query(sql, params);
    
    return results;
  }
  
  /**
   * Get main categories (parent categories only)
   */
  static async getMainCategories() {
    const sql = `
      SELECT c.*,
             (SELECT COUNT(*) FROM vendors WHERE category_id = c.id) as vendor_count
      FROM categories c
      WHERE c.parent_id IS NULL AND c.is_active = TRUE
      ORDER BY c.sort_order ASC, c.name ASC
    `;
    
    return await query(sql);
  }
  
  /**
   * Get subcategories for a parent category
   */
  static async getSubcategories(parentId) {
    const sql = `
      SELECT c.*,
             (SELECT COUNT(*) FROM vendors WHERE category_id = c.id) as vendor_count
      FROM categories c
      WHERE c.parent_id = ? AND c.is_active = TRUE
      ORDER BY c.sort_order ASC, c.name ASC
    `;
    
    return await query(sql, [parentId]);
  }
  
  /**
   * Get category tree (hierarchical structure)
   */
  static async getCategoryTree() {
    const mainCategories = await this.getMainCategories();
    
    for (const category of mainCategories) {
      category.subcategories = await this.getSubcategories(category.id);
    }
    
    return mainCategories;
  }
  
  /**
   * Get category with vendors
   */
  static async getCategoryWithVendors(id, filters = {}) {
    const category = await this.findById(id);
    
    if (!category) {
      return null;
    }
    
    let vendorSql = `
      SELECT v.*, 
             u.name as owner_name,
             (SELECT COUNT(*) FROM reviews WHERE vendor_id = v.id) as review_count
      FROM vendors v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.category_id = ? AND v.status = 'active'
    `;
    
    const params = [id];
    
    // Additional filters
    if (filters.city) {
      vendorSql += ' AND v.city = ?';
      params.push(filters.city);
    }
    
    if (filters.min_rating) {
      vendorSql += ' AND v.average_rating >= ?';
      params.push(filters.min_rating);
    }
    
    // Sorting
    const sortBy = filters.sort || 'average_rating';
    const sortOrder = filters.order || 'DESC';
    vendorSql += ` ORDER BY v.${sortBy} ${sortOrder}`;
    
    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;
    
    vendorSql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    category.vendors = await query(vendorSql, params);
    
    return category;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UPDATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async update(id, categoryData) {
    const allowedFields = [
      'name', 'name_en', 'slug', 'icon', 'color',
      'description', 'parent_id', 'sort_order', 'is_active'
    ];
    
    const updates = [];
    const params = [];
    
    for (const field of allowedFields) {
      if (categoryData[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(categoryData[field]);
      }
    }
    
    if (updates.length === 0) {
      throw new Error('لا توجد بيانات للتحديث');
    }
    
    params.push(id);
    
    const sql = `
      UPDATE categories
      SET ${updates.join(', ')}
      WHERE id = ?
    `;
    
    await query(sql, params);
    return await this.findById(id);
  }
  
  /**
   * Update category sort order
   */
  static async updateSortOrder(id, sortOrder) {
    const sql = `
      UPDATE categories
      SET sort_order = ?
      WHERE id = ?
    `;
    
    await query(sql, [sortOrder, id]);
    return await this.findById(id);
  }
  
  /**
   * Activate category
   */
  static async activate(id) {
    const sql = `
      UPDATE categories
      SET is_active = TRUE
      WHERE id = ?
    `;
    
    await query(sql, [id]);
    return await this.findById(id);
  }
  
  /**
   * Deactivate category
   */
  static async deactivate(id) {
    const sql = `
      UPDATE categories
      SET is_active = FALSE
      WHERE id = ?
    `;
    
    await query(sql, [id]);
    return await this.findById(id);
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DELETE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async delete(id) {
    // Check if category has vendors
    const vendorCheck = await query(
      'SELECT COUNT(*) as count FROM vendors WHERE category_id = ?',
      [id]
    );
    
    if (vendorCheck[0].count > 0) {
      throw new Error('لا يمكن حذف الفئة لأنها تحتوي على مزودين');
    }
    
    // Check if category has subcategories
    const subcategoryCheck = await query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
      [id]
    );
    
    if (subcategoryCheck[0].count > 0) {
      throw new Error('لا يمكن حذف الفئة لأنها تحتوي على فئات فرعية');
    }
    
    const sql = 'DELETE FROM categories WHERE id = ?';
    await query(sql, [id]);
    return true;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATISTICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) as main_categories,
        SUM(CASE WHEN parent_id IS NOT NULL THEN 1 ELSE 0 END) as subcategories,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive
      FROM categories
    `;
    
    const result = await query(sql);
    return result[0];
  }
  
  /**
   * Get popular categories (by vendor count)
   */
  static async getPopularCategories(limit = 10) {
    const sql = `
      SELECT c.*,
             COUNT(v.id) as vendor_count
      FROM categories c
      LEFT JOIN vendors v ON c.id = v.category_id AND v.status = 'active'
      WHERE c.is_active = TRUE
      GROUP BY c.id
      HAVING vendor_count > 0
      ORDER BY vendor_count DESC
      LIMIT ?
    `;
    
    return await query(sql, [limit]);
  }
}

module.exports = Category;
