'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminParagraphsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/content');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--admin-bg)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Redirecting to Content Repository...
    </div>
  );
}
