// /tests/task.test.js

/**
 * Task Tests
 * 
 * Tests for task CRUD operations, Kanban board functionality, and assignments
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Workspace = require('../src/models/Workspace');
const Project = require('../src/models/Project');
const Task = require('../src/models/Task');

let authToken;
let userId;
let workspaceId;
let projectId;
let taskId;

// Test database connection
beforeAll(async () => {
  try {
    const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/syncspace-test';
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    // Create and login a test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'task-test@example.com',
        password: 'Test@1234',
        confirmPassword: 'Test@1234'
      });

    if (registerResponse.status === 201 && registerResponse.body.success) {
      authToken = registerResponse.body.token;
      userId = registerResponse.body.data._id;
    } else {
      throw new Error('Failed to create test user');
    }

    // Create workspace
    const workspaceResponse = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Workspace',
        description: 'Workspace for task testing'
      });

    if (workspaceResponse.status === 201 && workspaceResponse.body.success) {
      workspaceId = workspaceResponse.body.data._id;
    } else {
      throw new Error('Failed to create test workspace');
    }

    // Create project
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Project',
        description: 'Project for task testing',
        workspaceId: workspaceId
      });

    if (projectResponse.status === 201 && projectResponse.body.success) {
      projectId = projectResponse.body.data._id;
    } else {
      throw new Error('Failed to create test project');
    }
  } catch (error) {
    console.error('Test setup error:', error);
    throw error;
  }
});

// Clean up tasks after each test
afterEach(async () => {
  try {
    await Task.deleteMany({});
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});

// Close database connection after all tests
afterAll(async () => {
  try {
    await Task.deleteMany({});
    await Project.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  } catch (error) {
    console.error('Teardown error:', error);
  }
});

describe('Task API', () => {

  describe('POST /api/tasks', () => {
    it('should create a new task with valid data', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'A task for testing',
        projectId: projectId,
        status: 'todo',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('title', taskData.title);
      expect(response.body.data).toHaveProperty('status', taskData.status);
      expect(response.body.data).toHaveProperty('priority', taskData.priority);

      taskId = response.body.data._id;
    });

    it('should fail to create task without authentication', async () => {
      const taskData = {
        title: 'Test Task',
        projectId: projectId
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail to create task with short title', async () => {
      const taskData = {
        title: 'T', // Too short (less than 2 characters)
        projectId: projectId
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail to create task without projectId', async () => {
      const taskData = {
        title: 'Test Task Without Project'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should create task with default status and priority', async () => {
      const taskData = {
        title: 'Task with Defaults',
        projectId: projectId
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('priority');
    });
  });

  describe('GET /api/tasks/:id', () => {
    beforeEach(async () => {
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task for Get',
          description: 'A task for testing GET',
          projectId: projectId
        });

      if (taskResponse.body.success) {
        taskId = taskResponse.body.data._id;
      }
    });

    it('should get task by ID', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('_id', taskId);
      expect(response.body.data).toHaveProperty('title', 'Test Task for Get');
    });

    it('should fail to get task without authentication', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 for invalid task ID format', async () => {
      const response = await request(app)
        .get('/api/tasks/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    beforeEach(async () => {
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Original Task',
          description: 'Original description',
          projectId: projectId
        });

      if (taskResponse.body.success) {
        taskId = taskResponse.body.data._id;
      }
    });

    it('should update task with valid data', async () => {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('title', updateData.title);
      expect(response.body.data).toHaveProperty('description', updateData.description);
      expect(response.body.data).toHaveProperty('priority', updateData.priority);
    });

    it('should fail to update with invalid priority', async () => {
      const updateData = {
        priority: 'invalid-priority'
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should partially update task', async () => {
      const updateData = {
        priority: 'urgent'
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('priority', 'urgent');
      expect(response.body.data).toHaveProperty('title', 'Original Task'); // Should remain unchanged
    });
  });

  describe('PATCH /api/tasks/:id/status', () => {
    beforeEach(async () => {
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Status Test Task',
          projectId: projectId,
          status: 'todo'
        });

      if (taskResponse.body.success) {
        taskId = taskResponse.body.data._id;
      }
    });

    it('should update task status', async () => {
      const statusData = {
        status: 'in-progress'
      };

      const response = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', statusData.status);
    });

    it('should fail to update with invalid status', async () => {
      const statusData = {
        status: 'invalid-status'
      };

      const response = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should accept all valid status values', async () => {
      const validStatuses = ['todo', 'in-progress', 'review', 'done', 'backlog'];

      for (const status of validStatuses) {
        const response = await request(app)
          .patch(`/api/tasks/${taskId}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status })
          .expect('Content-Type', /json/);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('status', status);
      }
    });
  });

  describe('PATCH /api/tasks/:id/priority', () => {
    beforeEach(async () => {
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Priority Test Task',
          projectId: projectId,
          priority: 'low'
        });

      if (taskResponse.body.success) {
        taskId = taskResponse.body.data._id;
      }
    });

    it('should update task priority', async () => {
      const priorityData = {
        priority: 'urgent'
      };

      const response = await request(app)
        .patch(`/api/tasks/${taskId}/priority`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(priorityData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('priority', priorityData.priority);
    });

    it('should accept all valid priority values', async () => {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];

      for (const priority of validPriorities) {
        const response = await request(app)
          .patch(`/api/tasks/${taskId}/priority`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ priority })
          .expect('Content-Type', /json/);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('priority', priority);
      }
    });
  });

  describe('PATCH /api/tasks/:id/assign', () => {
    beforeEach(async () => {
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Assignment Test Task',
          projectId: projectId
        });

      if (taskResponse.body.success) {
        taskId = taskResponse.body.data._id;
      }
    });

    it('should assign task to user', async () => {
      const assignData = {
        userId: userId
      };

      const response = await request(app)
        .patch(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should fail to assign with invalid user ID', async () => {
      const assignData = {
        userId: 'invalid-user-id'
      };

      const response = await request(app)
        .patch(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/tasks/:id/comments', () => {
    beforeEach(async () => {
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Comment Test Task',
          projectId: projectId
        });

      if (taskResponse.body.success) {
        taskId = taskResponse.body.data._id;
      }
    });

    it('should add comment to task', async () => {
      const commentData = {
        content: 'This is a test comment with sufficient length'
      };

      const response = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should fail to add empty comment', async () => {
      const commentData = {
        content: ''
      };

      const response = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail to add comment without content', async () => {
      const response = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/tasks/:id/subtasks', () => {
    beforeEach(async () => {
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Subtask Test Task',
          projectId: projectId
        });

      if (taskResponse.body.success) {
        taskId = taskResponse.body.data._id;
      }
    });

    it('should add subtask to task', async () => {
      const subtaskData = {
        title: 'Test Subtask',
        completed: false
      };

      const response = await request(app)
        .post(`/api/tasks/${taskId}/subtasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(subtaskData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.subtasks).toBeDefined();
      expect(Array.isArray(response.body.data.subtasks)).toBe(true);
    });

    it('should fail to add subtask without title', async () => {
      const subtaskData = {
        completed: false
      };

      const response = await request(app)
        .post(`/api/tasks/${taskId}/subtasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(subtaskData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    beforeEach(async () => {
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Delete Test Task',
          projectId: projectId
        });

      if (taskResponse.body.success) {
        taskId = taskResponse.body.data._id;
      }
    });

    it('should delete task successfully', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);

      // Verify task is deleted
      const getResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should fail to delete task without authentication', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 404 when deleting non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PATCH /api/tasks/:id/move', () => {
    beforeEach(async () => {
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Move Test Task',
          projectId: projectId,
          status: 'todo',
          position: 0
        });

      if (taskResponse.body.success) {
        taskId = taskResponse.body.data._id;
      }
    });

    it('should move task to different status', async () => {
      const moveData = {
        fromStatus: 'todo',
        toStatus: 'in-progress',
        position: 0
      };

      const response = await request(app)
        .patch(`/api/tasks/${taskId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(moveData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', moveData.toStatus);
    });

    it('should fail to move with invalid status', async () => {
      const moveData = {
        fromStatus: 'todo',
        toStatus: 'invalid-status',
        position: 0
      };

      const response = await request(app)
        .patch(`/api/tasks/${taskId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(moveData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail to move without required fields', async () => {
      const moveData = {
        toStatus: 'in-progress'
        // Missing fromStatus and position
      };

      const response = await request(app)
        .patch(`/api/tasks/${taskId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(moveData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create multiple tasks for testing
      const tasks = [
        { title: 'Task 1', projectId: projectId, status: 'todo', priority: 'high' },
        { title: 'Task 2', projectId: projectId, status: 'in-progress', priority: 'medium' },
        { title: 'Task 3', projectId: projectId, status: 'done', priority: 'low' }
      ];

      for (const task of tasks) {
        await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(task);
      }
    });

    it('should get all tasks for authenticated user', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=todo')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        response.body.data.forEach(task => {
          expect(task.status).toBe('todo');
        });
      }
    });

    it('should filter tasks by priority', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=high')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      
      if (response.body.data.length > 0) {
        response.body.data.forEach(task => {
          expect(task.priority).toBe('high');
        });
      }
    });

    it('should filter tasks by project', async () => {
      const response = await request(app)
        .get(`/api/tasks?projectId=${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail to get tasks without authentication', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return empty array when no tasks match filter', async () => {
      const response = await request(app)
        .get('/api/tasks?status=backlog')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});