import { plotRepository } from '../repositories/plotRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';

export class PlotService {
  async getAllPlots(filters = {}) {
    return plotRepository.findAll(filters);
  }

  async getPlotById(id) {
    const plot = await plotRepository.findById(id);
    if (!plot) {
      const error = new Error('Kavling tidak ditemukan');
      error.statusCode = 404;
      error.code = 'PLOT_NOT_FOUND';
      throw error;
    }
    return plot;
  }

  async createPlot(payload) {
    const { project_id, plot_code, area_sqm, price } = payload;

    if (!project_id || !plot_code || !area_sqm || price === undefined) {
      const error = new Error('Field project_id, plot_code, area_sqm, dan price wajib diisi');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    if (Number(area_sqm) <= 0) {
      const error = new Error('Luas kavling harus lebih besar dari 0');
      error.statusCode = 400;
      error.code = 'INVALID_AREA';
      throw error;
    }

    if (Number(price) < 0) {
      const error = new Error('Harga kavling tidak boleh negatif');
      error.statusCode = 400;
      error.code = 'INVALID_PRICE';
      throw error;
    }

    const project = await projectRepository.findByIdOrSlug(project_id);
    if (!project) {
      const error = new Error('Proyek terkait tidak ditemukan');
      error.statusCode = 404;
      error.code = 'PROJECT_NOT_FOUND';
      throw error;
    }

    const existingPlot = await plotRepository.findByProjectAndCode(project.id, plot_code);
    if (existingPlot) {
      const error = new Error(`Kode kavling '${plot_code}' sudah ada di proyek ini`);
      error.statusCode = 409;
      error.code = 'PLOT_CODE_CONFLICT';
      throw error;
    }

    return plotRepository.create({
      ...payload,
      project_id: project.id,
      area_sqm: Number(area_sqm),
      price: Number(price),
    });
  }

  async updatePlot(id, payload) {
    const existing = await plotRepository.findById(id);
    if (!existing) {
      const error = new Error('Kavling tidak ditemukan');
      error.statusCode = 404;
      error.code = 'PLOT_NOT_FOUND';
      throw error;
    }

    if (payload.area_sqm !== undefined && Number(payload.area_sqm) <= 0) {
      const error = new Error('Luas kavling harus lebih besar dari 0');
      error.statusCode = 400;
      error.code = 'INVALID_AREA';
      throw error;
    }

    if (payload.price !== undefined && Number(payload.price) < 0) {
      const error = new Error('Harga kavling tidak boleh negatif');
      error.statusCode = 400;
      error.code = 'INVALID_PRICE';
      throw error;
    }

    // Protect sensitive status transitions
    if (payload.status && ['BOOKED', 'SOLD'].includes(payload.status) && existing.status !== payload.status) {
      const error = new Error(
        `Perubahan status menjadi '${payload.status}' harus dilakukan melalui modul Booking atau Penjualan/POS`
      );
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    return plotRepository.update(id, payload);
  }
}

export const plotService = new PlotService();
