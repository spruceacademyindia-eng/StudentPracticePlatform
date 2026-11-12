'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });
      authService.saveSession(data.token, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a href="/login" className="btn btn-ghost btn-sm">
            Sign In
          </a>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem' }}>
        <div className="card shadow-lg" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img
              src="/spruce_logo.png"
              alt="Spruce Academia Logo"
              style={{ height: '48px', width: 'auto', margin: '0 auto 1rem', display: 'block', objectFit: 'contain' }}
            />
            <span className="badge badge-teal" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>
              Student Enrollment
            </span>
            <h1 className="text-h2" style={{ color: 'var(--color-secondary)' }}>Create Account</h1>
            <p className="text-body" style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>
              Begin your professional typing speed and accuracy training
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--color-extra)', marginBottom: '0.35rem' }}>
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="Sarah"
                  value={form.firstName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--color-extra)', marginBottom: '0.35rem' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="Jenkins"
                  value={form.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--color-extra)', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                className="input"
                style={{ width: '100%' }}
                placeholder="sarah.jenkins@student.spruce.edu"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--color-extra)', marginBottom: '0.35rem' }}>
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                name="phone"
                className="input"
                style={{ width: '100%' }}
                placeholder="+1 555-0199"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--color-extra)', marginBottom: '0.35rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="Min. 6 chars"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--color-extra)', marginBottom: '0.35rem' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem' }}
            >
              {loading ? 'Registering Account...' : 'Create Student Account'}
            </button>
          </form>

          <div style={{ marginTop: '1.75rem', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
            <p className="text-body" style={{ color: 'var(--color-muted)' }}>
              Already registered?{' '}
              <a href="/login" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
