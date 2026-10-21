import { Router } from 'express';
import { getDashboardSummary, getDashboardCharts } from '../controllers/dashboardController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/summary', authenticateToken, requireRole('Super Admin', 'Focal Person'), getDashboardSummary);
router.get('/charts', authenticateToken, requireRole('Super Admin', 'Focal Person'), getDashboardCharts);

export default router;
