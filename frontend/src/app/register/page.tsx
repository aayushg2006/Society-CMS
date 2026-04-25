'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth, getPortalPath } from '@/lib/auth';
import toast, { Toaster } from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    societyCode: '',
    phoneNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        societyCode: form.societyCode,
        phoneNumber: form.phoneNumber || undefined,
      });
      if (res.data.success) {
        login(res.data.data);
        toast.success('Registration successful!');
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
    <div className="auth-container">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' } }} />
      <div className="glass-card auth-card animate-fade-in-up" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, boxShadow: '0 0 30px rgba(124, 58, 237, 0.3)'
          }}>🏘️</div>
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join your housing society complaint management system</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              id="register-name"
              type="text"
              name="fullName"
              className="form-input"
              placeholder="John Doe"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              id="register-email"
              type="email"
              name="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="register-password"
                type="password"
                name="password"
                className="form-input"
                placeholder="Min 6 chars"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                id="register-confirm-password"
                type="password"
                name="confirmPassword"
                className="form-input"
                placeholder="Re-enter"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Society Code</label>
            <input
              id="register-society-code"
              type="text"
              name="societyCode"
              className="form-input"
              placeholder="Enter your society's unique code"
              value={form.societyCode}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number (Optional)</label>
            <input
              id="register-phone"
              type="tel"
              name="phoneNumber"
              className="form-input"
              placeholder="+91 9876543210"
              value={form.phoneNumber}
              onChange={handleChange}
            />
          </div>
          <button
            id="register-submit"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 8, padding: '14px 20px' }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <div style={{ marginBottom: 8 }}>
            Already have an account? <Link href="/login">Sign In</Link>
          </div>
          <div>
            Creating a new society? <Link href="/register-society">Register Society</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
