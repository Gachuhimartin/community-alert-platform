import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';

const EventChat = ({ event, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  
  const { user } = useAuth();
  const { socket } = useSocket();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadMessageHistory = async () => {
      try {
        const response = await api.get(`/event-messages/${event._id}`);
        setMessages(response.data);
      } catch (error) {
        console.error('Error loading message history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessageHistory();
  }, [event._id]);

  useEffect(() => {
    if (socket && event) {
      console.log('🔌 Joining event chat room:', event._id);
      
      socket.emit('join_event', event._id);

      const handleNewMessage = (data) => {
        setMessages(prev => [...prev, data]);
      };

      const handleUserTyping = (data) => {
        if (data.userId !== user.id) {
          setTypingUsers(prev => new Set(prev).add(data.username));
          setIsTyping(true);
          
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.username);
              if (newSet.size === 0) setIsTyping(false);
              return newSet;
            });
          }, 2000);
        }
      };

      const handleUserJoined = (data) => {
        setOnlineUsers(prev => new Set(prev).add(data.username));
        
        setMessages(prev => [...prev, {
          _id: `join-${Date.now()}`,
          system: true,
          message: `${data.username} joined the chat`,
          timestamp: data.timestamp
        }]);
      };

      const handleUserLeft = (data) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.username);
          return newSet;
        });
        
        setMessages(prev => [...prev, {
          _id: `leave-${Date.now()}`,
          system: true,
          message: `${data.username} left the chat`,
          timestamp: data.timestamp
        }]);
      };

      socket.on('new_event_message', handleNewMessage);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_joined', handleUserJoined);
      socket.on('user_left', handleUserLeft);

      return () => {
        socket.emit('leave_event', event._id);
        socket.off('new_event_message', handleNewMessage);
        socket.off('user_typing', handleUserTyping);
        socket.off('user_joined', handleUserJoined);
        socket.off('user_left', handleUserLeft);
      };
    }
  }, [socket, event, user]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      eventId: event._id,
      userId: user.id,
      username: user.username,
      message: newMessage,
      timestamp: new Date().toISOString()
    };

    socket.emit('send_event_message', messageData);
    setNewMessage('');
  };

  const handleTyping = () => {
    if (socket && newMessage.trim()) {
      socket.emit('user_typing', {
        eventId: event._id,
        userId: user.id,
        username: user.username
      });
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // FIXED: Proper user identification function
  const isCurrentUser = (message) => {
    // Handle both string IDs and populated user objects
    if (typeof message.userId === 'object' && message.userId._id) {
      return message.userId._id === user.id;
    }
    return message.userId === user.id;
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach(message => {
      const date = formatDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  // Debug: Log message ownership
  useEffect(() => {
    if (messages.length > 0) {
      console.log('🔍 Message Ownership Debug:', {
        currentUserId: user.id,
        messages: messages.map(msg => ({
          id: msg._id,
          userId: msg.userId,
          username: msg.username,
          isCurrentUser: isCurrentUser(msg),
          userIdType: typeof msg.userId
        }))
      });
    }
  }, [messages, user.id]);

  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md h-[500px] flex flex-col">
        
        {/* Header - Compact */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">💬</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">
                {event.title}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{onlineUsers.size} online</span>
                <span>•</span>
                <span>{event.attendees?.length || 0} attendees</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowOnlineUsers(!showOnlineUsers)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
              title="Online users"
            >
              <div className="relative">
                <span className="text-lg">👥</span>
                {onlineUsers.size > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {onlineUsers.size}
                  </span>
                )}
              </div>
            </button>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Online Users Popover */}
        {showOnlineUsers && (
          <div className="absolute top-12 right-12 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 min-w-[150px]">
            <h4 className="font-semibold text-gray-900 text-sm mb-2">Online Now</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {Array.from(onlineUsers).map(username => (
                <div key={username} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 truncate">{username}</span>
                  {username === user.username && <span className="text-xs text-gray-500">(you)</span>}
                </div>
              ))}
              {onlineUsers.size === 0 && (
                <p className="text-xs text-gray-500">No one online</p>
              )}
            </div>
          </div>
        )}

        {/* Messages Area - FIXED */}
        <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-sm">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-gray-500 text-sm">No messages yet</p>
              <p className="text-gray-400 text-xs">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(messageGroups).map(([date, dateMessages]) => (
                <div key={date}>
                  {/* Date Separator */}
                  <div className="flex items-center justify-center my-6">
                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {date}
                    </div>
                  </div>
                  
                  {/* Messages for this date - FIXED OWNERSHIP */}
                  <div className="space-y-3">
                    {dateMessages.map((msg, index) => {
                      const isCurrentUserMsg = isCurrentUser(msg);
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isCurrentUserMsg ? 'justify-end' : 'justify-start'} ${msg.system ? 'justify-center' : ''}`}
                        >
                          {msg.system ? (
                            <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs mx-auto">
                              {msg.message}
                            </div>
                          ) : (
                            <div
                              className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                                isCurrentUserMsg
                                  ? 'bg-blue-500 text-white rounded-br-none'
                                  : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                              } ${index > 0 ? 'mt-2' : ''}`}
                            >
                              {!isCurrentUserMsg && (
                                <div className="text-xs font-medium text-blue-600 mb-1">
                                  {msg.username || (msg.userId?.username)}
                                </div>
                              )}
                              <div className="text-sm leading-relaxed">{msg.message}</div>
                              <div className={`text-xs mt-1 ${
                                isCurrentUserMsg ? 'text-blue-200' : 'text-gray-500'
                              }`}>
                                {formatTime(msg.timestamp)}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Typing Indicator */}
          {isTyping && typingUsers.size > 0 && (
            <div className="flex justify-start mt-3">
              <div className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-2xl rounded-bl-none">
                <div className="text-xs">
                  {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                  <span className="ml-1 animate-pulse">✍️</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-3 border-t border-gray-200 bg-white">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventChat;