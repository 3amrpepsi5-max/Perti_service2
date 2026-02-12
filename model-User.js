/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 👤 User Model
 * نموذج المستخدم
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

class User {
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CREATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async create(userData) {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(authConfig.password.saltRounds);
      const passwordHash = await bcrypt.hash(userData.password, salt);
      
      const sql = `
        INSERT INTO users (name, email, phone, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const result = await query(sql, [
        userData.name,
        userData.email,
        userData.phone,
        passwordHash,
        userData.role || 'customer'
      ]);
      
      return {
        id: result.insertId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role || 'customer'
      };
      
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل');
      }
      throw error;
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // READ
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async findById(id) {
    const sql = `
      SELECT id, name, email, phone, role, email_verified, phone_verified,
             avatar_url, created_at, last_login, is_active
      FROM users
      WHERE id = ?
    `;
    
    const results = await query(sql, [id]);
    return results[0] || null;
  }
  
  static async findByEmail(email) {
    const sql = `
      SELECT *
      FROM users
      WHERE email = ?
    `;
    
    const results = await query(sql, [email]);
    return results[0] || null;
  }
  
  static async findByPhone(phone) {
    const sql = `
      SELECT *
      FROM users
      WHERE phone = ?
    `;
    
    const results = await query(sql, [phone]);
    return results[0] || null;
  }
  
  static async getAll(filters = {}) {
    let sql = `
      SELECT id, name, email, phone, role, email_verified, phone_verified,
             avatar_url, created_at, last_login, is_active
      FROM users
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.role) {
      sql += ' AND role = ?';
      params.push(filters.role);
    }
    
    if (filters.search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (filters.is_active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(filters.is_active);
    }
    
    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const results = await query(sql, params);
    
    // Get total count
    const countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countResult = await query(countSql);
    const total = countResult[0].total;
    
    return {
      users: results,
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
  
  static async update(id, userData) {
    const allowedFields = ['name', 'email', 'phone', 'avatar_url'];
    const updates = [];
    const params = [];
    
    for (const field of allowedFields) {
      if (userData[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(userData[field]);
      }
    }
    
    if (updates.length === 0) {
      throw new Error('لا توجد بيانات للتحديث');
    }
    
    params.push(id);
    
    const sql = `
      UPDATE users
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, params);
    return await this.findById(id);
  }
  
  static async updatePassword(id, newPassword) {
    const salt = await bcrypt.genSalt(authConfig.password.saltRounds);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    const sql = `
      UPDATE users
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [passwordHash, id]);
    return true;
  }
  
  static async updateLastLogin(id) {
    const sql = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [id]);
  }
  
  static async verifyEmail(id) {
    const sql = `
      UPDATE users
      SET email_verified = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [id]);
    return true;
  }
  
  static async verifyPhone(id) {
    const sql = `
      UPDATE users
      SET phone_verified = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [id]);
    return true;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DELETE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    await query(sql, [id]);
    return true;
  }
  
  static async deactivate(id) {
    const sql = `
      UPDATE users
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [id]);
    return true;
  }
  
  static async activate(id) {
    const sql = `
      UPDATE users
      SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [id]);
    return true;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // AUTHENTICATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async comparePassword(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
  }
  
  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      authConfig.jwt.secret,
      {
        expiresIn: authConfig.jwt.expiresIn
      }
    );
  }
  
  static verifyToken(token) {
    try {
      return jwt.verify(token, authConfig.jwt.secret);
    } catch (error) {
      return null;
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATISTICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as customers,
        SUM(CASE WHEN role = 'vendor' THEN 1 ELSE 0 END) as vendors,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN email_verified = TRUE THEN 1 ELSE 0 END) as verified
      FROM users
    `;
    
    const result = await query(sql);
    return result[0];
  }
}

module.exports = User;
