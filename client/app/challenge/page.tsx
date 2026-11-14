'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  authService,
  categoryService,
  contentService,
  typingService,
  settingsService,
  type Category,
  type TypingContent,
} from '@/lib/services';
import Navbar from '@/components/Navbar';
import { Zap, ClipboardList, Check, Rocket, Lightbulb, CheckCircle } from 'lucide-react';
import ClinicalDocumentView from '@/components/ClinicalDocumentView';
import { isDischargeSummaryContent } from '@/lib/clinicalTemplates';

type CharState = 'idle' | 'correct' | 'wrong' | 'current';
type AssessmentStatus = 'select' | 'running' | 'completed';

export default function ChallengeMePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [contents, setContents] = useState<TypingContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<TypingContent | null>(null);
  const [targetWPM, setTargetWPM] = useState<number>(30);
  const [wpmBenchmarks, setWpmBenchmarks] = useState<number[]>([20, 25, 30, 35, 40, 45, 50, 60, 80, 100]);
  const [loading, setLoading] = useState(true);

  // Challenge game status
  const [status, setStatus] = useState<AssessmentStatus>('select');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [typed, setTyped] = useState('');
  const [charStates, setCharStates] = useState<CharState[]>([]);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [resultMetrics, setResultMetrics] = useState<any>(null);
  const [chartViewMode, setChartViewMode] = useState<'CHART' | 'MONO'>('CHART');

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);

  // Auto-scroll passage container to keep active typing position visible and centered
  useEffect(() => {
    if (activeCharRef.current && contentContainerRef.current) {
      const container = contentContainerRef.current;
      const activeEl = activeCharRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      const relativeTop = activeRect.top - containerRect.top + container.scrollTop;
      const targetScrollTop = relativeTop - container.clientHeight * 0.35;

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    }
  }, [typed]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    initChallengeSettings();
  }, [router]);

  const initChallengeSettings = async () => {
    try {
      const [catsRes, settingsRes] = await Promise.all([
        categoryService.getAll({ status: 'ACTIVE' }),
        settingsService.getSettings(),
      ]);

      setCategories(catsRes.categories);
      setSelectedCategory('ALL');

      if (settingsRes.settings.availableWPMBenchmarks) {
        setWpmBenchmarks(settingsRes.settings.availableWPMBenchmarks);
      }
      if (settingsRes.settings.defaultTargetWPM) {
        setTargetWPM(settingsRes.settings.defaultTargetWPM);
      }
    } catch {
      // Handled
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      loadContents(selectedCategory);
    }
  }, [selectedCategory]);

  const loadContents = async (catId: string) => {
    setLoading(true);
    try {
      const res = await contentService.getAll({
        category: catId === 'ALL' ? undefined : catId,
        mode: 'CHALLENGE',
        status: 'ACTIVE',
        limit: 50,
      });
      setContents(res.content);
      if (res.content.length > 0) {
        setSelectedContent(res.content[0]);
      } else {
        setSelectedContent(null);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  // Calculate target duration
  const calculatedDuration = selectedContent
    ? Math.ceil((selectedContent.wordCount / targetWPM) * 60)
    : 0;

  // Start challenge session
  const startChallenge = async () => {
    if (!selectedContent) return;
    try {
      const res = await typingService.startSession(selectedContent._id, 'CHALLENGE', targetWPM);
      setSessionToken(res.sessionToken);
      setTimeLimitSeconds(res.timeLimitSeconds);
      setTimeLeft(res.timeLimitSeconds);

      const states: CharState[] = selectedContent.content
        .split('')
        .map((_, i) => (i === 0 ? 'current' : 'idle'));
      setCharStates(states);
      setTyped('');
      setLiveWpm(0);
      setLiveAccuracy(100);
      setResultMetrics(null);

      const now = Date.now();
      startTimeRef.current = now;
      setStatus('running');

      // Countdown timer
      countdownRef.current = setInterval(() => {
        const remaining = res.timeLimitSeconds - Math.floor((Date.now() - now) / 1000);
        if (remaining <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setTimeLeft(0);
          submitChallenge(true); // timed out
        } else {
          setTimeLeft(remaining);
        }
      }, 500);

      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      // Handled
    }
  };

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (status !== 'running' || !selectedContent) return;
      const value = e.target.value;
      const passage = selectedContent.content;

      if (value.length > passage.length) return;
      setTyped(value);

      // Character states
      const newStates: CharState[] = passage.split('').map((ch, i) => {
        if (i < value.length) return value[i] === ch ? 'correct' : 'wrong';
        if (i === value.length) return 'current';
        return 'idle';
      });
      setCharStates(newStates);

      // Live WPM
      const elapsedMin = (Date.now() - (startTimeRef.current ?? Date.now())) / 60000;
      if (elapsedMin > 0.05) {
        setLiveWpm(Math.round((value.length / 5) / elapsedMin));
      }

      // Live Accuracy
      let correct = 0;
      for (let i = 0; i < value.length; i++) {
        if (value[i] === passage[i]) correct++;
      }
      setLiveAccuracy(value.length > 0 ? Math.round((correct / value.length) * 100) : 100);

      // Full passage typed
      if (value.length === passage.length) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        submitChallenge(false, value);
      }
    },
    [status, selectedContent]
  );

  const submitChallenge = async (expired: boolean, finalTyped?: string) => {
    if (!sessionToken || submitting) return;
    setSubmitting(true);
    const textToSend = finalTyped !== undefined ? finalTyped : typed;
    const timeTaken = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : timeLimitSeconds;

    try {
      const res = await typingService.submitSession(sessionToken, textToSend, timeTaken);
      setResultMetrics(res.metrics);
      setStatus('completed');
    } catch {
      // Handled
    } finally {
      setSubmitting(false);
    }
  };

  const resetChallenge = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setStatus('select');
    setTyped('');
    setResultMetrics(null);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="challenge" />

      <div className="container" style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1320px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <span className="badge badge-accent" style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>
            Timed Assessment
          </span>
          <h1 className="text-h2" style={{ color: 'var(--color-secondary)' }}>
            <Zap size={26} strokeWidth={1.5} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.4rem' }} /> Challenge Me
          </h1>
          <p className="text-body" style={{ color: 'var(--color-muted)', marginTop: '0.25rem' }}>
            Timed speed verification benchmark with automated PASS/FAIL validation
          </p>
        </div>

        {status === 'select' && (
          <div>
            {/* Domain Filter Pills */}
            <div style={{ marginBottom: '1.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-meta)', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginRight: '0.5rem', letterSpacing: '0.05em' }}>
                Filter By Domain:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`btn btn-sm ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderRadius: '20px', padding: '0.35rem 1rem', fontSize: '0.85rem' }}
              >
                All Challenges
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setSelectedCategory(c._id)}
                  className={`btn btn-sm ${selectedCategory === c._id ? 'btn-primary' : 'btn-outline'}`}
                  style={{ borderRadius: '20px', padding: '0.35rem 1rem', fontSize: '0.85rem' }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Master-Detail Grid (Left: Ordered List, Right: Sticky Assessment Configuration) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                gap: '1.75rem',
                alignItems: 'start',
              }}
            >
              {/* Left Column: Ordered List of Challenges (<ol>) */}
              <div className="card shadow-sm" style={{ padding: '1.5rem', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #edf2f7' }}>
                  <div>
                    <h2 className="text-h3" style={{ color: 'var(--color-secondary)' }}>
                      Available Challenges
                    </h2>
                    <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
                      Select an assessment below to configure its benchmarks
                    </p>
                  </div>
                  <span className="badge badge-teal">
                    {contents.length} {contents.length === 1 ? 'Test' : 'Tests'}
                  </span>
                </div>

                {loading ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)' }}>
                    Loading available challenges...
                  </div>
                ) : contents.length === 0 ? (
                  <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--color-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><ClipboardList size={36} strokeWidth={1.5} /></div>
                    <p style={{ fontWeight: 600 }}>No challenges found for this category.</p>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('ALL')}
                      className="btn btn-outline btn-sm"
                      style={{ marginTop: '0.75rem' }}
                    >
                      View All Challenges
                    </button>
                  </div>
                ) : (
                  <ol
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem',
                      maxHeight: '640px',
                      overflowY: 'auto',
                      paddingRight: '0.25rem',
                    }}
                  >
                    {contents.map((item, index) => {
                      const isSelected = selectedContent?._id === item._id;
                      return (
                        <li key={item._id}>
                          <div
                            onClick={() => setSelectedContent(item)}
                            role="button"
                            tabIndex={0}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '1rem',
                              padding: '1rem 1.15rem',
                              borderRadius: 'var(--radius-md)',
                              border: isSelected
                                ? '2px solid var(--color-secondary)'
                                : '1px solid #e2e8f0',
                              backgroundColor: isSelected ? '#f0f7ff' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 150ms ease',
                              boxShadow: isSelected ? '0 4px 12px rgba(4, 76, 148, 0.08)' : 'none',
                            }}
                          >
                            {/* Sequence Number Badge */}
                            <span
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                flexShrink: 0,
                                backgroundColor: isSelected ? 'var(--color-secondary)' : '#edf2f7',
                                color: isSelected ? '#ffffff' : 'var(--color-secondary)',
                              }}
                            >
                              {String(index + 1).padStart(2, '0')}
                            </span>

                            {/* Challenge Meta */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <h3
                                  style={{
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    color: isSelected ? 'var(--color-secondary)' : 'var(--color-extra)',
                                    margin: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {item.title}
                                </h3>
                                {isSelected ? (
                                  <span
                                    className="badge badge-success"
                                    style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}
                                  >
                                    <Check size={12} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.2rem' }} /> Active
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                                    Select →
                                  </span>
                                )}
                              </div>

                              {/* Content Preview Snippet */}
                              <p
                                style={{
                                  fontSize: '0.82rem',
                                  color: 'var(--color-muted)',
                                  margin: '0 0 0.5rem 0',
                                  lineHeight: 1.4,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontStyle: 'italic',
                                }}
                              >
                                &ldquo;{item.content.slice(0, 80)}...&rdquo;
                              </p>

                              {/* Badges */}
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span className="badge badge-teal" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                                  {item.category && typeof item.category === 'object' ? item.category.name : 'Category'}
                                </span>
                                <span className="badge badge-accent" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                                  {item.wordCount} words
                                </span>
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '0.15rem 0.5rem',
                                    backgroundColor: '#edf2f7',
                                    color: '#4a5568',
                                  }}
                                >
                                  {item.difficulty}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginLeft: 'auto' }}>
                                  Min {item.minimumAccuracy}% Acc
                                </span>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              {/* Right Column: Sticky Challenge Dossier & Assessment Configuration */}
              <div
                className="card shadow-md"
                style={{
                  padding: '1.75rem',
                  backgroundColor: '#ffffff',
                  position: 'sticky',
                  top: '90px',
                  borderTop: '4px solid var(--color-secondary)',
                }}
              >
                {selectedContent ? (
                  <>
                    <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #edf2f7' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span className="badge badge-teal">
                          {selectedContent.category && typeof selectedContent.category === 'object' ? selectedContent.category.name : 'Category'}
                        </span>
                        <span className="badge badge-accent">
                          {selectedContent.difficulty}
                        </span>
                      </div>
                      <h2 className="text-h2" style={{ color: 'var(--color-secondary)', fontSize: '1.4rem' }}>
                        {selectedContent.title}
                      </h2>
                      <div style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {selectedContent.wordCount} words · {selectedContent.characterCount} characters
                      </div>
                    </div>

                    {/* Passage Content Preview */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: 'var(--text-meta)', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                        Passage Preview:
                      </span>
                      <div
                        style={{
                          fontFamily: 'Consolas, monospace',
                          fontSize: '0.85rem',
                          lineHeight: 1.6,
                          padding: '0.85rem',
                          backgroundColor: '#f8fafc',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid #e2e8f0',
                          color: '#4a5568',
                          maxHeight: '120px',
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {selectedContent.content}
                      </div>
                    </div>

                    {/* Target WPM Benchmark Buttons */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', fontWeight: 700, color: 'var(--color-extra)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                        Target Speed Benchmark: <strong style={{ color: 'var(--color-secondary)' }}>{targetWPM} WPM</strong>
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {wpmBenchmarks.map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setTargetWPM(b)}
                            className={`btn btn-sm ${targetWPM === b ? 'btn-primary' : 'btn-outline'}`}
                            style={{ minWidth: '48px', padding: '0.3rem 0.6rem', fontSize: '0.82rem' }}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Assessment Rules Grid */}
                    <div
                      style={{
                        backgroundColor: '#f7fafc',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1.5rem',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#718096', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                        Assessment Rules & Thresholds
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#a0aec0', textTransform: 'uppercase', display: 'block' }}>Target Speed</span>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-secondary)' }}>{targetWPM} WPM</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#a0aec0', textTransform: 'uppercase', display: 'block' }}>Min Accuracy</span>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-accent2)' }}>{selectedContent.minimumAccuracy}%</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#a0aec0', textTransform: 'uppercase', display: 'block' }}>Allowed Time</span>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                            {Math.floor(calculatedDuration / 60)}m {calculatedDuration % 60}s
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#a0aec0', textTransform: 'uppercase', display: 'block' }}>Pass Condition</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2d3748' }}>Speed ≥ {targetWPM} & Acc ≥ {selectedContent.minimumAccuracy}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Launch Button */}
                    <button
                      onClick={startChallenge}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '0.9rem',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 14px rgba(4, 76, 148, 0.25)',
                      }}
                    >
                      <Rocket size={16} strokeWidth={1.5} style={{ display: 'inline-block', verticalAlign: 'middle' }} /> Launch Challenge Assessment ({Math.floor(calculatedDuration / 60)}m {calculatedDuration % 60}s)
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-muted)' }}>
                    Select a challenge from the list on the left to configure assessment.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {status === 'running' && selectedContent && (
          <div>
            {/* Live Timer and Metric Bar */}
            <div
              className="card shadow-sm"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                textAlign: 'center',
                backgroundColor: '#fff',
              }}
            >
              <div>
                <span style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)', fontWeight: 600 }}>TIME REMAINING</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: timeLeft <= 30 ? '#e53e3e' : 'var(--color-secondary)' }}>
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)', fontWeight: 600 }}>LIVE WPM</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: liveWpm >= targetWPM ? 'var(--color-accent2)' : 'var(--color-secondary)' }}>
                  {liveWpm} <span style={{ fontSize: '0.9rem' }}>/ {targetWPM}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)', fontWeight: 600 }}>ACCURACY</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: liveAccuracy >= selectedContent.minimumAccuracy ? 'var(--color-accent2)' : '#e53e3e' }}>
                  {liveAccuracy}%
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)', fontWeight: 600 }}>PROGRESS</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-extra)' }}>
                  {Math.min(100, Math.round((typed.length / selectedContent.content.length) * 100))}%
                </div>
              </div>
            </div>

            {/* Split Screen Challenge Arena (50 / 50) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
                gap: '1.5rem',
                alignItems: 'stretch',
                marginBottom: '2rem',
              }}
            >
              {/* Left Column: Target Reference Passage */}
              {isDischargeSummaryContent(selectedContent.title, selectedContent.content) && chartViewMode === 'CHART' ? (
                <div style={{ height: '540px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setChartViewMode('MONO')}
                      className="btn btn-sm btn-ghost"
                      style={{ fontSize: '0.72rem', color: '#64748b' }}
                    >
                      Switch to Clean Monospace View →
                    </button>
                  </div>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <ClinicalDocumentView
                      content={selectedContent.content}
                      charStates={charStates}
                      title={selectedContent.title}
                      studentName="Candidate Student"
                      targetWPM={targetWPM}
                      mode="CHALLENGE"
                      containerRef={contentContainerRef}
                      activeCharRef={activeCharRef}
                      onContainerClick={() => inputRef.current?.focus()}
                      hospitalName="Ace Discharge Summary"
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="card shadow-md"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#ffffff',
                    height: '540px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid #edf2f7',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)', letterSpacing: '0.05em' }}>
                        Target Challenge Text
                      </span>
                      <h2 className="text-h3" style={{ color: 'var(--color-secondary)', marginTop: '0.15rem' }}>
                        {selectedContent.title}
                      </h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      {isDischargeSummaryContent(selectedContent.title, selectedContent.content) && (
                        <button
                          type="button"
                          onClick={() => setChartViewMode('CHART')}
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderColor: '#044C94', color: '#044C94' }}
                        >
                          📄 Hospital Chart View
                        </button>
                      )}
                      <span className="badge badge-teal">
                        Target: {targetWPM} WPM
                      </span>
                      <span className="badge badge-accent">
                        Min Acc: {selectedContent.minimumAccuracy}%
                      </span>
                    </div>
                  </div>

                  {/* Scrollable Target Box */}
                  <div
                    ref={contentContainerRef}
                    style={{
                      flex: 1,
                      fontFamily: 'Consolas, "Liberation Mono", Menlo, Courier, monospace',
                      fontSize: '1.15rem',
                      lineHeight: 1.85,
                      letterSpacing: '0.02em',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      userSelect: 'none',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      cursor: 'text',
                    }}
                    onClick={() => inputRef.current?.focus()}
                  >
                    {selectedContent.content.split('').map((char, index) => {
                      const state = charStates[index] || 'idle';
                      let color = '#718096';
                      let bg = 'transparent';
                      let borderBottom = 'none';

                      if (state === 'correct') {
                        color = '#15803d';
                        bg = '#dcfce7';
                      } else if (state === 'wrong') {
                        color = '#b91c1c';
                        bg = '#fee2e2';
                        borderBottom = '2px solid #ef4444';
                      } else if (state === 'current') {
                        color = '#ffffff';
                        bg = 'var(--color-secondary, #044C94)';
                      }

                      return (
                        <span
                          key={index}
                          ref={state === 'current' ? activeCharRef : undefined}
                          style={{
                            color,
                            backgroundColor: bg,
                            borderBottom,
                            borderRadius: '2px',
                            padding: '0 1px',
                            boxShadow: state === 'current' ? '0 0 0 2px rgba(4, 76, 148, 0.35)' : 'none',
                          }}
                        >
                          {char}
                        </span>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      marginTop: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 'var(--text-meta)',
                      color: 'var(--color-muted)',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Lightbulb size={14} strokeWidth={1.5} /> Click anywhere on passage to focus typing</span>
                    <span>Auto-scrolls with cursor</span>
                  </div>
                </div>
              )}

              {/* Right Column: Writing Input Field */}
              <div
                className="card shadow-md"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#ffffff',
                  height: '540px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid #edf2f7',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)', letterSpacing: '0.05em' }}>
                      Writing Field
                    </span>
                    <h2 className="text-h3" style={{ color: 'var(--color-secondary)', marginTop: '0.15rem' }}>
                      Active Assessment
                    </h2>
                  </div>
                  <span className="badge badge-accent">
                    Assessment Running
                  </span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <textarea
                    ref={inputRef}
                    value={typed}
                    onChange={handleInput}
                    placeholder="Focus and type here continuously..."
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    style={{
                      flex: 1,
                      width: '100%',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: '2px solid var(--color-accent)',
                      fontFamily: 'Consolas, "Liberation Mono", Menlo, Courier, monospace',
                      fontSize: '1.15rem',
                      lineHeight: 1.85,
                      letterSpacing: '0.02em',
                      outline: 'none',
                      resize: 'none',
                      backgroundColor: '#ffffff',
                      color: 'var(--color-text)',
                      boxShadow: '0 0 0 3px rgba(0, 120, 183, 0.12)',
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.75rem',
                      fontSize: 'var(--text-meta)',
                      color: 'var(--color-muted)',
                    }}
                  >
                    <span>
                      Characters: <strong>{typed.length}</strong> / {selectedContent.content.length}
                    </span>
                    <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                      Keep typing until paragraph is finished
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === 'completed' && resultMetrics && (
          <div className="card shadow-lg" style={{ padding: '3rem', maxWidth: '640px', margin: '0 auto', textAlign: 'center', backgroundColor: '#fff' }}>
            {/* PASS or FAIL Banner */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  padding: '0.5rem 2rem',
                  borderRadius: '8px',
                  color: '#fff',
                  backgroundColor: resultMetrics.result === 'PASS' ? '#38a169' : '#e53e3e',
                  letterSpacing: '0.05em',
                }}
              >
                {resultMetrics.result}
              </span>
            </div>

            <h2 className="text-h2" style={{ color: 'var(--color-secondary)' }}>
              {resultMetrics.result === 'PASS' ? 'Challenge Passed!' : 'Challenge Failed'}
            </h2>
            <p className="text-body" style={{ color: 'var(--color-muted)', marginTop: '0.25rem' }}>
              {resultMetrics.result === 'PASS'
                ? 'Congratulations! You achieved all required speed and accuracy thresholds.'
                : 'Speed or accuracy did not meet the required benchmark criteria.'}
            </p>

            {/* Comparison Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', margin: '2rem 0' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Typing Speed</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                  {resultMetrics.wpm} WPM
                </div>
                <span style={{ fontSize: '0.75rem', color: resultMetrics.wpm >= resultMetrics.targetWPM ? '#38a169' : '#e53e3e' }}>
                  Target: {resultMetrics.targetWPM} WPM
                </span>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Accuracy</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                  {resultMetrics.accuracy}%
                </div>
                <span style={{ fontSize: '0.75rem', color: resultMetrics.accuracy >= resultMetrics.minimumAccuracy ? '#38a169' : '#e53e3e' }}>
                  Required: {resultMetrics.minimumAccuracy}%
                </span>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Time Taken</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                  {resultMetrics.timeTaken}s
                </div>
                <span style={{ fontSize: '0.75rem', color: '#718096' }}>
                  Limit: {timeLimitSeconds}s
                </span>
              </div>
            </div>

            {selectedContent && isDischargeSummaryContent(selectedContent.title, selectedContent.content) && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.85rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={16} /> Clinical Transcription Assessment Validated
                </div>
                <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: '0.25rem' }}>
                  Clinical Precision Score: <strong>{resultMetrics.accuracy}%</strong> · All medical terminology, Joint Commission abbreviation rules, and diagnostic numbers evaluated.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={resetChallenge} className="btn btn-primary">
                Try Another Challenge
              </button>
              <a href="/history" className="btn btn-outline">
                View History
              </a>
              <a href="/dashboard" className="btn btn-ghost">
                Back to Dashboard
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
