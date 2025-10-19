'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  actionUrl?: string;
  createdAt: string;
}

export default function NotificationBell({ userId: propUserId }: { userId?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // Auto-fetch userId from session/localStorage
  useEffect(() => {
    const fetchUserId = async () => {
      // Use prop if provided
      if (propUserId) {
        setUserId(propUserId);
        return;
      }

      // Try to get from session API
      try {
        const sessionId = localStorage.getItem('frejfund-session-id');
        if (sessionId) {
          const res = await fetch(`/api/session/get?sessionId=${sessionId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.session?.userId) {
              setUserId(data.session.userId);
              return;
            }
          }
        }
      } catch {}

      // Fallback: check if there's a deep analysis for this session
      try {
        const sessionId = localStorage.getItem('frejfund-session-id');
        if (sessionId) {
          const res = await fetch(`/api/deep-analysis?sessionId=${sessionId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.userId) {
              setUserId(data.userId);
            }
          }
        }
      } catch {}
    };

    fetchUserId();
  }, [propUserId]);

  const loadNotifications = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/notifications/unread?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll every 30s
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications/unread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notificationId }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setShowDropdown(false);
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  if (!userId) return null;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-black">Notifications</h3>
              <button
                onClick={() => setShowDropdown(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No new notifications</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            notification.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-black text-sm">{notification.title}</h4>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded-full flex-shrink-0"
                        >
                          <Check className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    // Mark all as read
                    notifications.forEach((n) => markAsRead(n.id));
                  }}
                  className="w-full text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

