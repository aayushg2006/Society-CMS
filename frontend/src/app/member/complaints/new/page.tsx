'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { complaintApi, societyApi, fileApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import toast, { Toaster } from 'react-hot-toast';

const CATEGORIES = ['PLUMBING', 'ELECTRICAL', 'CIVIL', 'PEST_CONTROL', 'SECURITY', 'CLEANING', 'PARKING', 'NOISE', 'OTHER'];
const SCOPES = ['FLAT', 'BUILDING', 'SOCIETY'];

export default function NewComplaintPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [flats, setFlats] = useState<any[]>([]);
  const [commonAreas, setCommonAreas] = useState<any[]>([]);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    scope: 'FLAT',
    flatId: '',
    commonAreaId: '',
    imageUrl: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
    getLocation();
  }, []);

  const loadData = async () => {
    try {
      const [flatsRes, areasRes] = await Promise.all([
        societyApi.getFlats(),
        societyApi.getCommonAreas(),
      ]);
      if (flatsRes.data.success) setFlats(flatsRes.data.data);
      if (areasRes.data.success) setCommonAreas(areasRes.data.data);
    } catch (err) {
      // Silently handle
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));

          try {
            const res = await societyApi.verifyGeoFence({ latitude: lat, longitude: lng });
            if (res.data.success) {
              const isWithin = res.data.data.withinFence;
              setGeoStatus(isWithin ? 'within' : 'outside');
            }
          } catch {
            setGeoStatus(null);
          }
        },
        () => {
          setGeoStatus('unavailable');
        }
      );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (form.scope === 'BUILDING' || form.scope === 'SOCIETY') {
      const checkDup = async () => {
        try {
          const res = await complaintApi.checkDuplicate(
            form.category, 
            form.scope, 
            form.commonAreaId ? parseInt(form.commonAreaId) : undefined
          );
          if (res.data.success && res.data.data.isDuplicate) {
            setDuplicateInfo(res.data.data);
          } else {
            setDuplicateInfo(null);
          }
        } catch (e) {
          setDuplicateInfo(null);
        }
      };
      
      const timer = setTimeout(() => {
        checkDup();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDuplicateInfo(null);
    }
  }, [form.category, form.scope, form.commonAreaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = form.imageUrl;
      
      if (selectedFile) {
        const uploadRes = await fileApi.uploadImage(selectedFile);
        if (uploadRes.data.success) {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
          const baseUrl = apiBase.replace('/api', '');
          finalImageUrl = baseUrl + uploadRes.data.data;
        } else {
          toast.error('Image upload failed');
          setLoading(false);
          return;
        }
      }

      const payload: any = {
        title: form.title,
        description: form.description,
        category: form.category,
        scope: form.scope,
        imageUrl: finalImageUrl || undefined,
        latitude: form.latitude,
        longitude: form.longitude,
      };
      if (form.flatId) payload.flatId = parseInt(form.flatId);
      if (form.commonAreaId) payload.commonAreaId = parseInt(form.commonAreaId);

      const res = await complaintApi.create(payload);
      if (res.data.success) {
        toast.success('Complaint created successfully!');
        router.push(`/member/complaints/${res.data.data.id}`);
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' } }} />

      <div className="top-bar">
        <div>
          <h1 className="page-title">New Complaint</h1>
          <p className="page-subtitle">Submit a new complaint for your society</p>
        </div>
      </div>

      {/* Geo-fence Status */}
      {geoStatus && (
        <div className="glass-card" style={{
          padding: 16, marginBottom: 20,
          borderColor: geoStatus === 'within' ? 'rgba(16,185,129,0.3)' : geoStatus === 'outside' ? 'rgba(244,63,94,0.3)' : 'var(--border-glass)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{geoStatus === 'within' ? '✅' : geoStatus === 'outside' ? '⚠️' : '📍'}</span>
            <div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                {geoStatus === 'within' ? 'Location Verified' :
                  geoStatus === 'outside' ? 'Outside Society Premises' :
                    'Location not available'}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>
                {geoStatus === 'within' ? 'You are within the society geo-fence' :
                  geoStatus === 'outside' ? 'You can still submit, but it will be flagged' :
                    'Enable location for geo-fence verification'}
              </span>
            </div>
          </div>
        </div>
      )}

      {duplicateInfo && (
        <div className="glass-card animate-fade-in-up" style={{ padding: 24, marginBottom: 20, maxWidth: 700, background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 24 }}>💡</span>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 4 }}>
                Similar Issue Already Reported!
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                It looks like someone has already reported <strong>"{duplicateInfo.existingComplaintTitle}"</strong> in this category. 
                Instead of creating a new ticket, you can upvote this existing issue to increase its priority!
              </p>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  router.push(`/member/complaints/${duplicateInfo.existingComplaintId}`);
                }}
                className="btn btn-primary btn-sm"
              >
                View & Upvote Existing Issue ({duplicateInfo.existingUpvoteCount} 👍)
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card animate-fade-in-up" style={{ padding: 32, maxWidth: 700 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              id="complaint-title"
              type="text"
              name="title"
              className="form-input"
              placeholder="Brief description of the issue"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              id="complaint-description"
              name="description"
              className="form-textarea"
              placeholder="Provide detailed information about the complaint..."
              value={form.description}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                id="complaint-category"
                name="category"
                className="form-select"
                value={form.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Scope</label>
              <select
                id="complaint-scope"
                name="scope"
                className="form-select"
                value={form.scope}
                onChange={handleChange}
              >
                {SCOPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {form.scope === 'FLAT' && flats.length > 0 && (
            <div className="form-group">
              <label className="form-label">Flat</label>
              <select
                name="flatId"
                className="form-select"
                value={form.flatId}
                onChange={handleChange}
              >
                <option value="">Select flat (optional)</option>
                {flats.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.building?.name || 'Building'} - {f.flatNumber} (Floor {f.floorNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          {(form.scope === 'BUILDING' || form.scope === 'SOCIETY') && commonAreas.length > 0 && (
            <div className="form-group">
              <label className="form-label">Common Area</label>
              <select
                name="commonAreaId"
                className="form-select"
                value={form.commonAreaId}
                onChange={handleChange}
              >
                <option value="">Select common area (optional)</option>
                {commonAreas.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Upload Image (Optional)</label>
            <input
              type="file"
              accept="image/*"
              className="form-input"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              style={{ paddingTop: 8 }}
            />
            {selectedFile && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                Selected: {selectedFile.name}
              </div>
            )}
          </div>

          <button
            id="complaint-submit"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Submitting...' : '📋 Submit Complaint'}
          </button>
        </form>
      </div>
    </div>
  );
}
