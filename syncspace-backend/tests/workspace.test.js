// /tests/workspace.test.js

/**
 * Workspace Tests
 * 
 * Tests for workspace CRUD operations, member management, and permissions
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Workspace = require('../src/models/Workspace');

let authToken;
let userId;
let workspaceId;

// Test database connection
beforeAll(async () => {
  const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/syncspace-test';
  await mongoose.connect(testDbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Create and login a test user
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'workspace-test@example.com',
      password: 'Test@1234',
      confirmPassword: 'Test@1234'
    });

  authToken = registerResponse.body.token;
  userId = registerResponse.body.data._id;
});

// Clean up database after each test
afterEach(async () => {
  await Workspace.deleteMany({});
});

// Close database connection after all tests
afterAll(async () => {
  await User.deleteMany({});
  await Workspace.deleteMany({});
  await mongoose.connection.close();
});

describe('Workspace API', () => {

  describe('POST /api/workspaces', () => {
    it('should create a new workspace with valid data', async () => {
      const workspaceData = {
        name: 'Test Workspace',
        description: 'A workspace for testing',
        type: 'team'
      };

      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workspaceData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', workspaceData.name);
      expect(response.body.data).toHaveProperty('description', workspaceData.description);
      expect(response.body.data.owner).toBe(userId);

      workspaceId = response.body.data._id;
    });

    it('should fail to create workspace without authentication', async () => {
      const workspaceData = {
        name: 'Test Workspace',
        description: 'A workspace for testing'
      };

      const response = await request(app)
        .post('/api/workspaces')
        .send(workspaceData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail to create workspace with invalid name', async () => {
      const workspaceData = {
        name: 'T', // Too short
        description: 'A workspace for testing'
      };

      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workspaceData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/workspaces', () => {
    beforeEach(async () => {
      // Create a workspace for testing
      const workspaceResponse = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Workspace',
          description: 'A workspace for testing'
        });

      workspaceId = workspaceResponse.body.data._id;
    });

    it('should get all workspaces for authenticated user', async () => {
      const response = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should fail to get workspaces without authentication', async () => {
      const response = await request(app)
        .get('/api/workspaces')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/workspaces/:id', () => {
    beforeEach(async () => {
      const workspaceResponse = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Workspace',
          description: 'A workspace for testing'
        });

      workspaceId = workspaceResponse.body.data._id;
    });

    it('should get workspace by ID', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('_id', workspaceId);
    });

    it('should fail to get non-existent workspace', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/workspaces/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/workspaces/:id', () => {
    beforeEach(async () => {
      const workspaceResponse = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Workspace',
          description: 'A workspace for testing'
        });

      workspaceId = workspaceResponse.body.data._id;
    });

    it('should update workspace with valid data', async () => {
      const updateData = {
        name: 'Updated Workspace',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', updateData.name);
      expect(response.body.data).toHaveProperty('description', updateData.description);
    });

    it('should fail to update workspace with invalid name', async () => {
      const updateData = {
        name: '' // Empty name
      };

      const response = await request(app)
        .put(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/workspaces/:id', () => {
    beforeEach(async () => {
      const workspaceResponse = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Workspace',
          description: 'A workspace for testing'
        });

      workspaceId = workspaceResponse.body.data._id;
    });

    it('should delete workspace by owner', async () => {
      const response = await request(app)
        .delete(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify workspace is deleted
      const getResponse = await request(app)
        .get(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/workspaces/:id/members', () => {
    let secondUserId;
    let secondAuthToken;

    beforeEach(async () => {
      // Create workspace
      const workspaceResponse = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Workspace',
          description: 'A workspace for testing'
        });

      workspaceId = workspaceResponse.body.data._id;

      // Create second user
      const secondUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: 'second-user@example.com',
          password: 'Test@1234',
          confirmPassword: 'Test@1234'
        });

      secondUserId = secondUserResponse.body.data._id;
      secondAuthToken = secondUserResponse.body.token;
    });

    it('should add member to workspace', async () => {
      const memberData = {
        userId: secondUserId,
        role: 'member'
      };

      const response = await request(app)
        .post(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(memberData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should fail to add member without permission', async () => {
      const memberData = {
        userId: secondUserId,
        role: 'member'
      };

      // Try to add member using second user's token (not owner/admin)
      const response = await request(app)
        .post(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send(memberData)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});

// Note: Add to package.json devDependencies:
// "jest": "^29.7.0",
// "supertest": "^6.3.3"