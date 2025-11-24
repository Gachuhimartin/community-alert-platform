import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import SocketIndicator from '../components/common/SocketIndicator';
import AlertCard from '../components/alerts/AlertCard';
import AlertForm from '../components/alerts/AlertForm';
import AlertChat from '../components/alerts/AlertChat';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showAlertChat, setShowAlertChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [socketLoading, setSocketLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { socket, isConnected } = useSocket();
  const { user, loading: authLoading } = useAuth();

  const filters = [
    { key: 'all', label: 'All Alerts', icon: '📋', color: 'gray' },
    { key: 'active', label: 'Active', icon: '🚨', color: 'red' },
    { key: 'safety', label: 'Safety', icon: '🛡️', color: 'orange' },
    { key: 'environment', label: 'Environment', icon: '🌿', color: 'green' },
    { key: 'infrastructure', label: 'Infrastructure', icon: '🏗️', color: 'blue' },
  ];

  useEffect(() => {
    if (!authLoading && user) {
      console.log('🔍 Alerts page - User loaded:', user.username);
      fetchAlerts();
    }
  }, [user, authLoading]);

  useEffect(() => {
    filterAlerts();
  }, [alerts, activeFilter, searchTerm]);

  useEffect(() => {
    if (socket) {
      console.log('🔌 Socket ready, setting up listeners');
      setSocketLoading(false);

      const handleNewAlert = (newAlert) => {
        console.log('📢 New alert received:', newAlert);
        setAlerts(prev => [newAlert, ...prev]);
        
        // Show notification toast
        showNotification(`New ${newAlert.category} alert: ${newAlert.title}`);
      };

      const handleAlertUpdate = (updatedAlert) => {
        console.log('🔄 Alert updated:', updatedAlert);
        setAlerts(prev => 
          prev.map(alert => 
            alert._id === updatedAlert._id ? updatedAlert : alert
          )
        );
      };

      const handleAlertDelete = (deletedAlertId) => {
        console.log('🗑️ Alert deleted:', deletedAlertId);
        setAlerts(prev => prev.filter(alert => alert._id !== deletedAlertId));
      };

      socket.on('alert_broadcast', handleNewAlert);
      socket.on('alert_updated', handleAlertUpdate);
      socket.on('alert_deleted', handleAlertDelete);

      return () => {
        socket.off('alert_broadcast', handleNewAlert);
        socket.off('alert_updated', handleAlertUpdate);
        socket.off('alert_deleted', handleAlertDelete);
      };
    }
  }, [socket]);

  const fetchAlerts = async () => {
    try {
      console.log('📡 Fetching alerts...');
      const response = await api.get('/alerts');
      console.log('✅ Alerts fetched:', response.data.length, 'alerts');
      setAlerts(response.data);
    } catch (error) {
      console.error('❌ Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = alerts;

    // Apply category filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(alert => 
        activeFilter === 'active' ? alert.status === 'active' : alert.category === activeFilter
      );
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAlerts(filtered);
  };

  const showNotification = (message) => {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-right';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 5000);
  };

  const handleCreateAlert = async (alertData) => {
    try {
      console.log('📝 Creating alert:', alertData);
      await api.post('/alerts', alertData);
      setShowForm(false);
      console.log('✅ Alert created successfully');
    } catch (error) {
      console.error('❌ Error creating alert:', error);
      throw error;
    }
  };

  const handleOpenAlertChat = (alert) => {
    console.log('💬 Opening alert chat for:', alert._id);
    setSelectedAlert(alert);
    setShowAlertChat(true);
  };

  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
  };

  if (authLoading || (socketLoading && user)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-red-700 bg-clip-text text-transparent">
              Community Alerts
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Real-time safety updates • {isConnected ? '🟢 Live' : '🟡 Connecting...'}
            </p>
            
            {/* Stats */}
            <div className="flex space-x-6 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                <div className="text-sm text-gray-500">Critical</div>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-3"
          >
            <span className="text-xl">🚨</span>
            <span>Create Alert</span>
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
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
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
                      ? 'bg-red-500 text-white shadow-lg'
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

        {/* Alert Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <AlertForm 
                onSubmit={handleCreateAlert}
                onCancel={() => setShowForm(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alerts Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading community alerts...</p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            layout
          >
            {filteredAlerts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center"
              >
                <div className="text-6xl mb-4">📢</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No alerts found</h3>
                <p className="text-gray-600 mb-6 text-lg">
                  {searchTerm || activeFilter !== 'all' 
                    ? 'Try changing your search or filter criteria'
                    : 'Be the first to report something in your community!'
                  }
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Create First Alert
                </motion.button>
              </motion.div>
            ) : (
              <AnimatePresence>
                {filteredAlerts.map((alert, index) => (
                  <motion.div
                    key={alert._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                    layout
                  >
                    <AlertCard 
                      alert={alert}
                      onChat={handleOpenAlertChat}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}

        {/* Alert Chat Modal */}
        <AnimatePresence>
          {showAlertChat && selectedAlert && (
            <AlertChat 
              alert={selectedAlert}
              onClose={() => {
                setShowAlertChat(false);
                setSelectedAlert(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Alerts;