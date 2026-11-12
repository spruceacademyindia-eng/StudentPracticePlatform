'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, type User } from '@/lib/services';
import Navbar from '@/components/Navbar';

export default function StudentProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    try {
      const res = await authService.getMe();
      setUser(res.user);
    } catch {
      // Handled
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setSuccess('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="profile" />

      <div className="container" style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '2rem' }}>
          <span className="badge badge-teal" style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>
            Account Settings
          </span>
          <h1 className="text-h2" style={{ color: 'var(--color-secondary)' }}>
            Student Profile
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          {/* Profile Details Card */}
          <div className="card shadow-sm" style={{ padding: '2rem', backgroundColor: '#fff' }}>
            <h2 className="text-h3" style={{ color: 'var(--color-secondary)', marginBottom: '1.25rem' }}>
              Account Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Full Name</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-extra)', marginTop: '0.2rem' }}>
                  {user?.firstName} {user?.lastName}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Email Address</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-extra)', marginTop: '0.2rem' }}>
                  {user?.email}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Account Role</span>
                <div style={{ marginTop: '0.2rem' }}>
                  <span className="badge badge-accent">{user?.role}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Status</span>
                <div style={{ marginTop: '0.2rem' }}>
                  <span className="badge badge-success">{user?.status}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Phone</span>
                <div style={{ fontSize: '1rem', color: 'var(--color-extra)', marginTop: '0.2rem' }}>
                  {user?.phone || 'Not provided'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Last Login</span>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="card shadow-sm" style={{ padding: '2rem', backgroundColor: '#fff' }}>
            <h2 className="text-h3" style={{ color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>
              Change Password
            </h2>
            <p className="text-body" style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>
              Ensure your account uses a secure password with at least 6 characters
            </p>

            {error && (
              <div style={{ backgroundColor: '#fff5f5', border: '1px solid #feb2b2', color: '#c53030', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ backgroundColor: '#f0fff4', border: '1px solid #9ae6b4', color: '#276749', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                {success}
              </div>
            )}

            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '480px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--color-extra)', marginBottom: '0.35rem' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  className="input"
                  style={{ width: '100%' }}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
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
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--color-extra)', marginBottom: '0.35rem' }}>
                  Confirm New Password
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

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.75rem', width: '200px' }}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

