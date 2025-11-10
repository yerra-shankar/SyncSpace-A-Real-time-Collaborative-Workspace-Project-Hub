// /src/middlewares/validationMiddleware.js

const { validationResult } = require('express-validator');

/**
 * Middleware to handle validation results from express-validator
 * This should be used after validation rules in route definitions
 */
const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Extract error messages
    const extractedErrors = {};
    errors.array().forEach(err => {
      if (!extractedErrors[err.path]) {
        extractedErrors[err.path] = [];
      }
      extractedErrors[err.path].push(err.msg);
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors,
      details: errors.array()
    });
  }

  next();
};

/**
 * Custom validation middleware for specific scenarios
 */

/**
 * Validate MongoDB ObjectId format
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const mongoose = require('mongoose');
    const id = req.params[paramName];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }

    next();
  };
};

/**
 * Validate query parameters
 */
const validateQueryParams = (allowedParams = []) => {
  return (req, res, next) => {
    const queryKeys = Object.keys(req.query);
    const invalidParams = queryKeys.filter(key => !allowedParams.includes(key));

    if (invalidParams.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        invalidParams: invalidParams,
        allowedParams: allowedParams
      });
    }

    next();
  };
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({
      success: false,
      message: 'Page number must be a positive integer'
    });
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }

  // Set defaults if not provided
  req.query.page = parseInt(page) || 1;
  req.query.limit = parseInt(limit) || 20;

  next();
};

/**
 * Validate sort parameters
 */
const validateSort = (allowedFields = []) => {
  return (req, res, next) => {
    const { sortBy, sortOrder } = req.query;

    if (sortBy && !allowedFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sort field',
        allowedFields: allowedFields
      });
    }

    if (sortOrder && !['asc', 'desc', '1', '-1'].includes(sortOrder)) {
      return res.status(400).json({
        success: false,
        message: 'Sort order must be "asc" or "desc"'
      });
    }

    next();
  };
};

/**
 * Validate date range parameters
 */
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (startDate && isNaN(Date.parse(startDate))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid start date format'
    });
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid end date format'
    });
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({
      success: false,
      message: 'Start date cannot be after end date'
    });
  }

  next();
};

/**
 * Sanitize input to prevent XSS attacks
 */
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove script tags and potentially dangerous content
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return typeof obj === 'string' ? sanitizeString(obj) : obj;
    }

    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    
    return sanitized;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);

  next();
};

/**
 * Validate file upload in request
 */
const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  next();
};

/**
 * Validate required fields in request body
 */
const validateRequiredFields = (fields = []) => {
  return (req, res, next) => {
    const missingFields = [];

    fields.forEach(field => {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields: missingFields
      });
    }

    next();
  };
};

module.exports = validationMiddleware;
module.exports.validateObjectId = validateObjectId;
module.exports.validateQueryParams = validateQueryParams;
module.exports.validatePagination = validatePagination;
module.exports.validateSort = validateSort;
module.exports.validateDateRange = validateDateRange;
module.exports.sanitizeInput = sanitizeInput;
module.exports.validateFileUpload = validateFileUpload;
module.exports.validateRequiredFields = validateRequiredFields;