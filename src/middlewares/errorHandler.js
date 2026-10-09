import { errorResponse } from '../utils/response.js';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  
  // Safe user-facing message
  let message = err.message || 'An unexpected error occurred';

  // Protect internal database details from leaking in client response
  if (err.sql || err.sqlState || err.sqlMessage) {
    message = 'A database error occurred while processing the request';
  }

  // Log full error internally for debugging
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    code: err.code,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  const details = err.details || {};

  return errorResponse(res, message, errorCode, details, statusCode);
}
