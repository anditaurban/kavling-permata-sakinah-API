import { pool } from '../config/database.js';

export class BookingRepository {
  async findAll(filters = {}) {
    const conditions = ['1=1'];
    const params = [];

    if (filters.customerId || filters.customer_id) {
      conditions.push('b.customer_id = ?');
      params.push(filters.customerId || filters.customer_id);
    }

    if (filters.plotId || filters.plot_id) {
      conditions.push('b.plot_id = ?');
      params.push(filters.plotId || filters.plot_id);
    }

    if (filters.status && filters.status !== 'ALL') {
      conditions.push('b.status = ?');
      params.push(filters.status);
    }

    const sql = `
      SELECT 
        b.id,
        b.booking_number,
        b.customer_id,
        c.name AS customer_name,
        c.phone AS customer_phone,
        b.plot_id,
        pl.plot_code,
        pl.block_name,
        pr.name AS project_name,
        b.created_by,
        u.name AS created_by_name,
        b.booking_price,
        b.booking_fee,
        b.status,
        b.expires_at,
        b.notes,
        b.created_at,
        b.updated_at
      FROM bookings b
      INNER JOIN customers c ON b.customer_id = c.id
      INNER JOIN plots pl ON b.plot_id = pl.id
      INNER JOIN projects pr ON pl.project_id = pr.id
      INNER JOIN users u ON b.created_by = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY b.id DESC
    `;

    const [rows] = await pool.execute(sql, params);
    return rows.map((r) => ({
      ...r,
      booking_price: Number(r.booking_price),
      booking_fee: Number(r.booking_fee),
    }));
  }

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT 
        b.id,
        b.booking_number,
        b.customer_id,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.email AS customer_email,
        b.plot_id,
        pl.plot_code,
        pl.block_name,
        pl.area_sqm,
        pr.name AS project_name,
        b.created_by,
        u.name AS created_by_name,
        b.booking_price,
        b.booking_fee,
        b.status,
        b.expires_at,
        b.notes,
        b.created_at,
        b.updated_at
      FROM bookings b
      INNER JOIN customers c ON b.customer_id = c.id
      INNER JOIN plots pl ON b.plot_id = pl.id
      INNER JOIN projects pr ON pl.project_id = pr.id
      INNER JOIN users u ON b.created_by = u.id
      WHERE b.id = ?
      LIMIT 1`,
      [id]
    );

    if (!rows[0]) return null;
    const r = rows[0];

    // Fetch payments associated with this booking
    const [payments] = await pool.execute(
      `SELECT id, payment_number, amount, method, status, reference_number, paid_at, verified_at
       FROM payments
       WHERE booking_id = ?
       ORDER BY id ASC`,
      [id]
    );

    return {
      ...r,
      booking_price: Number(r.booking_price),
      booking_fee: Number(r.booking_fee),
      payments: payments.map((p) => ({ ...p, amount: Number(p.amount) })),
    };
  }

  async findActiveBookingByPlotId(plotId, connection = pool) {
    const [rows] = await connection.execute(
      `SELECT id, booking_number, customer_id, status
       FROM bookings
       WHERE plot_id = ? AND status IN ('PENDING_PAYMENT', 'ACTIVE')
       LIMIT 1`,
      [plotId]
    );
    return rows[0] || null;
  }
}

export const bookingRepository = new BookingRepository();
