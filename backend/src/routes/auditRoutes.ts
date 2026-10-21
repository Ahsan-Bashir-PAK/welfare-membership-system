import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, requireRole('Super Admin'), getAuditLogs);

export default router;
