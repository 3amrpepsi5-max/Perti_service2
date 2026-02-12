/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🗄️ Database Configuration
 * إعدادات الاتصال بقاعدة البيانات MySQL
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const mysql = require('mysql2');
require('dotenv').config();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATABASE POOL CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nozha2_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  timezone: '+00:00'
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROMISE WRAPPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const promisePool = pool.promise();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONNECTION TEST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('⚠️  Make sure MySQL is running and credentials are correct');
    process.exit(1);
  }
  
  console.log('✅ Database connected successfully');
  console.log(`📍 Database: ${process.env.DB_NAME}`);
  console.log(`🖥️  Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  
  connection.release();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Execute a query with promise support
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise}
 */
async function query(sql, params) {
  try {
    const [results] = await promisePool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
}

/**
 * Execute multiple queries in a transaction
 * @param {array} queries - Array of {sql, params} objects
 * @returns {Promise}
 */
async function transaction(queries) {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const q of queries) {
      const [result] = await connection.execute(q.sql, q.params || []);
      results.push(result);
    }
    
    await connection.commit();
    return results;
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Transaction error:', error.message);
    throw error;
    
  } finally {
    connection.release();
  }
}

/**
 * Check if table exists
 * @param {string} tableName - Table name
 * @returns {Promise<boolean>}
 */
async function tableExists(tableName) {
  try {
    const [rows] = await promisePool.execute(
      'SHOW TABLES LIKE ?',
      [tableName]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('❌ Error checking table:', error.message);
    return false;
  }
}

/**
 * Get table row count
 * @param {string} tableName - Table name
 * @returns {Promise<number>}
 */
async function getRowCount(tableName) {
  try {
    const [rows] = await promisePool.execute(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    return rows[0].count;
  } catch (error) {
    console.error('❌ Error getting row count:', error.message);
    return 0;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GRACEFUL SHUTDOWN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM: Closing database connections...');
  pool.end((err) => {
    if (err) {
      console.error('❌ Error closing database:', err.message);
    } else {
      console.log('✅ Database connections closed');
    }
    process.exit(0);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  pool,
  promisePool,
  query,
  transaction,
  tableExists,
  getRowCount
};
