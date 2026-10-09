import { saleService } from '../services/saleService.js';
import { successResponse } from '../utils/response.js';

export class SaleController {
  async getAll(req, res, next) {
    try {
      const filters = { ...req.query };
      if (req.user.role === 'CUSTOMER') {
        filters.customerId = req.user.customer_id;
      }
      const sales = await saleService.getAllSales(filters);
      return successResponse(res, sales, { total: sales.length });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const sale = await saleService.getSaleById(req.params.id);
      if (req.user.role === 'CUSTOMER' && String(sale.customer_id) !== String(req.user.customer_id)) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Anda hanya dapat mengakses data transaksi milik sendiri' },
        });
      }
      return successResponse(res, sale);
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const sale = await saleService.createSale(req.user, req.body);
      return successResponse(res, sale, {}, 201);
    } catch (error) {
      return next(error);
    }
  }

  async confirm(req, res, next) {
    try {
      const sale = await saleService.confirmSale(req.params.id, req.user);
      return successResponse(res, sale);
    } catch (error) {
      return next(error);
    }
  }
}

export const saleController = new SaleController();
