'use client';

import { useEffect, useState } from 'react';
import { complaintApi } from '@/lib/api';
import { Complaint } from '@/lib/types';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadComplaints();
  }, [page]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintApi.getMy(page, 10);
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
          <h1 className="page-title">My Complaints</h1>
          <p className="page-subtitle">Track all complaints you have submitted</p>
        </div>
        <Link href="/member/complaints/new" className="btn btn-primary">
          ✏️ New Complaint
        </Link>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : complaints.length > 0 ? (
        <>
          {complaints.map((c) => (
            <Link href={`/member/complaints/${c.id}`} key={c.id}>
              <div className="glass-card complaint-card">
                <div className="complaint-card-header">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>#{c.id}</span>
                      <span className="complaint-title">{c.title}</span>
                    </div>
                    <p className="complaint-description">{c.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {getPriorityBadge(c.priority)}
                    {getStatusBadge(c.status)}
                  </div>
                </div>
                <div className="complaint-meta">
                  <span>📁 {c.category}</span>
                  {c.assignedStaffName && <span>🛠️ Assigned: {c.assignedStaffName}</span>}
                  <span>👍 {c.upvoteCount}</span>
                  <span>📅 {new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}

          {totalPages > 1 && (
            <div className="pagination">
              <button className="pagination-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Previous</button>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Page {page + 1} of {totalPages}</span>
              <button className="pagination-btn" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </>
      ) : (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-title">No complaints submitted yet</div>
            <div className="empty-state-desc">Create your first complaint to get started</div>
            <Link href="/member/complaints/new" className="btn btn-primary" style={{ marginTop: 16 }}>
              ✏️ Create Complaint
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
