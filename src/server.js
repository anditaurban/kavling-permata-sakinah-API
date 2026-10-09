import app from './app.js';
import { env } from './config/env.js';
import { testConnection, pool } from './config/database.js';

async function startServer() {
  try {
    console.log('[Init] Checking database connection...');
    await testConnection();
    console.log(`[Init] Connected to MySQL database "${env.DB_NAME}" on port ${env.DB_PORT}`);

    const server = app.listen(env.PORT, () => {
      console.log(`[Server] Permata Sakinah REST API running on port ${env.PORT} (${env.NODE_ENV})`);
      console.log(`[Server] Health check: http://localhost:${env.PORT}/api/v1/health`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[Shutdown] Received ${signal}. Closing server gracefully...`);
      server.close(async () => {
        console.log('[Shutdown] HTTP server closed.');
        await pool.end();
        console.log('[Shutdown] Database pool closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[Fatal] Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
