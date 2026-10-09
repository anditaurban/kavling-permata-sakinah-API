import { Router } from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', (req, res, next) => paymentController.getAll(req, res, next));
router.get('/:id', (req, res, next) => paymentController.getById(req, res, next));
router.post('/', (req, res, next) => paymentController.create(req, res, next));
router.patch('/:id/verify', requireRoles('OWNER', 'ADMIN'), (req, res, next) =>
  paymentController.verify(req, res, next)
);
router.patch('/:id/reject', requireRoles('OWNER', 'ADMIN'), (req, res, next) =>
  paymentController.reject(req, res, next)
);

export default router;
