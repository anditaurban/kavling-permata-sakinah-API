import { errorResponse } from '../utils/response.js';

/**
 * Role-based authorization middleware
 * @param  {...string} allowedRoles - List of permitted roles (e.g. 'OWNER', 'ADMIN', 'STAFF', 'CUSTOMER')
 */
export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Autentikasi diperlukan', 'UNAUTHORIZED', {}, 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Akses ditolak: role '${req.user.role}' tidak memiliki izin`,
        'FORBIDDEN',
        { allowed_roles: allowedRoles, current_role: req.user.role },
        403
      );
    }

    return next();
  };
}

/**
 * Ownership check middleware ensuring CUSTOMER users can only access their own data
 * @param {string} customerIdField - Name of the property in req.params or req.body or req.query containing target customerId
 */
export function ensureCustomerOwnership(customerIdField = 'customerId') {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Autentikasi diperlukan', 'UNAUTHORIZED', {}, 401);
    }

    // OWNER, ADMIN, and STAFF have organizational access
    if (['OWNER', 'ADMIN', 'STAFF'].includes(req.user.role)) {
      return next();
    }

    // CUSTOMER role must only access their own linked customer_id
    if (req.user.role === 'CUSTOMER') {
      const targetId = req.params[customerIdField] || req.query[customerIdField] || req.body[customerIdField];
      if (!targetId || String(req.user.customer_id) !== String(targetId)) {
        return errorResponse(
          res,
          'Akses ditolak: Anda hanya dapat mengakses data Anda sendiri',
          'FORBIDDEN',
          {},
          403
        );
      }
    }

    return next();
  };
}
