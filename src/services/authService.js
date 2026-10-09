import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/userRepository.js';

export class AuthService {
  /**
   * Authenticate user with email and password
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    const trimmedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(trimmedEmail);

    if (!user) {
      const error = new Error('Email atau password tidak valid');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    if (!user.is_active) {
      const error = new Error('Akun dinonaktifkan. Hubungi administrator');
      error.statusCode = 403;
      error.code = 'ACCOUNT_INACTIVE';
      throw error;
    }

    // Safety check against unseeded placeholder hashes
    if (user.password_hash.includes('DEV_DUMMY_PASSWORD_HASH')) {
      const error = new Error(
        'Akun demo menggunakan placeholder development. Jalankan seeder dev password terlebih dahulu.'
      );
      error.statusCode = 401;
      error.code = 'UNCONFIGURED_DEV_CREDENTIALS';
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Email atau password tidak valid');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Generate JWT token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      customer_id: user.customer_id,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    // Exclude password_hash from safe user object
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      customer_id: user.customer_id,
      is_active: Boolean(user.is_active),
    };

    return {
      user: safeUser,
      token,
      token_type: 'Bearer',
      expires_in: env.JWT_EXPIRES_IN,
    };
  }

  /**
   * Get authenticated user profile
   * @param {number|string} userId
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('User tidak ditemukan');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      customer_id: user.customer_id,
      is_active: Boolean(user.is_active),
      last_login_at: user.last_login_at,
      created_at: user.created_at,
    };
  }
}

export const authService = new AuthService();
