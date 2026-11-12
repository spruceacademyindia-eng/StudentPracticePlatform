'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, settingsService } from '@/lib/services';
import AdminNav from '@/components/AdminNav';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    defaultTargetWPM: 30,
    minimumAccuracy: 80,
    maximumWordCount: 1000,
    defaultChallengeDuration: 300,
    availableWPMBenchmarks: '20, 25, 30, 35, 40, 45, 50, 60, 80, 100',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/admin/login');
      return;
    }
    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsService.getSettings();
      const s = res.settings;
      setForm({
        defaultTargetWPM: s.defaultTargetWPM || 30,
        minimumAccuracy: s.minimumAccuracy || 80,
        maximumWordCount: s.maximumWordCount || 1000,
        defaultChallengeDuration: s.defaultChallengeDuration || 300,
        availableWPMBenchmarks: Array.isArray(s.availableWPMBenchmarks)
          ? s.availableWPMBenchmarks.join(', ')
          : '20, 25, 30, 35, 40, 45, 50, 60, 80, 100',
      });
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setSaving(true);

    try {
      const parsedBenchmarks = form.availableWPMBenchmarks
        .split(',')
        .map((x) => Number(x.trim()))
        .filter((x) => !isNaN(x) && x > 0);

      await settingsService.updateSettings({
        defaultTargetWPM: Number(form.defaultTargetWPM),
        minimumAccuracy: Number(form.minimumAccuracy),
        maximumWordCount: Number(form.maximumWordCount),
        defaultChallengeDuration: Number(form.defaultChallengeDuration),
        availableWPMBenchmarks: parsedBenchmarks,
      });

      setMsg('System settings saved successfully in MongoDB.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--admin-bg)', color: 'var(--admin-text)' }}>
      <AdminNav />

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '840px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <span className="badge badge-teal" style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>
            System Configuration
          </span>
          <h1 className="text-h2" style={{ color: '#fff' }}>Platform Settings</h1>
          <p style={{ color: 'var(--admin-muted)', marginTop: '0.25rem' }}>
            Configure global assessment benchmarks, speed targets, and content bounds
          </p>
        </div>

        {msg && (
          <div style={{ backgroundColor: 'rgba(72, 187, 120, 0.15)', border: '1px solid #48bb78', color: '#9ae6b4', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            {msg}
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: 'rgba(229, 62, 62, 0.15)', border: '1px solid #e53e3e', color: '#fc8181', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '2rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-muted)' }}>
              Loading platform settings...
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                    Default Target Speed (WPM)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    required
                    className="input input-admin"
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                    value={form.defaultTargetWPM}
                    onChange={(e) => setForm({ ...form, defaultTargetWPM: Number(e.target.value) })}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>Default challenge target speed</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                    Minimum Accuracy Threshold (%)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    required
                    className="input input-admin"
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                    value={form.minimumAccuracy}
                    onChange={(e) => setForm({ ...form, minimumAccuracy: Number(e.target.value) })}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>Minimum accuracy to pass challenges</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                    Max Word Count Limit
                  </label>
                  <input
                    type="number"
                    min={100}
                    max={5000}
                    required
                    className="input input-admin"
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                    value={form.maximumWordCount}
                    onChange={(e) => setForm({ ...form, maximumWordCount: Number(e.target.value) })}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>Maximum allowed words per passage</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                    Default Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={3600}
                    required
                    className="input input-admin"
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                    value={form.defaultChallengeDuration}
                    onChange={(e) => setForm({ ...form, defaultChallengeDuration: Number(e.target.value) })}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>Fallback time limit</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                  Selectable WPM Benchmarks (Comma-separated)
                </label>
                <input
                  type="text"
                  required
                  className="input input-admin"
                  style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                  value={form.availableWPMBenchmarks}
                  onChange={(e) => setForm({ ...form, availableWPMBenchmarks: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>Available speed options on the Challenge page</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                  {saving ? 'Saving Settings...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
