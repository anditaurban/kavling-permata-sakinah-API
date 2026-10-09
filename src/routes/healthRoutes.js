import { Router } from 'express';
import { pool } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const startTime = Date.now();
    const [dbResult] = await pool.query('SELECT 1 AS alive');
    const dbLatencyMs = Date.now() - startTime;

    return successResponse(res, {
      status: 'UP',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        status: dbResult[0]?.alive === 1 ? 'CONNECTED' : 'UNKNOWN',
        latency_ms: dbLatencyMs,
      },
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    return errorResponse(res, 'Health check failed: database unavailable', 'DATABASE_UNAVAILABLE', {
      detail: error.message,
    }, 503);
  }
});

export default router;
