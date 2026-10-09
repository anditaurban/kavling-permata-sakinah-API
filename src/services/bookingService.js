import { pool } from '../config/database.js';
import { bookingRepository } from '../repositories/bookingRepository.js';
import { customerRepository } from '../repositories/customerRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';

export class BookingService {
  async getAllBookings(filters = {}) {
    return bookingRepository.findAll(filters);
  }

  async getBookingById(id) {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      const error = new Error('Booking tidak ditemukan');
      error.statusCode = 404;
      error.code = 'BOOKING_NOT_FOUND';
      throw error;
    }
    return booking;
  }

  /**
   * Create new booking using database transaction and row-level locking
   */
  async createBooking(actorUser, payload) {
    const { customer_id, plot_id, booking_fee = 5000000, notes, expires_in_days = 7 } = payload;

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
      if (plot.status !== 'AVAILABLE') {
        const error = new Error(`Kavling '${plot.plot_code}' tidak tersedia (status: ${plot.status})`);
        error.statusCode = 409;
        error.code = 'PLOT_NOT_AVAILABLE';
        throw error;
      }

      // 2. Lock check for active bookings
      const [existingActive] = await connection.execute(
        `SELECT id, booking_number FROM bookings 
         WHERE plot_id = ? AND status IN ('PENDING_PAYMENT', 'ACTIVE') 
         FOR UPDATE`,
        [plot_id]
      );

      if (existingActive.length > 0) {
        const error = new Error(
          `Kavling '${plot.plot_code}' sedang ditahan oleh booking aktif #${existingActive[0].booking_number}`
        );
        error.statusCode = 409;
        error.code = 'PLOT_ALREADY_BOOKED';
        throw error;
      }

      // 3. Generate booking number: BOOK-YYYY-MMDD-XXXX
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingNumber = `BOOK-${datePart}-${randomSuffix}`;

      // Calculate expires_at
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expires_in_days));

      // 4. Insert booking with snapshot price
      const [insertResult] = await connection.execute(
        `INSERT INTO bookings (
          booking_number, customer_id, plot_id, created_by,
          booking_price, booking_fee, status, expires_at, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING_PAYMENT', ?, ?, NOW(), NOW())`,
        [
          bookingNumber,
          customer_id,
          plot_id,
          actorUser.id,
          plot.price,
          Number(booking_fee),
          expiresAt.toISOString().slice(0, 19).replace('T', ' '),
          notes || null,
        ]
      );

      const newBookingId = insertResult.insertId;

      // 5. Update plot status to BOOKED
      await connection.execute(
        "UPDATE plots SET status = 'BOOKED', updated_at = NOW() WHERE id = ?",
        [plot_id]
      );

      // 6. Audit log
      await auditLogRepository.log(
        {
          actor_user_id: actorUser.id,
          action: 'CREATE_BOOKING',
          entity_type: 'BOOKING',
          entity_id: newBookingId,
          summary: `${actorUser.name} membuat booking ${bookingNumber} kavling ${plot.plot_code} untuk ${customer.name}`,
          metadata_json: { booking_number: bookingNumber, plot_id, customer_id, booking_fee },
        },
        connection
      );

      await connection.commit();
      return bookingRepository.findById(newBookingId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cancel booking and safely release plot if no other active transaction exists
   */
  async cancelBooking(bookingId, actorUser, reason) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [bookings] = await connection.execute(
        'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
        [bookingId]
      );

      if (!bookings[0]) {
        const error = new Error('Booking tidak ditemukan');
        error.statusCode = 404;
        error.code = 'BOOKING_NOT_FOUND';
        throw error;
      }

      const booking = bookings[0];
      if (['CANCELLED', 'CONVERTED', 'EXPIRED'].includes(booking.status)) {
        const error = new Error(`Booking tidak dapat dibatalkan (status saat ini: ${booking.status})`);
        error.statusCode = 400;
        error.code = 'INVALID_STATUS_TRANSITION';
        throw error;
      }

      // Update booking status
      await connection.execute(
        "UPDATE bookings SET status = 'CANCELLED', notes = CONCAT(COALESCE(notes, ''), ' | Dibatalkan: ', ?), updated_at = NOW() WHERE id = ?",
        [reason || 'Dibatalkan oleh staf', bookingId]
      );

      // Check if plot should be released back to AVAILABLE
      const [otherActive] = await connection.execute(
        "SELECT id FROM bookings WHERE plot_id = ? AND status IN ('PENDING_PAYMENT', 'ACTIVE') AND id != ? FOR UPDATE",
        [booking.plot_id, bookingId]
      );

      const [confirmedSales] = await connection.execute(
        "SELECT id FROM sales WHERE plot_id = ? AND status = 'CONFIRMED' FOR UPDATE",
        [booking.plot_id]
      );

      if (otherActive.length === 0 && confirmedSales.length === 0) {
        await connection.execute(
          "UPDATE plots SET status = 'AVAILABLE', updated_at = NOW() WHERE id = ?",
          [booking.plot_id]
        );
      }

      await auditLogRepository.log(
        {
          actor_user_id: actorUser.id,
          action: 'CANCEL_BOOKING',
          entity_type: 'BOOKING',
          entity_id: bookingId,
          summary: `${actorUser.name} membatalkan booking #${booking.booking_number}`,
          metadata_json: { reason, plot_id: booking.plot_id },
        },
        connection
      );

      await connection.commit();
      return bookingRepository.findById(bookingId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const bookingService = new BookingService();
