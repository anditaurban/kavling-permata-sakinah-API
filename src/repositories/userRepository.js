import { pool } from '../config/database.js';

export class UserRepository {
  /**
   * Find user by email including password_hash for authentication
   * @param {string} email
   */
  async findByEmail(email) {
    const [rows] = await pool.execute(
      `SELECT id, name, email, phone, password_hash, role, customer_id, is_active, last_login_at, created_at, updated_at
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  }

  /**
   * Find user by ID safely (without password_hash)
   * @param {number|string} id
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, name, email, phone, role, customer_id, is_active, last_login_at, created_at, updated_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Update last login timestamp
   * @param {number|string} id
   */
  async updateLastLogin(id) {
    await pool.execute(
      `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [id]
    );
  }

  /**
   * Update password hash for dev seeder / password change
   * @param {number|string} id
   * @param {string} newHash
   */
  async updatePasswordHash(id, newHash) {
    await pool.execute(
      `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`,
      [newHash, id]
    );
  }
}

export const userRepository = new UserRepository();
