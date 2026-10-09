import { paymentService } from '../services/paymentService.js';
import { successResponse } from '../utils/response.js';

export class PaymentController {
  async getAll(req, res, next) {
    try {
      const filters = {
        ...req.query,
        saleId: req.params.transactionId || req.query.transactionId || req.query.saleId,
      };
      const payments = await paymentService.getAllPayments(filters);
      return successResponse(res, payments, { total: payments.length });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const payment = await paymentService.getPaymentById(req.params.id);
      return successResponse(res, payment);
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const payload = {
        ...req.body,
        sale_id: req.params.transactionId || req.body.sale_id || req.body.transaction_id,
      };
      const payment = await paymentService.createPayment(req.user, payload);
      return successResponse(res, payment, {}, 201);
    } catch (error) {
      return next(error);
    }
  }

  async verify(req, res, next) {
    try {
      const payment = await paymentService.verifyPayment(req.params.id, req.user);
      return successResponse(res, payment);
    } catch (error) {
      return next(error);
    }
  }

  async reject(req, res, next) {
    try {
      const { reason } = req.body;
      const payment = await paymentService.rejectPayment(req.params.id, req.user, reason);
      return successResponse(res, payment);
    } catch (error) {
      return next(error);
    }
  }
}

export const paymentController = new PaymentController();
