'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { complaintApi, societyApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { uploadComplaintImage } from '@/lib/supabase';
import { Complaint, ActivityLog, UserInfo } from '@/lib/types';
import toast, { Toaster } from 'react-hot-toast';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

export default function ComplaintDetailPage() {
  const params = useParams();
  const { user, isAdmin, isStaff } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [staff, setStaff] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Assign Staff
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignComment, setAssignComment] = useState('');

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      const id = Number(params.id);
      const [compRes, logsRes] = await Promise.all([
        complaintApi.getById(id),
        complaintApi.getActivityLogs(id),
      ]);
      if (compRes.data.success) setComplaint(compRes.data.data);
      if (logsRes.data.success) setActivityLogs(logsRes.data.data);

      if (isAdmin) {
        const staffRes = await societyApi.getStaff();
        if (staffRes.data.success) setStaff(staffRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load complaint');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!complaint) return;
    try {
      const res = await complaintApi.upvote(complaint.id);
      if (res.data.success) {
        setComplaint(res.data.data);
        toast.success('Upvoted!');
      }
    } catch (err) {
      toast.error('Failed to upvote');
    }
  };

  const handleFollow = async () => {
    if (!complaint) return;
    try {
      await complaintApi.toggleFollow(complaint.id);
      setComplaint((prev) => prev ? { ...prev, isFollowing: !prev.isFollowing } : null);
      toast.success(complaint.isFollowing ? 'Unfollowed' : 'Following!');
    } catch (err) {
      toast.error('Failed to toggle follow');
    }
  };

  const handleStatusUpdate = async () => {
    if (!complaint || !newStatus) return;

    if (newStatus === 'RESOLVED' && (!beforeFile || !afterFile)) {
      toast.error('Please upload both before and after images to resolve this task.');
      return;
    }

    try {
      setIsUploading(true);
      let vendorBeforeImageUrl;
      let vendorAfterImageUrl;

      if (newStatus === 'RESOLVED' && beforeFile && afterFile) {
        vendorBeforeImageUrl = await uploadComplaintImage(beforeFile);
        vendorAfterImageUrl = await uploadComplaintImage(afterFile);

        if (!vendorBeforeImageUrl || !vendorAfterImageUrl) {
          toast.error('Failed to upload images to Supabase. Make sure you configured .env.local!');
          setIsUploading(false);
          return;
        }
      }

      const res = await complaintApi.updateStatus(complaint.id, {
        status: newStatus,
        comment: statusComment || undefined,
        vendorBeforeImageUrl,
        vendorAfterImageUrl,
      } as any);

      if (res.data.success) {
        setComplaint(res.data.data);
        setShowStatusModal(false);
        setNewStatus('');
        setStatusComment('');
        setBeforeFile(null);
        setAfterFile(null);
        toast.success('Status updated!');
        loadData();
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!complaint || !selectedStaffId) return;
    try {
      const res = await complaintApi.assignStaff(complaint.id, {
        staffId: parseInt(selectedStaffId),
        comment: assignComment || undefined,
      });
      if (res.data.success) {
        setComplaint(res.data.data);
        setShowAssignModal(false);
        setSelectedStaffId('');
        setAssignComment('');
        toast.success('Staff assigned!');
        loadData();
      }
    } catch (err) {
      toast.error('Failed to assign staff');
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  if (!complaint) {
    return (
      <div className="glass-card empty-state" style={{ padding: 40 }}>
        <div className="empty-state-icon">❌</div>
        <div className="empty-state-title">Complaint not found</div>
      </div>
    );
  }

  const getStatusBadge = (s: string) => (
    <span className={`badge badge-${s.toLowerCase().replace('_', '-')}`}>{s.replace('_', ' ')}</span>
  );
  const getPriorityBadge = (p: string) => (
    <span className={`badge badge-${p.toLowerCase()}`}>{p}</span>
  );

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      'CREATED': '📋', 'STATUS_CHANGED': '🔄', 'ASSIGNED': '👤',
      'UPVOTED': '👍', 'PRIORITY_ESCALATED': '⬆️', 'AUTO_ASSIGNED': '🤖',
      'OVERDUE_ESCALATED': '⏰',
    };
    return icons[action] || '📝';
  };

  return (
    <div>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' } }} />

      {/* Back Button */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => window.history.back()} className="btn btn-ghost btn-sm">
          ← Back to Complaints
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
        {/* Main Content */}
        <div>
          {/* Complaint Header */}
          <div className="glass-card animate-fade-in-up" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>#{complaint.id}</span>
                  {getStatusBadge(complaint.status)}
                  {getPriorityBadge(complaint.priority)}
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>{complaint.title}</h1>
              </div>
            </div>

            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
              {complaint.description}
            </p>

            {complaint.imageUrl && (
              <div style={{ marginBottom: 16, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Resident Attachment</div>
                <img src={complaint.imageUrl} alt="Complaint" style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }} />
              </div>
            )}

            {(complaint.vendorBeforeImageUrl || complaint.vendorAfterImageUrl) && (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border-glass)' }}>Verification Images</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {complaint.vendorBeforeImageUrl && (
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Before</div>
                      <img src={complaint.vendorBeforeImageUrl} alt="Before" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                    </div>
                  )}
                  {complaint.vendorAfterImageUrl && (
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>After</div>
                      <img src={complaint.vendorAfterImageUrl} alt="After" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Meta Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, padding: 16, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Category</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>📁 {complaint.category}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Scope</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>🏢 {complaint.scope}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Submitted By</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>👤 {complaint.userName}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Created</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>📅 {new Date(complaint.createdAt).toLocaleDateString()}</div>
              </div>
              {complaint.flatNumber && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Location</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>🏠 {complaint.buildingName} - {complaint.flatNumber}</div>
                </div>
              )}
              {complaint.commonAreaName && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Area</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>📍 {complaint.commonAreaName}</div>
                </div>
              )}
              {complaint.assignedStaffName && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Assigned To</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>🛠️ {complaint.assignedStaffName}</div>
                </div>
              )}
              {complaint.expectedCompletionDate && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Expected By</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>⏰ {new Date(complaint.expectedCompletionDate).toLocaleDateString()}</div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              <button onClick={handleUpvote} className="btn btn-ghost btn-sm">
                👍 Upvote ({complaint.upvoteCount})
              </button>
              <button onClick={handleFollow} className="btn btn-ghost btn-sm">
                {complaint.isFollowing ? '🔕 Unfollow' : '🔔 Follow'} ({complaint.followerCount})
              </button>
              {(isAdmin || isStaff) && (
                <button onClick={() => { setNewStatus(complaint.status); setShowStatusModal(true); }} className="btn btn-primary btn-sm">
                  🔄 Update Status
                </button>
              )}
              {isAdmin && (
                <button onClick={() => setShowAssignModal(true)} className="btn btn-success btn-sm">
                  👤 Assign Staff
                </button>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="glass-card" style={{ padding: 28, marginTop: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Activity Timeline</h3>
            {activityLogs.length > 0 ? (
              <ul className="timeline">
                {activityLogs.map((log) => (
                  <li key={log.id} className="timeline-item">
                    <div className={`timeline-dot ${log.details?.startsWith('[SYSTEM]') ? 'system' : ''}`}>
                      {getActionIcon(log.action)}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-action">
                        {log.action.replace('_', ' ')}
                        <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                          by {log.actorName}
                        </span>
                      </div>
                      <div className="timeline-details">{log.details}</div>
                      <div className="timeline-time">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state" style={{ padding: 20 }}>
                <p style={{ color: 'var(--text-muted)' }}>No activity yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div>
          {/* Quick Stats */}
          <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Quick Info</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Status</span>
                {getStatusBadge(complaint.status)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Priority</span>
                {getPriorityBadge(complaint.priority)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Upvotes</span>
                <span style={{ fontWeight: 600 }}>👍 {complaint.upvoteCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Followers</span>
                <span style={{ fontWeight: 600 }}>🔔 {complaint.followerCount}</span>
              </div>
              {complaint.resolvedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Resolved</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>
                    {new Date(complaint.resolvedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Staff Card */}
          {complaint.assignedStaffName && (
            <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Assigned Staff</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 16 }}>
                  {complaint.assignedStaffName[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{complaint.assignedStaffName}</div>
                  {complaint.assignedStaffSpecialization && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{complaint.assignedStaffSpecialization}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Update Status</h3>
            <div className="form-group">
              <label className="form-label">New Status</label>
              <select
                className="form-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Comment (Optional)</label>
              <textarea
                className="form-textarea"
                placeholder="Add a note about this status change..."
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                rows={3}
                disabled={isUploading}
              />
            </div>

            {newStatus === 'RESOLVED' && (
              <div className="glass-card" style={{ padding: 16, marginBottom: 20, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--accent-emerald)' }}>Upload Verification Images Required</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 12 }}>Before Fix Image</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setBeforeFile(e.target.files?.[0] || null)}
                      style={{ fontSize: 13, color: 'var(--text-muted)' }}
                      disabled={isUploading}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 12 }}>After Fix Image</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setAfterFile(e.target.files?.[0] || null)}
                      style={{ fontSize: 13, color: 'var(--text-muted)' }}
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowStatusModal(false)} className="btn btn-ghost" disabled={isUploading}>Cancel</button>
              <button onClick={handleStatusUpdate} className="btn btn-primary" disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Assign Staff</h3>
            <div className="form-group">
              <label className="form-label">Select Staff Member</label>
              <select
                className="form-select"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
              >
                <option value="">Select staff...</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} {s.staffSpecialization ? `(${s.staffSpecialization})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Comment (Optional)</label>
              <textarea
                className="form-textarea"
                placeholder="Add assignment notes..."
                value={assignComment}
                onChange={(e) => setAssignComment(e.target.value)}
                rows={3}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAssignModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleAssignStaff} className="btn btn-success">Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
