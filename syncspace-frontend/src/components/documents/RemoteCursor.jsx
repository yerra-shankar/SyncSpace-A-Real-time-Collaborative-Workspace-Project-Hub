import React from 'react';
import '../../styles/App.css';

function RemoteCursor({ position, color, userName }) {
  if (!position) return null;

  return (
    <div
      className="remote-cursor-wrapper"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        borderColor: color
      }}
    >
      <div
        className="remote-cursor-label"
        style={{ backgroundColor: color }}
      >
        {userName}
      </div>
    </div>
  );
}

export default RemoteCursor;