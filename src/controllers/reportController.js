import { dashboardService } from '../services/dashboardService.js';
import { successResponse } from '../utils/response.js';

export class ReportController {
  async getSales(req, res, next) {
    try {
      const sales = await dashboardService.getSalesReport();
      return successResponse(res, sales, { total: sales.length });
    } catch (error) {
      return next(error);
    }
  }

  async getPayments(req, res, next) {
    try {
      const payments = await dashboardService.getPaymentsReport();
      return successResponse(res, payments, { total: payments.length });
    } catch (error) {
      return next(error);
    }
  }

  async getLots(req, res, next) {
    try {
      const plots = await dashboardService.getPlotsReport();
      return successResponse(res, plots, { total: plots.length });
    } catch (error) {
      return next(error);
    }
  }
}

export const reportController = new ReportController();
