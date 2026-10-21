import { Router } from 'express';
import {
  getPayments,
  getPaymentById,
  createPayment,
  postPayment,
  reversePayment,
} from '../controllers/paymentController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getPayments);
router.get('/:id', authenticateToken, getPaymentById);
router.post('/', authenticateToken, requireRole('Super Admin', 'Focal Person'), createPayment);
router.post('/:id/post', authenticateToken, requireRole('Super Admin', 'Focal Person'), postPayment);
router.post('/:id/reverse', authenticateToken, requireRole('Super Admin'), reversePayment);

export default router;
