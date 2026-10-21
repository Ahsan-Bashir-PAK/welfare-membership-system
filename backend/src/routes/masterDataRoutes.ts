import { Router } from 'express';
import {
  getMasterData,
  addRank,
  addZone,
  addSector,
  addBeat,
  addSupportArea,
  deleteRank,
  deleteZone,
  deleteSector,
  deleteBeat,
  deleteSupportArea,
} from '../controllers/masterDataController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getMasterData);
router.post('/ranks', authenticateToken, requireRole('Super Admin'), addRank);
router.delete('/ranks/:id', authenticateToken, requireRole('Super Admin'), deleteRank);

router.post('/zones', authenticateToken, requireRole('Super Admin'), addZone);
router.delete('/zones/:id', authenticateToken, requireRole('Super Admin'), deleteZone);

router.post('/sectors', authenticateToken, requireRole('Super Admin'), addSector);
router.delete('/sectors/:id', authenticateToken, requireRole('Super Admin'), deleteSector);

router.post('/beats', authenticateToken, requireRole('Super Admin'), addBeat);
router.delete('/beats/:id', authenticateToken, requireRole('Super Admin'), deleteBeat);

router.post('/support-areas', authenticateToken, requireRole('Super Admin'), addSupportArea);
router.delete('/support-areas/:id', authenticateToken, requireRole('Super Admin'), deleteSupportArea);

export default router;
