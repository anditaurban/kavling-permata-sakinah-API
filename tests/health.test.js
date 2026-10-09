import http from 'http';
import app from '../src/app.js';
import { pool, testConnection } from '../src/config/database.js';

async function runTests() {
  console.log('--- Starting Phase 1 Health & Foundation Tests ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Test database connection
  try {
    const isConnected = await testConnection();
    assert(isConnected === true, 'MySQL connection pool ping successful');
  } catch (err) {
    assert(false, `MySQL connection pool failed: ${err.message}`);
  }

  // 2. Test database tables count
  try {
    const [tables] = await pool.query('SHOW TABLES');
    assert(tables.length >= 10, `Database contains expected tables (found: ${tables.length})`);
  } catch (err) {
    assert(false, `Failed to query tables: ${err.message}`);
  }

  // Start test HTTP server
  const testPort = 5999;
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(testPort, resolve));

  async function makeRequest(path) {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:${testPort}${path}`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, rawBody: data });
          }
        });
      }).on('error', reject);
    });
  }

  // 3. Test GET /api/v1/health
  try {
    const res = await makeRequest('/api/v1/health');
    assert(res.statusCode === 200, `GET /api/v1/health returns status 200 (actual: ${res.statusCode})`);
    assert(res.body.success === true, 'GET /api/v1/health response contains success: true');
    assert(res.body.data?.status === 'UP', 'GET /api/v1/health data.status is "UP"');
    assert(res.body.data?.database?.status === 'CONNECTED', 'GET /api/v1/health database.status is "CONNECTED"');
  } catch (err) {
    assert(false, `GET /api/v1/health request failed: ${err.message}`);
  }

  // 4. Test 404 Not Found route
  try {
    const res = await makeRequest('/api/v1/non-existent-route');
    assert(res.statusCode === 404, `GET /api/v1/non-existent-route returns status 404 (actual: ${res.statusCode})`);
    assert(res.body.success === false, '404 response contains success: false');
    assert(res.body.error?.code === 'NOT_FOUND', '404 response contains error.code: "NOT_FOUND"');
  } catch (err) {
    assert(false, `404 route test failed: ${err.message}`);
  }

  // Clean up
  await new Promise((resolve) => server.close(resolve));
  await pool.end();

  console.log(`\n--- Test Summary: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('All Phase 1 Foundation tests passed successfully!\n');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
