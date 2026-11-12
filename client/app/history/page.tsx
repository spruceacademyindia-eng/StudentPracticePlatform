'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, attemptService, type TypingAttempt } from '@/lib/services';
import Navbar from '@/components/Navbar';

export default function HistoryPage() {
  const router = useRouter();
  const [attempts, setAttempts] = useState<TypingAttempt[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [filterMode, setFilterMode] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchAttempts();
  }, [page, filterMode, filterResult, sortBy, router]);

  const fetchAttempts = async () => {
    setLoading(true);
    try {
      const res = await attemptService.getMyAttempts({
        mode: filterMode || undefined,
        result: filterResult || undefined,
        sortBy,
        page,
        limit: 15,
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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="history" />

      <div className="container" style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1140px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <span className="badge badge-teal" style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>
            Historical Records
          </span>
          <h1 className="text-h2" style={{ color: 'var(--color-secondary)' }}>
            My Attempt History
          </h1>
          <p className="text-body" style={{ color: 'var(--color-muted)', marginTop: '0.25rem' }}>
            Full chronological archive of all your practice runs and challenge assessments
          </p>
        </div>

        {/* Filter & Sort Bar */}
        <div className="card shadow-sm" style={{ padding: '1.25rem', marginBottom: '1.5rem', backgroundColor: '#fff' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 'var(--text-meta)', fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Filter Mode
                </label>
                <select
                  className="input"
                  style={{ padding: '0.4rem 0.75rem' }}
                  value={filterMode}
                  onChange={(e) => { setFilterMode(e.target.value); setPage(1); }}
                >
                  <option value="">All Modes</option>
                  <option value="PRACTICE">Practice</option>
                  <option value="CHALLENGE">Challenge</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-meta)', fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Filter Result
                </label>
                <select
                  className="input"
                  style={{ padding: '0.4rem 0.75rem' }}
                  value={filterResult}
                  onChange={(e) => { setFilterResult(e.target.value); setPage(1); }}
                >
                  <option value="">All Results</option>
                  <option value="PASS">Pass</option>
                  <option value="FAIL">Fail</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-meta)', fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: '0.25rem' }}>
                Sort Order
              </label>
              <select
                className="input"
                style={{ padding: '0.4rem 0.75rem' }}
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highestWpm">Highest Speed (WPM)</option>
                <option value="highestAccuracy">Highest Accuracy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm" style={{ padding: '1.5rem', backgroundColor: '#fff' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Passage Title</th>
                  <th>Category</th>
                  <th>Mode</th>
                  <th>Speed</th>
                  <th>Accuracy</th>
                  <th>Duration</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                      Loading attempts history...
                    </td>
                  </tr>
                ) : attempts.length > 0 ? (
                  attempts.map((item) => (
                    <tr key={item._id}>
                      <td style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                        {new Date(item.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-extra)' }}>
                        {item.contentSnapshot?.title || item.content?.title || 'Typing Passage'}
                      </td>
                      <td>
                        <span className="badge badge-teal">
                          {item.contentSnapshot?.categoryName || 'General'}
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                        {item.mode?.toLowerCase()}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--color-secondary)' }}>
                        {item.actualWPM} WPM
                      </td>
                      <td style={{ fontWeight: 600, color: item.accuracy >= 90 ? 'var(--color-accent2)' : 'inherit' }}>
                        {item.accuracy}%
                      </td>
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-muted)' }}>
                      No attempts matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid #edf2f7', paddingTop: '1rem' }}>
              <span style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)' }}>
                Showing page {page} of {pages} ({total} total attempts)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="btn btn-outline btn-sm"
                >
                  ← Previous
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                  className="btn btn-outline btn-sm"
                >
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

