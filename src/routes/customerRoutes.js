import { Router } from 'express';
import { customerController } from '../controllers/customerController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRoles, ensureCustomerOwnership } from '../middlewares/roleMiddleware.js';

const router = Router();

// All customer management requires authentication
router.use(authenticate);

router.get('/', requireRoles('OWNER', 'ADMIN', 'STAFF'), (req, res, next) =>
  customerController.getAll(req, res, next)
);

router.get('/:id', requireRoles('OWNER', 'ADMIN', 'STAFF', 'CUSTOMER'), ensureCustomerOwnership('id'), (req, res, next) =>
  customerController.getById(req, res, next)
);

router.post('/', requireRoles('OWNER', 'ADMIN', 'STAFF'), (req, res, next) =>
  customerController.create(req, res, next)
);

router.patch('/:id', requireRoles('OWNER', 'ADMIN', 'STAFF'), (req, res, next) =>
  customerController.update(req, res, next)
);

router.get('/:id/activities', requireRoles('OWNER', 'ADMIN', 'STAFF'), (req, res, next) =>
  customerController.getActivities(req, res, next)
);

router.post('/:id/activities', requireRoles('OWNER', 'ADMIN', 'STAFF'), (req, res, next) =>
  customerController.addActivity(req, res, next)
);

export default router;
