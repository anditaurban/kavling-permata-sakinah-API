import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRoles('OWNER', 'ADMIN', 'STAFF'));

router.get('/summary', (req, res, next) => dashboardController.getSummary(req, res, next));
router.get('/lot-status', (req, res, next) => dashboardController.getLotStatus(req, res, next));
router.get('/recent-transactions', (req, res, next) => dashboardController.getRecentTransactions(req, res, next));

export default router;
