// /src/socket/kanbanSocket.js

const Task = require('../models/Task');
const Project = require('../models/Project');

/**
 * Kanban board real-time updates socket handler
 */
const kanbanSocket = (io, socket) => {

  /**
   * Join a project's Kanban board
   */
  socket.on('kanban:join', async (data) => {
    try {
      const { projectId } = data;

      // Verify user has access to project
      const project = await Project.findById(projectId);
      if (!project) {
        return socket.emit('kanban:error', { message: 'Project not found' });
      }

      const isMember = project.members.some(m => m.user.toString() === socket.userId);
      if (!isMember) {
        return socket.emit('kanban:error', { message: 'Access denied to project Kanban board' });
      }

      socket.join(`kanban:${projectId}`);

      socket.emit('kanban:joined', {
        projectId,
        timestamp: new Date()
      });

      // Notify others that user joined the board
      socket.to(`kanban:${projectId}`).emit('kanban:user:joined', {
        userId: socket.userId,
        userName: socket.user.name,
        projectId,
        timestamp: new Date()
      });

      console.log(`User ${socket.userId} joined Kanban board for project ${projectId}`);
    } catch (error) {
      console.error('Error joining Kanban board:', error);
      socket.emit('kanban:error', { message: 'Failed to join Kanban board' });
    }
  });

  /**
   * Leave a Kanban board
   */
  socket.on('kanban:leave', (data) => {
    try {
      const { projectId } = data;

      socket.leave(`kanban:${projectId}`);

      socket.to(`kanban:${projectId}`).emit('kanban:user:left', {
        userId: socket.userId,
        projectId,
        timestamp: new Date()
      });

      console.log(`User ${socket.userId} left Kanban board for project ${projectId}`);
    } catch (error) {
      console.error('Error leaving Kanban board:', error);
    }
  });

  /**
   * Create a new task
   */
  socket.on('kanban:task:create', async (data) => {
    try {
      const { projectId, taskData } = data;

      // Verify project access
      const project = await Project.findById(projectId);
      if (!project) {
        return socket.emit('kanban:error', { message: 'Project not found' });
      }

      const isMember = project.members.some(m => m.user.toString() === socket.userId);
      if (!isMember) {
        return socket.emit('kanban:error', { message: 'Access denied' });
      }

      // Create task
      const task = await Task.create({
        ...taskData,
        project: projectId,
        createdBy: socket.userId
      });

      await task.populate('createdBy assignedTo', 'name email avatar');

      // Broadcast new task to all users on the board
      io.to(`kanban:${projectId}`).emit('kanban:task:created', {
        task,
        projectId,
        createdBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`Task created by ${socket.userId} in project ${projectId}`);
    } catch (error) {
      console.error('Error creating task:', error);
      socket.emit('kanban:error', { message: 'Failed to create task' });
    }
  });

  /**
   * Update a task
   */
  socket.on('kanban:task:update', async (data) => {
    try {
      const { taskId, projectId, updates } = data;

      const task = await Task.findById(taskId);
      if (!task) {
        return socket.emit('kanban:error', { message: 'Task not found' });
      }

      // Update task fields
      Object.keys(updates).forEach(key => {
        task[key] = updates[key];
      });

      task.updatedBy = socket.userId;
      task.updatedAt = new Date();
      await task.save();

      await task.populate('createdBy assignedTo updatedBy', 'name email avatar');

      // Broadcast task update
      io.to(`kanban:${projectId}`).emit('kanban:task:updated', {
        task,
        projectId,
        updatedBy: socket.user.name,
        updates,
        timestamp: new Date()
      });

      console.log(`Task ${taskId} updated by ${socket.userId}`);
    } catch (error) {
      console.error('Error updating task:', error);
      socket.emit('kanban:error', { message: 'Failed to update task' });
    }
  });

  /**
   * Move task to different column (status change)
   */
  socket.on('kanban:task:move', async (data) => {
    try {
      const { taskId, projectId, fromStatus, toStatus, position } = data;

      const task = await Task.findById(taskId);
      if (!task) {
        return socket.emit('kanban:error', { message: 'Task not found' });
      }

      // Update task status and position
      const oldStatus = task.status;
      task.status = toStatus;
      task.position = position;
      task.updatedBy = socket.userId;
      task.updatedAt = new Date();

      await task.save();
      await task.populate('createdBy assignedTo', 'name email avatar');

      // Broadcast task move to all users on the board
      io.to(`kanban:${projectId}`).emit('kanban:task:moved', {
        task,
        projectId,
        fromStatus: oldStatus,
        toStatus,
        position,
        movedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`Task ${taskId} moved from ${fromStatus} to ${toStatus} by ${socket.userId}`);
    } catch (error) {
      console.error('Error moving task:', error);
      socket.emit('kanban:error', { message: 'Failed to move task' });
    }
  });

  /**
   * Delete a task
   */
  socket.on('kanban:task:delete', async (data) => {
    try {
      const { taskId, projectId } = data;

      const task = await Task.findById(taskId);
      if (!task) {
        return socket.emit('kanban:error', { message: 'Task not found' });
      }

      // Check if user has permission (task creator or project admin)
      const project = await Project.findById(projectId);
      const isProjectAdmin = project.members.find(
        m => m.user.toString() === socket.userId && ['owner', 'admin'].includes(m.role)
      );
      const isTaskCreator = task.createdBy.toString() === socket.userId;

      if (!isProjectAdmin && !isTaskCreator) {
        return socket.emit('kanban:error', { message: 'Not authorized to delete this task' });
      }

      await task.deleteOne();

      // Broadcast task deletion
      io.to(`kanban:${projectId}`).emit('kanban:task:deleted', {
        taskId,
        projectId,
        deletedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`Task ${taskId} deleted by ${socket.userId}`);
    } catch (error) {
      console.error('Error deleting task:', error);
      socket.emit('kanban:error', { message: 'Failed to delete task' });
    }
  });

  /**
   * Assign task to user
   */
  socket.on('kanban:task:assign', async (data) => {
    try {
      const { taskId, projectId, userId } = data;

      const task = await Task.findById(taskId);
      if (!task) {
        return socket.emit('kanban:error', { message: 'Task not found' });
      }

      // Add user to assignedTo array if not already assigned
      if (!task.assignedTo) {
        task.assignedTo = [];
      }

      const alreadyAssigned = task.assignedTo.some(u => u.toString() === userId);
      if (!alreadyAssigned) {
        task.assignedTo.push(userId);
        task.updatedAt = new Date();
        await task.save();
      }

      await task.populate('assignedTo', 'name email avatar');

      // Broadcast task assignment
      io.to(`kanban:${projectId}`).emit('kanban:task:assigned', {
        taskId,
        projectId,
        assignedTo: userId,
        assignedBy: socket.user.name,
        task,
        timestamp: new Date()
      });

      // Notify the assigned user
      io.to(`user:${userId}`).emit('kanban:task:assigned:notify', {
        task,
        assignedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`Task ${taskId} assigned to user ${userId} by ${socket.userId}`);
    } catch (error) {
      console.error('Error assigning task:', error);
      socket.emit('kanban:error', { message: 'Failed to assign task' });
    }
  });

  /**
   * Unassign user from task
   */
  socket.on('kanban:task:unassign', async (data) => {
    try {
      const { taskId, projectId, userId } = data;

      const task = await Task.findById(taskId);
      if (!task) {
        return socket.emit('kanban:error', { message: 'Task not found' });
      }

      // Remove user from assignedTo array
      if (task.assignedTo) {
        task.assignedTo = task.assignedTo.filter(u => u.toString() !== userId);
        task.updatedAt = new Date();
        await task.save();
      }

      await task.populate('assignedTo', 'name email avatar');

      // Broadcast task unassignment
      io.to(`kanban:${projectId}`).emit('kanban:task:unassigned', {
        taskId,
        projectId,
        unassignedUser: userId,
        unassignedBy: socket.user.name,
        task,
        timestamp: new Date()
      });

      console.log(`User ${userId} unassigned from task ${taskId} by ${socket.userId}`);
    } catch (error) {
      console.error('Error unassigning task:', error);
      socket.emit('kanban:error', { message: 'Failed to unassign task' });
    }
  });

  /**
   * Update task priority
   */
  socket.on('kanban:task:priority', async (data) => {
    try {
      const { taskId, projectId, priority } = data;

      const task = await Task.findById(taskId);
      if (!task) {
        return socket.emit('kanban:error', { message: 'Task not found' });
      }

      const oldPriority = task.priority;
      task.priority = priority;
      task.updatedAt = new Date();
      await task.save();

      await task.populate('createdBy assignedTo', 'name email avatar');

      // Broadcast priority change
      io.to(`kanban:${projectId}`).emit('kanban:task:priority:changed', {
        taskId,
        projectId,
        oldPriority,
        newPriority: priority,
        changedBy: socket.user.name,
        task,
        timestamp: new Date()
      });

      console.log(`Task ${taskId} priority changed to ${priority} by ${socket.userId}`);
    } catch (error) {
      console.error('Error updating task priority:', error);
      socket.emit('kanban:error', { message: 'Failed to update task priority' });
    }
  });

  /**
   * Add comment to task
   */
  socket.on('kanban:task:comment', async (data) => {
    try {
      const { taskId, projectId, content, mentions } = data;

      const task = await Task.findById(taskId);
      if (!task) {
        return socket.emit('kanban:error', { message: 'Task not found' });
      }

      const comment = {
        user: socket.userId,
        content,
        mentions: mentions || [],
        createdAt: new Date()
      };

      if (!task.comments) {
        task.comments = [];
      }

      task.comments.push(comment);
      await task.save();

      // Populate comment user info
      const populatedComment = {
        ...comment,
        user: {
          _id: socket.userId,
          name: socket.user.name,
          avatar: socket.user.avatar
        }
      };

      // Broadcast new comment
      io.to(`kanban:${projectId}`).emit('kanban:task:comment:added', {
        taskId,
        projectId,
        comment: populatedComment,
        timestamp: new Date()
      });

      // Notify mentioned users
      if (mentions && mentions.length > 0) {
        for (const mentionedUserId of mentions) {
          io.to(`user:${mentionedUserId}`).emit('kanban:task:mention', {
            task,
            comment: populatedComment,
            mentionedBy: socket.user.name,
            timestamp: new Date()
          });
        }
      }

      console.log(`Comment added to task ${taskId} by ${socket.userId}`);
    } catch (error) {
      console.error('Error adding comment:', error);
      socket.emit('kanban:error', { message: 'Failed to add comment' });
    }
  });

  /**
   * Update task progress
   */
  socket.on('kanban:task:progress', async (data) => {
    try {
      const { taskId, projectId, progress } = data;

      const task = await Task.findById(taskId);
      if (!task) {
        return socket.emit('kanban:error', { message: 'Task not found' });
      }

      const oldProgress = task.progress || 0;
      task.progress = progress;
      task.updatedAt = new Date();
      await task.save();

      await task.populate('createdBy assignedTo', 'name email avatar');

      // Broadcast progress update
      io.to(`kanban:${projectId}`).emit('kanban:task:progress:updated', {
        taskId,
        projectId,
        oldProgress,
        newProgress: progress,
        updatedBy: socket.user.name,
        task,
        timestamp: new Date()
      });

      console.log(`Task ${taskId} progress updated to ${progress}% by ${socket.userId}`);
    } catch (error) {
      console.error('Error updating task progress:', error);
      socket.emit('kanban:error', { message: 'Failed to update task progress' });
    }
  });

  /**
   * Add subtask
   */
  socket.on('kanban:task:subtask:add', async (data) => {
    try {
      const { taskId, projectId, subtask } = data;

      const task = await Task.findById(taskId);
      if (!task) {
        return socket.emit('kanban:error', { message: 'Task not found' });
      }

      if (!task.subtasks) {
        task.subtasks = [];
      }

      const newSubtask = {
        ...subtask,
        createdBy: socket.userId,
        createdAt: new Date()
      };

      task.subtasks.push(newSubtask);
      task.updatedAt = new Date();
      await task.save();

      // Broadcast subtask addition
      io.to(`kanban:${projectId}`).emit('kanban:task:subtask:added', {
        taskId,
        projectId,
        subtask: newSubtask,
        addedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`Subtask added to task ${taskId} by ${socket.userId}`);
    } catch (error) {
      console.error('Error adding subtask:', error);
      socket.emit('kanban:error', { message: 'Failed to add subtask' });
    }
  });

  /**
   * Update subtask
   */
  socket.on('kanban:task:subtask:update', async (data) => {
    try {
      const { taskId, projectId, subtaskId, updates } = data;

      const task = await Task.findById(taskId);
      if (!task) {
        return socket.emit('kanban:error', { message: 'Task not found' });
      }

      const subtask = task.subtasks.id(subtaskId);
      if (!subtask) {
        return socket.emit('kanban:error', { message: 'Subtask not found' });
      }

      // Update subtask fields
      Object.keys(updates).forEach(key => {
        subtask[key] = updates[key];
      });

      subtask.updatedAt = new Date();
      task.updatedAt = new Date();
      await task.save();

      // Broadcast subtask update
      io.to(`kanban:${projectId}`).emit('kanban:task:subtask:updated', {
        taskId,
        projectId,
        subtaskId,
        subtask,
        updatedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`Subtask ${subtaskId} updated by ${socket.userId}`);
    } catch (error) {
      console.error('Error updating subtask:', error);
      socket.emit('kanban:error', { message: 'Failed to update subtask' });
    }
  });

  /**
   * Delete subtask
   */
  socket.on('kanban:task:subtask:delete', async (data) => {
    try {
      const { taskId, projectId, subtaskId } = data;

      const task = await Task.findById(taskId);
      if (!task) {
        return socket.emit('kanban:error', { message: 'Task not found' });
      }

      // Remove subtask
      task.subtasks = task.subtasks.filter(st => st._id.toString() !== subtaskId);
      task.updatedAt = new Date();
      await task.save();

      // Broadcast subtask deletion
      io.to(`kanban:${projectId}`).emit('kanban:task:subtask:deleted', {
        taskId,
        projectId,
        subtaskId,
        deletedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`Subtask ${subtaskId} deleted by ${socket.userId}`);
    } catch (error) {
      console.error('Error deleting subtask:', error);
      socket.emit('kanban:error', { message: 'Failed to delete subtask' });
    }
  });

  /**
   * Bulk task operations
   */
  socket.on('kanban:tasks:bulk:update', async (data) => {
    try {
      const { projectId, taskIds, updates } = data;

      // Update multiple tasks
      await Task.updateMany(
        { _id: { $in: taskIds } },
        { 
          ...updates,
          updatedBy: socket.userId,
          updatedAt: new Date()
        }
      );

      // Broadcast bulk update
      io.to(`kanban:${projectId}`).emit('kanban:tasks:bulk:updated', {
        projectId,
        taskIds,
        updates,
        updatedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`Bulk update on ${taskIds.length} tasks by ${socket.userId}`);
    } catch (error) {
      console.error('Error bulk updating tasks:', error);
      socket.emit('kanban:error', { message: 'Failed to bulk update tasks' });
    }
  });

  /**
   * Reorder tasks within a column
   */
  socket.on('kanban:column:reorder', async (data) => {
    try {
      const { projectId, status, taskOrders } = data;

      // taskOrders: [{ taskId, position }, ...]
      for (const { taskId, position } of taskOrders) {
        await Task.findByIdAndUpdate(taskId, { 
          position,
          updatedAt: new Date()
        });
      }

      // Broadcast reorder
      io.to(`kanban:${projectId}`).emit('kanban:column:reordered', {
        projectId,
        status,
        taskOrders,
        reorderedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`Column ${status} reordered by ${socket.userId}`);
    } catch (error) {
      console.error('Error reordering column:', error);
      socket.emit('kanban:error', { message: 'Failed to reorder column' });
    }
  });

};

module.exports = kanbanSocket;