

// src/components/kanban/KanbanBoard.jsx

import React, { useState, useEffect } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { Plus } from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import TaskModal from '../../components/modals/TaskModal';
import api from '../../services/api';
import socketService from '../../socket/socket';
import { toast } from 'react-toastify';
import '../../styles/App.css';

function KanbanBoard({ workspaceId }) {
  const [tasks, setTasks] = useState({ todo: [], inProgress: [], done: [] });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState(null);

  useEffect(() => {
    if (workspaceId) {
      initializeBoard();
      subscribeToTaskUpdates();
    }
    return () => socketService.unsubscribeFromTaskUpdates();
  }, [workspaceId]);

  // ===================== INITIALIZE BOARD =====================
  const initializeBoard = async () => {
    setLoading(true);
    try {
      console.log("🧩 Loading projects for workspace:", workspaceId);

      const projects = await api.projects.getByWorkspace(workspaceId);

      if (!projects || projects.length === 0) {
        toast.info('No projects found in this workspace');
        setTasks({ todo: [], inProgress: [], done: [] });
        setLoading(false);
        return;
      }

      // ✅ Always use _id or id safely
      const firstProject = projects[0];
      const validId = firstProject._id || firstProject.id;

      if (!validId || validId.length !== 24) {
        console.error("❌ Invalid project ID received:", validId, firstProject);
        toast.error("Invalid project ID from backend. Please check workspaceController.");
        setTasks({ todo: [], inProgress: [], done: [] });
        setLoading(false);
        return;
      }

      console.log("✅ Using Project ID:", validId, " | Project Name:", firstProject.name);

      setProjectId(validId);
      await loadTasks(validId);

    } catch (error) {
      console.error('❌ Error initializing board:', error);
      toast.error('Failed to load workspace projects');
    } finally {
      setLoading(false);
    }
  };

  // ===================== LOAD TASKS =====================
  const loadTasks = async (projId) => {
    try {
      console.log("📂 Loading tasks for project:", projId);
      const tasksData = await api.tasks.getByProject(projId);
      setTasks(tasksData || { todo: [], inProgress: [], done: [] });
      console.log("✅ Tasks loaded:", tasksData);
    } catch (error) {
      console.error('❌ Error loading tasks:', error);
      toast.error('Failed to load tasks');
    }
  };

  // ===================== SOCKET UPDATES =====================
  const subscribeToTaskUpdates = () => {
    socketService.subscribeToTaskUpdates(() => {
      if (projectId) loadTasks(projectId);
    });
  };

  // ===================== DRAG AND DROP =====================
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    const newTasks = { ...tasks };
    const sourceItems = Array.from(newTasks[sourceCol]);
    const destItems = Array.from(newTasks[destCol]);

    const [movedTask] = sourceItems.splice(source.index, 1);
    destItems.splice(destination.index, 0, movedTask);

    newTasks[sourceCol] = sourceItems;
    newTasks[destCol] = destItems;
    setTasks(newTasks);

    try {
      await api.tasks.move(draggableId, destCol);
      socketService.emitTaskMove(draggableId, sourceCol, destCol);
    } catch (error) {
      console.error('❌ Error moving task:', error);
      toast.error('Failed to move task');
      loadTasks(projectId);
    }
  };

  // ===================== MODALS =====================
  const handleCreateTask = () => {
    if (!projectId) {
      toast.warn('Project not ready yet. Please wait a moment.');
      return;
    }
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleCloseModal = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  const handleTaskSaved = () => {
    if (projectId) loadTasks(projectId);
    handleCloseModal();
  };

  // ===================== LOADING STATE =====================
  if (loading) {
    return (
      <div className="kanban-loading-wrapper">
        <div className="kanban-spinner"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  // ===================== RENDER =====================
  return (
    <div className="kanban-board-wrapper">
      <div className="kanban-board-header">
        <div>
          <h2 className="kanban-board-title">Project Board</h2>
          <p className="kanban-board-subtitle">Manage your tasks with drag & drop</p>
        </div>
        <button onClick={handleCreateTask} className="kanban-create-task-btn">
          <Plus size={20} />
          <span>Add Task</span>
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="row g-3 kanban-columns-container">
          <KanbanColumn columnId="todo" title="To Do" tasks={tasks.todo} count={tasks.todo.length} onEditTask={handleEditTask} />
          <KanbanColumn columnId="inProgress" title="In Progress" tasks={tasks.inProgress} count={tasks.inProgress.length} onEditTask={handleEditTask} />
          <KanbanColumn columnId="done" title="Done" tasks={tasks.done} count={tasks.done.length} onEditTask={handleEditTask} />
        </div>
      </DragDropContext>

      {showTaskModal && (
        <TaskModal task={selectedTask} onClose={handleCloseModal} onSave={handleTaskSaved} projectId={projectId} />
      )}
    </div>
  );
}

export default KanbanBoard;
