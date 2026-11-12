'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService, type User } from '@/lib/services';
import { User as UserIcon } from 'lucide-react';

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(authService.getStoredUser());
  }, []);

  const handleLogout = () => {
    authService.clearSession();
    router.push('/login');
  };

  const navLinks = [
    { label: 'Overview', href: '/admin' },
    { label: 'Students', href: '/admin/students' },
    { label: 'Categories', href: '/admin/categories' },
    { label: 'Typing Content', href: '/admin/content' },
    { label: 'Attempts', href: '/admin/attempts' },
    { label: 'Analytics', href: '/admin/analytics' },
    { label: 'Reports', href: '/admin/reports' },
    { label: 'Settings', href: '/admin/settings' },
    { label: 'Audit Logs', href: '/admin/logs' },
  ];

  return (
    <nav
      className="navbar navbar-admin"
      suppressHydrationWarning
      style={{
        borderBottom: '1px solid var(--admin-border)',
        padding: '0.6rem 1.5rem',
        backgroundColor: 'var(--admin-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 'auto',
        minHeight: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <a
          href="/admin"
          style={{
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          <img
            src="/spruce_logo_dark.png"
            alt="Spruce Academia"
            style={{
              height: '42px',
              width: 'auto',
              maxHeight: '44px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <span className="badge badge-teal" style={{ alignSelf: 'center' }}>Admin</span>
        </a>

        {/* Links */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
            return (
              <a
                key={link.href}
                href={link.href}
                className="btn btn-sm"
                style={{
                  backgroundColor: isActive ? 'var(--color-secondary)' : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#fff' : 'var(--admin-muted)',
                  borderColor: isActive ? 'var(--color-accent)' : 'var(--admin-border)',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  padding: '0.35rem 0.65rem',
                }}
              >
                {link.label}
              </a>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <a
          href="/practice"
          className="btn btn-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'var(--admin-border)', textDecoration: 'none', fontSize: '0.8rem' }}
        >
          View Practice Arena →
        </a>
        <span
          suppressHydrationWarning
          style={{ color: 'var(--admin-muted)', fontSize: 'var(--text-meta)' }}
        >
          {user ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <UserIcon size={14} strokeWidth={1.5} />
              {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
            </span>
          ) : ''}
        </span>
        <button
          onClick={handleLogout}
          className="btn btn-sm"
          style={{ backgroundColor: 'transparent', color: 'var(--admin-muted)', borderColor: 'var(--admin-border)' }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

