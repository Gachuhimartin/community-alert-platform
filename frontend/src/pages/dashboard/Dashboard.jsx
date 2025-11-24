import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeAlerts: 0,
    upcomingEvents: 0,
    communityMembers: 1,
    responseRate: 0
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [alertsResponse, eventsResponse] = await Promise.all([
        api.get('/alerts'),
        api.get('/events')
      ]);

      const activeAlerts = alertsResponse.data.filter(alert => alert.status === 'active').length;
      const upcomingEvents = eventsResponse.data.filter(event => 
        new Date(event.date) > new Date()
      ).length;

      // Count unique community members
      const allMembers = new Set();
      eventsResponse.data.forEach(event => {
        event.attendees?.forEach(attendee => {
          if (typeof attendee === 'object') allMembers.add(attendee._id);
          else allMembers.add(attendee);
        });
      });

      // Calculate response rate (mock data for now)
      const responseRate = Math.min(85 + Math.random() * 15, 100);

      // Get recent alerts and events
      const sortedAlerts = alertsResponse.data
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      
      const sortedEvents = eventsResponse.data
        .filter(event => new Date(event.date) > new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);

      setStats({
        activeAlerts,
        upcomingEvents,
        communityMembers: Math.max(allMembers.size, 1),
        responseRate: Math.round(responseRate)
      });
      
      setRecentAlerts(sortedAlerts);
      setUpcomingEvents(sortedEvents);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ number, label, icon, color, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
    >
      <div className="flex items-center justify-between">
        <div>
          <motion.div 
            className={`text-3xl font-bold ${color}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: "spring" }}
          >
            {number}
          </motion.div>
          <div className="text-gray-600 text-sm mt-1">{label}</div>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </motion.div>
  );

  const QuickAction = ({ to, icon, title, description, color, delay }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
    >
      <Link 
        to={to} 
        className="block bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-2xl transition-all duration-300 group hover:scale-105"
      >
        <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
        <div className="mt-4 text-blue-500 font-semibold text-sm group-hover:translate-x-2 transition-transform">
          Get Started →
        </div>
      </Link>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-3">
              Welcome Back! 👋
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl">
              Your community is safer and more connected than ever. Here's what's happening right now.
            </p>
          </div>
          
          {/* Floating elements */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/5 rounded-full blur-lg"></div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <StatCard 
            number={stats.activeAlerts} 
            label="Active Alerts" 
            icon="🚨" 
            color="text-red-600"
            delay={0.1}
          />
          <StatCard 
            number={stats.upcomingEvents} 
            label="Upcoming Events" 
            icon="📅" 
            color="text-green-600"
            delay={0.2}
          />
          <StatCard 
            number={stats.communityMembers} 
            label="Community Members" 
            icon="👥" 
            color="text-blue-600"
            delay={0.3}
          />
          <StatCard 
            number={`${stats.responseRate}%`} 
            label="Response Rate" 
            icon="⚡" 
            color="text-purple-600"
            delay={0.4}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <QuickAction 
            to="/alerts"
            icon="🚨"
            title="View Alerts"
            description="Monitor current safety alerts and community reports in real-time"
            color="bg-red-100"
            delay={0.1}
          />
          <QuickAction 
            to="/alerts"
            icon="📢"
            title="Create Alert"
            description="Report incidents, share warnings, or post important community updates"
            color="bg-blue-100"
            delay={0.2}
          />
          <QuickAction 
            to="/events"
            icon="📅"
            title="Manage Events"
            description="Organize gatherings, meetings, or community activities"
            color="bg-green-100"
            delay={0.3}
          />
        </motion.div>

        {/* Live Activity */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {/* Recent Alerts */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Recent Alerts</h3>
              <Link to="/alerts" className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center">
                View All <span className="ml-1">→</span>
              </Link>
            </div>
            <div className="space-y-4">
              {recentAlerts.length > 0 ? recentAlerts.map((alert, index) => (
                <motion.div
                  key={alert._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'high' ? 'bg-orange-500' :
                    alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                    <p className="text-xs text-gray-500">{new Date(alert.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-lg">{alert.category === 'safety' ? '🚨' : '📢'}</span>
                </motion.div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📭</div>
                  <p>No recent alerts</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Upcoming Events</h3>
              <Link to="/events" className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center">
                View All <span className="ml-1">→</span>
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? upcomingEvents.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">
                      {new Date(event.date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString()} • {event.attendees?.length || 0} attending
                    </p>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📅</div>
                  <p>No upcoming events</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Community Impact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Making a Difference Together</h2>
          <p className="text-green-100 mb-6 max-w-2xl mx-auto">
            Your active participation has helped create a {stats.responseRate}% faster response time 
            in your community. Keep up the great work!
          </p>
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div 
              className="bg-white h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${stats.responseRate}%` }}
              transition={{ delay: 1.2, duration: 1.5, ease: "easeOut" }}
            ></motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;