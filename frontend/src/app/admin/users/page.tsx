'use client';

import { useEffect, useState } from 'react';
import { societyApi } from '@/lib/api';
import { UserInfo } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import toast, { Toaster } from 'react-hot-toast';

const ROLES = ['RESIDENT', 'STAFF', 'SECRETARY', 'ADMIN'];

export default function UsersPage() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [newRole, setNewRole] = useState('');
  const [activeTab, setActiveTab] = useState<'LIST' | 'BULK_UPLOAD' | 'MANUAL_ADD'>('LIST');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'RESIDENT', phoneNumber: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await societyApi.getUsers();
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: number) => {
    try {
      const res = await societyApi.toggleUserActive(userId);
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: res.data.data.isActive } : u))
        );
        toast.success('User status updated');
      }
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const handleVerify = async (userId: number) => {
    try {
      const res = await societyApi.verifyUser(userId);
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isVerified: true } : u))
        );
        toast.success('User verified');
      }
    } catch (err) {
      toast.error('Failed to verify user');
    }
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser || !newRole) return;
    try {
      const res = await societyApi.updateUserRole(selectedUser.id, newRole);
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, role: newRole } : u))
        );
        setShowRoleModal(false);
        toast.success('Role updated');
      }
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingFile(true);
    try {
      const res = await societyApi.bulkUploadUsers(formData);
      if (res.data.success) {
        const { successCount, failCount, errors } = res.data.data;
        if (successCount > 0) {
          toast.success(`Successfully uploaded ${successCount} users`);
          loadUsers(); // Refresh list
        }
        if (failCount > 0) {
          toast.error(`${failCount} rows failed. See console for details.`);
          console.error('Bulk Upload Errors:', errors);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk upload failed');
    } finally {
      setUploadingFile(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await societyApi.createUser(newUser);
      if (res.data.success) {
        toast.success(`User ${newUser.fullName} added successfully. Password is: ${newUser.password}`, { duration: 10000 });
        setNewUser({ fullName: '', email: '', password: '', role: 'RESIDENT', phoneNumber: '' });
        loadUsers();
        setActiveTab('LIST');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add user');
    }
  };

  const downloadTemplate = () => {
    const headers = 'FullName,Email,Password,Role(RESIDENT/STAFF/ADMIN),PhoneNumber,BuildingName,FlatNumber\n';
    const sample = 'John Doe,johndoe@example.com,securepass123,RESIDENT,+919876543210,Tower A,101\nJane Smith,janesmith@example.com,securepass123,STAFF,+919876543211,,\n';
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'User_Bulk_Upload_Template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredUsers = filter === 'ALL'
    ? users
    : users.filter((u) => u.role === filter);

  return (
    <div>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' } }} />

      <div className="top-bar">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage society members, staff, and admin roles</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button 
            className={`btn btn-sm ${activeTab === 'LIST' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('LIST')}
          >
            User List
          </button>
          <button 
            className={`btn btn-sm ${activeTab === 'BULK_UPLOAD' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('BULK_UPLOAD')}
          >
            Bulk Upload
          </button>
          <button 
            className={`btn btn-sm ${activeTab === 'MANUAL_ADD' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('MANUAL_ADD')}
          >
            Add Single User
          </button>
        </div>
      </div>

      {activeTab === 'LIST' && (
        <>
          {/* Role Filter */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {['ALL', ...ROLES].map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={filter === r ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
          >
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div className="glass-card" style={{ padding: 4 }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Flat</th>
                  <th>Verified</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                          {u.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{u.fullName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'
                          ? 'rgba(124,58,237,0.15)' : u.role === 'SECRETARY'
                            ? 'rgba(59,130,246,0.15)' : u.role === 'STAFF'
                              ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)',
                        color: u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'
                          ? '#a78bfa' : u.role === 'SECRETARY'
                            ? '#60a5fa' : u.role === 'STAFF'
                              ? '#fbbf24' : '#94a3b8',
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.phoneNumber || '-'}</td>
                    <td style={{ fontSize: 13 }}>
                      {u.flatNumber ? `${u.buildingName} - ${u.flatNumber}` : '-'}
                    </td>
                    <td>
                      {u.isVerified ? (
                        <span style={{ color: 'var(--accent-emerald)' }}>✅ Yes</span>
                      ) : (
                        <button onClick={() => handleVerify(u.id)} className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '3px 8px' }}>
                          Verify
                        </button>
                      )}
                    </td>
                    <td>
                      <span style={{
                        color: u.isActive ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                        fontWeight: 600, fontSize: 12
                      }}>
                        {u.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => { setSelectedUser(u); setNewRole(u.role); setShowRoleModal(true); }}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                          title="Change Role"
                        >
                          🔑
                        </button>
                        <button
                          onClick={() => handleToggleActive(u.id)}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {u.isActive ? '🚫' : '✅'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}

      {activeTab === 'BULK_UPLOAD' && (
        <div className="glass-card" style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 16 }}>Bulk Upload Users</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
            Easily add multiple residents, staff, or admins by uploading a CSV file.
          </p>

          <div style={{ marginBottom: 24 }}>
            <button onClick={downloadTemplate} className="btn btn-ghost" style={{ width: '100%' }}>
              ⬇️ Download CSV Template
            </button>
          </div>

          <div style={{ 
            border: '2px dashed var(--border-glass)', 
            padding: 40, 
            textAlign: 'center', 
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255,255,255,0.02)'
          }}>
            <h3 style={{ marginBottom: 16, fontSize: 16 }}>Upload your CSV here</h3>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleBulkUpload}
              disabled={uploadingFile}
              id="csv-upload"
              style={{ display: 'none' }}
            />
            <label 
              htmlFor="csv-upload" 
              className="btn btn-primary"
              style={{ cursor: uploadingFile ? 'not-allowed' : 'pointer', opacity: uploadingFile ? 0.7 : 1 }}
            >
              {uploadingFile ? 'Uploading...' : 'Browse CSV File'}
            </label>
          </div>
        </div>
      )}

      {activeTab === 'MANUAL_ADD' && (
        <div className="glass-card" style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 16 }}>Add Single User</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
            Manually create an account for a Resident, Staff, or Admin. They can change their password later.
          </p>

          <form onSubmit={handleManualAdd}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" required 
                value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" required 
                value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="text" className="form-input" required minLength={6} 
                value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" 
                value={newUser.phoneNumber} onChange={e => setNewUser({...newUser, phoneNumber: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>
              Create Account
            </button>
          </form>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Change Role for {selectedUser.fullName}</h3>
            <div className="form-group">
              <label className="form-label">New Role</label>
              <select className="form-select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRoleModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleRoleUpdate} className="btn btn-primary">Update Role</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
