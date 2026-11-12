'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/services';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const qToken = searchParams.get('token');
    if (qToken) setToken(qToken);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password reset failed. Token may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-lg" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="text-h2" style={{ color: 'var(--color-secondary)' }}>Reset Password</h1>
        <p className="text-body" style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>
          Enter your reset token and new secure password
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fff5f5', border: '1px solid #feb2b2', color: '#c53030', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {success ? (
        <div style={{ backgroundColor: '#f0fff4', border: '1px solid #9ae6b4', color: '#276749', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <p style={{ fontWeight: 600 }}>Password reset successfully!</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Redirecting to sign in...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, color: 'var(--color-extra)', marginBottom: '0.35rem' }}>
              Reset Token
            </label>
            <input
              type="text"
              required
              className="input"
              style={{ width: '100%' }}
              placeholder="Paste received token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, color: 'var(--color-extra)', marginBottom: '0.35rem' }}>
              New Password
            </label>
            <input
              type="password"
              required
              className="input"
              style={{ width: '100%' }}
              placeholder="Min. 6 chars"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, color: 'var(--color-extra)', marginBottom: '0.35rem' }}>
              Confirm Password
            </label>
            <input
              type="password"
              required
              className="input"
              style={{ width: '100%' }}
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
            {loading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-surface)' }}>
      <nav className="navbar">
        <a href="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/spruce_logo.png"
            alt="Spruce Academia"
            style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
          />
        </a>
        <a href="/login" className="btn btn-ghost btn-sm">Sign In</a>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

