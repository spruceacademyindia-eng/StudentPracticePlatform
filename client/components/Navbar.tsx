'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, type User } from '@/lib/services';
import { Shield, Zap } from 'lucide-react';

export default function Navbar({ activePage }: { activePage?: string }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(authService.getStoredUser());
  }, []);

  const handleLogout = () => {
    authService.clearSession();
    setUser(null);
    router.push('/');
  };

  return (
    <nav className="navbar" suppressHydrationWarning>
      <a href="/" className="navbar-brand" style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
        <img
          src="/spruce_logo.png"
          alt="Spruce Academia"
          style={{ height: '48px', width: 'auto', maxHeight: '50px', objectFit: 'contain', display: 'block' }}
        />
      </a>

      {user ? (
        // Logged-in state
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Only shown if user is an ADMIN */}
          {user.role === 'ADMIN' && (
            <a
              href="/admin"
              className="btn btn-sm"
              style={{
                backgroundColor: 'var(--color-secondary)',
                color: '#fff',
                borderColor: 'transparent',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Shield size={15} strokeWidth={2} />
              Admin Dashboard
            </a>
          )}

          <a
            href="/dashboard"
            className={`btn btn-sm ${activePage === 'dashboard' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Dashboard
          </a>
          <a
            href="/practice"
            className={`btn btn-sm ${activePage === 'practice' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Practice
          </a>
          <a
            href="/challenge"
            className={`btn btn-sm ${activePage === 'challenge' ? 'btn-primary' : 'btn-outline'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Zap size={14} strokeWidth={2} />
            Challenge Me
          </a>
          <a
            href="/history"
            className={`btn btn-sm ${activePage === 'history' ? 'btn-primary' : 'btn-ghost'}`}
          >
            History
          </a>
          <a
            href="/progress"
            className={`btn btn-sm ${activePage === 'progress' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Progress
          </a>
          <a
            href="/profile"
            className={`btn btn-sm ${activePage === 'profile' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Profile
          </a>

          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--color-muted)' }}
          >
            Logout
          </button>
        </div>
      ) : (
        // Public / logged-out state (NO admin link visible)
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a href="/login" className="btn btn-ghost btn-sm">
            Sign In
          </a>
          <a href="/register" className="btn btn-primary btn-sm">
            Get Started
          </a>
        </div>
      )}
    </nav>
  );
}

