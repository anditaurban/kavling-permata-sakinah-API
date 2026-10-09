import { projectRepository } from '../repositories/projectRepository.js';

export class ProjectService {
  async getAllProjects() {
    return projectRepository.findAll();
  }

  async getProject(identifier) {
    const project = await projectRepository.findByIdOrSlug(identifier);
    if (!project) {
      const error = new Error('Proyek tidak ditemukan');
      error.statusCode = 404;
      error.code = 'PROJECT_NOT_FOUND';
      throw error;
    }
    return project;
  }

  async createProject(payload) {
    if (!payload.name || !payload.slug) {
      const error = new Error('Nama dan slug proyek wajib diisi');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const existing = await projectRepository.findByIdOrSlug(payload.slug);
    if (existing) {
      const error = new Error('Slug proyek sudah digunakan');
      error.statusCode = 409;
      error.code = 'SLUG_CONFLICT';
      throw error;
    }

    return projectRepository.create(payload);
  }

  async updateProject(id, payload) {
    const existing = await projectRepository.findByIdOrSlug(id);
    if (!existing) {
      const error = new Error('Proyek tidak ditemukan');
      error.statusCode = 404;
      error.code = 'PROJECT_NOT_FOUND';
      throw error;
    }

    if (payload.slug && payload.slug !== existing.slug) {
      const slugUsed = await projectRepository.findByIdOrSlug(payload.slug);
      if (slugUsed && slugUsed.id !== existing.id) {
        const error = new Error('Slug proyek sudah digunakan oleh proyek lain');
        error.statusCode = 409;
        error.code = 'SLUG_CONFLICT';
        throw error;
      }
    }

    return projectRepository.update(existing.id, payload);
  }

  async deleteProject(id) {
    const existing = await projectRepository.findByIdOrSlug(id);
    if (!existing) {
      const error = new Error('Proyek tidak ditemukan');
      error.statusCode = 404;
      error.code = 'PROJECT_NOT_FOUND';
      throw error;
    }

    const hasPlots = await projectRepository.hasPlots(existing.id);
    if (hasPlots) {
      const error = new Error('Proyek tidak dapat dihapus karena masih memiliki data kavling terkait');
      error.statusCode = 409;
      error.code = 'PROJECT_HAS_PLOTS';
      throw error;
    }

    return projectRepository.delete(existing.id);
  }
}

export const projectService = new ProjectService();
