// /src/utils/cloudinaryUtils.js

const cloudinary = require('cloudinary').v2;
const fs = require('fs');

/**
 * Configure Cloudinary
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder name
 * @param {object} options - Additional options
 */
const uploadToCloudinary = async (filePath, folder = 'syncspace', options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      ...options
    });

    // Delete local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      created_at: result.created_at
    };
  } catch (error) {
    // Clean up local file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to cloud storage');
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array} files - Array of file objects with path property
 * @param {string} folder - Cloudinary folder name
 */
const uploadMultipleToCloudinary = async (files, folder = 'syncspace') => {
  try {
    const uploadPromises = files.map(file => 
      uploadToCloudinary(file.path, folder)
    );

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Multiple files upload error:', error);
    throw new Error('Failed to upload files to cloud storage');
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error('Failed to delete file from cloud storage');
    }

    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from cloud storage');
  }
};

/**
 * Delete multiple files from Cloudinary
 * @param {Array} publicIds - Array of Cloudinary public_ids
 */
const deleteMultipleFromCloudinary = async (publicIds) => {
  try {
    const deletePromises = publicIds.map(publicId => 
      deleteFromCloudinary(publicId)
    );

    const results = await Promise.all(deletePromises);
    return results;
  } catch (error) {
    console.error('Multiple files delete error:', error);
    throw new Error('Failed to delete files from cloud storage');
  }
};

/**
 * Upload image with transformation
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder name
 * @param {object} transformOptions - Transformation options
 */
const uploadImageWithTransformation = async (filePath, folder = 'syncspace', transformOptions = {}) => {
  try {
    const defaultTransformations = {
      width: 1200,
      height: 1200,
      crop: 'limit',
      quality: 'auto',
      fetch_format: 'auto'
    };

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image',
      transformation: { ...defaultTransformations, ...transformOptions }
    });

    // Delete local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    };
  } catch (error) {
    // Clean up local file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error('Cloudinary image upload error:', error);
    throw new Error('Failed to upload image to cloud storage');
  }
};

/**
 * Upload avatar/profile picture
 * @param {string} filePath - Local file path
 * @param {string} userId - User ID for folder organization
 */
const uploadAvatar = async (filePath, userId) => {
  try {
    const result = await uploadImageWithTransformation(filePath, `syncspace/avatars/${userId}`, {
      width: 400,
      height: 400,
      crop: 'fill',
      gravity: 'face'
    });

    return result;
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw new Error('Failed to upload avatar');
  }
};

/**
 * Generate signed URL for private files
 * @param {string} publicId - Cloudinary public_id
 * @param {object} options - URL generation options
 */
const generateSignedUrl = (publicId, options = {}) => {
  try {
    const url = cloudinary.url(publicId, {
      sign_url: true,
      type: 'authenticated',
      ...options
    });

    return url;
  } catch (error) {
    console.error('Signed URL generation error:', error);
    throw new Error('Failed to generate signed URL');
  }
};

/**
 * Get file info from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 */
const getFileInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'auto'
    });

    return {
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      url: result.secure_url,
      created_at: result.created_at,
      type: result.resource_type
    };
  } catch (error) {
    console.error('Get file info error:', error);
    throw new Error('Failed to get file information');
  }
};

/**
 * Search files in Cloudinary
 * @param {string} expression - Search expression
 * @param {object} options - Search options
 */
const searchFiles = async (expression, options = {}) => {
  try {
    const result = await cloudinary.search
      .expression(expression)
      .max_results(options.max_results || 30)
      .sort_by(options.sort_by || 'created_at', options.sort_order || 'desc')
      .execute();

    return result.resources;
  } catch (error) {
    console.error('Search files error:', error);
    throw new Error('Failed to search files');
  }
};

/**
 * Create archive (zip) of multiple files
 * @param {Array} publicIds - Array of public IDs to archive
 * @param {string} archiveName - Name of the archive
 */
const createArchive = async (publicIds, archiveName = 'archive') => {
  try {
    const result = await cloudinary.uploader.create_archive({
      public_ids: publicIds,
      resource_type: 'auto',
      type: 'upload',
      mode: 'download',
      target_format: 'zip',
      flatten_folders: true,
      skip_transformation_name: true,
      use_original_filename: true
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Create archive error:', error);
    throw new Error('Failed to create archive');
  }
};

/**
 * Get storage usage statistics
 */
const getStorageUsage = async () => {
  try {
    const result = await cloudinary.api.usage();

    return {
      bandwidth: result.bandwidth,
      storage: result.storage,
      requests: result.requests,
      resources: result.resources,
      credits: result.credits,
      plan: result.plan
    };
  } catch (error) {
    console.error('Get storage usage error:', error);
    throw new Error('Failed to get storage usage');
  }
};

/**
 * Optimize image URL for responsive delivery
 * @param {string} publicId - Cloudinary public_id
 * @param {object} options - Optimization options
 */
const getOptimizedImageUrl = (publicId, options = {}) => {
  try {
    const defaultOptions = {
      quality: 'auto',
      fetch_format: 'auto',
      width: 'auto',
      dpr: 'auto',
      crop: 'scale'
    };

    const url = cloudinary.url(publicId, {
      ...defaultOptions,
      ...options,
      secure: true
    });

    return url;
  } catch (error) {
    console.error('Get optimized image URL error:', error);
    throw new Error('Failed to get optimized image URL');
  }
};

/**
 * Generate thumbnail from video
 * @param {string} videoPublicId - Video public_id
 * @param {object} options - Thumbnail options
 */
const generateVideoThumbnail = (videoPublicId, options = {}) => {
  try {
    const defaultOptions = {
      resource_type: 'video',
      format: 'jpg',
      width: 300,
      height: 200,
      crop: 'fill',
      start_offset: 'auto'
    };

    const url = cloudinary.url(videoPublicId, {
      ...defaultOptions,
      ...options,
      secure: true
    });

    return url;
  } catch (error) {
    console.error('Generate video thumbnail error:', error);
    throw new Error('Failed to generate video thumbnail');
  }
};

module.exports = {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  uploadImageWithTransformation,
  uploadAvatar,
  generateSignedUrl,
  getFileInfo,
  searchFiles,
  createArchive,
  getStorageUsage,
  getOptimizedImageUrl,
  generateVideoThumbnail,
  cloudinary
};