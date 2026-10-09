import { pool } from '../config/database.js';

export class PaymentRepository {
  async findAll(filters = {}) {
    const conditions = ['1=1'];
    const params = [];

    if (filters.saleId || filters.sale_id || filters.transactionId || filters.transaction_id) {
      conditions.push('p.sale_id = ?');
      params.push(filters.saleId || filters.sale_id || filters.transactionId || filters.transaction_id);
    }

    if (filters.bookingId || filters.booking_id) {
      conditions.push('p.booking_id = ?');
      params.push(filters.bookingId || filters.booking_id);
    }

    if (filters.status && filters.status !== 'ALL') {
      conditions.push('p.status = ?');
      params.push(filters.status);
    }

    const sql = `
      SELECT 
        p.id,
        p.payment_number,
        p.sale_id,
        s.sale_number,
        p.booking_id,
        b.booking_number,
        p.amount,
        p.method,
        p.status,
        p.reference_number,
        p.proof_url,
        p.paid_at,
        p.verified_by,
        u.name AS verified_by_name,
        p.verified_at,
        p.notes,
        p.created_at,
        p.updated_at
      FROM payments p
      LEFT JOIN sales s ON p.sale_id = s.id
      LEFT JOIN bookings b ON p.booking_id = b.id
      LEFT JOIN users u ON p.verified_by = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.id DESC
    `;

    const [rows] = await pool.execute(sql, params);
    return rows.map((r) => ({ ...r, amount: Number(r.amount) }));
  }

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT 
        p.id,
        p.payment_number,
        p.sale_id,
        s.sale_number,
        p.booking_id,
        b.booking_number,
        p.amount,
        p.method,
        p.status,
        p.reference_number,
        p.proof_url,
        p.paid_at,
        p.verified_by,
        u.name AS verified_by_name,
        p.verified_at,
        p.notes,
        p.created_at,
        p.updated_at
      FROM payments p
      LEFT JOIN sales s ON p.sale_id = s.id
      LEFT JOIN bookings b ON p.booking_id = b.id
      LEFT JOIN users u ON p.verified_by = u.id
      WHERE p.id = ?
      LIMIT 1`,
      [id]
    );

    if (!rows[0]) return null;
    return { ...rows[0], amount: Number(rows[0].amount) };
  }
}

export const paymentRepository = new PaymentRepository();
