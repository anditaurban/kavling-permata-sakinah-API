/**
 * Standard API Response Utilities conforming to docs/API-SPEC.md
 */

export function successResponse(res, data = {}, meta = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta,
  });
}

export function errorResponse(res, message = 'Internal Server Error', code = 'SERVER_ERROR', details = {}, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}
