'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, analyticsService, type TypingAttempt, type User } from '@/lib/services';
import { Trophy, Keyboard, Target, CheckCircle, BarChart2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

export default function StudentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = authService.getStoredUser();
    if (currentUser?.role === 'ADMIN') {
      router.push('/admin');
      return;
    }
    setUser(currentUser);
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getStudentAnalytics();
      setData(res);
    } catch {
      // Axios interceptor handles 401
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.clearSession();
    router.push('/login');
  };

  const summary = data?.summary || {
    totalAttempts: 0,
    bestWpm: 0,
    avgWpm: 0,
    avgAccuracy: 0,
    passRate: 0,
    practiceAttempts: 0,
    challengeAttempts: 0,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)' }}>
      {/* Navbar with role-aware Admin Dashboard button */}
      <Navbar activePage="dashboard" />

      {/* Main Container */}
      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Welcome Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-teal" style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>
              Student Portal
            </span>
            <h1 suppressHydrationWarning className="text-h2" style={{ color: 'var(--color-secondary)' }}>
              Welcome, {user?.firstName || 'Student'}
            </h1>
            <p className="text-body" style={{ color: 'var(--color-muted)', marginTop: '0.25rem' }}>
              Track your typing cadence, domain precision, and speed milestones
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a href="/practice" className="btn btn-primary">
              Start Free Practice
            </a>
            <a href="/challenge" className="btn btn-outline">
              Take Challenge
            </a>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div className="card shadow-sm" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-accent1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-meta)', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                Best WPM
              </span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trophy size={22} strokeWidth={1.5} /></span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)', marginTop: '0.5rem' }}>
              {loading ? '—' : summary.bestWpm} <span style={{ fontSize: '1rem', fontWeight: 400 }}>WPM</span>
            </div>
          </div>

          <div className="card shadow-sm" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-meta)', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                Average WPM
              </span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Keyboard size={22} strokeWidth={1.5} /></span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)', marginTop: '0.5rem' }}>
              {loading ? '—' : summary.avgWpm} <span style={{ fontSize: '1rem', fontWeight: 400 }}>WPM</span>
            </div>
          </div>

          <div className="card shadow-sm" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-accent2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-meta)', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                Average Accuracy
              </span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Target size={22} strokeWidth={1.5} /></span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)', marginTop: '0.5rem' }}>
              {loading ? '—' : `${summary.avgAccuracy}%`}
            </div>
          </div>

          <div className="card shadow-sm" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-accent3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-meta)', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                Challenge Pass Rate
              </span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={22} strokeWidth={1.5} /></span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)', marginTop: '0.5rem' }}>
              {loading ? '—' : `${summary.passRate}%`}
            </div>
          </div>

          <div className="card shadow-sm" style={{ padding: '1.5rem', borderLeft: '4px solid #f6ad55' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-meta)', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                Total Sessions
              </span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart2 size={22} strokeWidth={1.5} /></span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)', marginTop: '0.5rem' }}>
              {loading ? '—' : summary.totalAttempts}
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {/* Progress Timeline Chart */}
          <div className="card shadow-sm" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="text-h3" style={{ color: 'var(--color-secondary)' }}>Performance Trajectory</h2>
              <span style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)' }}>WPM & Accuracy (Last 30 Sessions)</span>
            </div>
            <div style={{ width: '100%', height: '280px' }}>
              {data?.timeline && data.timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.timeline} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" />
                    <XAxis dataKey="session" stroke="#a0aec0" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#a0aec0" style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="wpm" name="Speed (WPM)" stroke="#044C94" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="accuracy" name="Accuracy (%)" stroke="#00c5a2" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', flexDirection: 'column', gap: '0.5rem' }}>
                  <span>No completed sessions yet.</span>
                  <a href="/practice" className="btn btn-outline btn-sm">Complete your first test</a>
                </div>
              )}
            </div>
          </div>

          {/* Category Performance Breakdown */}
          <div className="card shadow-sm" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="text-h3" style={{ color: 'var(--color-secondary)' }}>Domain Proficiency</h2>
              <span style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)' }}>Average WPM by Category</span>
            </div>
            <div style={{ width: '100%', height: '280px' }}>
              {data?.categoryPerformance && data.categoryPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categoryPerformance} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" />
                    <XAxis dataKey="category" stroke="#a0aec0" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#a0aec0" style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="avgWpm" name="Avg WPM" fill="#0078b7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgAccuracy" name="Avg Accuracy %" fill="#00a1ba" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
                  Take practice sessions to generate domain metrics.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Attempts Table */}
        <div className="card shadow-sm" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 className="text-h3" style={{ color: 'var(--color-secondary)' }}>Recent Typing Attempts</h2>
              <p className="text-body" style={{ color: 'var(--color-muted)', marginTop: '0.25rem' }}>
                Your latest practice sessions and speed challenges
              </p>
            </div>
            <a href="/history" className="btn btn-outline btn-sm">
              View All History →
            </a>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Content Title</th>
                  <th>Category</th>
                  <th>Mode</th>
                  <th>Speed</th>
                  <th>Accuracy</th>
                  <th>Time</th>
                  <th>Result</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentAttempts && data.recentAttempts.length > 0 ? (
                  data.recentAttempts.map((attempt: TypingAttempt) => (
                    <tr key={attempt._id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-extra)' }}>
                        {attempt.contentSnapshot?.title || attempt.content?.title || 'Typing Passage'}
                      </td>
                      <td>
                        <span className="badge badge-teal">
                          {attempt.contentSnapshot?.categoryName || 'General'}
                        </span>
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                          {attempt.mode?.toLowerCase()}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>
                        {attempt.actualWPM} WPM
                      </td>
                      <td>{attempt.accuracy}%</td>
                      <td>{attempt.timeTaken}s</td>
                      <td>
                        <span
                          className={`badge ${
                            attempt.result === 'PASS'
                              ? 'badge-success'
                              : attempt.result === 'FAIL'
                              ? 'badge-danger'
                              : 'badge-accent'
                          }`}
                        >
                          {attempt.result}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-muted)', fontSize: 'var(--text-meta)' }}>
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                      No attempts recorded yet. Click &quot;Start Free Practice&quot; above to begin!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
