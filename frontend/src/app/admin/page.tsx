'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { societyApi, complaintApi } from '@/lib/api';
import { DashboardStats, Complaint } from '@/lib/types';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const CHART_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, complaintsRes, buildingsRes] = await Promise.all([
        societyApi.getDashboard(),
        complaintApi.getAll({ page: 0, size: 5, sortBy: 'createdAt', sortDir: 'desc' }),
        societyApi.getBuildings(),
      ]);
      
      if (isAdmin && buildingsRes.data.success && buildingsRes.data.data.length === 0) {
        toast.error('Please add buildings and infrastructure details first.');
        router.push('/admin/buildings');
        return;
      }

      if (dashRes.data.success) setStats(dashRes.data.data);
      if (complaintsRes.data.success) setRecentComplaints(complaintsRes.data.data.content);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  const categoryData = stats?.complaintsByCategory
    ? Object.entries(stats.complaintsByCategory).map(([name, value]) => ({ name, value }))
    : [];

  const statusData = stats?.complaintsByStatus
    ? Object.entries(stats.complaintsByStatus).map(([name, value]) => ({ name, value }))
    : [];

  const getStatusBadge = (status: string) => {
    const cls = `badge badge-${status.toLowerCase().replace('_', '-')}`;
    return <span className={cls}>{status.replace('_', ' ')}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    const cls = `badge badge-${priority.toLowerCase()}`;
    return <span className={cls}>{priority}</span>;
  };

  return (
    <div>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' } }} />

      {/* Header */}
      <div className="top-bar">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.fullName} 👋</p>
        </div>
        <div className="user-menu">
          <div className="user-info">
            <div className="user-name">{user?.societyName}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="stats-grid animate-fade-in-up">
          <div className="glass-card stat-card">
            <div className="stat-icon violet">📋</div>
            <div className="stat-value">{stats.totalComplaints}</div>
            <div className="stat-label">Total Complaints</div>
          </div>
          <div className="glass-card stat-card">
            <div className="stat-icon blue">🔵</div>
            <div className="stat-value">{stats.openComplaints}</div>
            <div className="stat-label">Open</div>
          </div>
          <div className="glass-card stat-card">
            <div className="stat-icon amber">⏳</div>
            <div className="stat-value">{stats.inProgressComplaints}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="glass-card stat-card">
            <div className="stat-icon emerald">✅</div>
            <div className="stat-value">{stats.resolvedComplaints}</div>
            <div className="stat-label">Resolved</div>
          </div>
          {isAdmin && (
            <>
              <div className="glass-card stat-card">
                <div className="stat-icon rose">🔴</div>
                <div className="stat-value">{stats.criticalComplaints}</div>
                <div className="stat-label">Critical</div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-icon amber">⚠️</div>
                <div className="stat-value">{stats.overdueComplaints}</div>
                <div className="stat-label">Overdue</div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-icon blue">👥</div>
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Total Users</div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-icon emerald">🛠️</div>
                <div className="stat-value">{stats.totalStaff}</div>
                <div className="stat-label">Staff Members</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Charts Row */}
      {isAdmin && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
          {/* Category Chart */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Complaints by Category</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }}
                  />
                  <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No data yet</p></div>
            )}
          </div>

          {/* Status Pie Chart */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Status Distribution</h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No data yet</p></div>
            )}
            {statusData.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 8 }}>
                {statusData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Complaints */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Complaints</h3>
          <Link href="/admin/complaints" className="btn btn-ghost btn-sm">
            View All →
          </Link>
        </div>

        {recentComplaints.length > 0 ? (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map((c) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/admin/complaints/${c.id}`}>
                    <td style={{ color: 'var(--text-muted)' }}>#{c.id}</td>
                    <td style={{ fontWeight: 500, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </td>
                    <td><span className="badge" style={{ background: 'rgba(124,58,237,0.12)', color: '#a78bfa' }}>{c.category}</span></td>
                    <td>{getPriorityBadge(c.priority)}</td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.userName}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No complaints yet</div>
            <div className="empty-state-desc">Complaints will appear here once created</div>
          </div>
        )}
      </div>
    </div>
  );
}
