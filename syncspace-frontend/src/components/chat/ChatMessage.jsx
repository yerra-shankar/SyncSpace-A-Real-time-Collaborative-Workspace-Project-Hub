import React from 'react';
import '../../styles/App.css';

function ChatMessage({ message, isOwnMessage }) {
  return (
    <div className={`chat-message-wrapper ${isOwnMessage ? 'chat-message-own' : 'chat-message-other'}`}>
      <div className="container-fluid">
        <div className={`row ${isOwnMessage ? 'justify-content-end' : 'justify-content-start'}`}>
          <div className="col-12 col-sm-10 col-md-8 col-lg-6">
            <div className={`chat-message-inner ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              {!isOwnMessage && (
                <div className="chat-message-avatar">
                  {message.avatar}
                </div>
              )}

              {/* Message Content */}
              <div className="chat-message-content-wrapper">
                <div className={`chat-message-header-info ${isOwnMessage ? 'text-end' : ''}`}>
                  <span className="chat-message-user-name">{message.user}</span>
                  <span className="chat-message-timestamp">{message.time}</span>
                </div>
                
                <div className={`chat-message-bubble ${isOwnMessage ? 'chat-message-bubble-own' : 'chat-message-bubble-other'}`}>
                  <p className="chat-message-text">{message.message}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;