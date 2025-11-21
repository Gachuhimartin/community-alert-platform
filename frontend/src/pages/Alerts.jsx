import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import SocketIndicator from '../components/common/SocketIndicator';
import AlertCard from '../components/alerts/AlertCard';
import AlertForm from '../components/alerts/AlertForm';
import AlertChat from '../components/alerts/AlertChat'; // ADD THIS IMPORT
import api from '../utils/api';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null); // ADD THIS
  const [showAlertChat, setShowAlertChat] = useState(false); // ADD THIS
  const [loading, setLoading] = useState(true);
  const [socketLoading, setSocketLoading] = useState(true);
  const { socket, isConnected } = useSocket();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      console.log('🔍 Alerts page - User loaded:', user.username);
      fetchAlerts();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (socket) {
      console.log('🔌 Socket ready, setting up listeners');
      setSocketLoading(false);

      const handleNewAlert = (newAlert) => {
        console.log('📢 New alert received:', newAlert);
        setAlerts(prev => [newAlert, ...prev]);
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

  const handleStatusUpdate = async (alertId, newStatus) => {
    try {
      await api.patch(`/alerts/${alertId}/status`, { status: newStatus });
    } catch (error) {
      console.error('❌ Error updating alert status:', error);
      alert(error.response?.data?.message || 'Failed to update alert');
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await api.delete(`/alerts/${alertId}`);
    } catch (error) {
      console.error('❌ Error deleting alert:', error);
      alert(error.response?.data?.message || 'Failed to delete alert');
    }
  };

  // ADD THIS FUNCTION
  const handleOpenAlertChat = (alert) => {
    console.log('💬 Opening alert chat for:', alert._id);
    setSelectedAlert(alert);
    setShowAlertChat(true);
  };

  // Show loading while auth or socket is initializing
  if (authLoading || (socketLoading && user)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading alerts...</div>
      </div>
    );
  }

  // Redirect if not authenticated (should be handled by ProtectedRoute, but as fallback)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Please log in to view alerts</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <SocketIndicator />
      
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Community Alerts</h1>
            <p className="text-gray-600 mt-2">
              Real-time updates from your community • {isConnected ? '🟢 Live' : '🟡 Connecting...'}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            + Create Alert
          </button>
        </div>

        {showForm && (
          <div className="mb-8">
            <AlertForm 
              onSubmit={handleCreateAlert}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Loading alerts...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {alerts.length === 0 ? (
              <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">📢</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No alerts yet</h3>
                <p className="text-gray-600 mb-6">Be the first to report something in your community!</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Create First Alert
                </button>
              </div>
            ) : (
              alerts.map(alert => (
                <AlertCard 
                  key={alert._id} 
                  alert={alert}
                  onStatusUpdate={handleStatusUpdate}
                  onDelete={handleDeleteAlert}
                  onChat={handleOpenAlertChat} // ADD THIS PROP
                />
              ))
            )}
          </div>
        )}

        {/* ADD ALERT CHAT MODAL */}
        {showAlertChat && selectedAlert && (
          <AlertChat 
            alert={selectedAlert}
            onClose={() => {
              setShowAlertChat(false);
              setSelectedAlert(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Alerts;