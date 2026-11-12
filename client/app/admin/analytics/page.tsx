'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, analyticsService } from '@/lib/services';
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

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/admin/login');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
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

  const summary = data?.summary || {
    totalAttempts: 0,
    practiceAttempts: 0,
    challengeAttempts: 0,
    challengePassed: 0,
    challengeFailed: 0,
    avgWpm: 0,
    bestWpm: 0,
    avgAccuracy: 0,
    passRate: 0,
  };

  const users = data?.users || { total: 0, active: 0 };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--admin-bg)', color: 'var(--admin-text)' }}>
      <AdminNav />

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <span className="badge badge-teal" style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>
            Data Intelligence
          </span>
          <h1 className="text-h2" style={{ color: '#fff' }}>Platform Performance Analytics</h1>
          <p style={{ color: 'var(--admin-muted)', marginTop: '0.25rem' }}>
            Aggregated institutional typing speed velocity, accuracy distributions, and benchmark pass rates
          </p>
        </div>

        {/* Big Numbers Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', borderLeft: '4px solid var(--color-accent1)' }}>
            <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Active Students</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
              {users.active} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--admin-muted)' }}>/ {users.total}</span>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', borderLeft: '4px solid var(--color-accent)' }}>
            <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Platform Avg Speed</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
              {summary.avgWpm} WPM
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent4)' }}>Platform Peak: {summary.bestWpm} WPM</span>
          </div>

          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', borderLeft: '4px solid var(--color-accent2)' }}>
            <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Accuracy Ratio</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent2)', marginTop: '0.25rem' }}>
              {summary.avgAccuracy}%
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', borderLeft: '4px solid var(--color-accent3)' }}>
            <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Challenge Pass Rate</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#68d391', marginTop: '0.25rem' }}>
              {summary.passRate}%
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>{summary.challengePassed} passed / {summary.challengeFailed} failed</span>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
          {/* Daily Trend */}
          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.75rem' }}>
            <h2 className="text-h3" style={{ color: '#fff', marginBottom: '1.25rem' }}>Daily Assessment Volume</h2>
            <div style={{ width: '100%', height: '300px' }}>
              {data?.dailyAttempts && data.dailyAttempts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dailyAttempts}>
                    <defs>
                      <linearGradient id="attemptsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00c5a2" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#00c5a2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#718096" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#718096" style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', borderRadius: '8px', border: '1px solid #2a2a3e', color: '#fff' }} />
                    <Area type="monotone" dataKey="attempts" stroke="#00c5a2" fillOpacity={1} fill="url(#attemptsGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-muted)' }}>
                  No activity in this period.
                </div>
              )}
            </div>
          </div>

          {/* Domain Breakdown */}
          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.75rem' }}>
            <h2 className="text-h3" style={{ color: '#fff', marginBottom: '1.25rem' }}>Domain Assessment Usage</h2>
            <div style={{ width: '100%', height: '300px' }}>
              {data?.categoryStats && data.categoryStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#718096" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#718096" style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', borderRadius: '8px', border: '1px solid #2a2a3e', color: '#fff' }} />
                    <Legend />
                    <Bar dataKey="count" name="Total Sessions" fill="#044C94" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgWpm" name="Avg Speed (WPM)" fill="#00a1ba" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-muted)' }}>
                  No domain breakdown available.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
