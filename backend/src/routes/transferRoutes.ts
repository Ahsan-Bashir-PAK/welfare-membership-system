import { Router } from 'express';
import {
  getTransfers,
  getTransferById,
  createTransfer,
  postTransfer,
  reverseTransfer,
} from '../controllers/transferController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getTransfers);
router.get('/:id', authenticateToken, getTransferById);
router.post('/', authenticateToken, requireRole('Super Admin', 'Focal Person'), createTransfer);
router.post('/:id/post', authenticateToken, requireRole('Super Admin', 'Focal Person'), postTransfer);
router.post('/:id/reverse', authenticateToken, requireRole('Super Admin'), reverseTransfer);

export default router;
