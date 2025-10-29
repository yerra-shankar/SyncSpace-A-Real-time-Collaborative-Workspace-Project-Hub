import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import TaskCard from './TaskCard';
import '../../styles/App.css';

function KanbanColumn({ columnId, title, tasks, count, onEditTask }) {
  return (
    <div className="kanban-column-wrapper">
      <div className="kanban-column-header-section">
        <h3 className="kanban-column-title-text">{title}</h3>
        <span className="kanban-column-count-badge">{count}</span>
      </div>

      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`kanban-column-droppable ${snapshot.isDraggingOver ? 'kanban-column-dragging-over' : ''}`}
          >
            {tasks.length === 0 ? (
              <div className="kanban-column-empty-state">
                <p>No tasks</p>
              </div>
            ) : (
              tasks.map((task, index) => (
                <Draggable
                  key={task.id.toString()}
                  draggableId={task.id.toString()}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TaskCard
                        task={task}
                        onEdit={onEditTask}
                        isDragging={snapshot.isDragging}
                      />
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default KanbanColumn;