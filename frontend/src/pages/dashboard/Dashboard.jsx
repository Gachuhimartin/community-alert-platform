import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeAlerts: 0,
    upcomingEvents: 0,
    communityMembers: 1 // Starts with current user
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [alertsResponse, eventsResponse] = await Promise.all([
        api.get('/alerts'),
        api.get('/events')
      ]);

      const activeAlerts = alertsResponse.data.filter(alert => alert.status === 'active').length;
      const upcomingEvents = eventsResponse.data.filter(event => 
        new Date(event.date) > new Date()
      ).length;

      // Count unique community members from events and alerts
      const allMembers = new Set();
      eventsResponse.data.forEach(event => {
        event.attendees?.forEach(attendee => {
          if (typeof attendee === 'object') allMembers.add(attendee._id);
          else allMembers.add(attendee);
        });
      });

      setStats({
        activeAlerts,
        upcomingEvents,
        communityMembers: Math.max(allMembers.size, 1) // At least current user
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Community Alert! 🎉
          </h1>
          <p className="text-gray-600 text-lg">
            Stay connected with your community through real-time alerts and events.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link 
            to="/alerts" 
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition group"
          >
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <span className="text-2xl">🚨</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">View Alerts</h3>
            <p className="text-gray-600">See current community alerts and reports</p>
          </Link>

          <Link 
            to="/alerts" 
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <span className="text-2xl">📢</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Alert</h3>
            <p className="text-gray-600">Report an issue or share important information</p>
          </Link>

          <Link 
            to="/events" 
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Events</h3>
            <p className="text-gray-600">Join or organize community events</p>
          </Link>
        </div>

        {/* Live Stats */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6">Community Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{stats.activeAlerts}</div>
              <div className="text-blue-100">Active Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{stats.upcomingEvents}</div>
              <div className="text-blue-100">Upcoming Events</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{stats.communityMembers}</div>
              <div className="text-blue-100">Community Members</div>
            </div>
          </div>
        </div>

        {/* Recent Activity Preview */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Alerts</h3>
            <div className="space-y-3">
              <Link to="/alerts" className="block text-blue-600 hover:text-blue-700 text-sm">
                View all alerts →
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              <Link to="/events" className="block text-blue-600 hover:text-blue-700 text-sm">
                View all events →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;