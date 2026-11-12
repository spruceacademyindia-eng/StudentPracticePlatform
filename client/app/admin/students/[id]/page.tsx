'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { authService, userService, type TypingAttempt } from '@/lib/services';
import AdminNav from '@/components/AdminNav';

export default function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const studentId = resolvedParams.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/admin/login');
      return;
    }
    fetchStudentDetail();
  }, [studentId, router]);

  const fetchStudentDetail = async () => {
    setLoading(true);
    try {
      const res = await userService.getStudentById(studentId);
      setData(res);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const user = data?.user;
  const performance = data?.performance || {
    totalAttempts: 0,
    practiceAttempts: 0,
    challengeAttempts: 0,
    bestWpm: 0,
    avgWpm: 0,
    avgAccuracy: 0,
    passRate: 0,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--admin-bg)', color: 'var(--admin-text)' }}>
      <AdminNav />

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1140px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <a href="/admin/students" style={{ color: 'var(--color-accent1)', textDecoration: 'none', fontSize: '0.85rem' }}>
            ← Back to Student Directory
          </a>
          <h1 className="text-h2" style={{ color: '#fff', marginTop: '0.5rem' }}>
            {user ? `${user.firstName} ${user.lastName}` : 'Student Profile'}
          </h1>
          <p style={{ color: 'var(--admin-muted)', marginTop: '0.25rem' }}>
            Individual performance records and assessment telemetry
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--admin-muted)' }}>
            Loading student records...
          </div>
        ) : user ? (
          <div>
            {/* Profile Overview Card */}
            <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.75rem', marginBottom: '2rem' }}>
              <h2 className="text-h3" style={{ color: '#fff', marginBottom: '1.25rem' }}>Student Metadata</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Email</span>
                  <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>{user.email}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Account Status</span>
                  <div style={{ marginTop: '0.2rem' }}>
                    <span className={`badge ${user.status === 'ACTIVE' ? 'badge-success' : user.status === 'BLOCKED' ? 'badge-danger' : 'badge-accent'}`}>
                      {user.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Phone</span>
                  <div style={{ color: '#fff', marginTop: '0.2rem' }}>{user.phone || 'None'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Joined Date</span>
                  <div style={{ color: 'var(--admin-muted)', marginTop: '0.2rem' }}>{new Date(user.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Last Active</span>
                  <div style={{ color: 'var(--admin-muted)', marginTop: '0.2rem' }}>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', borderLeft: '4px solid var(--color-accent1)' }}>
                <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Peak Speed</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>{performance.bestWpm} WPM</div>
              </div>
              <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', borderLeft: '4px solid var(--color-accent)' }}>
                <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Average Speed</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>{performance.avgWpm} WPM</div>
              </div>
              <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', borderLeft: '4px solid var(--color-accent2)' }}>
                <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Average Accuracy</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>{performance.avgAccuracy}%</div>
              </div>
              <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', borderLeft: '4px solid var(--color-accent3)' }}>
                <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Challenge Pass Rate</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#68d391', marginTop: '0.25rem' }}>{performance.passRate}%</div>
              </div>
              <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', borderLeft: '4px solid #f6ad55' }}>
                <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Total Sessions</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>{performance.totalAttempts}</div>
              </div>
            </div>

            {/* Attempts History */}
            <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
              <h2 className="text-h3" style={{ color: '#fff', marginBottom: '1.25rem' }}>Recent Attempts by Student</h2>
              <div style={{ overflowX: 'auto' }}>
                <table className="table table-admin" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Passage</th>
                      <th>Mode</th>
                      <th>Speed</th>
                      <th>Accuracy</th>
                      <th>Time</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentAttempts && data.recentAttempts.length > 0 ? (
                      data.recentAttempts.map((att: TypingAttempt) => (
                        <tr key={att._id}>
                          <td style={{ color: 'var(--admin-muted)', fontSize: '0.85rem' }}>{new Date(att.createdAt).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 600, color: '#fff' }}>{att.contentSnapshot?.title || att.content?.title || 'Passage'}</td>
                          <td style={{ textTransform: 'capitalize' }}>{att.mode?.toLowerCase()}</td>
                          <td style={{ fontWeight: 700, color: 'var(--color-accent1)' }}>{att.actualWPM} WPM</td>
                          <td>{att.accuracy}%</td>
                          <td>{att.timeTaken}s</td>
                          <td>
                            <span className={`badge ${att.result === 'PASS' ? 'badge-success' : att.result === 'FAIL' ? 'badge-danger' : 'badge-accent'}`}>
                              {att.result}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-muted)' }}>
                          No typing attempts logged for this student yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

