
// src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ================= REGISTER =================

exports.register = async (req, res, next) => {
  try {
    console.log("📥 Register Request Body:", req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
              console.log("❌ Missing required fields");
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password
    });

    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

// ================= LOGIN =================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// ================= REFRESH TOKEN =================
exports.refreshToken = async (req, res, next) => {
  try {
    // In real setup, verify refresh token logic here
    return res.status(200).json({ success: true, message: 'Token refreshed (placeholder)' });
  } catch (error) {
    next(error);
  }
};

// ================= LOGOUT =================
exports.logout = async (req, res, next) => {
  try {
    // Placeholder for token invalidation logic
    return res.status(200).json({ success: true, message: 'User logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res, next) => {
  try {
    // Placeholder for email reset logic
    return res.status(200).json({ success: true, message: 'Password reset email sent (placeholder)' });
  } catch (error) {
    next(error);
  }
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res, next) => {
  try {
    // Placeholder for reset password logic
    return res.status(200).json({ success: true, message: 'Password reset successfully (placeholder)' });
  } catch (error) {
    next(error);
  }
};

// ================= VERIFY EMAIL =================
exports.verifyEmail = async (req, res, next) => {
  try {
    // Placeholder for email verification logic
    return res.status(200).json({ success: true, message: 'Email verified successfully (placeholder)' });
  } catch (error) {
    next(error);
  }
};

// ================= RESEND VERIFICATION =================
exports.resendVerification = async (req, res, next) => {
  try {
    // Placeholder for resend verification logic
    return res.status(200).json({ success: true, message: 'Verification email resent (placeholder)' });
  } catch (error) {
    next(error);
  }
};

// ================= GET CURRENT USER =================
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// ================= CHANGE PASSWORD =================
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Old password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
