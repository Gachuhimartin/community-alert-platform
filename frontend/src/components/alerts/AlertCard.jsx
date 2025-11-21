import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ALERT_CATEGORIES, ALERT_SEVERITY } from '../../utils/constants';

const AlertCard = ({ alert, onStatusUpdate, onDelete, onChat }) => { // ADD onChat to props
  const { user } = useAuth();

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-300 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // FIXED: Handle undefined attendees safely
  const isAttending = user && alert.attendees && alert.attendees.some(attendee => 
    (attendee._id && attendee._id === user.id) || attendee === user.id
  );
  
  const isCreator = user && (
    (typeof alert.createdBy === 'object' && alert.createdBy._id === user.id) ||
    (typeof alert.createdBy === 'string' && alert.createdBy === user.id)
  );

  // FIXED: Handle undefined attendees for isFull check
  const isFull = alert.attendees && alert.attendees.length >= alert.maxAttendees;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // FIXED: Safe attendees count
  const attendeesCount = alert.attendees ? alert.attendees.length : 0;

  // ADD DEBUG LOGS
  console.log('🎯 AlertCard Debug:', {
    eventId: alert._id,
    eventTitle: alert.title,
    isAttending: isAttending,
    isCreator: isCreator,
    attendees: attendeesCount,
    hasOnChat: !!onChat // Check if onChat is provided
  });

  const handleChatClick = () => {
    console.log('💬 Chat button clicked for alert:', alert._id);
    if (onChat) {
      onChat(alert);
    } else {
      console.error('❌ onChat function not provided');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (onStatusUpdate && isCreator) {
      await onStatusUpdate(alert._id, newStatus);
    } else if (!isCreator) {
      alert('Only the alert creator can update this alert');
    }
  };

  const handleDelete = async () => {
    if (onDelete && isCreator && window.confirm('Are you sure you want to delete this alert?')) {
      await onDelete(alert._id);
    } else if (!isCreator) {
      alert('Only the alert creator can delete this alert');
    }
  };

  const getCreatorName = () => {
    if (typeof alert.createdBy === 'object') {
      return alert.createdBy.username;
    }
    return 'Unknown User';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
        <div className="flex space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
            {ALERT_SEVERITY[alert.severity]}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
            {alert.status}
          </span>
        </div>
      </div>

      <p className="text-gray-600 mb-4">{alert.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm">
          {ALERT_CATEGORIES[alert.category]}
        </span>
        <span className="bg-gray-50 text-gray-700 px-3 py-1 rounded-lg text-sm">
          📍 {alert.location}
        </span>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>By {getCreatorName()} {isCreator && '(You)'}</span>
        <span>{new Date(alert.createdAt).toLocaleString()}</span>
      </div>

      {/* Action Buttons - Only show for creator */}
      {isCreator && alert.status === 'active' && (
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => handleStatusChange('resolved')}
            className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition"
          >
            Mark Resolved
          </button>
          <button
            onClick={() => handleStatusChange('closed')}
            className="bg-gray-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-600 transition"
          >
            Close Alert
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      )}

      {/* Show message if not creator */}
      {!isCreator && alert.status === 'active' && (
        <div className="mt-4 text-sm text-gray-500">
          Only {getCreatorName()} can update this alert
        </div>
      )}

      {/* ADD CHAT BUTTON - Available to all community members */}
      <div className="mt-4 flex space-x-2">
        <button
          onClick={handleChatClick}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600 transition flex-1"
        >
          💬 Chat About This Alert
        </button>
      </div>
    </div>
  );
};

export default AlertCard;