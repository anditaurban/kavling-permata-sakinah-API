import http from 'http';
import express from 'express';
import apiRoutes from '../src/routes/index.js';
import { pool } from '../src/config/database.js';
import { authenticate } from '../src/middlewares/authMiddleware.js';
import { requireRoles, ensureCustomerOwnership } from '../src/middlewares/roleMiddleware.js';
import { notFoundHandler } from '../src/middlewares/notFoundHandler.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { successResponse } from '../src/utils/response.js';

const testApp = express();
testApp.use(express.json());
testApp.use('/api/v1', apiRoutes);

// Test routes for role authorization and customer ownership
testApp.get('/api/v1/test/owner-only', authenticate, requireRoles('OWNER'), (req, res) => {
  return successResponse(res, { secret: 'owner_data' });
});

testApp.get('/api/v1/test/customer-data/:customerId', authenticate, ensureCustomerOwnership('customerId'), (req, res) => {
  return successResponse(res, { customer_id: req.params.customerId });
});

testApp.use(notFoundHandler);
testApp.use(errorHandler);

async function runAuthTests() {
  console.log('--- Starting Phase 2 Authentication & Authorization Tests ---\n');
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

  const testPort = 5998;
  const server = http.createServer(testApp);
  await new Promise((resolve) => server.listen(testPort, resolve));

  function makeRequest({ method = 'GET', path, body = null, token = null }) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (payload) {
        headers['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = http.request(
        {
          hostname: 'localhost',
          port: testPort,
          path,
          method,
          headers,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
            } catch (e) {
              resolve({ statusCode: res.statusCode, rawBody: data });
            }
          });
        }
      );

      req.on('error', reject);
      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }

  // 1. Test validation error (empty body)
  try {
    const res = await makeRequest({ method: 'POST', path: '/api/v1/auth/login', body: {} });
    assert(res.statusCode === 400, `POST /auth/login with empty body returns 400 (actual: ${res.statusCode})`);
    assert(res.body.error?.code === 'VALIDATION_ERROR', 'Returns VALIDATION_ERROR code');
    assert(Boolean(res.body.error?.details?.email), 'Contains email validation error');
  } catch (err) {
    assert(false, `Validation test failed: ${err.message}`);
  }

  // 2. Test invalid credentials (wrong email)
  try {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: 'nonexistent@example.test', password: 'Password123!' },
    });
    assert(res.statusCode === 401, `Wrong email returns 401 (actual: ${res.statusCode})`);
    assert(res.body.error?.code === 'INVALID_CREDENTIALS', 'Returns INVALID_CREDENTIALS code');
  } catch (err) {
    assert(false, `Wrong email test failed: ${err.message}`);
  }

  // 3. Test invalid credentials (wrong password)
  try {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: 'owner@permatasakinah.test', password: 'WrongPassword999!' },
    });
    assert(res.statusCode === 401, `Wrong password returns 401 (actual: ${res.statusCode})`);
    assert(res.body.error?.code === 'INVALID_CREDENTIALS', 'Returns INVALID_CREDENTIALS code');
  } catch (err) {
    assert(false, `Wrong password test failed: ${err.message}`);
  }

  // 4. Test successful login (Owner)
  let ownerToken = null;
  try {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: 'owner@permatasakinah.test', password: 'Password123!' },
    });
    assert(res.statusCode === 200, `Owner login returns 200 OK (actual: ${res.statusCode})`);
    assert(res.body.success === true, 'Response contains success: true');
    assert(Boolean(res.body.data?.token), 'Response contains JWT token');
    assert(res.body.data?.user?.role === 'OWNER', 'User role is "OWNER"');
    assert(res.body.data?.user?.password_hash === undefined, 'password_hash is NOT exposed in response');
    ownerToken = res.body.data?.token;
  } catch (err) {
    assert(false, `Owner login failed: ${err.message}`);
  }

  // 5. Test successful login (Staff)
  let staffToken = null;
  try {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: 'staff1@permatasakinah.test', password: 'Password123!' },
    });
    assert(res.statusCode === 200, `Staff login returns 200 OK`);
    assert(res.body.data?.user?.role === 'STAFF', 'Staff user role is "STAFF"');
    staffToken = res.body.data?.token;
  } catch (err) {
    assert(false, `Staff login failed: ${err.message}`);
  }

  // 6. Test successful login (Customer Portal)
  let customerToken = null;
  try {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: 'budi.portal@example.test', password: 'Password123!' },
    });
    assert(res.statusCode === 200, `Customer login returns 200 OK`);
    assert(res.body.data?.user?.role === 'CUSTOMER', 'Customer user role is "CUSTOMER"');
    assert(res.body.data?.user?.customer_id === 1, 'Customer user customer_id is 1');
    customerToken = res.body.data?.token;
  } catch (err) {
    assert(false, `Customer login failed: ${err.message}`);
  }

  // 7. Test GET /auth/me without token -> 401
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/auth/me' });
    assert(res.statusCode === 401, `GET /auth/me without token returns 401 (actual: ${res.statusCode})`);
    assert(res.body.error?.code === 'UNAUTHORIZED', 'Returns UNAUTHORIZED code');
  } catch (err) {
    assert(false, `No token test failed: ${err.message}`);
  }

  // 8. Test GET /auth/me with invalid token -> 401
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/auth/me', token: 'invalid_tampered_token_xyz' });
    assert(res.statusCode === 401, `GET /auth/me with invalid token returns 401 (actual: ${res.statusCode})`);
    assert(res.body.error?.code === 'INVALID_TOKEN', 'Returns INVALID_TOKEN code');
  } catch (err) {
    assert(false, `Invalid token test failed: ${err.message}`);
  }

  // 9. Test GET /auth/me with valid token -> 200
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/auth/me', token: ownerToken });
    assert(res.statusCode === 200, `GET /auth/me with valid token returns 200 (actual: ${res.statusCode})`);
    assert(res.body.data?.user?.email === 'owner@permatasakinah.test', 'Returns correct authenticated user');
    assert(res.body.data?.user?.password_hash === undefined, 'password_hash is omitted in profile');
  } catch (err) {
    assert(false, `Valid token test failed: ${err.message}`);
  }

  // 10. Role Authorization: Staff accessing Owner-only route -> 403 Forbidden
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/test/owner-only', token: staffToken });
    assert(res.statusCode === 403, `Staff accessing owner-only route returns 403 (actual: ${res.statusCode})`);
    assert(res.body.error?.code === 'FORBIDDEN', 'Returns FORBIDDEN code');
  } catch (err) {
    assert(false, `Role forbidden test failed: ${err.message}`);
  }

  // 11. Role Authorization: Owner accessing Owner-only route -> 200 OK
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/test/owner-only', token: ownerToken });
    assert(res.statusCode === 200, `Owner accessing owner-only route returns 200 OK (actual: ${res.statusCode})`);
  } catch (err) {
    assert(false, `Role allowed test failed: ${err.message}`);
  }

  // 12. Customer Ownership: Customer 1 accessing customer 1 data -> 200 OK
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/test/customer-data/1', token: customerToken });
    assert(res.statusCode === 200, `Customer accessing own data returns 200 OK (actual: ${res.statusCode})`);
  } catch (err) {
    assert(false, `Customer own data test failed: ${err.message}`);
  }

  // 13. Customer Ownership: Customer 1 accessing customer 3 data -> 403 Forbidden
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/test/customer-data/3', token: customerToken });
    assert(res.statusCode === 403, `Customer accessing other customer's data returns 403 Forbidden (actual: ${res.statusCode})`);
  } catch (err) {
    assert(false, `Customer cross-access test failed: ${err.message}`);
  }

  // 14. Staff accessing customer data -> 200 OK (staff is authorized for all customers)
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/test/customer-data/3', token: staffToken });
    assert(res.statusCode === 200, `Staff accessing customer data returns 200 OK (actual: ${res.statusCode})`);
  } catch (err) {
    assert(false, `Staff customer data access test failed: ${err.message}`);
  }

  // 15. POST /auth/logout
  try {
    const res = await makeRequest({ method: 'POST', path: '/api/v1/auth/logout', token: ownerToken });
    assert(res.statusCode === 200, `POST /auth/logout returns 200 OK (actual: ${res.statusCode})`);
    assert(res.body.success === true, 'Logout returns success: true');
  } catch (err) {
    assert(false, `Logout test failed: ${err.message}`);
  }

  // Clean up
  await new Promise((resolve) => server.close(resolve));
  await pool.end();

  console.log(`\n--- Auth Test Summary: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('All Phase 2 Authentication & Authorization tests passed successfully!\n');
    process.exit(0);
  }
}

runAuthTests().catch((err) => {
  console.error('Auth test execution error:', err);
  process.exit(1);
});
