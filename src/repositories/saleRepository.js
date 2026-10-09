import { pool } from '../config/database.js';

export class SaleRepository {
  async findAll(filters = {}) {
    const conditions = ['1=1'];
    const params = [];

    if (filters.customerId || filters.customer_id) {
      conditions.push('s.customer_id = ?');
      params.push(filters.customerId || filters.customer_id);
    }

    if (filters.plotId || filters.plot_id) {
      conditions.push('s.plot_id = ?');
      params.push(filters.plotId || filters.plot_id);
    }

    if (filters.status && filters.status !== 'ALL') {
      conditions.push('s.status = ?');
      params.push(filters.status);
    }

    const sql = `
      SELECT 
        s.id,
        s.sale_number,
        s.sale_number AS transaction_number,
        s.customer_id,
        c.name AS customer_name,
        c.phone AS customer_phone,
        s.plot_id,
        pl.plot_code,
        pl.block_name,
        pr.name AS project_name,
        s.booking_id,
        s.created_by,
        u.name AS created_by_name,
        s.sale_price,
        s.discount_amount,
        s.total_amount,
        s.status,
        s.confirmed_at,
        s.notes,
        s.created_at,
        s.updated_at,
        COALESCE(SUM(CASE WHEN p.status = 'VERIFIED' THEN p.amount ELSE 0 END), 0) AS total_paid
      FROM sales s
      INNER JOIN customers c ON s.customer_id = c.id
      INNER JOIN plots pl ON s.plot_id = pl.id
      INNER JOIN projects pr ON pl.project_id = pr.id
      INNER JOIN users u ON s.created_by = u.id
      LEFT JOIN payments p ON s.id = p.sale_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY s.id
      ORDER BY s.id DESC
    `;

    const [rows] = await pool.execute(sql, params);
    return rows.map((r) => ({
      ...r,
      sale_price: Number(r.sale_price),
      discount_amount: Number(r.discount_amount),
      total_amount: Number(r.total_amount),
      total_paid: Number(r.total_paid),
      balance_remaining: Number(r.total_amount) - Number(r.total_paid),
    }));
  }

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT 
        s.id,
        s.sale_number,
        s.sale_number AS transaction_number,
        s.customer_id,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.email AS customer_email,
        s.plot_id,
        pl.plot_code,
        pl.block_name,
        pl.area_sqm,
        pr.name AS project_name,
        s.booking_id,
        s.created_by,
        u.name AS created_by_name,
        s.sale_price,
        s.discount_amount,
        s.total_amount,
        s.status,
        s.confirmed_at,
        s.notes,
        s.created_at,
        s.updated_at
      FROM sales s
      INNER JOIN customers c ON s.customer_id = c.id
      INNER JOIN plots pl ON s.plot_id = pl.id
      INNER JOIN projects pr ON pl.project_id = pr.id
      INNER JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
      LIMIT 1`,
      [id]
    );

    if (!rows[0]) return null;
    const r = rows[0];

    // Fetch payments associated with this sale
    const [payments] = await pool.execute(
      `SELECT id, payment_number, amount, method, status, reference_number, proof_url, paid_at, verified_at
       FROM payments
       WHERE sale_id = ?
       ORDER BY id ASC`,
      [id]
    );

    const formattedPayments = payments.map((p) => ({ ...p, amount: Number(p.amount) }));
    const totalPaid = formattedPayments
      .filter((p) => p.status === 'VERIFIED')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      ...r,
      sale_price: Number(r.sale_price),
      discount_amount: Number(r.discount_amount),
      total_amount: Number(r.total_amount),
      total_paid: totalPaid,
      balance_remaining: Math.max(0, Number(r.total_amount) - totalPaid),
      payments: formattedPayments,
    };
  }

  async findConfirmedSaleByPlotId(plotId, connection = pool) {
    const [rows] = await connection.execute(
      `SELECT id, sale_number, customer_id
       FROM sales
       WHERE plot_id = ? AND status = 'CONFIRMED'
       LIMIT 1`,
      [plotId]
    );
    return rows[0] || null;
  }
}

export const saleRepository = new SaleRepository();
