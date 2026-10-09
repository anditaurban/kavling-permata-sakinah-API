import { pool } from '../config/database.js';
import { saleRepository } from '../repositories/saleRepository.js';
import { customerRepository } from '../repositories/customerRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';

export class SaleService {
  async getAllSales(filters = {}) {
    return saleRepository.findAll(filters);
  }

  async getSaleById(id) {
    const sale = await saleRepository.findById(id);
    if (!sale) {
      const error = new Error('Transaksi penjualan tidak ditemukan');
      error.statusCode = 404;
      error.code = 'SALE_NOT_FOUND';
      throw error;
    }
    return sale;
  }

  /**
   * Create new sales transaction using database transaction and row-level locking
   */
  async createSale(actorUser, payload) {
    const { customer_id, plot_id, booking_id, discount_amount = 0, status = 'PENDING_PAYMENT', notes } = payload;

    if (!customer_id || !plot_id) {
      const error = new Error('Field customer_id dan plot_id wajib diisi');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const customer = await customerRepository.findById(customer_id);
    if (!customer) {
      const error = new Error('Customer tidak ditemukan');
      error.statusCode = 404;
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Lock plot row
      const [plots] = await connection.execute(
        'SELECT id, plot_code, price, status FROM plots WHERE id = ? FOR UPDATE',
        [plot_id]
      );

      if (!plots[0]) {
        const error = new Error('Kavling tidak ditemukan');
        error.statusCode = 404;
        error.code = 'PLOT_NOT_FOUND';
        throw error;
      }

      const plot = plots[0];
      const plotPrice = Number(plot.price);

      // 2. Validate plot availability
      if (plot.status === 'SOLD') {
        const error = new Error(`Kavling '${plot.plot_code}' sudah terjual`);
        error.statusCode = 409;
        error.code = 'PLOT_ALREADY_SOLD';
        throw error;
      }

      // Check if plot is booked by another customer
      const [activeBookings] = await connection.execute(
        `SELECT id, customer_id, booking_number FROM bookings 
         WHERE plot_id = ? AND status IN ('PENDING_PAYMENT', 'ACTIVE') 
         FOR UPDATE`,
        [plot_id]
      );

      if (activeBookings.length > 0) {
        const activeBooking = activeBookings[0];
        // If booked by another customer, reject
        if (String(activeBooking.customer_id) !== String(customer_id)) {
          const error = new Error(
            `Kavling '${plot.plot_code}' sedang dibooking oleh customer lain (#${activeBooking.booking_number})`
          );
          error.statusCode = 409;
          error.code = 'PLOT_BOOKED_BY_ANOTHER';
          throw error;
        }
      }

      // 3. Price and discount calculations
      const discount = Math.max(0, Number(discount_amount) || 0);
      if (discount > plotPrice) {
        const error = new Error('Diskon tidak boleh melebihi harga jual kavling');
        error.statusCode = 400;
        error.code = 'INVALID_DISCOUNT';
        throw error;
      }

      const totalAmount = plotPrice - discount;

      // 4. Generate unique sale number: SALE-YYYY-MMDD-XXXX
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const saleNumber = `SALE-${datePart}-${randomSuffix}`;

      const saleStatus = status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING_PAYMENT';
      const confirmedAt = saleStatus === 'CONFIRMED' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;

      // 5. Insert sale record
      const [insertResult] = await connection.execute(
        `INSERT INTO sales (
          sale_number, customer_id, plot_id, booking_id, created_by,
          sale_price, discount_amount, total_amount, status, confirmed_at, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          saleNumber,
          customer_id,
          plot_id,
          booking_id || null,
          actorUser.id,
          plotPrice,
          discount,
          totalAmount,
          saleStatus,
          confirmedAt,
          notes || null,
        ]
      );

      const newSaleId = insertResult.insertId;

      // 6. Update booking status if converted
      if (booking_id || activeBookings.length > 0) {
        const targetBookingId = booking_id || activeBookings[0].id;
        await connection.execute(
          "UPDATE bookings SET status = 'CONVERTED', updated_at = NOW() WHERE id = ?",
          [targetBookingId]
        );
      }

      // 7. Update plot status
      if (saleStatus === 'CONFIRMED') {
        await connection.execute("UPDATE plots SET status = 'SOLD', updated_at = NOW() WHERE id = ?", [plot_id]);
      } else {
        await connection.execute("UPDATE plots SET status = 'BOOKED', updated_at = NOW() WHERE id = ?", [plot_id]);
      }

      // 8. Audit log
      await auditLogRepository.log(
        {
          actor_user_id: actorUser.id,
          action: 'CREATE_SALE',
          entity_type: 'SALE',
          entity_id: newSaleId,
          summary: `${actorUser.name} membuat transaksi penjualan #${saleNumber} untuk kavling ${plot.plot_code}`,
          metadata_json: { sale_number: saleNumber, total_amount: totalAmount, status: saleStatus },
        },
        connection
      );

      await connection.commit();
      return saleRepository.findById(newSaleId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Confirm sale transaction and permanently mark plot as SOLD
   */
  async confirmSale(saleId, actorUser) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [sales] = await connection.execute(
        'SELECT * FROM sales WHERE id = ? FOR UPDATE',
        [saleId]
      );

      if (!sales[0]) {
        const error = new Error('Transaksi penjualan tidak ditemukan');
        error.statusCode = 404;
        error.code = 'SALE_NOT_FOUND';
        throw error;
      }

      const sale = sales[0];
      if (sale.status === 'CONFIRMED') {
        const error = new Error('Transaksi penjualan sudah dikonfirmasi');
        error.statusCode = 400;
        error.code = 'SALE_ALREADY_CONFIRMED';
        throw error;
      }

      if (sale.status === 'CANCELLED') {
        const error = new Error('Transaksi penjualan yang dibatalkan tidak dapat dikonfirmasi');
        error.statusCode = 400;
        error.code = 'SALE_CANCELLED';
        throw error;
      }

      // Lock plot
      const [plots] = await connection.execute('SELECT * FROM plots WHERE id = ? FOR UPDATE', [sale.plot_id]);
      if (plots[0].status === 'SOLD' && plots[0].id !== sale.plot_id) {
        const error = new Error('Kavling sudah terjual dalam transaksi lain');
        error.statusCode = 409;
        error.code = 'PLOT_ALREADY_SOLD';
        throw error;
      }

      // Update sale
      await connection.execute(
        "UPDATE sales SET status = 'CONFIRMED', confirmed_at = NOW(), updated_at = NOW() WHERE id = ?",
        [saleId]
      );

      // Update plot to SOLD
      await connection.execute("UPDATE plots SET status = 'SOLD', updated_at = NOW() WHERE id = ?", [sale.plot_id]);

      await auditLogRepository.log(
        {
          actor_user_id: actorUser.id,
          action: 'CONFIRM_SALE',
          entity_type: 'SALE',
          entity_id: saleId,
          summary: `${actorUser.name} mengonfirmasi transaksi penjualan #${sale.sale_number}`,
          metadata_json: { sale_id: saleId, plot_id: sale.plot_id },
        },
        connection
      );

      await connection.commit();
      return saleRepository.findById(saleId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const saleService = new SaleService();
