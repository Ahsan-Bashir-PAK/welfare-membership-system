import { Router } from 'express';
import authRoutes from './authRoutes.js';
import memberRoutes from './memberRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import welfareRoutes from './welfareRoutes.js';
import transferRoutes from './transferRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import reportRoutes from './reportRoutes.js';
import masterDataRoutes from './masterDataRoutes.js';
import auditRoutes from './auditRoutes.js';
import settingsRoutes from './settingsRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/payments', paymentRoutes);
router.use('/welfare', welfareRoutes);
router.use('/transfers', transferRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/master-data', masterDataRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/settings', settingsRoutes);

export default router;
