'use client';

import { useEffect, useState } from 'react';
import { complaintApi } from '@/lib/api';
import { Complaint, Page } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

const STATUSES = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

export default function ComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    loadComplaints();
  }, [page, status, search]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const params: any = { page, size: 10, sortBy: 'createdAt', sortDir: 'desc' };
      if (status !== 'ALL') params.status = status;
      if (search) params.search = search;

      const res = await complaintApi.getAll(params);
      if (res.data.success) {
        setComplaints(res.data.data.content);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (err) {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  const getStatusBadge = (s: string) => (
    <span className={`badge badge-${s.toLowerCase().replace('_', '-')}`}>{s.replace('_', ' ')}</span>
  );

  const getPriorityBadge = (p: string) => (
    <span className={`badge badge-${p.toLowerCase()}`}>{p}</span>
  );

  return (
    <div>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' } }} />

      <div className="top-bar">
        <div>
          <h1 className="page-title">Complaints</h1>
          <p className="page-subtitle">Browse and manage all complaints in your society</p>
        </div>
      </div>
      {/* Filters */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(0); }}
              className={status === s ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search complaints..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ width: 240, padding: '8px 14px', fontSize: 13 }}
          />
          <button type="submit" className="btn btn-ghost btn-sm">🔍</button>
        </form>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : complaints.length > 0 ? (
        <>
          {complaints.map((c) => (
            <Link href={`/admin/complaints/${c.id}`} key={c.id}>
              <div className="glass-card complaint-card animate-fade-in-up">
                <div className="complaint-card-header">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>#{c.id}</span>
                      <span className="complaint-title">{c.title}</span>
                    </div>
                    <p className="complaint-description">{c.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {getPriorityBadge(c.priority)}
                    {getStatusBadge(c.status)}
                  </div>
                </div>
                <div className="complaint-meta">
                  <span>📁 {c.category}</span>
                  <span>👤 {c.userName}</span>
                  {c.flatNumber && <span>🏠 {c.buildingName} - {c.flatNumber}</span>}
                  {c.assignedStaffName && <span>🛠️ {c.assignedStaffName}</span>}
                  <span>👍 {c.upvoteCount}</span>
                  <span>📅 {new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                ← Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(0, Math.min(page - 2, totalPages - 5));
                const pageNum = start + i;
                return (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${page === pageNum ? 'active' : ''}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              <button
                className="pagination-btn"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No complaints found</div>
            <div className="empty-state-desc">
              {search ? 'Try a different search term' : 'Be the first to create a complaint!'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
