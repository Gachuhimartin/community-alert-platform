import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ALERT_CATEGORIES, ALERT_SEVERITY } from '../../utils/constants';

const AlertCard = ({ alert, onStatusUpdate, onDelete, onChat }) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'from-red-500 to-red-600';
      case 'high': return 'from-orange-500 to-orange-600';
      case 'medium': return 'from-yellow-500 to-yellow-600';
      case 'low': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-500 text-white';
      case 'resolved': return 'bg-green-500 text-white';
      case 'closed': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🔥';
      case 'high': return '⚠️';
      case 'medium': return '🔸';
      case 'low': return 'ℹ️';
      default: return '📢';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      safety: '🛡️',
      environment: '🌿',
      infrastructure: '🏗️',
      lost_found: '🔍',
      event: '📅',
      other: '❓'
    };
    return icons[category] || '📢';
  };

  const isCreator = user && (
    (typeof alert.createdBy === 'object' && alert.createdBy._id === user.id) ||
    (typeof alert.createdBy === 'string' && alert.createdBy === user.id)
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 1) return 'Today';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const handleChatClick = () => {
    console.log('💬 Chat button clicked for alert:', alert._id);
    if (onChat) {
      onChat(alert);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (onStatusUpdate && isCreator) {
      await onStatusUpdate(alert._id, newStatus);
    }
  };

  const handleDelete = async () => {
    if (onDelete && isCreator) {
      setIsDeleting(true);
      await onDelete(alert._id);
      setIsDeleting(false);
    }
  };

  const getCreatorName = () => {
    if (typeof alert.createdBy === 'object') {
      return alert.createdBy.username;
    }
    return 'Community Member';
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2, scale: 1.02 }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Header with gradient severity indicator */}
      <div className={`bg-gradient-to-r ${getSeverityColor(alert.severity)} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{alert.title}</h3>
              <div className="flex items-center space-x-2 text-white/80 text-sm">
                <span>{getCategoryIcon(alert.category)}</span>
                <span>{ALERT_CATEGORIES[alert.category]}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(alert.status)} backdrop-blur-sm`}>
              {alert.status.toUpperCase()}
            </span>
            <span className="text-white/70 text-sm">
              {getTimeAgo(alert.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Description with expandable text */}
        <div className="mb-4">
          <p className={`text-gray-600 leading-relaxed ${
            !isExpanded && alert.description.length > 120 ? 'line-clamp-3' : ''
          }`}>
            {alert.description}
          </p>
          {alert.description.length > 120 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium mt-1 transition-colors"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Location and Metadata */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-xl">
            <span className="text-gray-500">📍</span>
            <span className="text-sm font-medium text-gray-700">{alert.location}</span>
          </div>
          
          <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-xl">
            <span className="text-blue-500">👤</span>
            <span className="text-sm font-medium text-blue-700">
              {getCreatorName()}
              {isCreator && <span className="text-blue-500 ml-1">(You)</span>}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          {/* Chat Button - Always visible */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleChatClick}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <span className="text-lg">💬</span>
            <span>Join Alert Discussion</span>
          </motion.button>

          {/* Creator Actions */}
          <AnimatePresence>
            {isCreator && alert.status === 'active' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-3 gap-2"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStatusChange('resolved')}
                  className="bg-green-500 text-white py-2 px-3 rounded-lg font-medium hover:bg-green-600 transition-all duration-300 text-sm flex items-center justify-center space-x-1"
                >
                  <span>✅</span>
                  <span>Resolve</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStatusChange('closed')}
                  className="bg-gray-500 text-white py-2 px-3 rounded-lg font-medium hover:bg-gray-600 transition-all duration-300 text-sm flex items-center justify-center space-x-1"
                >
                  <span>🔒</span>
                  <span>Close</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-500 text-white py-2 px-3 rounded-lg font-medium hover:bg-red-600 transition-all duration-300 text-sm flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>🗑️</span>
                      <span>Delete</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Message for non-creators */}
          {!isCreator && alert.status === 'active' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="text-sm text-gray-500 bg-gray-50 py-2 px-3 rounded-lg">
                Reported by <span className="font-semibold text-gray-700">{getCreatorName()}</span>
              </p>
            </motion.div>
          )}

          {/* Resolved/Closed State */}
          {alert.status !== 'active' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center py-2 px-3 rounded-lg ${
                alert.status === 'resolved' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
              }`}
            >
              <p className="text-sm font-medium">
                {alert.status === 'resolved' ? '✅ This alert has been resolved' : '🔒 This alert is closed'}
              </p>
              {isCreator && (
                <p className="text-xs mt-1 opacity-75">You can still chat about it</p>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer with timestamp */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200/50">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Alert ID: {alert._id.slice(-8)}</span>
          <span>Created: {new Date(alert.createdAt).toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AlertCard;