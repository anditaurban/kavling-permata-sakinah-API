import { dashboardRepository } from '../repositories/dashboardRepository.js';

export class DashboardService {
  async getSummary() {
    return dashboardRepository.getSummary();
  }

  async getLotStatus() {
    return dashboardRepository.getLotStatusBreakdown();
  }

  async getRecentTransactions(limit = 5) {
    return dashboardRepository.getRecentTransactions(limit);
  }

  async getSalesReport() {
    return dashboardRepository.getSalesReport();
  }

  async getPaymentsReport() {
    return dashboardRepository.getPaymentsReport();
  }

  async getPlotsReport() {
    return dashboardRepository.getPlotsReport();
  }
}

export const dashboardService = new DashboardService();
