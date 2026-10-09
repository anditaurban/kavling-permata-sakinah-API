import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/response.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(
      res,
      'Terlalu banyak percobaan autentikasi. Silakan coba lagi setelah 15 menit.',
      'RATE_LIMIT_EXCEEDED',
      {},
      429
    );
  },
});
