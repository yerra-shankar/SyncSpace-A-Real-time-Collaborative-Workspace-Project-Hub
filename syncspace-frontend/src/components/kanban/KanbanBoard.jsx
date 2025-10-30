import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus } from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskModal from '../../components/modals/TaskModal';
import api from '../../services/api';
import socketService from '../../socket/socket';
import { toast } from 'react-toastify';
import '../../styles/App.css';

function KanbanBoard({ workspaceId }) {
  const [tasks, setTasks] = useState({
    todo: [],
    inProgress: [],
    done: []
  });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
    subscribeToTaskUpdates();

    return () => {
      socketService.unsubscribeFromTaskUpdates();
    };
  }, [workspaceId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const projectId = 1; // This should come from workspace context
      const tasksData = await api.tasks.getByProject(projectId);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToTaskUpdates = () => {
    socketService.subscribeToTaskUpdates((data) => {
      // Handle real-time task updates
      loadTasks();
    });
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;

    // Create new tasks object
    const newTasks = { ...tasks };
    const sourceItems = Array.from(newTasks[sourceColumn]);
    const destItems = sourceColumn === destColumn ? sourceItems : Array.from(newTasks[destColumn]);

    // Remove from source
    const [movedTask] = sourceItems.splice(source.index, 1);

    // Add to destination
    destItems.splice(destination.index, 0, movedTask);

    // Update state
    newTasks[sourceColumn] = sourceItems;
    newTasks[destColumn] = destItems;
    setTasks(newTasks);

    // Update backend
    try {
      await api.tasks.move(draggableId, destColumn);
      socketService.emitTaskMove(draggableId, sourceColumn, destColumn);
      toast.success('Task moved successfully');
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Failed to move task');
      // Revert on error
      loadTasks();
    }
  };

  const handleCreateTask = () => {
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
    loadTasks();
    handleCloseModal();
  };

  if (loading) {
    return (
      <div className="kanban-loading-wrapper">
        <div className="kanban-spinner"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="kanban-board-wrapper">
      <div className="kanban-board-header">
        <div>
          <h2 className="kanban-board-title">Project Board</h2>
          <p className="kanban-board-subtitle">Manage your tasks with drag and drop</p>
        </div>
        <button onClick={handleCreateTask} className="kanban-create-task-btn">
          <Plus size={20} />
          <span className="d-none d-sm-inline">Add Task</span>
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="row g-3 kanban-columns-container">
          {/* To Do Column */}
          <div className="col-12 col-lg-4">
            <KanbanColumn
              columnId="todo"
              title="To Do"
              tasks={tasks.todo}
              count={tasks.todo.length}
              onEditTask={handleEditTask}
            />
          </div>

          {/* In Progress Column */}
          <div className="col-12 col-lg-4">
            <KanbanColumn
              columnId="inProgress"
              title="In Progress"
              tasks={tasks.inProgress}
              count={tasks.inProgress.length}
              onEditTask={handleEditTask}
            />
          </div>

          {/* Done Column */}
          <div className="col-12 col-lg-4">
            <KanbanColumn
              columnId="done"
              title="Done"
              tasks={tasks.done}
              count={tasks.done.length}
              onEditTask={handleEditTask}
            />
          </div>
        </div>
      </DragDropContext>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          onClose={handleCloseModal}
          onSave={handleTaskSaved}
        />
      )}
    </div>
  );
}

export default KanbanBoard;