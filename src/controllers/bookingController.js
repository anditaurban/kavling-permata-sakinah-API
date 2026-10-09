import { bookingService } from '../services/bookingService.js';
import { successResponse } from '../utils/response.js';

export class BookingController {
  async getAll(req, res, next) {
    try {
      const filters = { ...req.query };
      // If customer role, only return customer's bookings
      if (req.user.role === 'CUSTOMER') {
        filters.customerId = req.user.customer_id;
      }
      const bookings = await bookingService.getAllBookings(filters);
      return successResponse(res, bookings, { total: bookings.length });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const booking = await bookingService.getBookingById(req.params.id);
      // Customer isolation
      if (req.user.role === 'CUSTOMER' && String(booking.customer_id) !== String(req.user.customer_id)) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Anda hanya dapat mengakses data booking milik sendiri' },
        });
      }
      return successResponse(res, booking);
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const payload = { ...req.body };
      // If customer initiates, assign their customer_id
      if (req.user.role === 'CUSTOMER') {
        payload.customer_id = req.user.customer_id;
      }
      const booking = await bookingService.createBooking(req.user, payload);
      return successResponse(res, booking, {}, 201);
    } catch (error) {
      return next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const { reason } = req.body;
      const booking = await bookingService.cancelBooking(req.params.id, req.user, reason);
      return successResponse(res, booking);
    } catch (error) {
      return next(error);
    }
  }
}

export const bookingController = new BookingController();
