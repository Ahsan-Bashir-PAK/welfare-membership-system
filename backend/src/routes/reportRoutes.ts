import { Router } from 'express';
import {
  getMemberReport,
  getPaymentReport,
  getWelfareReport,
  getTransferReport,
  getOrganizationalFundReport,
} from '../controllers/reportsController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/members', authenticateToken, requireRole('Super Admin', 'Focal Person'), getMemberReport);
router.get('/payments', authenticateToken, requireRole('Super Admin', 'Focal Person'), getPaymentReport);
router.get('/welfare', authenticateToken, requireRole('Super Admin', 'Focal Person'), getWelfareReport);
router.get('/transfers', authenticateToken, requireRole('Super Admin', 'Focal Person'), getTransferReport);
router.get('/organizational-fund', authenticateToken, requireRole('Super Admin'), getOrganizationalFundReport);

export default router;
