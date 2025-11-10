// syncspace-backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');

// Controllers & Middlewares
const authController = require('../controllers/authController');
const { protect, verifyToken } = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

// Validators
const {
  validateRegister,
  validateLogin,
  validatePasswordReset
} = require('../validators/authValidator');

// ==================== DEBUG LOGS ====================
console.log('🧩 Loaded authController:', Object.keys(authController));
console.log('🧩 Loaded authValidator:', {
  validateRegister: !!validateRegister,
  validateLogin: !!validateLogin,
  validatePasswordReset: !!validatePasswordReset,
});

// ==================== AUTH ROUTES ====================

// @route   POST /api/auth/register
// @desc    Register new user
router.post('/register', validateRegister, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation Errors:', errors.array());
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return authController.register(req, res, next);
});

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', validateLogin, validationMiddleware, authController.login);

// @route   POST /api/auth/refresh-token
// @desc    Refresh token
router.post('/refresh-token', authController.refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user
router.post('/logout', protect, authController.logout);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
router.post('/forgot-password', validatePasswordReset, validationMiddleware, authController.forgotPassword);

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using token
router.post('/reset-password/:token', authController.resetPassword);

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email
router.get('/verify-email/:token', authController.verifyEmail);

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
router.post('/resend-verification', protect, authController.resendVerification);

// @route   GET /api/auth/me
// @desc    Get current user details
router.get('/me', protect, authController.getCurrentUser);

// @route   POST /api/auth/change-password
// @desc    Change password
router.post('/change-password', protect, authController.changePassword);

// @route   GET /api/auth/validate
// @desc    Validate token (check if logged in)
// router.get('/validate', verifyToken, async (req, res) => {
router.get('/validate', protect, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: req.user,
    });
  } catch (error) {
    console.error('❌ Error validating token:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
