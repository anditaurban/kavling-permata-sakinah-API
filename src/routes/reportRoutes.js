import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRoles('OWNER', 'ADMIN'));

router.get('/sales', (req, res, next) => reportController.getSales(req, res, next));
router.get('/payments', (req, res, next) => reportController.getPayments(req, res, next));
router.get('/plots', (req, res, next) => reportController.getLots(req, res, next));
router.get('/lots', (req, res, next) => reportController.getLots(req, res, next)); // Alias

export default router;
