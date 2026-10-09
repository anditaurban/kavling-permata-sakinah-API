import { pool } from '../config/database.js';

export class DashboardRepository {
  async getSummary() {
    // 1. Total revenue (sum of verified payments)
    const [revenueRows] = await pool.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN sale_id IS NOT NULL AND status = 'VERIFIED' THEN amount ELSE 0 END), 0) AS total_sales_revenue,
        COALESCE(SUM(CASE WHEN booking_id IS NOT NULL AND status = 'VERIFIED' THEN amount ELSE 0 END), 0) AS total_booking_fees,
        COALESCE(SUM(CASE WHEN status = 'VERIFIED' THEN amount ELSE 0 END), 0) AS total_verified_income,
        COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END), 0) AS pending_verification_amount
      FROM payments
    `);

    // 2. Plots stats
    const [plotsRows] = await pool.execute(`
      SELECT 
        COUNT(id) AS total_plots,
        COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) AS available_plots,
        COUNT(CASE WHEN status = 'BOOKED' THEN 1 END) AS booked_plots,
        COUNT(CASE WHEN status = 'SOLD' THEN 1 END) AS sold_plots,
        COUNT(CASE WHEN status = 'INACTIVE' THEN 1 END) AS inactive_plots
      FROM plots
    `);

    // 3. Transactions & Leads stats
    const [statsRows] = await pool.execute(`
      SELECT 
        (SELECT COUNT(id) FROM sales WHERE status = 'CONFIRMED') AS confirmed_sales_count,
        (SELECT COUNT(id) FROM bookings WHERE status = 'ACTIVE') AS active_bookings_count,
        (SELECT COUNT(id) FROM customers WHERE lead_status NOT IN ('CONVERTED', 'CLOSED')) AS active_leads_count,
        (SELECT COUNT(id) FROM customers) AS total_customers_count
    `);

    const rev = revenueRows[0] || {};
    const plots = plotsRows[0] || {};
    const stats = statsRows[0] || {};

    return {
      revenue: {
        total_sales_revenue: Number(rev.total_sales_revenue),
        total_booking_fees: Number(rev.total_booking_fees),
        total_verified_income: Number(rev.total_verified_income),
        pending_verification_amount: Number(rev.pending_verification_amount),
      },
      plots: {
        total: Number(plots.total_plots),
        available: Number(plots.available_plots),
        booked: Number(plots.booked_plots),
        sold: Number(plots.sold_plots),
        inactive: Number(plots.inactive_plots),
      },
      counts: {
        confirmed_sales: Number(stats.confirmed_sales_count),
        active_bookings: Number(stats.active_bookings_count),
        active_leads: Number(stats.active_leads_count),
        total_customers: Number(stats.total_customers_count),
      },
    };
  }

  async getLotStatusBreakdown() {
    const [rows] = await pool.execute(`
      SELECT status, COUNT(id) AS count, COALESCE(SUM(price), 0) AS total_value
      FROM plots
      GROUP BY status
    `);
    return rows.map((r) => ({
      status: r.status,
      count: Number(r.count),
      total_value: Number(r.total_value),
    }));
  }

  async getRecentTransactions(limit = 5) {
    const [rows] = await pool.execute(
      `SELECT 
        s.id,
        s.sale_number AS transaction_number,
        'SALE' AS type,
        c.name AS customer_name,
        pl.plot_code,
        pr.name AS project_name,
        s.total_amount AS amount,
        s.status,
        s.created_at
       FROM sales s
       INNER JOIN customers c ON s.customer_id = c.id
       INNER JOIN plots pl ON s.plot_id = pl.id
       INNER JOIN projects pr ON pl.project_id = pr.id
       ORDER BY s.created_at DESC
       LIMIT ?`,
      [Number(limit)]
    );
    return rows.map((r) => ({ ...r, amount: Number(r.amount) }));
  }

  async getSalesReport() {
    const [rows] = await pool.execute(`
      SELECT 
        s.id,
        s.sale_number,
        c.name AS customer_name,
        c.phone AS customer_phone,
        pl.plot_code,
        pr.name AS project_name,
        s.sale_price,
        s.discount_amount,
        s.total_amount,
        s.status,
        s.confirmed_at,
        s.created_at
      FROM sales s
      INNER JOIN customers c ON s.customer_id = c.id
      INNER JOIN plots pl ON s.plot_id = pl.id
      INNER JOIN projects pr ON pl.project_id = pr.id
      ORDER BY s.created_at DESC
    `);
    return rows.map((r) => ({
      ...r,
      sale_price: Number(r.sale_price),
      discount_amount: Number(r.discount_amount),
      total_amount: Number(r.total_amount),
    }));
  }

  async getPaymentsReport() {
    const [rows] = await pool.execute(`
      SELECT 
        p.id,
        p.payment_number,
        COALESCE(s.sale_number, b.booking_number) AS reference_transaction,
        CASE WHEN p.sale_id IS NOT NULL THEN 'SALE' ELSE 'BOOKING' END AS payment_for,
        p.amount,
        p.method,
        p.status,
        p.paid_at,
        p.verified_at,
        p.created_at
      FROM payments p
      LEFT JOIN sales s ON p.sale_id = s.id
      LEFT JOIN bookings b ON p.booking_id = b.id
      ORDER BY p.created_at DESC
    `);
    return rows.map((r) => ({ ...r, amount: Number(r.amount) }));
  }

  async getPlotsReport() {
    const [rows] = await pool.execute(`
      SELECT 
        pl.id,
        pr.name AS project_name,
        pl.plot_code,
        pl.block_name,
        pl.area_sqm,
        pl.price,
        pl.status,
        pl.created_at
      FROM plots pl
      INNER JOIN projects pr ON pl.project_id = pr.id
      ORDER BY pl.project_id ASC, pl.plot_code ASC
    `);
    return rows.map((r) => ({
      ...r,
      area_sqm: Number(r.area_sqm),
      price: Number(r.price),
    }));
  }
}

export const dashboardRepository = new DashboardRepository();
