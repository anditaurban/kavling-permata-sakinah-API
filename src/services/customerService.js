import { customerRepository } from '../repositories/customerRepository.js';

export class CustomerService {
  async getAllCustomers(filters = {}) {
    return customerRepository.findAll(filters);
  }

  async getCustomerById(id) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      const error = new Error('Customer tidak ditemukan');
      error.statusCode = 404;
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }

    const activities = await customerRepository.findActivitiesByCustomerId(customer.id);
    return {
      ...customer,
      activities,
    };
  }

  async createCustomer(payload) {
    const { name, phone } = payload;
    if (!name || !phone) {
      const error = new Error('Nama dan nomor telepon customer wajib diisi');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    // Normalize phone number: remove non-digits
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return customerRepository.create({
      ...payload,
      phone: cleanPhone || phone,
    });
  }

  async updateCustomer(id, payload) {
    const existing = await customerRepository.findById(id);
    if (!existing) {
      const error = new Error('Customer tidak ditemukan');
      error.statusCode = 404;
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }

    if (payload.phone) {
      payload.phone = payload.phone.replace(/[^0-9]/g, '') || payload.phone;
    }

    return customerRepository.update(id, payload);
  }

  async getActivities(customerId) {
    const existing = await customerRepository.findById(customerId);
    if (!existing) {
      const error = new Error('Customer tidak ditemukan');
      error.statusCode = 404;
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }
    return customerRepository.findActivitiesByCustomerId(customerId);
  }

  async addActivity(customerId, staffUserId, payload) {
    const existing = await customerRepository.findById(customerId);
    if (!existing) {
      const error = new Error('Customer tidak ditemukan');
      error.statusCode = 404;
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }

    if (!payload.activity_type) {
      const error = new Error('Tipe aktivitas wajib diisi');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    return customerRepository.addActivity({
      customer_id: customerId,
      created_by: staffUserId,
      activity_type: payload.activity_type,
      description: payload.description,
      follow_up_at: payload.follow_up_at,
    });
  }
}

export const customerService = new CustomerService();
