// /src/controllers/userController.js

const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Notification = require('../models/Notification');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUtils');

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;

    const query = {};

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const users = await User.find(query)
      .select('-password -refreshToken')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search users by name or email
 * @route   GET /api/users/search
 * @access  Private
 */
exports.searchUsers = async (req, res, next) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
      .select('name email avatar role status')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/:id
 * @access  Private
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, bio, phone, timezone, avatar } = req.body;

    // Check if user is updating their own profile or is admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (phone) updateData.phone = phone;
    if (timezone) updateData.timezone = timezone;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user's avatar from cloud storage if exists
    if (user.avatar && user.avatar.public_id) {
      await deleteFromCloudinary(user.avatar.public_id);
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload user avatar
 * @route   POST /api/users/:id/upload-avatar
 * @access  Private
 */
exports.uploadAvatar = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user is updating their own avatar
    if (req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user avatar'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old avatar if exists
    if (user.avatar && user.avatar.public_id) {
      await deleteFromCloudinary(user.avatar.public_id);
    }

    // Upload new avatar to cloudinary
    const result = await uploadToCloudinary(req.file.path, 'avatars');

    user.avatar = {
      public_id: result.public_id,
      url: result.secure_url
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all workspaces for a user
 * @route   GET /api/users/:id/workspaces
 * @access  Private
 */
exports.getUserWorkspaces = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check authorization
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these workspaces'
      });
    }

    const workspaces = await Workspace.find({
      'members.user': id
    }).populate('owner', 'name email avatar');

    res.status(200).json({
      success: true,
      data: workspaces
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user notifications
 * @route   GET /api/users/:id/notifications
 * @access  Private
 */
exports.getUserNotifications = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    // Check authorization
    if (req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these notifications'
      });
    }

    const query = { recipient: id };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name email avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: notifications,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalNotifications: count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user online status
 * @route   PATCH /api/users/:id/status
 * @access  Private
 */
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check authorization
    if (req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user status'
      });
    }

    const validStatuses = ['online', 'offline', 'away', 'busy'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { 
        status,
        lastActive: Date.now()
      },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: {
        status: user.status,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user activity history
 * @route   GET /api/users/:id/activity
 * @access  Private
 */
exports.getUserActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, days = 7 } = req.query;

    // Check authorization
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this activity'
      });
    }

    const user = await User.findById(id).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate date range
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));

    // Get activity data (this would need an Activity model in production)
    // For now, returning user's last active information
    const activityData = {
      lastActive: user.lastActive,
      status: user.status,
      recentActivity: [] // Would populate from Activity model
    };

    res.status(200).json({
      success: true,
      data: activityData
    });
  } catch (error) {
    next(error);
  }
};