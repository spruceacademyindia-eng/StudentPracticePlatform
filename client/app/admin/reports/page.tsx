'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, reportsService } from '@/lib/services';
import AdminNav from '@/components/AdminNav';

export default function AdminReportsPage() {
  const router = useRouter();
  const [activeReport, setActiveReport] = useState<'student' | 'category' | 'challenge'>('student');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/admin/login');
      return;
    }
    fetchReport(activeReport);
  }, [activeReport, router]);

  const fetchReport = async (type: 'student' | 'category' | 'challenge') => {
    setLoading(true);
    try {
      let res: any;
      if (type === 'student') res = await reportsService.getStudentReport();
      else if (type === 'category') res = await reportsService.getCategoryReport();
      else if (type === 'challenge') res = await reportsService.getChallengeReport();
      setReportData(res?.data || []);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setDownloading(true);
    try {
      let blob: any;
      let filename = `${activeReport}_report.csv`;

      if (activeReport === 'student') blob = await reportsService.getStudentReport('csv');
      else if (activeReport === 'category') blob = await reportsService.getCategoryReport('csv');
      else if (activeReport === 'challenge') blob = await reportsService.getChallengeReport('csv');

      // Trigger browser download
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--admin-bg)', color: 'var(--admin-text)' }}>
      <AdminNav />

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-teal" style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>
              Institutional Auditing
            </span>
            <h1 className="text-h2" style={{ color: '#fff' }}>Reporting & Exports</h1>
            <p style={{ color: 'var(--admin-muted)', marginTop: '0.25rem' }}>
              Generate comprehensive cohort analytics and export structured spreadsheets
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={downloading || reportData.length === 0}
            className="btn btn-primary btn-sm"
          >
            {downloading ? 'Preparing CSV...' : '⬇ Export to CSV'}
          </button>
        </div>

        {/* Report Selector Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveReport('student')}
            className={`btn btn-sm ${activeReport === 'student' ? 'btn-primary' : ''}`}
            style={activeReport !== 'student' ? { backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--admin-muted)', borderColor: 'var(--admin-border)' } : {}}
          >
            Student Performance Report
          </button>
          <button
            onClick={() => setActiveReport('category')}
            className={`btn btn-sm ${activeReport === 'category' ? 'btn-primary' : ''}`}
            style={activeReport !== 'category' ? { backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--admin-muted)', borderColor: 'var(--admin-border)' } : {}}
          >
            Category Domain Report
          </button>
          <button
            onClick={() => setActiveReport('challenge')}
            className={`btn btn-sm ${activeReport === 'challenge' ? 'btn-primary' : ''}`}
            style={activeReport !== 'challenge' ? { backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--admin-muted)', borderColor: 'var(--admin-border)' } : {}}
          >
            Timed Challenge Report
          </button>
        </div>

        {/* Data Table */}
        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            {activeReport === 'student' && (
              <table className="table table-admin" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Total Sessions</th>
                    <th>Best WPM</th>
                    <th>Average WPM</th>
                    <th>Average Accuracy</th>
                    <th>Challenges Passed</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Generating student report...</td></tr>
                  ) : reportData.length > 0 ? (
                    reportData.map((row, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: '#fff' }}>{row.studentName}</td>
                        <td style={{ color: 'var(--admin-muted)' }}>{row.email}</td>
                        <td><span className={`badge ${row.status === 'ACTIVE' ? 'badge-success' : 'badge-accent'}`}>{row.status}</span></td>
                        <td>{row.totalSessions}</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-accent1)' }}>{row.bestWpm} WPM</td>
                        <td>{row.avgWpm} WPM</td>
                        <td>{row.avgAccuracy}%</td>
                        <td>{row.challengesPassed}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No student records found.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeReport === 'category' && (
              <table className="table table-admin" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Category Domain</th>
                    <th>Total Attempts</th>
                    <th>Average WPM</th>
                    <th>Peak Speed</th>
                    <th>Average Accuracy</th>
                    <th>Challenges Passed</th>
                    <th>Challenges Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Generating domain report...</td></tr>
                  ) : reportData.length > 0 ? (
                    reportData.map((row, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 700, color: '#fff' }}>{row.categoryName}</td>
                        <td>{row.attempts}</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-accent1)' }}>{row.avgWpm} WPM</td>
                        <td>{row.peakWpm} WPM</td>
                        <td>{row.avgAccuracy}%</td>
                        <td style={{ color: '#68d391' }}>{row.passedCount}</td>
                        <td style={{ color: '#fc8181' }}>{row.failedCount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No domain records found.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeReport === 'challenge' && (
              <table className="table table-admin" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Passage Title</th>
                    <th>Category</th>
                    <th>Target WPM</th>
                    <th>Actual WPM</th>
                    <th>Accuracy</th>
                    <th>Time</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem' }}>Generating challenge report...</td></tr>
                  ) : reportData.length > 0 ? (
                    reportData.map((row, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--admin-muted)', fontSize: '0.85rem' }}>{row.date}</td>
                        <td style={{ fontWeight: 600, color: '#fff' }}>{row.studentName}</td>
                        <td style={{ color: 'var(--admin-muted)' }}>{row.email}</td>
                        <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.contentTitle}</td>
                        <td><span className="badge badge-teal">{row.category}</span></td>
                        <td>{row.targetWPM} WPM</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-accent1)' }}>{row.actualWPM} WPM</td>
                        <td>{row.accuracy}%</td>
                        <td>{row.timeTaken}</td>
                        <td>
                          <span className={`badge ${row.result === 'PASS' ? 'badge-success' : 'badge-danger'}`}>
                            {row.result}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem' }}>No challenge records found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

