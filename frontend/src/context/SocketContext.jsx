

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

const showBrowserNotification = (title, options) => {
  if (!("Notification" in window)) {
    console.log("Browser does not support notifications.");
    return;
  }
  if (Notification.permission === "granted") {
    new Notification(title, options);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(title, options);
      }
    });
  }
};

const MessageToast = ({ username, message, timestamp }) => {
  const shortTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const firstChar = username?.charAt(0).toUpperCase() || '?';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', maxWidth: '300px', 
      background: '#fff', borderRadius: '15px', boxShadow: '0 2px 7px rgba(0,0,0,0.15)', 
      padding: '10px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{
        background: '#f44336', color: 'white', borderRadius: '50%', width: '36px', height: '36px', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '12px',
        userSelect: 'none'
      }}>
        {firstChar}
      </div>
      <div style={{flex:1}}>
        <div style={{fontWeight: 'bold', marginBottom: '4px', fontSize: '0.9rem'}}>
          {username}
        </div>
        <div style={{fontSize: '0.85rem', color: '#333'}}>
          {message}
        </div>
      </div>
      <div style={{fontSize: '0.75rem', color: '#999', marginLeft: '8px', userSelect: 'none'}}>
        {shortTime}
      </div>
    </div>
  );
};

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (user) {
      console.log('🔌 Creating socket connection for:', user.username);
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: localStorage.getItem('token')
        },
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelayMax: 5000,
      });

      socketRef.current = newSocket;

      newSocket.on('connect', () => {
        console.log('✅ Socket connected');
        reconnectAttempts.current = 0;
        setIsConnected(true);
        newSocket.emit('join_community', user.community);
      });

      newSocket.on('connect_error', (err) => {
        reconnectAttempts.current++;
        console.error(`Socket connection error, attempt ${reconnectAttempts.current}:`, err);
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          toast.error('Unable to connect to socket server.');
        }
      });

      // Socket event listeners for notifications

      const addNotification = (message) => {
        setNotifications((prev) => [{ message, timestamp: Date.now(), read: false }, ...prev]);
      };

      newSocket.on('alert_broadcast', (alert) => {
        const message = `New Alert: ${alert.title}`;
        toast.info(message);
        showBrowserNotification("New Alert", { body: message });
        addNotification(message);
      });

      newSocket.on('alert_updated', (alert) => {
        const message = `Alert Updated: ${alert.title}`;
        toast.info(message);
        showBrowserNotification("Alert Updated", { body: message });
        addNotification(message);
      });

      newSocket.on('alert_deleted', (alertId) => {
        const message = `An alert was deleted.`;
        toast.info(message);
        showBrowserNotification("Alert Deleted", { body: message });
        addNotification(message);
      });

      newSocket.on('event_broadcast', (event) => {
        const message = `New Event: ${event.title}`;
        toast.info(message);
        showBrowserNotification("New Event", { body: message });
        addNotification(message);
      });

      newSocket.on('event_joined', (data) => {
        const message = `${data.user.username} joined the event: ${data.event.title}`;
        toast.info(message);
        showBrowserNotification("Event Joined", { body: message });
        addNotification(message);
      });

      newSocket.on('new_alert_message', (msg) => {
        toast.info(<MessageToast username={msg.username} message={msg.message} timestamp={msg.timestamp} />);
        showBrowserNotification("Alert Message", { body: `${msg.username}: ${msg.message}` });
        addNotification(`${msg.username}: ${msg.message}`);
      });

      newSocket.on('new_event_message', (msg) => {
        toast.info(<MessageToast username={msg.username} message={msg.message} timestamp={msg.timestamp} />);
        showBrowserNotification("Event Message", { body: `${msg.username}: ${msg.message}` });
        addNotification(`${msg.username}: ${msg.message}`);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        console.log('🧹 Cleaning up socket');
        if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
        }
        setSocket(null);
        setIsConnected(false);
        setNotifications([]);
      };
    } else {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      setNotifications([]);
    }
  }, [user]);

  const markNotificationAsRead = (index) => {
    setNotifications((prev) => {
      const newNotifs = [...prev];
      if (newNotifs[index]) {
        newNotifs[index].read = true;
      }
      return newNotifs;
    });
  };

  // RETURN SOCKET, CONNECTION STATE, NOTIFICATIONS AND MARK AS READ
  const value = {
    socket,
    isConnected,
    notifications,
    markNotificationAsRead,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;