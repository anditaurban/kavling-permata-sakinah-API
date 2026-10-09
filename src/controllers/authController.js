import { authService } from '../services/authService.js';
import { validateLoginInput } from '../validators/authValidator.js';
import { successResponse, errorResponse } from '../utils/response.js';

export class AuthController {
  /**
   * POST /api/v1/auth/login
   */
  async login(req, res, next) {
    try {
      const { isValid, errors } = validateLoginInput(req.body);
      if (!isValid) {
        return errorResponse(res, 'Validasi login gagal', 'VALIDATION_ERROR', errors, 400);
      }

      const { email, password } = req.body;
      const result = await authService.login(email, password);

      return successResponse(res, result, {}, 200);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  async getMe(req, res, next) {
    try {
      const userProfile = await authService.getProfile(req.user.id);
      return successResponse(res, { user: userProfile }, {}, 200);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req, res, _next) {
    return successResponse(res, { message: 'Logout berhasil' }, {}, 200);
  }
}

export const authController = new AuthController();
