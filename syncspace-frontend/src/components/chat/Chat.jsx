import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { Send, Paperclip, Smile, MoreVertical } from 'lucide-react';
import socketService from '../../socket/socket';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useApp } from '../../context/AppContext';
import '../../styles/App.css';

function Chat({ workspaceId }) {
  const { user } = useApp();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(3);
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    loadMessages();
    subscribeToChatEvents();

    return () => {
      socketService.unsubscribeFromChatMessages();
      socketService.unsubscribeFromTypingIndicators();
    };
  }, [workspaceId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const messagesData = await api.chat.getMessages(workspaceId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChatEvents = () => {
    // Subscribe to new messages
    socketService.subscribeToChatMessages((message) => {
      setMessages(prev => [...prev, message]);
    });

    // Subscribe to typing indicators
    socketService.subscribeToTypingIndicators((data) => {
      if (data.isTyping) {
        setTypingUsers(prev => [...new Set([...prev, data.userName])]);
      } else {
        setTypingUsers(prev => prev.filter(name => name !== data.userName));
      }
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    // Emit typing indicator
    if (!isTyping) {
      setIsTyping(true);
      socketService.emitTypingIndicator(workspaceId, true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.emitTypingIndicator(workspaceId, false);
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    const messageData = {
      id: Date.now(),
      user: user.name,
      message: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: user.name.charAt(0).toUpperCase(),
      userId: user.id
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, messageData]);
    setNewMessage('');

    // Clear typing indicator
    setIsTyping(false);
    socketService.emitTypingIndicator(workspaceId, false);

    try {
      // Send message to backend
      await api.chat.sendMessage(workspaceId, messageData);
      
      // Emit to socket
      socketService.emitChatMessage(workspaceId, messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Remove message from UI on error
      setMessages(prev => prev.filter(msg => msg.id !== messageData.id));
    }
  };

  if (loading) {
    return (
      <div className="chat-loading-wrapper">
        <div className="chat-spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="chat-container-wrapper">
      <div className="container-fluid h-100">
        <div className="row h-100">
          <div className="col-12">
            <div className="chat-inner-container">
              {/* Chat Header */}
              <div className="chat-header-section">
                <div className="row align-items-center">
                  <div className="col">
                    <h2 className="chat-header-title">Team Chat</h2>
                    <div className="chat-online-status">
                      <span className="chat-online-indicator"></span>
                      <span className="chat-online-text">{onlineUsers} online</span>
                    </div>
                  </div>
                  <div className="col-auto">
                    <button className="chat-header-menu-btn">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="chat-messages-area">
                {messages.length === 0 ? (
                  <div className="chat-empty-state">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="chat-messages-list">
                    {messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        isOwnMessage={message.userId === user.id}
                      />
                    ))}
                    
                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                      <TypingIndicator users={typingUsers} />
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="chat-input-section">
                <div className="row align-items-center g-2">
                  <div className="col-auto d-none d-sm-block">
                    <button type="button" className="chat-action-btn">
                      <Paperclip size={20} />
                    </button>
                  </div>
                  
                  <div className="col">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleTyping}
                      placeholder="Type a message..."
                      className="chat-message-input"
                    />
                  </div>
                  
                  <div className="col-auto d-none d-sm-block">
                    <button type="button" className="chat-action-btn">
                      <Smile size={20} />
                    </button>
                  </div>
                  
                  <div className="col-auto">
                    <button
                      type="submit"
                      className="chat-send-btn"
                      disabled={!newMessage.trim()}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;