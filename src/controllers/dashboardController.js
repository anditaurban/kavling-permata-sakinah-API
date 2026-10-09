import { dashboardService } from '../services/dashboardService.js';
import { successResponse } from '../utils/response.js';

export class DashboardController {
  async getSummary(req, res, next) {
    try {
      const summary = await dashboardService.getSummary();
      return successResponse(res, summary);
    } catch (error) {
      return next(error);
    }
  }

  async getLotStatus(req, res, next) {
    try {
      const lotStatus = await dashboardService.getLotStatus();
      return successResponse(res, lotStatus);
    } catch (error) {
      return next(error);
    }
  }

  async getRecentTransactions(req, res, next) {
    try {
      const limit = req.query.limit || 5;
      const recent = await dashboardService.getRecentTransactions(limit);
      return successResponse(res, recent, { total: recent.length });
    } catch (error) {
      return next(error);
    }
  }
}

export const dashboardController = new DashboardController();
