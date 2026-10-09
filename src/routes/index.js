import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import projectRoutes from './projectRoutes.js';
import plotRoutes from './plotRoutes.js';
import customerRoutes from './customerRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import saleRoutes from './saleRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = Router();

// Health
router.use('/health', healthRoutes);

// Auth
router.use('/auth', authRoutes);

// Master Data
router.use('/projects', projectRoutes);
router.use('/projects/:projectId/plots', plotRoutes);
router.use('/plots', plotRoutes);
router.use('/lots', plotRoutes); // Alias
router.use('/customers', customerRoutes);

// Transactions & POS
router.use('/bookings', bookingRoutes);
router.use('/sales', saleRoutes);
router.use('/transactions', saleRoutes); // Alias
router.use('/payments', paymentRoutes);
router.use('/transactions/:transactionId/payments', paymentRoutes); // Alias

// Analytics & Reports
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

export default router;
