'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, attemptService, type TypingAttempt } from '@/lib/services';
import AdminNav from '@/components/AdminNav';

export default function AdminAttemptsPage() {
  const router = useRouter();
  const [attempts, setAttempts] = useState<TypingAttempt[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterMode, setFilterMode] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [inspectAttempt, setInspectAttempt] = useState<TypingAttempt | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/admin/login');
      return;
    }
    fetchAttempts();
  }, [page, filterMode, filterResult, router]);

  const fetchAttempts = async () => {
    setLoading(true);
    try {
      const res = await attemptService.getAllAdmin({
        mode: filterMode || undefined,
        result: filterResult || undefined,
        page,
        limit: 20,
      });
      setAttempts(res.attempts);
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
            Assessment Audit Trail
          </span>
          <h1 className="text-h2" style={{ color: '#fff' }}>Student Typing Submissions</h1>
          <p style={{ color: 'var(--admin-muted)', marginTop: '0.25rem' }}>
            Inspect every completed test attempt, character verification count, and result status
          </p>
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <select
              className="input input-admin"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)', padding: '0.4rem 0.75rem' }}
              value={filterMode}
              onChange={(e) => { setFilterMode(e.target.value); setPage(1); }}
            >
              <option value="" style={{ color: '#000' }}>All Modes</option>
              <option value="PRACTICE" style={{ color: '#000' }}>Practice Mode</option>
              <option value="CHALLENGE" style={{ color: '#000' }}>Challenge Mode</option>
            </select>

            <select
              className="input input-admin"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)', padding: '0.4rem 0.75rem' }}
              value={filterResult}
              onChange={(e) => { setFilterResult(e.target.value); setPage(1); }}
            >
              <option value="" style={{ color: '#000' }}>All Results</option>
              <option value="PASS" style={{ color: '#000' }}>Pass Only</option>
              <option value="FAIL" style={{ color: '#000' }}>Fail Only</option>
              <option value="COMPLETED" style={{ color: '#000' }}>Completed Only</option>
            </select>
          </div>
        </div>

        {/* Attempts Table */}
        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-admin" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Passage</th>
                  <th>Category</th>
                  <th>Mode</th>
                  <th>Speed</th>
                  <th>Accuracy</th>
                  <th>Time</th>
                  <th>Result</th>
                  <th>Date</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-muted)' }}>
                      Loading attempts...
                    </td>
                  </tr>
                ) : attempts.length > 0 ? (
                  attempts.map((item) => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>
                        {item.student ? `${item.student.firstName} ${item.student.lastName}` : 'Student'}
                      </td>
                      <td style={{ color: '#e2e8f0', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.contentSnapshot?.title || item.content?.title || 'Passage'}
                      </td>
                      <td>
                        <span className="badge badge-teal">
                          {item.contentSnapshot?.categoryName || 'General'}
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{item.mode?.toLowerCase()}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-accent1)' }}>{item.actualWPM} WPM</td>
                      <td>{item.accuracy}%</td>
                      <td>{item.timeTaken}s</td>
                      <td>
                        <span
                          className={`badge ${
                            item.result === 'PASS'
                              ? 'badge-success'
                              : item.result === 'FAIL'
                              ? 'badge-danger'
                              : 'badge-accent'
                          }`}
                        >
                          {item.result}
                        </span>
                      </td>
                      <td style={{ color: 'var(--admin-muted)', fontSize: '0.85rem' }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          onClick={() => setInspectAttempt(item)}
                          className="btn btn-sm"
                          style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'var(--admin-border)', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-muted)' }}>
                      No attempts logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--admin-border)', paddingTop: '1rem' }}>
              <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)' }}>
                Page {page} of {pages} ({total} attempts logged)
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

        {/* Inspect Modal */}
        {inspectAttempt && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h3 className="text-h3" style={{ color: '#fff' }}>Attempt Telemetry</h3>
                  <p style={{ color: 'var(--admin-muted)', fontSize: '0.875rem' }}>
                    Candidate: {inspectAttempt.student ? `${inspectAttempt.student.firstName} ${inspectAttempt.student.lastName} (${inspectAttempt.student.email})` : 'Unknown'}
                  </p>
                </div>
                <span className={`badge ${inspectAttempt.result === 'PASS' ? 'badge-success' : inspectAttempt.result === 'FAIL' ? 'badge-danger' : 'badge-accent'}`}>
                  {inspectAttempt.result}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Actual Speed</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent1)' }}>{inspectAttempt.actualWPM} WPM</div>
                  {inspectAttempt.targetWPM ? <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>Target: {inspectAttempt.targetWPM} WPM</span> : null}
                </div>

                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Accuracy</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#68d391' }}>{inspectAttempt.accuracy}%</div>
                </div>

                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Characters</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                    {inspectAttempt.correctCharacters} correct / {inspectAttempt.incorrectCharacters} errors
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>{inspectAttempt.typedCharacters} total keystrokes</span>
                </div>

                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Session Duration</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{inspectAttempt.timeTaken} seconds</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>{inspectAttempt.wordsTyped} words</span>
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Passage Title & Content Snapshot</span>
                <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                  {inspectAttempt.contentSnapshot?.title || 'Passage'}
                </div>
                <p style={{ color: 'var(--admin-muted)', fontSize: '0.85rem', maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {inspectAttempt.contentSnapshot?.content || 'No snapshot preserved.'}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setInspectAttempt(null)} className="btn btn-primary btn-sm">
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

