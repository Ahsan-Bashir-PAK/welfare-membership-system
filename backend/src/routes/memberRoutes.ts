import { Router } from 'express';
import {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  updateMemberStatus,
  updateMembershipDate,
  updateMemberRole,
  archiveMember,
} from '../controllers/memberController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getMembers);
router.get('/:id', authenticateToken, getMemberById);
router.post('/', authenticateToken, requireRole('Super Admin', 'Focal Person'), createMember);
router.put('/:id', authenticateToken, updateMember);
router.patch('/:id/status', authenticateToken, requireRole('Super Admin', 'Focal Person'), updateMemberStatus);
router.patch('/:id/membership-date', authenticateToken, requireRole('Super Admin', 'Focal Person'), updateMembershipDate);
router.patch('/:id/role', authenticateToken, requireRole('Super Admin'), updateMemberRole);
router.delete('/:id', authenticateToken, requireRole('Super Admin'), archiveMember);

export default router;
