// /tests/setup.js

/**
 * Test Setup and Configuration
 * 
 * Global test setup, teardown, and helper functions
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Connect to in-memory MongoDB for testing
 */
const connectDatabase = async () => {
  try {
    // Use MongoDB Memory Server for isolated testing
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test database connection error:', error);
    process.exit(1);
  }
};

/**
 * Disconnect and cleanup database
 */
const disconnectDatabase = async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('✅ Test database disconnected');
  } catch (error) {
    console.error('❌ Test database disconnect error:', error);
    process.exit(1);
  }
};

/**
 * Clear all collections
 */
const clearDatabase = async () => {
  try {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }

    console.log('✅ Test database cleared');
  } catch (error) {
    console.error('❌ Clear database error:', error);
  }
};

/**
 * Helper function to create test user
 */
const createTestUser = async (userData = {}) => {
  const User = require('../src/models/User');
  const bcrypt = require('bcryptjs');

  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test@1234',
    role: 'user',
    emailVerified: true
  };

  const user = await User.create({
    ...defaultUser,
    ...userData,
    password: await bcrypt.hash(userData.password || defaultUser.password, 10)
  });

  return user;
};

/**
 * Helper function to generate JWT token for testing
 */
const generateTestToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1d'
  });
};

/**
 * Helper function to create test workspace
 */
const createTestWorkspace = async (ownerId, workspaceData = {}) => {
  const Workspace = require('../src/models/Workspace');

  const defaultWorkspace = {
    name: 'Test Workspace',
    description: 'A workspace for testing',
    owner: ownerId,
    members: [
      {
        user: ownerId,
        role: 'owner',
        joinedAt: new Date()
      }
    ]
  };

  const workspace = await Workspace.create({
    ...defaultWorkspace,
    ...workspaceData
  });

  return workspace;
};

/**
 * Helper function to create test project
 */
const createTestProject = async (workspaceId, creatorId, projectData = {}) => {
  const Project = require('../src/models/Project');

  const defaultProject = {
    name: 'Test Project',
    description: 'A project for testing',
    workspace: workspaceId,
    owner: creatorId,
    members: [
      {
        user: creatorId,
        role: 'owner',
        joinedAt: new Date()
      }
    ],
    status: 'active'
  };

  const project = await Project.create({
    ...defaultProject,
    ...projectData
  });

  return project;
};

/**
 * Helper function to create test task
 */
const createTestTask = async (projectId, creatorId, taskData = {}) => {
  const Task = require('../src/models/Task');

  const defaultTask = {
    title: 'Test Task',
    description: 'A task for testing',
    project: projectId,
    createdBy: creatorId,
    status: 'todo',
    priority: 'medium'
  };

  const task = await Task.create({
    ...defaultTask,
    ...taskData
  });

  return task;
};

/**
 * Helper function to create test document
 */
const createTestDocument = async (ownerId, documentData = {}) => {
  const Document = require('../src/models/Document');

  const defaultDocument = {
    title: 'Test Document',
    content: 'This is test content',
    owner: ownerId,
    type: 'text'
  };

  const document = await Document.create({
    ...defaultDocument,
    ...documentData
  });

  return document;
};

/**
 * Helper function to wait for async operations
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock email service for testing
 */
const mockEmailService = () => {
  jest.mock('../src/utils/emailUtils', () => ({
    sendEmail: jest.fn().mockResolvedValue({ success: true }),
    sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
    sendWorkspaceInvitationEmail: jest.fn().mockResolvedValue({ success: true }),
    sendTaskAssignmentEmail: jest.fn().mockResolvedValue({ success: true })
  }));
};

/**
 * Mock Cloudinary service for testing
 */
const mockCloudinaryService = () => {
  jest.mock('../src/utils/cloudinaryUtils', () => ({
    uploadToCloudinary: jest.fn().mockResolvedValue({
      public_id: 'test-public-id',
      url: 'https://test-url.com/image.jpg',
      format: 'jpg',
      bytes: 12345
    }),
    deleteFromCloudinary: jest.fn().mockResolvedValue({ result: 'ok' })
  }));
};

// Global setup before all tests
beforeAll(async () => {
  await connectDatabase();
});

// Global teardown after all tests
afterAll(async () => {
  await disconnectDatabase();
});

// Clear database before each test
beforeEach(async () => {
  await clearDatabase();
});

module.exports = {
  connectDatabase,
  disconnectDatabase,
  clearDatabase,
  createTestUser,
  generateTestToken,
  createTestWorkspace,
  createTestProject,
  createTestTask,
  createTestDocument,
  wait,
  mockEmailService,
  mockCloudinaryService
};