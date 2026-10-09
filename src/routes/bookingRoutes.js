import { Router } from 'express';
import { bookingController } from '../controllers/bookingController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => bookingController.getAll(req, res, next));
router.get('/:id', (req, res, next) => bookingController.getById(req, res, next));
router.post('/', requireRoles('OWNER', 'ADMIN', 'STAFF', 'CUSTOMER'), (req, res, next) =>
  bookingController.create(req, res, next)
);
router.patch('/:id/cancel', requireRoles('OWNER', 'ADMIN', 'STAFF'), (req, res, next) =>
  bookingController.cancel(req, res, next)
);

export default router;
