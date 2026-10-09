import { Router } from 'express';
import { projectController } from '../controllers/projectController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

// Public endpoints for listing and details
router.get('/', (req, res, next) => projectController.getAll(req, res, next));
router.get('/:id', (req, res, next) => projectController.getById(req, res, next));

// Protected admin endpoints
router.post('/', authenticate, requireRoles('OWNER', 'ADMIN'), (req, res, next) =>
  projectController.create(req, res, next)
);
router.patch('/:id', authenticate, requireRoles('OWNER', 'ADMIN'), (req, res, next) =>
  projectController.update(req, res, next)
);
router.delete('/:id', authenticate, requireRoles('OWNER', 'ADMIN'), (req, res, next) =>
  projectController.delete(req, res, next)
);

export default router;
