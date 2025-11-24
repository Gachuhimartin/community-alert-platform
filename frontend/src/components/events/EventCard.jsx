import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { EVENT_CATEGORIES } from '../../utils/constants';

const EventCard = ({ event, onJoin, onChat }) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const getCategoryColor = (category) => {
    switch (category) {
      case 'cleanup': return 'from-green-500 to-emerald-600';
      case 'meeting': return 'from-blue-500 to-cyan-600';
      case 'workshop': return 'from-purple-500 to-indigo-600';
      case 'social': return 'from-pink-500 to-rose-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      cleanup: '🧹',
      meeting: '👥',
      workshop: '🎓',
      social: '🎉',
      other: '📅'
    };
    return icons[category] || '📅';
  };

  const isAttending = user && event.attendees && event.attendees.some(attendee => 
    (attendee._id && attendee._id === user.id) || attendee === user.id
  );
  
  const isCreator = user && (
    (typeof event.createdBy === 'object' && event.createdBy._id === user.id) ||
    (typeof event.createdBy === 'string' && event.createdBy === user.id)
  );

  const isFull = event.attendees && event.attendees.length >= event.maxAttendees;
  const attendeesCount = event.attendees ? event.attendees.length : 0;
  const spotsLeft = event.maxAttendees - attendeesCount;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If event is today
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If event is tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleString();
  };

  const isUpcoming = new Date(event.date) > new Date();
  const isPast = new Date(event.date) < new Date();

  const getTimeStatus = () => {
    if (isPast) return { text: 'Past Event', color: 'bg-gray-500' };
    if (!isUpcoming) return { text: 'Happening Now', color: 'bg-green-500' };
    
    const hoursUntil = Math.floor((new Date(event.date) - new Date()) / (1000 * 60 * 60));
    if (hoursUntil < 24) return { text: 'Soon', color: 'bg-orange-500' };
    return { text: 'Upcoming', color: 'bg-blue-500' };
  };

  const timeStatus = getTimeStatus();

  const handleChatClick = () => {
    console.log('💬 Chat button clicked for event:', event._id);
    if (onChat) {
      onChat(event);
    }
  };

  const handleJoinClick = async () => {
    if (onJoin && !isAttending && !isFull) {
      setIsJoining(true);
      try {
        await onJoin(event._id);
      } catch (error) {
        console.error('Error joining event:', error);
      } finally {
        setIsJoining(false);
      }
    }
  };

  const getCreatorName = () => {
    if (typeof event.createdBy === 'object') {
      return event.createdBy.username;
    }
    return 'Community Organizer';
  };

  const getProgressPercentage = () => {
    return Math.min((attendeesCount / event.maxAttendees) * 100, 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2, scale: 1.02 }}
      className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 ${
        isPast ? 'opacity-75' : ''
      }`}
    >
      {/* Header with gradient category indicator */}
      <div className={`bg-gradient-to-r ${getCategoryColor(event.category)} p-4 text-white relative overflow-hidden`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-2 text-4xl">{getCategoryIcon(event.category)}</div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <span className="text-sm">{getCategoryIcon(event.category)}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${timeStatus.color} backdrop-blur-sm`}>
                {timeStatus.text}
              </span>
            </div>
            
            <div className="text-right">
              <div className="text-white/80 text-sm">{formatDate(event.date)}</div>
              {isCreator && (
                <div className="text-white/60 text-xs mt-1">You created this</div>
              )}
            </div>
          </div>
          
          <h3 className="font-bold text-lg leading-tight mb-1">{event.title}</h3>
          <p className="text-white/80 text-sm line-clamp-2">{event.description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Expandable description */}
        <div className="mb-4">
          <p className={`text-gray-600 leading-relaxed ${
            !isExpanded && event.description.length > 120 ? 'line-clamp-3' : ''
          }`}>
            {event.description}
          </p>
          {event.description.length > 120 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium mt-1 transition-colors"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-3 bg-gray-50 px-3 py-2 rounded-xl">
            <span className="text-gray-500 text-lg">📍</span>
            <div>
              <div className="text-sm font-medium text-gray-700">Location</div>
              <div className="text-xs text-gray-500">{event.location}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 bg-blue-50 px-3 py-2 rounded-xl">
            <span className="text-blue-500 text-lg">👤</span>
            <div>
              <div className="text-sm font-medium text-blue-700">Organizer</div>
              <div className="text-xs text-blue-600">{getCreatorName()}</div>
            </div>
          </div>

          {/* Attendance Progress */}
          <div className="bg-green-50 px-3 py-2 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-green-700">Attendance</div>
              <div className="text-xs text-green-600">
                {attendeesCount} / {event.maxAttendees} ({spotsLeft} spots left)
              </div>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <motion.div 
                className="bg-green-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${getProgressPercentage()}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary Action Button */}
          {!isPast && (
            <AnimatePresence mode="wait">
              {!isAttending && !isFull && (
                <motion.button
                  key="join"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleJoinClick}
                  disabled={isJoining}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isJoining ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">✅</span>
                      <span>Join Event</span>
                    </>
                  )}
                </motion.button>
              )}

              {isAttending && (
                <motion.button
                  key="attending"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleChatClick}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span className="text-lg">💬</span>
                  <span>Open Event Chat</span>
                </motion.button>
              )}

              {isFull && !isAttending && (
                <motion.div
                  key="full"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white py-3 px-4 rounded-xl font-semibold text-center"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>🔒</span>
                    <span>Event Full</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Past Event State */}
          {isPast && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full bg-gray-100 text-gray-600 py-3 px-4 rounded-xl text-center"
            >
              <div className="flex items-center justify-center space-x-2">
                <span>⏰</span>
                <span>This event has ended</span>
              </div>
              {isAttending && (
                <button
                  onClick={handleChatClick}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium mt-2 transition-colors"
                >
                  View event archive
                </button>
              )}
            </motion.div>
          )}

          {/* Creator Badge */}
          {isCreator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center bg-purple-50 text-purple-700 py-2 px-3 rounded-lg"
            >
              <p className="text-sm font-medium">🎯 You are the organizer</p>
              <p className="text-xs opacity-75 mt-1">Manage attendance in the chat</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200/50">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Event ID: {event._id.slice(-8)}</span>
          <span>Created: {new Date(event.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;