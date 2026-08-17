import { Router } from 'express';
import {
  signUp,
  verifyOTP,
  signIn,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';

const router = Router();

// @route   POST /api/auth/signup
// @desc    Register a new user and dispatch 6-digit OTP
router.post('/signup', signUp);

// @route   POST /api/auth/verify-otp
// @desc    Verify registration OTP and activate user account
router.post('/verify-otp', verifyOTP);

// @route   POST /api/auth/signin
// @desc    Authenticate user credentials and issue JWT
router.post('/signin', signIn);

// Also accept /login alias for backwards compatibility
router.post('/login', signIn);

// @route   POST /api/auth/forgot-password
// @desc    Dispatch password reset OTP
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Verify OTP and update user password
router.post('/reset-password', resetPassword);

export default router;
