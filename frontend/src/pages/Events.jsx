import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import SocketIndicator from '../components/common/SocketIndicator';
import EventCard from '../components/events/EventCard';
import EventForm from '../components/events/EventForm';
import EventChat from '../components/events/EventChat';
import api from '../utils/api';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      await api.post('/events', eventData);
      setShowForm(false);
      fetchEvents(); // Refresh events list
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/join`);
      fetchEvents(); // Refresh to show updated attendees
    } catch (error) {
      console.error('Error joining event:', error);
      alert(error.response?.data?.message || 'Failed to join event');
    }
  };

  const handleOpenChat = (event) => {
    setSelectedEvent(event);
    setShowChat(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <SocketIndicator />
      
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Community Events</h1>
            <p className="text-gray-600 mt-2">Join events and coordinate in real-time</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
          >
            + Create Event
          </button>
        </div>

        {showForm && (
          <div className="mb-8">
            <EventForm 
              onSubmit={handleCreateEvent}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Loading events...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {events.length === 0 ? (
              <div className="col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No events yet</h3>
                <p className="text-gray-600 mb-6">Be the first to organize a community event!</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
                >
                  Create First Event
                </button>
              </div>
            ) : (
              events.map(event => (
                <EventCard 
                  key={event._id} 
                  event={event}
                  onJoin={handleJoinEvent}
                  onChat={handleOpenChat}
                />
              ))
            )}
          </div>
        )}

        {/* Event Chat Modal */}
        {showChat && selectedEvent && (
          <EventChat 
            event={selectedEvent}
            onClose={() => {
              setShowChat(false);
              setSelectedEvent(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Events;