'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth, getPortalPath } from '@/lib/auth';
import toast, { Toaster } from 'react-hot-toast';

export default function RegisterSocietyPage() {
  const [form, setForm] = useState({
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminConfirmPassword: '',
    adminPhone: '',
    societyName: '',
    societyCode: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    geoFenceLatitude: null as number | null,
    geoFenceLongitude: null as number | null,
    geoFenceRadius: 500.0,
  });
  
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Fetching location...');
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm((prev) => ({
            ...prev,
            geoFenceLatitude: position.coords.latitude,
            geoFenceLongitude: position.coords.longitude,
          }));
          setLocationStatus('✅ Coordinates captured automatically');
        },
        (error) => {
          setLocationStatus('⚠️ Location access denied. Using defaults.');
          setForm((prev) => ({
            ...prev,
            geoFenceLatitude: 19.0760,
            geoFenceLongitude: 72.8777,
          }));
        }
      );
    } else {
      setLocationStatus('⚠️ Geolocation not supported. Using defaults.');
      setForm((prev) => ({
        ...prev,
        geoFenceLatitude: 19.0760,
        geoFenceLongitude: 72.8777,
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.adminPassword !== form.adminConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.registerSociety({
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
        adminPhone: form.adminPhone || undefined,
        societyName: form.societyName,
        societyCode: form.societyCode,
        address: form.address,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        geoFenceLatitude: form.geoFenceLatitude,
        geoFenceLongitude: form.geoFenceLongitude,
        geoFenceRadius: form.geoFenceRadius,
      });
      
      if (res.data.success) {
        login(res.data.data);
        toast.success('Society registered successfully!');
        router.push(getPortalPath(res.data.data.role));
      } else {
        toast.error(res.data.message || 'Registration failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ padding: '40px 20px', alignItems: 'flex-start' }}>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' } }} />
      <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: 700, padding: 40, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
          }}>🏢</div>
        </div>
        <h1 className="auth-title">Register Your Society</h1>
        <p className="auth-subtitle">Create a new society and set up your admin account</p>

        <form onSubmit={handleSubmit}>
          <h3 style={{ fontSize: 18, marginBottom: 16, borderBottom: '1px solid var(--border-glass)', paddingBottom: 8 }}>Admin Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" name="adminName" className="form-input" placeholder="Admin Name" value={form.adminName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" name="adminEmail" className="form-input" placeholder="admin@society.com" value={form.adminEmail} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" name="adminPassword" className="form-input" placeholder="Min 6 chars" value={form.adminPassword} onChange={handleChange} required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" name="adminConfirmPassword" className="form-input" placeholder="Re-enter password" value={form.adminConfirmPassword} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 32 }}>
            <label className="form-label">Phone Number (Optional)</label>
            <input type="tel" name="adminPhone" className="form-input" placeholder="+91 9876543210" value={form.adminPhone} onChange={handleChange} />
          </div>

          <h3 style={{ fontSize: 18, marginBottom: 16, borderBottom: '1px solid var(--border-glass)', paddingBottom: 8 }}>Society Details</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Society Name</label>
              <input type="text" name="societyName" className="form-input" placeholder="E.g., Sai Seva Society" value={form.societyName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Unique Code</label>
              <input type="text" name="societyCode" className="form-input" placeholder="E.g., SAI_SEVA" value={form.societyCode} onChange={handleChange} required />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Address</label>
            <input type="text" name="address" className="form-input" placeholder="Street address" value={form.address} onChange={handleChange} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input type="text" name="city" className="form-input" value={form.city} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input type="text" name="state" className="form-input" value={form.state} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Zip Code</label>
              <input type="text" name="zipCode" className="form-input" value={form.zipCode} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 16, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px dashed var(--border-glass)' }}>
            <label className="form-label">Geofencing Location Setup</label>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
              We use your device's current location to set the center of the society's geofence.
            </p>
            <div style={{ fontSize: 14, fontWeight: 600, color: form.geoFenceLatitude ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
              {locationStatus}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !form.geoFenceLatitude}
            style={{ width: '100%', marginTop: 24, padding: '14px 20px', background: 'var(--gradient-success)' }}
          >
            {loading ? 'Registering...' : 'Register Society'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: 24 }}>
          Looking to join an existing society? <Link href="/register">Register as Resident</Link>
        </div>
      </div>
    </div>
  );
}
