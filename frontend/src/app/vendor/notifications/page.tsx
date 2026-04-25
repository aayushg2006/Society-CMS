'use client';

import { useEffect, useState } from 'react';
import { notificationApi } from '@/lib/api';
import { Notification } from '@/lib/types';
import toast, { Toaster } from 'react-hot-toast';
import { format } from 'date-fns';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getAll({ page: 0, size: 50 });
      if (res.data.success) {
        setNotifications(res.data.data.content);
      }
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const res = await notificationApi.markAsRead(id);
      if (res.data.success) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (err) {
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Toaster position="top-right" />
      <div className="top-bar">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Tasks and assignments</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {notifications.length > 0 ? (
          <div className="notification-list">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--border-glass)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: !n.isRead ? 'rgba(124, 58, 237, 0.05)' : 'transparent',
                  display: 'flex',
                  gap: 16
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  background: !n.isRead ? 'linear-gradient(135deg, #7c3aed, #3b82f6)' : 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0
                }}>
                  {n.title.toLowerCase().includes('assigned') ? '🛠️' : '🔔'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <h3 style={{ 
                      fontSize: 16, 
                      fontWeight: !n.isRead ? 700 : 600,
                      color: !n.isRead ? '#fff' : 'var(--text-secondary)'
                    }}>
                      {n.title}
                    </h3>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {format(new Date(n.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p style={{ 
                    fontSize: 14, 
                    lineHeight: 1.5, 
                    color: !n.isRead ? 'var(--text-secondary)' : 'var(--text-muted)'
                  }}>
                    {n.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '80px 40px' }}>
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No notifications yet</div>
          </div>
        )}
      </div>
    </div>
  );
}
