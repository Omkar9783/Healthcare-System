import express from 'express';
import { login, register, getProfile, sendOtp, verifyOtp } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticateToken, getProfile);

export default router;
