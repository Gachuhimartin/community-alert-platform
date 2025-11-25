import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationsDropdown = ({ notifications, onClose, onMarkAsRead }) => {
  return (
    <AnimatePresence>
      {notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Notifications</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              aria-label="Close notifications"
            >
              &times;
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.map((notif, idx) => (
              <div
                key={notif.timestamp || idx}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 ${
                  !notif.read ? 'bg-gray-50 dark:bg-gray-900 font-semibold' : ''
                }`}
                onClick={() => onMarkAsRead(idx)}
              >
                <div className="text-sm text-gray-900 dark:text-white">{notif.message}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(notif.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      {notifications.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 text-center text-gray-500 dark:text-gray-400"
        >
          No new notifications
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationsDropdown;
