'use client';
import { useState } from 'react';
import { authService } from '@/lib/services';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);

    try {
      const res: any = await authService.forgotPassword(email);
      setMsg(res.message || 'Password reset link generated.');
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request reset.');
    } finally {
      setLoading(false);
    }
  };

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
        <a href="/login" className="btn btn-ghost btn-sm">Back to Login</a>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div className="card shadow-lg" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img
              src="/spruce_logo.png"
              alt="Spruce Academia Logo"
              style={{ height: '48px', width: 'auto', margin: '0 auto 1rem', display: 'block', objectFit: 'contain' }}
            />
            <h1 className="text-h2" style={{ color: 'var(--color-secondary)' }}>Forgot Password</h1>
            <p className="text-body" style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>
              Enter your registered student email to receive recovery instructions
            </p>
          </div>

          {error && (
            <div style={{ backgroundColor: '#fff5f5', border: '1px solid #feb2b2', color: '#c53030', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {msg && (
            <div style={{ backgroundColor: '#f0fff4', border: '1px solid #9ae6b4', color: '#276749', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
              <p>{msg}</p>
              {resetToken && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                  <p style={{ fontWeight: 600 }}>Demo Reset Token:</p>
                  <code style={{ wordBreak: 'break-all', backgroundColor: '#e2e8f0', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'block', margin: '0.5rem 0' }}>
                    {resetToken}
                  </code>
                  <a href={`/reset-password?token=${resetToken}`} className="btn btn-primary btn-sm" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
                    Click here to reset password now
                  </a>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: 'var(--color-extra)', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                className="input"
                style={{ width: '100%' }}
                placeholder="student@spruce.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              {loading ? 'Sending Instructions...' : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

