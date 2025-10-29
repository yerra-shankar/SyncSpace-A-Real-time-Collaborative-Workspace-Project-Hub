import React from 'react';
import '../../styles/App.css';

function TypingIndicator({ users }) {
  const displayText = users.length === 1
    ? `${users[0]} is typing`
    : users.length === 2
    ? `${users[0]} and ${users[1]} are typing`
    : `${users[0]} and ${users.length - 1} others are typing`;

  return (
    <div className="typing-indicator-wrapper">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6">
            <div className="typing-indicator-container">
              <div className="typing-indicator-avatar">
                {users[0]?.charAt(0) || 'U'}
              </div>
              
              <div className="typing-indicator-content">
                <span className="typing-indicator-text">{displayText}</span>
                <div className="typing-indicator-dots">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;