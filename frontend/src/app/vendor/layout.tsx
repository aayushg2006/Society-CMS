'use client';

import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const menuItems = {
  main: [
    { href: '/vendor', label: 'Dashboard', icon: '📊' },
    { href: '/vendor/tasks', label: 'Assigned Tasks', icon: '📋' },
    { href: '/vendor/notifications', label: 'Notifications', icon: '🔔' },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'STAFF') {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  if (!mounted || isLoading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return null;

  const userInitials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="page-container portal-vendor">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏘️</div>
          <div>
            <div className="sidebar-logo-text">SocietyCMS</div>
            <div className="sidebar-logo-sub">{user.societyName || 'Platform'}</div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Navigation</div>
          {menuItems.main
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
        </div>



        {/* User Profile at Bottom */}
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px' }}>
            <div className="user-avatar">{userInitials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.fullName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {user.role}
              </div>
            </div>
          </div>
          <Link
            href="/change-password"
            className="sidebar-link"
            style={{ width: '100%', marginTop: 8 }}
          >
            <span>🔑</span>
            <span>Change Password</span>
          </Link>
          <button
            onClick={logout}
            className="sidebar-link"
            style={{ width: '100%', marginTop: 4, color: 'var(--accent-rose)' }}
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
