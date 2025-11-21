import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { EVENT_CATEGORIES } from '../../utils/constants';

const EventCard = ({ event, onJoin, onChat }) => {
  const { user } = useAuth();

  const getCategoryColor = (category) => {
    switch (category) {
      case 'cleanup': return 'bg-green-100 text-green-800';
      case 'meeting': return 'bg-blue-100 text-blue-800';
      case 'workshop': return 'bg-purple-100 text-purple-800';
      case 'social': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // FIXED: Handle undefined attendees safely
  const isAttending = user && event.attendees && event.attendees.some(attendee => 
    (attendee._id && attendee._id === user.id) || attendee === user.id
  );
  
  const isCreator = user && (
    (typeof event.createdBy === 'object' && event.createdBy._id === user.id) ||
    (typeof event.createdBy === 'string' && event.createdBy === user.id)
  );

  // FIXED: Handle undefined attendees for isFull check
  const isFull = event.attendees && event.attendees.length >= event.maxAttendees;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // FIXED: Safe attendees count
  const attendeesCount = event.attendees ? event.attendees.length : 0;

  // ADD DEBUG LOGS
  console.log('🎯 EventCard Debug:', {
    eventId: event._id,
    eventTitle: event.title,
    isAttending: isAttending,
    isCreator: isCreator,
    attendees: attendeesCount,
    hasOnChat: !!onChat,
    attendeesData: event.attendees // Debug what's actually in attendees
  });

  const handleChatClick = () => {
    console.log('💬 Chat button clicked for event:', event._id);
    if (onChat) {
      onChat(event);
    } else {
      console.error('❌ onChat function not provided');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
        <div className="flex space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
            {EVENT_CATEGORIES[event.category]}
          </span>
          {isFull && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Full
            </span>
          )}
        </div>
      </div>

      <p className="text-gray-600 mb-4">{event.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <span className="w-5">📅</span>
          <span className="ml-2">{formatDate(event.date)}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="w-5">📍</span>
          <span className="ml-2">{event.location}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="w-5">👥</span>
          <span className="ml-2">
            {attendeesCount} / {event.maxAttendees} attendees
            {isCreator && ' (You created this)'}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>By {typeof event.createdBy === 'object' ? event.createdBy.username : 'Unknown'}</span>
        <span>{new Date(event.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="mt-4 flex space-x-2">
        {!isAttending && !isFull && (
          <button
            onClick={() => onJoin(event._id)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition flex-1"
          >
            Join Event
          </button>
        )}
        
        {isAttending && (
          <button
            onClick={handleChatClick}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition flex-1"
          >
            Open Chat
          </button>
        )}

        {isFull && !isAttending && (
          <button
            disabled
            className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm cursor-not-allowed flex-1"
          >
            Event Full
          </button>
        )}
      </div>
    </div>
  );
};

export default EventCard;