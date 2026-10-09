import { errorResponse } from '../utils/response.js';

export function notFoundHandler(req, res, _next) {
  return errorResponse(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    'NOT_FOUND',
    {},
    404
  );
}
