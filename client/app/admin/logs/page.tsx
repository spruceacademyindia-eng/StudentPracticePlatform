'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, adminLogService } from '@/lib/services';
import AdminNav from '@/components/AdminNav';

export default function AdminLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/admin/login');
      return;
    }
    fetchLogs();
  }, [page, actionFilter, entityFilter, router]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminLogService.getLogs({
        action: actionFilter || undefined,
        entity: entityFilter || undefined,
        page,
        limit: 25,
      });
      setLogs(res.logs);
      setTotal(res.total);
      setPages(res.pages);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--admin-bg)', color: 'var(--admin-text)' }}>
      <AdminNav />

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <span className="badge badge-teal" style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>
            Compliance & Security
          </span>
          <h1 className="text-h2" style={{ color: '#fff' }}>Admin Activity Audit Log</h1>
          <p style={{ color: 'var(--admin-muted)', marginTop: '0.25rem' }}>
            Immutable chronological record of administrator operations, status changes, and content mutations
          </p>
        </div>

        {/* Filter Bar */}
        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Filter by action (e.g. CREATE_CONTENT, UPDATE_USER)..."
              className="input input-admin"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)', padding: '0.4rem 0.75rem', minWidth: '280px' }}
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            />

            <select
              className="input input-admin"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)', padding: '0.4rem 0.75rem' }}
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            >
              <option value="" style={{ color: '#000' }}>All Entities</option>
              <option value="TypingContent" style={{ color: '#000' }}>TypingContent</option>
              <option value="Category" style={{ color: '#000' }}>Category</option>
              <option value="User" style={{ color: '#000' }}>User</option>
              <option value="SystemSetting" style={{ color: '#000' }}>SystemSetting</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-admin" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Target Entity</th>
                  <th>Entity ID</th>
                  <th>Metadata Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-muted)' }}>
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ color: 'var(--admin-muted)', fontSize: '0.85rem' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600, color: '#fff' }}>
                        {log.admin ? `${log.admin.firstName} ${log.admin.lastName}` : 'System'}
                      </td>
                      <td>
                        <span className="badge badge-teal" style={{ fontFamily: 'monospace' }}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.entity}</td>
                      <td style={{ color: 'var(--admin-muted)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {log.entityId ? String(log.entityId).substring(0, 8) + '...' : '—'}
                      </td>
                      <td style={{ maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--admin-muted)' }}>
                        {JSON.stringify(log.metadata || {})}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-muted)' }}>
                      No activity logs recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--admin-border)', paddingTop: '1rem' }}>
              <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)' }}>
                Page {page} of {pages} ({total} logs)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-outline btn-sm" style={{ color: '#fff', borderColor: 'var(--admin-border)' }}>
                  ← Previous
                </button>
                <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="btn btn-outline btn-sm" style={{ color: '#fff', borderColor: 'var(--admin-border)' }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

