import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';

const AlertChat = ({ alert, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const { user } = useAuth();
  const { socket } = useSocket();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadMessageHistory = async () => {
      try {
        const response = await api.get(`/alert-messages/${alert._id}`);
        setMessages(response.data);
      } catch (error) {
        console.error('Error loading alert message history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessageHistory();
  }, [alert._id]);

  useEffect(() => {
    if (socket && alert) {
      console.log('🔌 Joining alert chat room:', alert._id);
      
      socket.emit('join_alert', alert._id);

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
          timestamp: data.timestamp,
          isJoin: true
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
          timestamp: data.timestamp,
          isLeave: true
        }]);
      };

      socket.on('new_alert_message', handleNewMessage);
      socket.on('alert_user_typing', handleUserTyping);
      socket.on('alert_user_joined', handleUserJoined);
      socket.on('alert_user_left', handleUserLeft);

      return () => {
        socket.emit('leave_alert', alert._id);
        socket.off('new_alert_message', handleNewMessage);
        socket.off('alert_user_typing', handleUserTyping);
        socket.off('alert_user_joined', handleUserJoined);
        socket.off('alert_user_left', handleUserLeft);
      };
    }
  }, [socket, alert, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const messageData = {
      alertId: alert._id,
      userId: user.id,
      username: user.username,
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      socket.emit('send_alert_message', messageData);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = () => {
    if (socket && newMessage.trim()) {
      socket.emit('alert_user_typing', {
        alertId: alert._id,
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
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString();
  };

  const isCurrentUser = (message) => {
    if (typeof message.userId === 'object' && message.userId._id) {
      return message.userId._id === user.id;
    }
    return message.userId === user.id;
  };

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

  const getAlertSeverityColor = () => {
    switch (alert.severity) {
      case 'critical': return 'from-red-500 to-rose-600';
      case 'high': return 'from-orange-500 to-red-600';
      case 'medium': return 'from-yellow-500 to-orange-600';
      case 'low': return 'from-green-500 to-emerald-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getAlertSeverityIcon = () => {
    switch (alert.severity) {
      case 'critical': return '🔥';
      case 'high': return '⚠️';
      case 'medium': return '🔸';
      case 'low': return 'ℹ️';
      default: return '🚨';
    }
  };

  if (!alert) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 w-full max-w-md h-[600px] flex flex-col overflow-hidden">
        
        {/* Premium Header with Alert Severity */}
        <div className={`bg-gradient-to-r ${getAlertSeverityColor()} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-xl">{getAlertSeverityIcon()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate">{alert.title}</h3>
                <div className="flex items-center space-x-3 text-white/80 text-sm mt-1">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                    <span>{onlineUsers.size} online</span>
                  </span>
                  <span>•</span>
                  <span className="capitalize">{alert.severity} priority</span>
                  <span>•</span>
                  <span className="capitalize">{alert.status}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Online Users Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                className="relative p-2 hover:bg-white/10 rounded-xl transition-all"
                title="Online users"
              >
                <span className="text-xl">👥</span>
                {onlineUsers.size > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                    {onlineUsers.size}
                  </span>
                )}
              </motion.button>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Online Users Popover */}
        <AnimatePresence>
          {showOnlineUsers && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-20 right-6 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 z-10 min-w-[180px]"
            >
              <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center space-x-2">
                <span>👥</span>
                <span>Responding Now</span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Array.from(onlineUsers).map(username => (
                  <div key={username} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-700 font-medium truncate">
                      {username}
                    </span>
                    {username === user.username && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">you</span>
                    )}
                  </div>
                ))}
                {onlineUsers.size === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">No responders online</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-red-50 to-white p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-4"
            >
              <div className="text-6xl mb-2">🚨</div>
              <h3 className="text-xl font-bold text-gray-900">No messages yet</h3>
              <p className="text-gray-500 max-w-xs">
                Coordinate the response for {alert.title}
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 max-w-xs">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Use this chat to coordinate with other responders
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {Object.entries(messageGroups).map(([date, dateMessages]) => (
                <div key={date}>
                  {/* Date Separator */}
                  <div className="flex items-center justify-center my-8">
                    <div className="bg-white/80 backdrop-blur-sm text-gray-500 text-xs px-4 py-2 rounded-full border border-gray-200/50 shadow-sm">
                      {date}
                    </div>
                  </div>
                  
                  {/* Messages */}
                  <div className="space-y-4">
                    {dateMessages.map((msg, index) => {
                      const isCurrentUserMsg = isCurrentUser(msg);
                      const showAvatar = !msg.system && !isCurrentUserMsg && 
                        (index === 0 || dateMessages[index - 1].userId !== msg.userId);

                      return (
                        <motion.div
                          key={msg._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isCurrentUserMsg ? 'justify-end' : 'justify-start'} ${msg.system ? 'justify-center' : ''}`}
                        >
                          {msg.system ? (
                            <div className={`px-4 py-2 rounded-2xl text-sm max-w-xs text-center ${
                              msg.isJoin ? 'bg-green-100 text-green-700' : 
                              msg.isLeave ? 'bg-gray-100 text-gray-600' : 
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {msg.message}
                            </div>
                          ) : (
                            <div className={`flex items-end space-x-2 max-w-[85%] ${
                              isCurrentUserMsg ? 'flex-row-reverse space-x-reverse' : ''
                            }`}>
                              {/* Avatar */}
                              {showAvatar && (
                                <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                  {msg.username?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              
                              {/* Message Bubble */}
                              <div className={`flex flex-col ${
                                isCurrentUserMsg ? 'items-end' : 'items-start'
                              }`}>
                                {!isCurrentUserMsg && showAvatar && (
                                  <div className="text-xs text-gray-500 font-medium mb-1 ml-1">
                                    {msg.username}
                                  </div>
                                )}
                                <div
                                  className={`px-4 py-3 rounded-3xl ${
                                    isCurrentUserMsg
                                      ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-br-md'
                                      : 'bg-white text-gray-900 border border-gray-200/50 rounded-bl-md shadow-sm'
                                  }`}
                                >
                                  <div className="text-sm leading-relaxed">{msg.message}</div>
                                  <div className={`text-xs mt-1 ${
                                    isCurrentUserMsg ? 'text-red-100' : 'text-gray-400'
                                  }`}>
                                    {formatTime(msg.timestamp)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && typingUsers.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex justify-start mt-4"
              >
                <div className="bg-white border border-gray-200/50 text-gray-600 px-4 py-3 rounded-3xl rounded-bl-md shadow-sm">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span>
                      {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>

        {/* Premium Message Input */}
        <div className="p-4 border-t border-gray-200/50 bg-white/80 backdrop-blur-sm">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder={`Coordinate response for ${alert.title}...`}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 pr-12"
                maxLength={500}
              />
              {newMessage.length > 0 && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  {newMessage.length}/500
                </div>
              )}
            </div>
            <motion.button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              whileHover={{ scale: !newMessage.trim() ? 1 : 1.05 }}
              whileTap={{ scale: !newMessage.trim() ? 1 : 0.95 }}
              className="bg-gradient-to-r from-red-500 to-orange-600 text-white p-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSending ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </motion.button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default AlertChat;