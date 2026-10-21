import { Router } from 'express';
import {
  getWelfareRecords,
  getWelfareById,
  createWelfare,
  postWelfare,
  reverseWelfare,
} from '../controllers/welfareController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getWelfareRecords);
router.get('/:id', authenticateToken, getWelfareById);
router.post('/', authenticateToken, requireRole('Super Admin', 'Focal Person'), createWelfare);
router.post('/:id/post', authenticateToken, requireRole('Super Admin', 'Focal Person'), postWelfare);
router.post('/:id/reverse', authenticateToken, requireRole('Super Admin'), reverseWelfare);

export default router;
