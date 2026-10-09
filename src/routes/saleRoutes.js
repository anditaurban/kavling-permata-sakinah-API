import { Router } from 'express';
import { saleController } from '../controllers/saleController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => saleController.getAll(req, res, next));
router.get('/:id', (req, res, next) => saleController.getById(req, res, next));
router.post('/', requireRoles('OWNER', 'ADMIN', 'STAFF'), (req, res, next) =>
  saleController.create(req, res, next)
);
router.patch('/:id/confirm', requireRoles('OWNER', 'ADMIN'), (req, res, next) =>
  saleController.confirm(req, res, next)
);

export default router;
