import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/userRepository.js';
import { errorResponse } from '../utils/response.js';

/**
 * Authentication middleware that verifies JWT Bearer token
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Token autentikasi diperlukan', 'UNAUTHORIZED', {}, 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 'Format token tidak valid', 'UNAUTHORIZED', {}, 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token kedaluwarsa. Silakan login kembali', 'TOKEN_EXPIRED', {}, 401);
      }
      return errorResponse(res, 'Token tidak valid', 'INVALID_TOKEN', {}, 401);
    }

    // Verify user still exists and is active in database
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return errorResponse(res, 'Pengguna tidak ditemukan', 'USER_NOT_FOUND', {}, 401);
    }

    if (!user.is_active) {
      return errorResponse(res, 'Akun pengguna telah dinonaktifkan', 'ACCOUNT_INACTIVE', {}, 403);
    }

    // Attach authenticated user to request
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}
