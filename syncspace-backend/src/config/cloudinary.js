// /src/config/cloudinary.js

const cloudinary = require('cloudinary').v2;

/**
 * Initialize Cloudinary configuration
 */
const initializeCloudinary = () => {
  try {
    // Check if Cloudinary credentials are provided
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.warn('⚠️  Cloudinary credentials not configured. File uploads will use local storage.');
      return false;
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });

    console.log('✅ Cloudinary configured successfully');
    return true;
  } catch (error) {
    console.error('❌ Cloudinary configuration error:', error.message);
    return false;
  }
};

/**
 * Test Cloudinary connection
 */
const testCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    
    if (result.status === 'ok') {
      console.log('✅ Cloudinary connection test successful');
      return true;
    } else {
      console.error('❌ Cloudinary connection test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Cloudinary connection test error:', error.message);
    return false;
  }
};

/**
 * Get Cloudinary configuration status
 */
const getCloudinaryStatus = () => {
  const config = cloudinary.config();
  
  return {
    configured: !!(config.cloud_name && config.api_key && config.api_secret),
    cloudName: config.cloud_name || 'Not configured',
    apiKey: config.api_key ? '***' + config.api_key.slice(-4) : 'Not configured'
  };
};

/**
 * Set up Cloudinary folders
 */
const setupCloudinaryFolders = async () => {
  try {
    const folders = [
      'syncspace/avatars',
      'syncspace/workspaces',
      'syncspace/projects',
      'syncspace/tasks',
      'syncspace/documents',
      'syncspace/files',
      'syncspace/temp'
    ];

    console.log('📁 Setting up Cloudinary folder structure...');
    
    // Note: Folders are created automatically when uploading files
    // This is just for documentation purposes
    console.log('✅ Cloudinary folders ready:', folders.join(', '));
    
    return true;
  } catch (error) {
    console.error('❌ Error setting up Cloudinary folders:', error.message);
    return false;
  }
};

/**
 * Configure upload presets
 */
const configureUploadPresets = () => {
  // Upload presets configuration
  const presets = {
    avatar: {
      folder: 'syncspace/avatars',
      transformation: {
        width: 400,
        height: 400,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto',
        fetch_format: 'auto'
      }
    },
    document: {
      folder: 'syncspace/documents',
      resource_type: 'auto',
      max_file_size: 10485760 // 10MB
    },
    image: {
      folder: 'syncspace/files',
      transformation: {
        quality: 'auto',
        fetch_format: 'auto'
      }
    },
    file: {
      folder: 'syncspace/files',
      resource_type: 'auto',
      max_file_size: 52428800 // 50MB
    }
  };

  console.log('✅ Upload presets configured');
  return presets;
};

module.exports = {
  initializeCloudinary,
  testCloudinaryConnection,
  getCloudinaryStatus,
  setupCloudinaryFolders,
  configureUploadPresets,
  cloudinary
};