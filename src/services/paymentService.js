import { pool } from '../config/database.js';
import { paymentRepository } from '../repositories/paymentRepository.js';
import { bookingRepository } from '../repositories/bookingRepository.js';
import { saleRepository } from '../repositories/saleRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';

export class PaymentService {
  async getAllPayments(filters = {}) {
    return paymentRepository.findAll(filters);
  }

  async getPaymentById(id) {
    const payment = await paymentRepository.findById(id);
    if (!payment) {
      const error = new Error('Data pembayaran tidak ditemukan');
      error.statusCode = 404;
      error.code = 'PAYMENT_NOT_FOUND';
      throw error;
    }
    return payment;
  }

  /**
   * Create new payment linked to either booking or sale
   */
  async createPayment(actorUser, payload) {
    const { sale_id, booking_id, amount, method = 'BANK_TRANSFER', reference_number, proof_url, notes } = payload;

    if (!sale_id && !booking_id) {
      const error = new Error('Pembayaran harus ditujukan ke booking_id atau sale_id');
      error.statusCode = 400;
      error.code = 'MISSING_PAYMENT_TARGET';
      throw error;
    }

    if (sale_id && booking_id) {
      const error = new Error('Pembayaran hanya boleh ditujukan ke salah satu target (booking_id atau sale_id)');
      error.statusCode = 400;
      error.code = 'AMBIGUOUS_PAYMENT_TARGET';
      throw error;
    }

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      const error = new Error('Nominal pembayaran harus lebih besar dari 0');
      error.statusCode = 400;
      error.code = 'INVALID_AMOUNT';
      throw error;
    }

    // Verify existence of target entity
    if (booking_id) {
      const booking = await bookingRepository.findById(booking_id);
      if (!booking) {
        const error = new Error('Booking terkait tidak ditemukan');
        error.statusCode = 404;
        error.code = 'BOOKING_NOT_FOUND';
        throw error;
      }
    }

    if (sale_id) {
      const sale = await saleRepository.findById(sale_id);
      if (!sale) {
        const error = new Error('Transaksi penjualan terkait tidak ditemukan');
        error.statusCode = 404;
        error.code = 'SALE_NOT_FOUND';
        throw error;
      }
    }

    // Generate unique payment number: PAY-YYYY-MMDD-XXXX
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const paymentNumber = `PAY-${datePart}-${randomSuffix}`;

    const [result] = await pool.execute(
      `INSERT INTO payments (
        payment_number, sale_id, booking_id, amount, method, status,
        reference_number, proof_url, paid_at, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, NOW(), ?, NOW(), NOW())`,
      [
        paymentNumber,
        sale_id || null,
        booking_id || null,
        payAmount,
        method,
        reference_number || null,
        proof_url || null,
        notes || null,
      ]
    );

    return paymentRepository.findById(result.insertId);
  }

  /**
   * Verify payment (Owner/Admin only) with concurrency locking
   */
  async verifyPayment(paymentId, actorUser) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [payments] = await connection.execute(
        'SELECT * FROM payments WHERE id = ? FOR UPDATE',
        [paymentId]
      );

      if (!payments[0]) {
        const error = new Error('Data pembayaran tidak ditemukan');
        error.statusCode = 404;
        error.code = 'PAYMENT_NOT_FOUND';
        throw error;
      }

      const payment = payments[0];
      if (payment.status === 'VERIFIED') {
        const error = new Error('Pembayaran ini sudah terverifikasi sebelumnya');
        error.statusCode = 400;
        error.code = 'ALREADY_VERIFIED';
        throw error;
      }

      // Update payment to VERIFIED
      await connection.execute(
        `UPDATE payments 
         SET status = 'VERIFIED', verified_by = ?, verified_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [actorUser.id, paymentId]
      );

      // If linked to booking and booking is PENDING_PAYMENT, promote to ACTIVE
      if (payment.booking_id) {
        const [bookings] = await connection.execute(
          'SELECT id, status FROM bookings WHERE id = ? FOR UPDATE',
          [payment.booking_id]
        );
        if (bookings[0] && bookings[0].status === 'PENDING_PAYMENT') {
          await connection.execute(
            "UPDATE bookings SET status = 'ACTIVE', updated_at = NOW() WHERE id = ?",
            [payment.booking_id]
          );
        }
      }

      await auditLogRepository.log(
        {
          actor_user_id: actorUser.id,
          action: 'VERIFY_PAYMENT',
          entity_type: 'PAYMENT',
          entity_id: paymentId,
          summary: `${actorUser.name} memverifikasi pembayaran #${payment.payment_number} senilai Rp ${Number(payment.amount).toLocaleString('id-ID')}`,
          metadata_json: { payment_id: paymentId, amount: payment.amount },
        },
        connection
      );

      await connection.commit();
      return paymentRepository.findById(paymentId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Reject payment
   */
  async rejectPayment(paymentId, actorUser, reason) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      const error = new Error('Data pembayaran tidak ditemukan');
      error.statusCode = 404;
      error.code = 'PAYMENT_NOT_FOUND';
      throw error;
    }

    await pool.execute(
      `UPDATE payments 
       SET status = 'REJECTED', notes = CONCAT(COALESCE(notes, ''), ' | Ditolak: ', ?), updated_at = NOW()
       WHERE id = ?`,
      [reason || 'Pembayaran ditolak oleh admin', paymentId]
    );

    return paymentRepository.findById(paymentId);
  }
}

export const paymentService = new PaymentService();
