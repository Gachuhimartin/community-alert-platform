import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import SocketIndicator from '../components/common/SocketIndicator';
import EventCard from '../components/events/EventCard';
import EventForm from '../components/events/EventForm';
import EventChat from '../components/events/EventChat';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { socket } = useSocket();
  const { user } = useAuth();

  const filters = [
    { key: 'all', label: 'All Events', icon: '📋', color: 'gray' },
    { key: 'upcoming', label: 'Upcoming', icon: '⏰', color: 'blue' },
    { key: 'today', label: 'Today', icon: '🌞', color: 'green' },
    { key: 'meeting', label: 'Meetings', icon: '👥', color: 'purple' },
    { key: 'social', label: 'Social', icon: '🎉', color: 'pink' },
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, activeFilter, searchTerm]);

  useEffect(() => {
    if (socket) {
      const showNotification = (message) => {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-right';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
          toast.remove();
        }, 5000);
      };

      const handleNewEvent = (newEvent) => {
        setEvents(prev => [newEvent, ...prev]);
        showNotification(`New event created: ${newEvent.title}`);
      };

      const handleEventJoined = (data) => {
        setEvents(prev => prev.map(event => {
          if (event._id === data.event._id) {
            return data.event;
          }
          return event;
        }));
        showNotification(`${data.user.username} joined event: ${data.event.title}`);
      };

      socket.on('event_broadcast', handleNewEvent);
      socket.on('event_joined', handleEventJoined);

      return () => {
        socket.off('event_broadcast', handleNewEvent);
        socket.off('event_joined', handleEventJoined);
      };
    }
  }, [socket]);

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

  const filterEvents = () => {
    let filtered = events;
    const today = new Date().toDateString();

    // Apply time filter
    if (activeFilter === 'upcoming') {
      filtered = filtered.filter(event => new Date(event.date) > new Date());
    } else if (activeFilter === 'today') {
      filtered = filtered.filter(event => new Date(event.date).toDateString() === today);
    } else if (activeFilter !== 'all') {
      filtered = filtered.filter(event => event.category === activeFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  };

  const handleCreateEvent = async (eventData) => {
    try {
      await api.post('/events', eventData);
      setShowForm(false);
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  };

  const handleOpenChat = (event) => {
    setSelectedEvent(event);
    setShowChat(true);
  };

  const stats = {
    total: events.length,
    upcoming: events.filter(e => new Date(e.date) > new Date()).length,
    today: events.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).length,
  };

  // Added handleJoin function here
  const handleJoin = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/join`);
      await fetchEvents(); // refresh events list
    } catch (error) {
      console.error('Error joining event:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <Navbar />
      <SocketIndicator />
      
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8"
        >
          <div className="flex-1 mb-6 lg:mb-0">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent">
              Community Events
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Connect, coordinate, and build your community together
            </p>
            
            {/* Stats */}
            <div className="flex space-x-6 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
                <div className="text-sm text-gray-500">Upcoming</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.today}</div>
                <div className="text-sm text-gray-500">Today</div>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-3"
          >
            <span className="text-xl">📅</span>
            <span>Create Event</span>
          </motion.button>
        </motion.div>

        {/* Filters & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2">
              {filters.map((filter, index) => (
                <motion.button
                  key={filter.key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    activeFilter === filter.key
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{filter.icon}</span>
                  <span>{filter.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Event Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <EventForm 
                onSubmit={handleCreateEvent}
                onCancel={() => setShowForm(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading community events...</p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
            layout
          >
            {filteredEvents.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center"
              >
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No events found</h3>
                <p className="text-gray-600 mb-6 text-lg">
                  {searchTerm || activeFilter !== 'all' 
                    ? 'Try changing your search or filter criteria'
                    : 'Be the first to organize a community event!'
                  }
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Create First Event
                </motion.button>
              </motion.div>
            ) : (
              <AnimatePresence>
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                  layout
                >
                  <EventCard 
                    event={event}
                    onChat={handleOpenChat}
                    onJoin={handleJoin}    // Added onJoin prop here
                  />
                </motion.div>
              ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}

        {/* Event Chat Modal */}
        <AnimatePresence>
          {showChat && selectedEvent && (
            <EventChat 
              event={selectedEvent}
              onClose={() => {
                setShowChat(false);
                setSelectedEvent(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Events;