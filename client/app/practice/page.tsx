'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  authService,
  categoryService,
  contentService,
  typingService,
  type Category,
  type TypingContent,
} from '@/lib/services';
import Navbar from '@/components/Navbar';
import { RotateCcw, ClipboardList, Check, Play, Lightbulb, CheckCircle, FileText } from 'lucide-react';
import ClinicalDocumentView from '@/components/ClinicalDocumentView';
import { isDischargeSummaryContent } from '@/lib/clinicalTemplates';

type CharState = 'idle' | 'correct' | 'wrong' | 'current';

export default function FreePracticePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [contents, setContents] = useState<TypingContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<TypingContent | null>(null);
  const [loading, setLoading] = useState(true);

  // Typing session state
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [typed, setTyped] = useState('');
  const [charStates, setCharStates] = useState<CharState[]>([]);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [chartViewMode, setChartViewMode] = useState<'CHART' | 'MONO'>('CHART');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);

  // Auto-scroll target passage container so active typing cursor remains visible
  useEffect(() => {
    if (activeCharRef.current && contentContainerRef.current) {
      const container = contentContainerRef.current;
      const activeEl = activeCharRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      // Relative offset of active character from top of container
      const relativeTop = activeRect.top - containerRect.top + container.scrollTop;
      // Keep active cursor positioned around 35% from the top of the viewport
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
    loadCategories();
  }, [router]);

  // Load categories
  const loadCategories = async () => {
    try {
      const res = await categoryService.getAll({ status: 'ACTIVE' });
      setCategories(res.categories);
      setSelectedCategory('ALL');
    } catch {
      // Handled
    }
  };

  // Load content when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadCategoryContent(selectedCategory);
    }
  }, [selectedCategory]);

  const loadCategoryContent = async (catId: string) => {
    setLoading(true);
    try {
      const res = await contentService.getAll({
        category: catId === 'ALL' ? undefined : catId,
        mode: 'PRACTICE',
        status: 'ACTIVE',
        limit: 50,
      });
      setContents(res.content);
      if (res.content.length > 0) {
        selectPassage(res.content[0]);
      } else {
        setSelectedContent(null);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const selectPassage = (contentItem: TypingContent) => {
    setSelectedContent(contentItem);
    resetTyping();
    const states: CharState[] = contentItem.content
      .split('')
      .map((_, i) => (i === 0 ? 'current' : 'idle'));
    setCharStates(states);
  };

  const resetTyping = () => {
    setStarted(false);
    setFinished(false);
    setSessionToken(null);
    setStartTime(null);
    setElapsed(0);
    setTyped('');
    setLiveWpm(0);
    setLiveAccuracy(100);
    setResultData(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Start typing session
  const startSession = async () => {
    if (!selectedContent) return;
    try {
      const res = await typingService.startSession(selectedContent._id, 'PRACTICE');
      setSessionToken(res.sessionToken);
      const now = Date.now();
      setStartTime(now);
      setStarted(true);

      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - now) / 1000));
      }, 1000);

      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      // Handled
    }
  };

  // Keystroke handler
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (finished || !selectedContent || !started) return;
      const value = e.target.value;
      const passage = selectedContent.content;

      // Restrict typing past passage length
      if (value.length > passage.length) return;

      setTyped(value);

      // Character states
      const newStates: CharState[] = passage.split('').map((ch, i) => {
        if (i < value.length) return value[i] === ch ? 'correct' : 'wrong';
        if (i === value.length) return 'current';
        return 'idle';
      });
      setCharStates(newStates);

      // Standard WPM: (Typed Characters / 5) / (Time in Minutes)
      const currentElapsed = (Date.now() - (startTime ?? Date.now())) / 60000;
      if (currentElapsed > 0.05) {
        const standardWords = value.length / 5;
        setLiveWpm(Math.round(standardWords / currentElapsed));
      }

      // Accuracy: (Correct Chars / Typed Chars) * 100
      let correct = 0;
      for (let i = 0; i < value.length; i++) {
        if (value[i] === passage[i]) correct++;
      }
      const acc = value.length > 0 ? Math.round((correct / value.length) * 100) : 100;
      setLiveAccuracy(acc);

      // Completed
      if (value.length === passage.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setFinished(true);
        completeSession(value);
      }
    },
    [finished, selectedContent, started, startTime]
  );

  const completeSession = async (finalTyped: string) => {
    if (!sessionToken || !startTime || submitting) return;
    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      const res = await typingService.submitSession(sessionToken, finalTyped, timeTaken);
      setResultData(res.metrics);
    } catch {
      // Handled
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercent = selectedContent
    ? Math.min(100, Math.round((typed.length / selectedContent.content.length) * 100))
    : 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar with role-aware Admin Dashboard button */}
      <Navbar activePage="practice" />

      {/* Main Practice Container */}
      <div className="container" style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1320px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-accent" style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>
              Free Practice
            </span>
            <h1 className="text-h2" style={{ color: 'var(--color-secondary)' }}>
              Practice Arena
            </h1>
            <p className="text-body" style={{ color: 'var(--color-muted)', marginTop: '0.25rem' }}>
              Select a domain passage to practice keystroke cadence, accuracy, and muscle memory
            </p>
          </div>

          {started && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  resetTyping();
                  setStarted(false);
                }}
                className="btn btn-outline btn-sm"
              >
                ← Choose Another Passage
              </button>
              <button
                type="button"
                onClick={resetTyping}
                className="btn btn-ghost btn-sm"
                style={{ color: '#e53e3e' }}
              >
                <RotateCcw size={14} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.3rem' }} /> Restart
              </button>
            </div>
          )}
        </div>

        {/* ========================================================
            MODE 1: PASSAGE SELECTION (MASTER-DETAIL ORDERED LIST)
           ======================================================== */}
        {!started && (
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
                All Passages
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

            {/* Master-Detail Grid (Left: Ordered List, Right: Sticky Practice Dossier) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                gap: '1.75rem',
                alignItems: 'start',
              }}
            >
              {/* Left Column: Ordered List of Practice Passages (<ol>) */}
              <div className="card shadow-sm" style={{ padding: '1.5rem', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #edf2f7' }}>
                  <div>
                    <h2 className="text-h3" style={{ color: 'var(--color-secondary)' }}>
                      Available Practice Passages
                    </h2>
                    <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
                      Select a passage from the ordered list to inspect its content
                    </p>
                  </div>
                  <span className="badge badge-teal">
                    {contents.length} {contents.length === 1 ? 'Passage' : 'Passages'}
                  </span>
                </div>

                {loading ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)' }}>
                    Loading available passages...
                  </div>
                ) : contents.length === 0 ? (
                  <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--color-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><ClipboardList size={36} strokeWidth={1.5} /></div>
                    <p style={{ fontWeight: 600 }}>No practice passages found for this category.</p>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('ALL')}
                      className="btn btn-outline btn-sm"
                      style={{ marginTop: '0.75rem' }}
                    >
                      View All Passages
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
                            onClick={() => selectPassage(item)}
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

                            {/* Passage Meta */}
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
                                    <Check size={12} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.2rem' }} /> Selected
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
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              {/* Right Column: Sticky Practice Dossier */}
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

                    {/* Full Passage Preview */}
                    <div style={{ marginBottom: '1.5rem' }}>
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
                          maxHeight: '160px',
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {selectedContent.content}
                      </div>
                    </div>

                    {/* Practice Mode Highlights */}
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
                        Practice Arena Rules
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#a0aec0', textTransform: 'uppercase', display: 'block' }}>Time Limit</span>
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)' }}>Untimed (Free)</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#a0aec0', textTransform: 'uppercase', display: 'block' }}>Estimated Pace</span>
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-accent2)' }}>~{Math.max(1, Math.ceil(selectedContent.wordCount / 35))} min</span>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <span style={{ fontSize: '0.7rem', color: '#a0aec0', textTransform: 'uppercase', display: 'block' }}>Focus Area</span>
                          <span style={{ fontSize: '0.82rem', color: '#4a5568', fontWeight: 600 }}>Zero pressure accuracy building, real-time cadence tracking</span>
                        </div>
                      </div>
                    </div>

                    {/* Launch Button */}
                    <button
                      onClick={startSession}
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
                      <Play size={16} strokeWidth={1.5} style={{ display: 'inline-block', verticalAlign: 'middle' }} /> Launch Practice Session ({selectedContent.wordCount} Words)
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-muted)' }}>
                    Select a passage from the ordered list on the left to inspect details.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            MODE 2: ACTIVE PRACTICE ARENA (50/50 SPLIT SCREEN)
           ======================================================== */}
        {started && selectedContent && (
          <div>
            {/* Live Metrics Header Bar */}
            <div
              className="card shadow-sm"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                textAlign: 'center',
                backgroundColor: '#ffffff',
              }}
            >
              <div>
                <span style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Live Speed
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                  {liveWpm} <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>WPM</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Accuracy
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-accent2)' }}>
                  {liveAccuracy}%
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Time Elapsed
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                  {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-meta)', color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Progress
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-extra)' }}>
                  {progressPercent}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginBottom: '1.5rem', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-accent2)',
                  transition: 'width 100ms ease',
                }}
              />
            </div>

            {/* Split Screen Typing Arena (50 / 50) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
                gap: '1.5rem',
                alignItems: 'stretch',
                marginBottom: '2rem',
              }}
            >
              {/* Left Column: Reference Passage (Target Content) */}
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
                      targetWPM={selectedContent.targetWPM || 35}
                      mode="PRACTICE"
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
                        Reference Passage
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
                        {selectedContent.category && typeof selectedContent.category === 'object' ? selectedContent.category.name : 'Category'}
                      </span>
                      <span className="badge badge-accent">
                        {selectedContent.wordCount} words
                      </span>
                    </div>
                  </div>

                  {/* Scrollable Target Passage Box with Active Cursor Auto-Scroll */}
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
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Lightbulb size={14} strokeWidth={1.5} /> Click anywhere on text to focus typing input</span>
                    <span>Auto-scrolls as you type</span>
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
                      Type Passage Below
                    </h2>
                  </div>
                  <span className={`badge ${started ? (finished ? 'badge-success' : 'badge-teal') : 'badge-accent'}`}>
                    {started ? (finished ? 'Completed' : 'Session Active') : 'Ready to Start'}
                  </span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <textarea
                    ref={inputRef}
                    value={typed}
                    onChange={handleInput}
                    disabled={finished}
                    placeholder="Start typing the passage here..."
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    style={{
                      flex: 1,
                      width: '100%',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: finished ? '2px solid #38a169' : '2px solid var(--color-accent)',
                      fontFamily: 'Consolas, "Liberation Mono", Menlo, Courier, monospace',
                      fontSize: '1.15rem',
                      lineHeight: 1.85,
                      letterSpacing: '0.02em',
                      outline: 'none',
                      resize: 'none',
                      backgroundColor: finished ? '#f0fff4' : '#ffffff',
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
                      Characters typed: <strong>{typed.length}</strong> / {selectedContent.content.length}
                    </span>
                    <button
                      onClick={resetTyping}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '0.25rem 0.5rem', color: '#e53e3e' }}
                    >
                      <RotateCcw size={14} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.3rem' }} /> Restart Passage
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completion Result Modal */}
        {finished && resultData && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
          >
            <div className="card shadow-lg" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem', textAlign: 'center', backgroundColor: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}><CheckCircle size={48} strokeWidth={1.5} style={{ color: 'var(--color-accent2)' }} /></div>
              <h2 className="text-h2" style={{ color: 'var(--color-secondary)' }}>Practice Completed!</h2>
              <p className="text-body" style={{ color: 'var(--color-muted)', marginTop: '0.25rem' }}>
                Your typing metrics have been saved to your student profile
              </p>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '2rem 0' }}>
                <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Final Speed</span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                    {resultData.wpm} <span style={{ fontSize: '1rem', fontWeight: 400 }}>WPM</span>
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Final Accuracy</span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent2)' }}>
                    {resultData.accuracy}%
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Characters</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-extra)' }}>
                    {resultData.correctCharacters} / {resultData.typedCharacters}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#e53e3e' }}>({resultData.incorrectCharacters} errors)</span>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Time Taken</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-extra)' }}>
                    {resultData.timeTaken} seconds
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#718096' }}>({resultData.wordsTyped} words)</span>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedContent && isDischargeSummaryContent(selectedContent.title, selectedContent.content) && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                    <CheckCircle size={15} /> Clinical Medical Record Completed
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.2rem' }}>
                    Clinical Precision Score: <strong>{resultData.accuracy}%</strong> · All diagnostics, abbreviations, and numerical lab values verified.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    resetTyping();
                    if (selectedContent) selectPassage(selectedContent);
                  }}
                  className="btn btn-primary"
                >
                  Practice Again
                </button>
                <button
                  onClick={() => {
                    resetTyping();
                    setStarted(false);
                  }}
                  className="btn btn-outline"
                >
                  Choose Another Passage
                </button>
                <a href="/history" className="btn btn-ghost">
                  History
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
