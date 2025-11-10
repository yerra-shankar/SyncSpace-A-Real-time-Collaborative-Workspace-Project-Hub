/**
 * Token Utility Functions
 * Helper functions for JWT token generation and management
 */

const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {Object} payload - Data to encode in token
 * @returns {String} JWT token
 */
exports.generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Generate access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Access and refresh tokens
 */
exports.generateAuthTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Short-lived access token
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' } // Long-lived refresh token
  );

  return { accessToken, refreshToken };
};

/**
 * Decode token without verification (for debugging)
 * @param {String} token - JWT token
 * @returns {Object} Decoded token
 */
exports.decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Generate password reset token
 * @param {String} userId - User ID
 * @returns {String} Reset token
 */
exports.generateResetToken = (userId) => {
  return jwt.sign(
    { id: userId, purpose: 'password-reset' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * Verify password reset token
 * @param {String} token - Reset token
 * @returns {Object} Decoded token
 */
exports.verifyResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.purpose !== 'password-reset') {
      throw new Error('Invalid reset token');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }
};