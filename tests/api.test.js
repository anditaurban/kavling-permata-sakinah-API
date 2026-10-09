import http from 'http';
import app from '../src/app.js';
import { pool } from '../src/config/database.js';

async function runApiTests() {
  console.log('--- Starting Phase 3, 4, 5 Comprehensive API Test Suite ---\n');
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

  const testPort = 5997;
  const server = http.createServer(app);
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
      if (payload) req.write(payload);
      req.end();
    });
  }

  // 1. Obtain Tokens (Admin & Staff & Customer)
  let adminToken = null;
  let staffToken = null;
  let customerToken = null;

  try {
    const adminLogin = await makeRequest({
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: 'admin@permatasakinah.test', password: 'Password123!' },
    });
    adminToken = adminLogin.body.data.token;
    assert(Boolean(adminToken), 'Admin token obtained');

    const staffLogin = await makeRequest({
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: 'staff1@permatasakinah.test', password: 'Password123!' },
    });
    staffToken = staffLogin.body.data.token;
    assert(Boolean(staffToken), 'Staff token obtained');

    const customerLogin = await makeRequest({
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: 'budi.portal@example.test', password: 'Password123!' },
    });
    customerToken = customerLogin.body.data.token;
    assert(Boolean(customerToken), 'Customer token obtained');
  } catch (err) {
    assert(false, `Failed to obtain tokens: ${err.message}`);
  }

  // --- PHASE 3: MASTER DATA TESTS ---

  // 2. Projects Listing (Public)
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/projects' });
    assert(res.statusCode === 200, `GET /api/v1/projects returns 200 (actual: ${res.statusCode})`);
    assert(Array.isArray(res.body.data), 'Projects data is array');
    assert(res.body.data.length >= 2, `Contains at least 2 projects (actual: ${res.body.data.length})`);
    assert(Array.isArray(res.body.data[0].images), 'Project contains gallery images array');
  } catch (err) {
    assert(false, `Projects test failed: ${err.message}`);
  }

  // 3. Project Detail by Slug (Public)
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/projects/permata-sakinah-1-cihanjuang' });
    assert(res.statusCode === 200, `GET project by slug returns 200 OK`);
    assert(res.body.data?.slug === 'permata-sakinah-1-cihanjuang', 'Returns correct project slug');
    assert(res.body.data?.available_plots > 0, 'Project has available_plots count');
  } catch (err) {
    assert(false, `Project by slug failed: ${err.message}`);
  }

  // 4. Plots Listing with filter (Public)
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/plots?status=AVAILABLE' });
    assert(res.statusCode === 200, `GET /api/v1/plots?status=AVAILABLE returns 200 OK`);
    assert(Array.isArray(res.body.data), 'Plots data is array');
    const allAvailable = res.body.data.every((p) => p.status === 'AVAILABLE');
    assert(allAvailable, 'All returned plots have status AVAILABLE');
  } catch (err) {
    assert(false, `Plots listing failed: ${err.message}`);
  }

  // 5. Plots alias /lots test
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/lots' });
    assert(res.statusCode === 200, `GET /api/v1/lots (alias) returns 200 OK`);
  } catch (err) {
    assert(false, `/lots alias failed: ${err.message}`);
  }

  // 6. Customers Listing (Staff)
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/customers', token: staffToken });
    assert(res.statusCode === 200, `GET /api/v1/customers with staff token returns 200 OK`);
    assert(res.body.data?.length >= 5, 'Contains customer demo records');
  } catch (err) {
    assert(false, `Customers listing failed: ${err.message}`);
  }

  // 7. Customers Listing (Unauthorized for customer role)
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/customers', token: customerToken });
    assert(res.statusCode === 403, `Customer cannot access full customer directory (returns 403)`);
  } catch (err) {
    assert(false, `Customer directory unauthorized test failed: ${err.message}`);
  }

  // 8. Create Customer (Staff)
  let newCustomerId = null;
  try {
    const testPhone = `0899${Math.floor(10000000 + Math.random() * 90000000)}`;
    const res = await makeRequest({
      method: 'POST',
      path: '/api/v1/customers',
      body: {
        name: 'Calon Pembeli Tes',
        phone: testPhone,
        email: 'calon.tes@example.test',
        lead_status: 'NEW',
        source: 'TEST_SUITE',
      },
      token: staffToken,
    });
    assert(res.statusCode === 201, `POST /api/v1/customers returns 201 Created`);
    assert(res.body.data?.name === 'Calon Pembeli Tes', 'Customer name matches');
    newCustomerId = res.body.data?.id;
  } catch (err) {
    assert(false, `Create customer failed: ${err.message}`);
  }

  // 9. Add Lead Activity
  try {
    const res = await makeRequest({
      method: 'POST',
      path: `/api/v1/customers/${newCustomerId}/activities`,
      body: {
        activity_type: 'PHONE_CALL',
        description: 'Telepon perkenalan proyek Cihanjuang',
      },
      token: staffToken,
    });
    assert(res.statusCode === 201, `POST /api/v1/customers/:id/activities returns 201 Created`);
    assert(res.body.data?.activity_type === 'PHONE_CALL', 'Activity type saved correctly');
  } catch (err) {
    assert(false, `Add lead activity failed: ${err.message}`);
  }

  // --- PHASE 4: TRANSACTION & CONCURRENCY TESTS ---

  // 10. Create Booking on Plot 4 (A-04, AVAILABLE)
  let createdBookingId = null;
  try {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/v1/bookings',
      body: {
        customer_id: newCustomerId,
        plot_id: 4,
        booking_fee: 5000000,
        notes: 'Booking otomatis dari test suite',
      },
      token: staffToken,
    });
    assert(res.statusCode === 201, `POST /api/v1/bookings returns 201 Created`);
    assert(res.body.data?.status === 'PENDING_PAYMENT', 'Booking status is PENDING_PAYMENT');
    createdBookingId = res.body.data?.id;

    // Verify plot 4 is now BOOKED
    const plotCheck = await makeRequest({ method: 'GET', path: '/api/v1/plots/4' });
    assert(plotCheck.body.data?.status === 'BOOKED', 'Plot status transitioned to BOOKED');
  } catch (err) {
    assert(false, `Create booking failed: ${err.message}`);
  }

  // 11. Concurrency / Duplicate Booking Protection on Plot 4
  try {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/v1/bookings',
      body: {
        customer_id: 1,
        plot_id: 4,
        booking_fee: 5000000,
      },
      token: staffToken,
    });
    assert(res.statusCode === 409, `Second booking on same plot is rejected with 409 Conflict (actual: ${res.statusCode})`);
    assert(res.body.error?.code === 'PLOT_NOT_AVAILABLE', 'Error code indicates PLOT_NOT_AVAILABLE');
  } catch (err) {
    assert(false, `Duplicate booking test failed: ${err.message}`);
  }

  // 12. Create Sale on Plot 6 (B-02, AVAILABLE)
  let createdSaleId = null;
  try {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/v1/sales',
      body: {
        customer_id: newCustomerId,
        plot_id: 6,
        discount_amount: 1000000,
        status: 'PENDING_PAYMENT',
        notes: 'Penjualan dari test suite',
      },
      token: staffToken,
    });
    assert(res.statusCode === 201, `POST /api/v1/sales returns 201 Created`);
    assert(res.body.data?.discount_amount === 1000000, 'Discount recorded correctly');
    assert(res.body.data?.total_amount === 215000000, 'Total amount calculated accurately (216jt - 1jt = 215jt)');
    createdSaleId = res.body.data?.id;
  } catch (err) {
    assert(false, `Create sale failed: ${err.message}`);
  }

  // 13. Confirm Sale -> Plot transitions to SOLD
  try {
    const res = await makeRequest({
      method: 'PATCH',
      path: `/api/v1/sales/${createdSaleId}/confirm`,
      token: adminToken,
    });
    assert(res.statusCode === 200, `PATCH /api/v1/sales/:id/confirm returns 200 OK`);
    assert(res.body.data?.status === 'CONFIRMED', 'Sale status is CONFIRMED');

    // Verify plot 6 is now SOLD
    const plotCheck = await makeRequest({ method: 'GET', path: '/api/v1/plots/6' });
    assert(plotCheck.body.data?.status === 'SOLD', 'Plot status transitioned to SOLD');
  } catch (err) {
    assert(false, `Confirm sale failed: ${err.message}`);
  }

  // 14. Prevent Selling Already SOLD Plot
  try {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/v1/sales',
      body: {
        customer_id: 1,
        plot_id: 6,
      },
      token: staffToken,
    });
    assert(res.statusCode === 409, `Selling SOLD plot returns 409 Conflict`);
    assert(res.body.error?.code === 'PLOT_ALREADY_SOLD', 'Error code is PLOT_ALREADY_SOLD');
  } catch (err) {
    assert(false, `Re-selling sold plot test failed: ${err.message}`);
  }

  // 15. Create Payment for Sale
  let createdPaymentId = null;
  try {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/v1/payments',
      body: {
        sale_id: createdSaleId,
        amount: 215000000,
        method: 'BANK_TRANSFER',
        reference_number: 'TRF-TEST-888999',
        notes: 'Pelunasan test suite',
      },
      token: staffToken,
    });
    assert(res.statusCode === 201, `POST /api/v1/payments returns 201 Created`);
    assert(res.body.data?.status === 'PENDING', 'Payment initial status is PENDING');
    createdPaymentId = res.body.data?.id;
  } catch (err) {
    assert(false, `Create payment failed: ${err.message}`);
  }

  // 16. Verify Payment (Admin/Owner only)
  try {
    const res = await makeRequest({
      method: 'PATCH',
      path: `/api/v1/payments/${createdPaymentId}/verify`,
      token: adminToken,
    });
    assert(res.statusCode === 200, `PATCH /api/v1/payments/:id/verify returns 200 OK`);
    assert(res.body.data?.status === 'VERIFIED', 'Payment status is VERIFIED');
    assert(res.body.data?.verified_by_name === 'Siti Sarah', 'Verified by Admin record present');
  } catch (err) {
    assert(false, `Verify payment failed: ${err.message}`);
  }

  // 17. Cancel Booking -> Releases Plot 4 back to AVAILABLE
  try {
    const res = await makeRequest({
      method: 'PATCH',
      path: `/api/v1/bookings/${createdBookingId}/cancel`,
      body: { reason: 'Dibatalkan oleh sistem pengujian' },
      token: staffToken,
    });
    assert(res.statusCode === 200, `PATCH /api/v1/bookings/:id/cancel returns 200 OK`);
    assert(res.body.data?.status === 'CANCELLED', 'Booking status transitioned to CANCELLED');

    // Verify Plot 4 is back to AVAILABLE
    const plotCheck = await makeRequest({ method: 'GET', path: '/api/v1/plots/4' });
    assert(plotCheck.body.data?.status === 'AVAILABLE', 'Plot 4 is safely released back to AVAILABLE');
  } catch (err) {
    assert(false, `Cancel booking failed: ${err.message}`);
  }

  // --- PHASE 5: DASHBOARD & REPORTS TESTS ---

  // 18. Dashboard Summary
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/dashboard/summary', token: staffToken });
    assert(res.statusCode === 200, `GET /api/v1/dashboard/summary returns 200 OK`);
    assert(res.body.data?.revenue !== undefined, 'Summary contains revenue metrics');
    assert(res.body.data?.plots !== undefined, 'Summary contains plots breakdown');
    assert(res.body.data?.counts !== undefined, 'Summary contains transaction counts');
  } catch (err) {
    assert(false, `Dashboard summary failed: ${err.message}`);
  }

  // 19. Dashboard Lot Status Breakdown
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/dashboard/lot-status', token: staffToken });
    assert(res.statusCode === 200, `GET /api/v1/dashboard/lot-status returns 200 OK`);
    assert(Array.isArray(res.body.data), 'Lot status data is array');
  } catch (err) {
    assert(false, `Lot status breakdown failed: ${err.message}`);
  }

  // 20. Dashboard Recent Transactions
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/dashboard/recent-transactions?limit=5', token: staffToken });
    assert(res.statusCode === 200, `GET /api/v1/dashboard/recent-transactions returns 200 OK`);
    assert(Array.isArray(res.body.data), 'Recent transactions data is array');
  } catch (err) {
    assert(false, `Recent transactions failed: ${err.message}`);
  }

  // 21. Reports Sales
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/reports/sales', token: adminToken });
    assert(res.statusCode === 200, `GET /api/v1/reports/sales returns 200 OK`);
    assert(Array.isArray(res.body.data), 'Sales report data is array');
  } catch (err) {
    assert(false, `Sales report failed: ${err.message}`);
  }

  // 22. Reports Payments
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/reports/payments', token: adminToken });
    assert(res.statusCode === 200, `GET /api/v1/reports/payments returns 200 OK`);
    assert(Array.isArray(res.body.data), 'Payments report data is array');
  } catch (err) {
    assert(false, `Payments report failed: ${err.message}`);
  }

  // 23. Reports Plots
  try {
    const res = await makeRequest({ method: 'GET', path: '/api/v1/reports/plots', token: adminToken });
    assert(res.statusCode === 200, `GET /api/v1/reports/plots returns 200 OK`);
    assert(Array.isArray(res.body.data), 'Plots report data is array');
  } catch (err) {
    assert(false, `Plots report failed: ${err.message}`);
  }

  // Clean up
  await new Promise((resolve) => server.close(resolve));
  await pool.end();

  console.log(`\n--- Comprehensive API Test Summary: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('All API tests passed successfully!\n');
    process.exit(0);
  }
}

runApiTests().catch((err) => {
  console.error('API test execution error:', err);
  process.exit(1);
});
