// /src/controllers/fileController.js

const File = require('../models/File');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Upload a file
 * @route   POST /api/files/upload
 * @access  Private
 */
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileData = {
      name: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.user.id
    };

    // Add optional fields if provided
    if (req.body.workspaceId) fileData.workspace = req.body.workspaceId;
    if (req.body.projectId) fileData.project = req.body.projectId;
    if (req.body.taskId) fileData.task = req.body.taskId;
    if (req.body.description) fileData.description = req.body.description;

    const file = await File.create(fileData);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: file
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload multiple files
 * @route   POST /api/files/upload-multiple
 * @access  Private
 */
exports.uploadMultipleFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const filesData = req.files.map(file => ({
      name: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedBy: req.user.id,
      workspace: req.body.workspaceId,
      project: req.body.projectId,
      task: req.body.taskId
    }));

    const files = await File.insertMany(filesData);

    res.status(201).json({
      success: true,
      message: `${files.length} files uploaded successfully`,
      data: files
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get file by ID
 * @route   GET /api/files/:id
 * @access  Private
 */
exports.getFileById = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('uploadedBy', 'name email');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.status(200).json({
      success: true,
      data: file
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download file
 * @route   GET /api/files/:id/download
 * @access  Private
 */
exports.downloadFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    res.download(file.path, file.name);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete file
 * @route   DELETE /api/files/:id
 * @access  Private
 */
exports.deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if user is authorized to delete
    if (file.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this file'
      });
    }

    // Delete file from disk
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    await file.deleteOne();

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get workspace files
 * @route   GET /api/files/workspace/:workspaceId
 * @access  Private
 */
exports.getWorkspaceFiles = async (req, res, next) => {
  try {
    const files = await File.find({ workspace: req.params.workspaceId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get project files
 * @route   GET /api/files/project/:projectId
 * @access  Private
 */
exports.getProjectFiles = async (req, res, next) => {
  try {
    const files = await File.find({ project: req.params.projectId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task files
 * @route   GET /api/files/task/:taskId
 * @access  Private
 */
exports.getTaskFiles = async (req, res, next) => {
  try {
    const files = await File.find({ task: req.params.taskId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update file metadata
 * @route   PATCH /api/files/:id
 * @access  Private
 */
exports.updateFileMetadata = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check authorization
    if (file.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this file'
      });
    }

    const { name, description } = req.body;

    if (name) file.name = name;
    if (description !== undefined) file.description = description;

    await file.save();

    res.status(200).json({
      success: true,
      message: 'File metadata updated successfully',
      data: file
    });
  } catch (error) {
    next(error);
  }
};

// Export functions that might be missing
exports.getDocumentFiles = async (req, res, next) => {
  try {
    const files = await File.find({ document: req.params.documentId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (error) {
    next(error);
  }
};

exports.shareFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'File share functionality - to be implemented',
      data: file
    });
  } catch (error) {
    next(error);
  }
};

exports.getFilePreview = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'File preview functionality - to be implemented',
      data: file
    });
  } catch (error) {
    next(error);
  }
};

exports.moveFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'File move functionality - to be implemented',
      data: file
    });
  } catch (error) {
    next(error);
  }
};

exports.copyFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'File copy functionality - to be implemented',
      data: file
    });
  } catch (error) {
    next(error);
  }
};

exports.searchFiles = async (req, res, next) => {
  try {
    const { query } = req.query;

    const files = await File.find({
      name: { $regex: query, $options: 'i' }
    })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecentFiles = async (req, res, next) => {
  try {
    const files = await File.find({ uploadedBy: req.user.id })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (error) {
    next(error);
  }
};