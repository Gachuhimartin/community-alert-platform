import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENT_CATEGORIES } from '../../utils/constants';

const EventForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: 'cleanup',
    maxAttendees: 50
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Event title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.date) newErrors.date = 'Event date is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (formData.maxAttendees < 1) newErrors.maxAttendees = 'Must have at least 1 attendee';
    
    // Validate date is in future
    if (formData.date && new Date(formData.date) <= new Date()) {
      newErrors.date = 'Event must be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        title: '',
        description: '',
        date: '',
        location: '',
        category: 'cleanup',
        maxAttendees: 50
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString().slice(0, 16);

  const categoryIcons = {
    cleanup: '🧹',
    meeting: '👥',
    workshop: '🎓',
    social: '🎉',
    other: '❓'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-8 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-100 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>
      
      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl text-white">📅</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent">
              Create Event
            </h2>
            <p className="text-gray-600">Organize a community gathering</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-3">
              Event Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={100}
              className={`w-full px-4 py-4 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 ${
                errors.title ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Community Park Cleanup, Neighborhood Meeting..."
            />
            <AnimatePresence>
              {errors.title && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-500 text-sm mt-2 flex items-center space-x-1"
                >
                  <span>⚠️</span>
                  <span>{errors.title}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-3">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              maxLength={500}
              rows={4}
              className={`w-full px-4 py-4 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Describe the event, what to bring, meeting point..."
            />
            <div className="flex justify-between items-center mt-2">
              <AnimatePresence>
                {errors.description && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-500 text-sm flex items-center space-x-1"
                  >
                    <span>⚠️</span>
                    <span>{errors.description}</span>
                  </motion.p>
                )}
              </AnimatePresence>
              <div className={`text-sm ${
                formData.description.length > 450 ? 'text-red-500' : 'text-gray-500'
              }`}>
                {formData.description.length}/500
              </div>
            </div>
          </motion.div>

          {/* Date & Category */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-3">
                Event Date & Time *
              </label>
              <input
                type="datetime-local"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                min={now}
                className={`w-full px-4 py-4 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 ${
                  errors.date ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              <AnimatePresence>
                {errors.date && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-500 text-sm mt-2 flex items-center space-x-1"
                  >
                    <span>⚠️</span>
                    <span>{errors.date}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-3">
                Category *
              </label>
              <div className="relative">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 appearance-none"
                >
                  {Object.entries(EVENT_CATEGORIES).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {categoryIcons[formData.category]}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Location & Attendees */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-3">
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className={`w-full px-4 py-4 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 ${
                  errors.location ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Where is the event happening?"
              />
              <AnimatePresence>
                {errors.location && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-500 text-sm mt-2 flex items-center space-x-1"
                  >
                    <span>⚠️</span>
                    <span>{errors.location}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label htmlFor="maxAttendees" className="block text-sm font-semibold text-gray-700 mb-3">
                Maximum Attendees *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="maxAttendees"
                  name="maxAttendees"
                  value={formData.maxAttendees}
                  onChange={handleChange}
                  required
                  min="1"
                  max="500"
                  className={`w-full px-4 py-4 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 ${
                    errors.maxAttendees ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  👥
                </div>
              </div>
              <AnimatePresence>
                {errors.maxAttendees && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-500 text-sm mt-2 flex items-center space-x-1"
                  >
                    <span>⚠️</span>
                    <span>{errors.maxAttendees}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex space-x-4 pt-6"
          >
            {onCancel && (
              <motion.button
                type="button"
                onClick={onCancel}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 border-2 border-transparent hover:border-gray-300"
              >
                Cancel
              </motion.button>
            )}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Event...</span>
                </>
              ) : (
                <>
                  <span>🎉</span>
                  <span>Create Event</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
};

export default EventForm;