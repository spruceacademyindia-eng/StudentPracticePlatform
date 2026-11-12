'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authService.isAuthenticated()) {
      const user = authService.getStoredUser();
      if (user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(email, password);
      authService.saveSession(data.token, data.user);
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-surface)' }}>
      {/* Navbar with NO admin link */}
      <nav className="navbar">
        <a href="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/spruce_logo.png"
            alt="Spruce Academia"
            style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
          />
        </a>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a href="/register" className="btn btn-outline btn-sm">
            Sign Up
          </a>
        </div>
      </nav>

      {/* Main Login Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div className="card shadow-lg" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img
              src="/spruce_logo.png"
              alt="Spruce Academia Logo"
              style={{ height: '48px', width: 'auto', margin: '0 auto 1rem', display: 'block', objectFit: 'contain' }}
            />
            <h1 className="text-h2" style={{ color: 'var(--color-secondary)' }}>Sign In</h1>
            <p className="text-body" style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>
              Enter your credentials to access your Spruce Academia account
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fff5f5',
              border: '1px solid #feb2b2',
              color: '#c53030',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-body)',
              marginBottom: '1.5rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--color-extra)', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                className="input"
                style={{ width: '100%' }}
                placeholder="user@spruce.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--color-extra)' }}>
                  Password
                </label>
                <a href="/forgot-password" style={{ fontSize: 'var(--text-meta)', color: 'var(--color-accent)', textDecoration: 'none' }}>
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                required
                className="input"
                style={{ width: '100%' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.75rem', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
            <p className="text-body" style={{ color: 'var(--color-muted)' }}>
              Don&apos;t have an account?{' '}
              <a href="/register" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
                Create one now
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
