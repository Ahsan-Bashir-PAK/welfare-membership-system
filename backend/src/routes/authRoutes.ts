import { Router } from 'express';
import {
  login,
  logout,
  getMe,
  verifyForgotPassword,
  resetForgotPassword,
  changePassword,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { loginLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', loginLimiter, login);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getMe);
router.post('/forgot-password/verify', passwordResetLimiter, verifyForgotPassword);
router.post('/forgot-password/reset', passwordResetLimiter, resetForgotPassword);
router.post('/change-password', authenticateToken, changePassword);

export default router;
