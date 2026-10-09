import { plotService } from '../services/plotService.js';
import { successResponse } from '../utils/response.js';

export class PlotController {
  async getAll(req, res, next) {
    try {
      const filters = {
        ...req.query,
        projectId: req.params.projectId || req.query.projectId || req.query.project_id,
      };
      const plots = await plotService.getAllPlots(filters);
      return successResponse(res, plots, { total: plots.length });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const plot = await plotService.getPlotById(req.params.id);
      return successResponse(res, plot);
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const payload = {
        ...req.body,
        project_id: req.params.projectId || req.body.project_id || req.body.projectId,
      };
      const plot = await plotService.createPlot(payload);
      return successResponse(res, plot, {}, 201);
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const plot = await plotService.updatePlot(req.params.id, req.body);
      return successResponse(res, plot);
    } catch (error) {
      return next(error);
    }
  }
}

export const plotController = new PlotController();
