import express from 'express';
import { getSystemAnalytics, getUsersList, getRolesPermissionsMatrix } from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.get('/analytics', authenticateToken, requireRole(['ADMIN']), getSystemAnalytics);
router.get('/users', authenticateToken, requireRole(['ADMIN']), getUsersList);
router.get('/roles', authenticateToken, requireRole(['ADMIN']), getRolesPermissionsMatrix);

export default router;
