'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, analyticsService } from '@/lib/services';
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

export default function StudentProgressPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchProgressData();
  }, [router]);

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getStudentAnalytics();
      setData(res);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary || {
    bestWpm: 0,
    avgWpm: 0,
    bestAccuracy: 0,
    avgAccuracy: 0,
    totalAttempts: 0,
    challengeAttempts: 0,
    passRate: 0,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="progress" />

      <div className="container" style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1140px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '2rem' }}>
          <span className="badge badge-accent" style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>
            Performance Telemetry
          </span>
          <h1 className="text-h2" style={{ color: 'var(--color-secondary)' }}>
            Student Progress Analytics
          </h1>
          <p className="text-body" style={{ color: 'var(--color-muted)', marginTop: '0.25rem' }}>
            Detailed breakdown of speed acceleration, precision consistency, and domain proficiency
          </p>
        </div>

        {/* Top Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="card shadow-sm" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-accent1)' }}>
            <span style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)', fontWeight: 600 }}>PEAK SPEED</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)', marginTop: '0.25rem' }}>
              {summary.bestWpm} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>WPM</span>
            </div>
          </div>

          <div className="card shadow-sm" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-accent)' }}>
            <span style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)', fontWeight: 600 }}>AVERAGE SPEED</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)', marginTop: '0.25rem' }}>
              {summary.avgWpm} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>WPM</span>
            </div>
          </div>

          <div className="card shadow-sm" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-accent2)' }}>
            <span style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)', fontWeight: 600 }}>PEAK ACCURACY</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent2)', marginTop: '0.25rem' }}>
              {summary.bestAccuracy}%
            </div>
          </div>

          <div className="card shadow-sm" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-accent3)' }}>
            <span style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)', fontWeight: 600 }}>AVERAGE ACCURACY</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-extra)', marginTop: '0.25rem' }}>
              {summary.avgAccuracy}%
            </div>
          </div>

          <div className="card shadow-sm" style={{ padding: '1.5rem', borderLeft: '4px solid #f6ad55' }}>
            <span style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)', fontWeight: 600 }}>CHALLENGE PASS RATE</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#dd6b20', marginTop: '0.25rem' }}>
              {summary.passRate}%
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          {/* Chart 1: WPM Over Time */}
          <div className="card shadow-sm" style={{ padding: '2rem', backgroundColor: '#fff' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 className="text-h3" style={{ color: 'var(--color-secondary)' }}>Speed Progression (WPM)</h2>
              <p style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
                Chronological typing speed evolution across recent sessions
              </p>
            </div>
            <div style={{ width: '100%', height: '300px' }}>
              {data?.timeline && data.timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" />
                    <XAxis dataKey="session" stroke="#a0aec0" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#a0aec0" style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Line type="monotone" dataKey="wpm" name="Speed (WPM)" stroke="#044C94" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
                  Complete typing sessions to render speed curve.
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Accuracy Over Time */}
          <div className="card shadow-sm" style={{ padding: '2rem', backgroundColor: '#fff' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 className="text-h3" style={{ color: 'var(--color-secondary)' }}>Accuracy Consistency (%)</h2>
              <p style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
                Precision accuracy trendline over completed assessments
              </p>
            </div>
            <div style={{ width: '100%', height: '300px' }}>
              {data?.timeline && data.timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" />
                    <XAxis dataKey="session" stroke="#a0aec0" style={{ fontSize: '11px' }} />
                    <YAxis domain={[50, 100]} stroke="#a0aec0" style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Line type="monotone" dataKey="accuracy" name="Accuracy (%)" stroke="#00c5a2" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
                  Complete typing sessions to render accuracy curve.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Domain Comparison */}
        <div className="card shadow-sm" style={{ padding: '2rem', backgroundColor: '#fff' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 className="text-h3" style={{ color: 'var(--color-secondary)' }}>Category Proficiency Comparison</h2>
            <p style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
              Speed and accuracy variance across specialized medical, business, and speed categories
            </p>
          </div>
          <div style={{ width: '100%', height: '320px' }}>
            {data?.categoryPerformance && data.categoryPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categoryPerformance} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" />
                  <XAxis dataKey="category" stroke="#718096" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#718096" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="avgWpm" name="Average Speed (WPM)" fill="#044C94" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avgAccuracy" name="Average Accuracy (%)" fill="#00a1ba" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
                No category data available yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

