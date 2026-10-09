import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runImport() {
  console.log('\n======================================================');
  console.log('   PERMATA SAKINAH — IMPORT DATABASE KE RAILWAY / CLOUD');
  console.log('======================================================\n');

  // Connection options: supports Railway connection URL or individual env variables
  const connectionUrl = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL || process.env.MYSQL_URL;

  let connectionConfig;
  if (connectionUrl) {
    console.log(`[Info] Menggunakan Connection URL dari environment.`);
    connectionConfig = {
      uri: connectionUrl,
      multipleStatements: true,
      charset: 'utf8mb4',
      ssl: { rejectUnauthorized: false },
    };
  } else {
    const host = process.env.CLOUD_DB_HOST || process.env.DB_HOST;
    const port = Number(process.env.CLOUD_DB_PORT || process.env.DB_PORT || 3306);
    const user = process.env.CLOUD_DB_USER || process.env.DB_USER;
    const password = process.env.CLOUD_DB_PASSWORD || process.env.DB_PASSWORD || '';
    const database = process.env.CLOUD_DB_NAME || process.env.DB_NAME || 'railway';

    console.log(`[Info] Target host: ${host}:${port}, database: ${database}, user: ${user}`);

    connectionConfig = {
      host,
      port,
      user,
      password,
      database,
      multipleStatements: true,
      charset: 'utf8mb4',
      ssl: { rejectUnauthorized: false }, // Allows cloud SSL connections
    };
  }

  // Read SQL script
  const sqlFilePath = path.join(__dirname, '..', 'database', 'railway_combined.sql');
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`[Error] Berkas SQL tidak ditemukan di: ${sqlFilePath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
  console.log(`[Info] Membaca ${sqlFilePath} (${(sqlContent.length / 1024).toFixed(1)} KB)...`);

  let connection;
  try {
    let parsedTargetDb = null;
    let baseConfig = { ...connectionConfig };

    if (connectionUrl) {
      try {
        const u = new URL(connectionUrl);
        parsedTargetDb = u.pathname.replace(/^\//, '') || null;
        // Connect initially to default root without specific DB to ensure target DB exists
        const baseUrl = new URL(connectionUrl);
        baseUrl.pathname = '/';
        baseConfig = {
          uri: baseUrl.toString(),
          multipleStatements: true,
          charset: 'utf8mb4',
          ssl: { rejectUnauthorized: false },
        };
      } catch (e) {
        // Fallback to original config if URL parsing fails
      }
    }

    console.log('[Connecting] Menghubungkan ke server MySQL cloud...');
    try {
      connection = await mysql.createConnection(baseConfig);
    } catch (err) {
      // If root connection without DB fails, try original connectionConfig
      connection = await mysql.createConnection(connectionConfig);
    }
    console.log('[Connected] Berhasil terhubung ke database cloud!\n');

    if (parsedTargetDb) {
      console.log(`[Database] Memastikan database '${parsedTargetDb}' tersedia...`);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${parsedTargetDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await connection.query(`USE \`${parsedTargetDb}\`;`);
      console.log(`[Database] Menggunakan database '${parsedTargetDb}'.\n`);
    }

    console.log('[Executing] Mengimpor tabel dan data seed ke Railway...');
    await connection.query(sqlContent);
    console.log('[Success] Seluruh tabel, relasi, dan data dummy berhasil di-import!\n');

    // Verification
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`[Verifikasi] Ditemukan ${tables.length} tabel di database:`);
    for (const t of tables) {
      console.log(`  - ${Object.values(t)[0]}`);
    }

    console.log('\n======================================================');
    console.log('       STATUS: IMPORT KE RAILWAY BERHASIL 100%');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n[Gagal Import]', error.message);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('\nTips: Pastikan kredensial host dan port Railway sudah benar, dan port public Railway dapat diakses dari internet.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runImport();
