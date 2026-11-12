'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, analyticsService } from '@/lib/services';
import { Trophy } from 'lucide-react';
import AdminNav from '@/components/AdminNav';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/admin/login');
      return;
    }
    const user = authService.getStoredUser();
    if (user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchAdminData();
  }, [router]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getAdminAnalytics();
      setData(res);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const users = data?.users || { total: 0, active: 0, inactive: 0, blocked: 0 };
  const summary = data?.summary || {
    totalAttempts: 0,
    practiceAttempts: 0,
    challengeAttempts: 0,
    avgWpm: 0,
    bestWpm: 0,
    avgAccuracy: 0,
    passRate: 0,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--admin-bg)', color: 'var(--admin-text)' }}>
      <AdminNav />

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="text-h2" style={{ color: '#fff' }}>Platform Operations Dashboard</h1>
            <p className="text-body" style={{ color: 'var(--admin-muted)', marginTop: '0.25rem' }}>
              Real-time student cohorts, typing throughput, and benchmark pass rates
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a href="/admin/content" className="btn btn-primary btn-sm">
              + Create Content
            </a>
            <a href="/admin/reports" className="btn btn-outline btn-sm" style={{ color: '#fff', borderColor: 'var(--admin-border)' }}>
              Export Reports
            </a>
          </div>
        </div>

        {/* Primary Metric Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', borderLeft: '4px solid var(--color-accent1)' }}>
            <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Students</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
              {loading ? '—' : users.total}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#68d391' }}>
              {users.active} active cohort
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', borderLeft: '4px solid var(--color-accent)' }}>
            <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Attempts</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
              {loading ? '—' : summary.totalAttempts}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
              {summary.practiceAttempts} practice / {summary.challengeAttempts} challenge
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', borderLeft: '4px solid var(--color-accent2)' }}>
            <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Platform Avg Speed</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
              {loading ? '—' : summary.avgWpm} <span style={{ fontSize: '1rem', fontWeight: 400 }}>WPM</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent4)' }}>Peak: {summary.bestWpm} WPM</span>
          </div>

          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', borderLeft: '4px solid var(--color-accent3)' }}>
            <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Accuracy</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
              {loading ? '—' : `${summary.avgAccuracy}%`}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#68d391' }}>Benchmark: 80%+</span>
          </div>

          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', borderLeft: '4px solid #f6ad55' }}>
            <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Challenge Pass Rate</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f6ad55', marginTop: '0.25rem' }}>
              {loading ? '—' : `${summary.passRate}%`}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>{summary.challengePassed || 0} passed tests</span>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Chart 1: Daily Activity */}
          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 className="text-h3" style={{ color: '#fff' }}>14-Day Activity Volume</h2>
              <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)' }}>Attempts logged daily</span>
            </div>
            <div style={{ width: '100%', height: '280px' }}>
              {data?.dailyAttempts && data.dailyAttempts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dailyAttempts}>
                    <defs>
                      <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0078b7" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#0078b7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#718096" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#718096" style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', borderRadius: '8px', border: '1px solid #2a2a3e', color: '#fff' }} />
                    <Area type="monotone" dataKey="attempts" stroke="#0078b7" fillOpacity={1} fill="url(#colorAttempts)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-muted)' }}>
                  No activity in the last 14 days.
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Category Distribution */}
          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 className="text-h3" style={{ color: '#fff' }}>Category Distribution</h2>
              <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)' }}>Sessions by domain</span>
            </div>
            <div style={{ width: '100%', height: '280px' }}>
              {data?.categoryStats && data.categoryStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#718096" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#718096" style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', borderRadius: '8px', border: '1px solid #2a2a3e', color: '#fff' }} />
                    <Bar dataKey="count" name="Total Sessions" fill="#00c5a2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-muted)' }}>
                  No category usage data yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 className="text-h3" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Trophy size={18} strokeWidth={1.5} /> Student Speed Leaderboard</h2>
              <p style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)', marginTop: '0.25rem' }}>
                Top performing students ranked by average speed
              </p>
            </div>
            <a href="/admin/students" className="btn btn-sm" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'var(--admin-border)' }}>
              Manage All Students →
            </a>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table table-admin" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Average Speed</th>
                  <th>Peak Speed</th>
                  <th>Average Accuracy</th>
                  <th>Total Sessions</th>
                </tr>
              </thead>
              <tbody>
                {data?.leaderboard && data.leaderboard.length > 0 ? (
                  data.leaderboard.map((student: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 800, color: idx === 0 ? 'var(--color-accent4)' : '#fff' }}>
                        #{idx + 1}
                      </td>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{student.name}</td>
                      <td style={{ color: 'var(--admin-muted)' }}>{student.email}</td>
                      <td style={{ fontWeight: 800, color: 'var(--color-accent1)' }}>{student.avgWpm} WPM</td>
                      <td>{student.bestWpm} WPM</td>
                      <td>{student.avgAccuracy}%</td>
                      <td>{student.sessions}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-muted)' }}>
                      No leaderboard data recorded yet.
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
