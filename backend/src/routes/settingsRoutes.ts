import { Router } from 'express';
import { getSettings, updateSetting } from '../controllers/settingsController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getSettings);
router.patch('/:key', authenticateToken, requireRole('Super Admin'), updateSetting);

export default router;
