'use client';

import Link from 'next/link';
import { useAuth, getPortalPath } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div>
      {/* Navigation */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10, 14, 26, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18
          }}>🏘️</div>
          <span style={{ fontSize: 18, fontWeight: 800, background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SocietyCMS
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {user ? (
            <Link href={getPortalPath(user.role)} className="btn btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Sign In</Link>
              <Link href="/register" className="btn btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-badge animate-fade-in">
          ✨ Multi-Tenancy Platform
        </div>
        <h1 className="landing-title animate-fade-in-up">
          Manage Your Society <span>Complaints</span> Effortlessly
        </h1>
        <p className="landing-description animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          A powerful complaint management system designed for housing societies.
          Track, prioritize, and resolve complaints with automated workflows,
          geo-fencing, and real-time updates.
        </p>
        <div className="landing-cta animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Link href="/register" className="btn btn-primary btn-lg">
            🚀 Start Free
          </Link>
          <Link href="/login" className="btn btn-ghost btn-lg">
            Sign In →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 48, letterSpacing: '-0.02em' }}>
          Everything you need to <span style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>manage complaints</span>
        </h2>
        <div className="features-grid">
          {[
            { icon: '🔐', title: 'Role-Based Access', desc: 'Separate dashboards for residents, secretaries, admins, and staff with granular permissions.' },
            { icon: '🏢', title: 'Multi-Tenancy', desc: 'Each housing society operates independently with its own buildings, flats, and users.' },
            { icon: '⚡', title: 'Auto-Assignment', desc: 'Complaints are automatically assigned to staff based on category and specialization.' },
            { icon: '📊', title: 'Live Dashboard', desc: 'Real-time analytics with complaint trends, priority breakdowns, and SLA tracking.' },
            { icon: '📍', title: 'Geo-Fencing', desc: 'Verify complaints are submitted from within society premises using GPS location.' },
            { icon: '🔔', title: 'Smart Escalation', desc: 'Automatic priority escalation for unresolved complaints and SLA violations.' },
          ].map((f, i) => (
            <div key={i} className="glass-card feature-card animate-fade-in-up" style={{ animationDelay: `${0.1 * i}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '40px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        color: 'var(--text-muted)', fontSize: 14,
        position: 'relative', zIndex: 1
      }}>
        <p>© 2026 SocietyCMS. All rights reserved.</p>
      </footer>
    </div>
  );
}
