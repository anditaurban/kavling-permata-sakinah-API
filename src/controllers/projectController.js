import { projectService } from '../services/projectService.js';
import { successResponse } from '../utils/response.js';

export class ProjectController {
  async getAll(req, res, next) {
    try {
      const projects = await projectService.getAllProjects();
      return successResponse(res, projects, { total: projects.length });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const project = await projectService.getProject(req.params.id);
      return successResponse(res, project);
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const project = await projectService.createProject(req.body);
      return successResponse(res, project, {}, 201);
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const project = await projectService.updateProject(req.params.id, req.body);
      return successResponse(res, project);
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await projectService.deleteProject(req.params.id);
      return successResponse(res, { message: 'Proyek berhasil dihapus' });
    } catch (error) {
      return next(error);
    }
  }
}

export const projectController = new ProjectController();
