import { customerService } from '../services/customerService.js';
import { successResponse } from '../utils/response.js';

export class CustomerController {
  async getAll(req, res, next) {
    try {
      const customers = await customerService.getAllCustomers(req.query);
      return successResponse(res, customers, { total: customers.length });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      return successResponse(res, customer);
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const customer = await customerService.createCustomer(req.body);
      return successResponse(res, customer, {}, 201);
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const customer = await customerService.updateCustomer(req.params.id, req.body);
      return successResponse(res, customer);
    } catch (error) {
      return next(error);
    }
  }

  async getActivities(req, res, next) {
    try {
      const activities = await customerService.getActivities(req.params.id);
      return successResponse(res, activities, { total: activities.length });
    } catch (error) {
      return next(error);
    }
  }

  async addActivity(req, res, next) {
    try {
      const activity = await customerService.addActivity(req.params.id, req.user.id, req.body);
      return successResponse(res, activity, {}, 201);
    } catch (error) {
      return next(error);
    }
  }
}

export const customerController = new CustomerController();
