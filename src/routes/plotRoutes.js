import { Router } from 'express';
import { plotController } from '../controllers/plotController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';

const router = Router({ mergeParams: true });

// Public endpoints
router.get('/', (req, res, next) => plotController.getAll(req, res, next));
router.get('/:id', (req, res, next) => plotController.getById(req, res, next));

// Internal endpoints
router.post('/', authenticate, requireRoles('OWNER', 'ADMIN'), (req, res, next) =>
  plotController.create(req, res, next)
);
router.patch('/:id', authenticate, requireRoles('OWNER', 'ADMIN', 'STAFF'), (req, res, next) =>
  plotController.update(req, res, next)
);

export default router;
