import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';

const SocketIndicator = () => {
  const { socket, isConnected } = useSocket();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  }, [isConnected]);

  // Don't render if no socket (user not authenticated)
  if (!socket) return null;

  return (
    <>
      {/* Connection Status Dot */}
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-600 hidden md:block">
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Connection Notification */}
      {showNotification && (
        <div className="fixed top-16 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
          🔗 Connected to community
        </div>
      )}
    </>
  );
};

export default SocketIndicator;