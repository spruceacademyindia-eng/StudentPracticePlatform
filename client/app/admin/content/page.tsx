'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, contentService, categoryService, type TypingContent, type Category } from '@/lib/services';
import AdminNav from '@/components/AdminNav';
import {
  Sparkles,
  Activity,
  Calendar,
  Stethoscope,
  FlaskConical,
  FileText,
  Layers,
} from 'lucide-react';
import {
  CLINICAL_PRESETS,
  ClinicalDischargeForm,
  compileDischargeSummaryText,
} from '@/lib/clinicalTemplates';

type ContentForm = {
  title: string;
  description: string;
  content: string;
  category: string;
  subcategory: string;
  mode: 'PRACTICE' | 'CHALLENGE' | 'BOTH';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  targetWPM: number;
  minimumAccuracy: number;
};

const EMPTY_FORM: ContentForm = {
  title: '',
  description: '',
  content: '',
  category: '',
  subcategory: '',
  mode: 'BOTH',
  difficulty: 'MEDIUM',
  targetWPM: 30,
  minimumAccuracy: 80,
};

export default function AdminContentPage() {
  const router = useRouter();
  const [contentList, setContentList] = useState<TypingContent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [search, setSearch] = useState('');

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TypingContent | null>(null);
  const [form, setForm] = useState<ContentForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dynamic Clinical Discharge Summary State
  const defaultClinical = CLINICAL_PRESETS.orthopedic_spine;
  const [dischargeSummarySelected, setDischargeSummarySelected] = useState(false);
  const [clinicalTab, setClinicalTab] = useState<'encounter' | 'diagnoses' | 'labs' | 'course' | 'safety'>('encounter');
  const [clinicalForm, setClinicalForm] = useState<ClinicalDischargeForm>({
    preset: 'orthopedic_spine',
    title: defaultClinical.title || 'Clinical Discharge Summary',
    hospitalName: defaultClinical.hospitalName || 'Ace Discharge Summary',
    dateOfService: defaultClinical.dateOfService || '',
    admitDate: defaultClinical.admitDate || '',
    dischargeDate: defaultClinical.dischargeDate || '',
    admittingDiagnosis: defaultClinical.admittingDiagnosis || '',
    dischargeDiagnosis: defaultClinical.dischargeDiagnosis || '',
    secondaryDiagnoses: defaultClinical.secondaryDiagnoses || '',
    attendingMD: defaultClinical.attendingMD || '',
    consultations: defaultClinical.consultations || '',
    labsImaging: defaultClinical.labsImaging || '',
    cardiacEcho: defaultClinical.cardiacEcho || '',
    cxr: defaultClinical.cxr || '',
    labPanels: defaultClinical.labPanels || '',
    hospitalCourse: defaultClinical.hospitalCourse || '',
    mode: 'BOTH',
    difficulty: 'HARD',
    targetWPM: 35,
    minimumAccuracy: 85,
  });

  const updateClinicalField = (field: keyof ClinicalDischargeForm, value: any) => {
    const updated = { ...clinicalForm, [field]: value };
    setClinicalForm(updated);
    const compiled = compileDischargeSummaryText(updated);
    setForm((prev) => ({
      ...prev,
      title: updated.title,
      content: compiled,
      targetWPM: updated.targetWPM,
      minimumAccuracy: updated.minimumAccuracy,
      difficulty: updated.difficulty,
      mode: updated.mode,
    }));
  };

  const handleClinicalPresetChange = (presetKey: string) => {
    if (presetKey === 'blank') {
      const blankData: ClinicalDischargeForm = {
        preset: 'blank',
        title: 'Clinical Discharge Summary',
        hospitalName: 'Ace Discharge Summary',
        dateOfService: '',
        admitDate: '',
        dischargeDate: '',
        admittingDiagnosis: '',
        dischargeDiagnosis: '',
        secondaryDiagnoses: '',
        attendingMD: '',
        consultations: 'none',
        labsImaging: '',
        cardiacEcho: '',
        cxr: '',
        labPanels: '',
        hospitalCourse: '',
        mode: 'BOTH',
        difficulty: 'HARD',
        targetWPM: 35,
        minimumAccuracy: 85,
      };
      setClinicalForm(blankData);
      setForm((prev) => ({
        ...prev,
        title: blankData.title,
        content: compileDischargeSummaryText(blankData),
      }));
      return;
    }

    const preset = CLINICAL_PRESETS[presetKey];
    if (preset) {
      const merged = { ...clinicalForm, ...preset, preset: presetKey } as ClinicalDischargeForm;
      setClinicalForm(merged);
      setForm((prev) => ({
        ...prev,
        title: merged.title || prev.title,
        content: compileDischargeSummaryText(merged),
        targetWPM: merged.targetWPM || prev.targetWPM,
        minimumAccuracy: merged.minimumAccuracy || prev.minimumAccuracy,
        difficulty: merged.difficulty || prev.difficulty,
        mode: merged.mode || prev.mode,
      }));
    }
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/admin/login');
      return;
    }
    loadCategories();
  }, [router]);

  useEffect(() => {
    fetchContent();
  }, [page, filterCategory, filterMode, filterDifficulty, router]);

  const loadCategories = async () => {
    try {
      const res = await categoryService.getAll();
      setCategories(res.categories);
      if (res.categories.length > 0 && !form.category) {
        setForm((prev) => ({ ...prev, category: res.categories[0]._id }));
      }
    } catch {
      // Handled
    }
  };

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await contentService.getAll({
        category: filterCategory || undefined,
        mode: filterMode || undefined,
        difficulty: filterDifficulty || undefined,
        search: search || undefined,
        page,
        limit: 15,
      });
      setContentList(res.content);
      setTotal(res.total);
      setPages(res.pages);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    const defaultCat = categories.length > 0 ? categories[0]._id : '';
    const isDischarge = categories.length > 0 && categories[0].name.toLowerCase().includes('discharge summary');
    setDischargeSummarySelected(isDischarge);
    setForm({
      ...EMPTY_FORM,
      category: defaultCat,
      content: isDischarge ? compileDischargeSummaryText(clinicalForm) : '',
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (item: TypingContent) => {
    setEditingItem(item);
    const catId = item.category && typeof item.category === 'object' ? item.category._id : item.category;
    const catName = item.category && typeof item.category === 'object' ? item.category.name : '';
    const isDischarge =
      catName.toLowerCase().includes('discharge summary') ||
      item.title.toLowerCase().includes('discharge summary') ||
      item.content.includes('DISCHARGE SUMMARY:');
    setDischargeSummarySelected(isDischarge);
    setForm({
      title: item.title,
      description: item.description || '',
      content: item.content,
      category: catId,
      subcategory: typeof item.subcategory === 'object' && item.subcategory ? item.subcategory._id : '',
      mode: item.mode,
      difficulty: item.difficulty,
      targetWPM: item.targetWPM,
      minimumAccuracy: item.minimumAccuracy,
    });
    setError('');
    setShowModal(true);
  };

  const liveWordCount = form.content.trim().split(/\s+/).filter(Boolean).length;
  const liveCharCount = form.content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (liveWordCount < 10) {
      setError('Content must have at least 10 words.');
      setSaving(false);
      return;
    }

    try {
      const payload: Partial<TypingContent> = {
        title: form.title,
        description: form.description,
        content: form.content,
        category: form.category,
        subcategory: form.subcategory ? form.subcategory : undefined,
        mode: form.mode,
        difficulty: form.difficulty,
        targetWPM: Number(form.targetWPM),
        minimumAccuracy: Number(form.minimumAccuracy),
      };

      if (editingItem) {
        await contentService.update(editingItem._id, payload);
        setSuccess('Content updated successfully.');
      } else {
        await contentService.create(payload);
        setSuccess('Content created successfully.');
      }
      setShowModal(false);
      fetchContent();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save typing content.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: TypingContent, nextStatus: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') => {
    try {
      await contentService.updateStatus(item._id, nextStatus);
      fetchContent();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--admin-bg)', color: 'var(--admin-text)' }}>
      <AdminNav />

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-teal" style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>
              Content Repository
            </span>
            <h1 className="text-h2" style={{ color: '#fff' }}>Typing Passages</h1>
            <p style={{ color: 'var(--admin-muted)', marginTop: '0.25rem' }}>
              Curate, edit, and configure benchmark paragraphs for Practice and Challenge assessments
            </p>
          </div>
          <button onClick={openCreateModal} className="btn btn-primary btn-sm">
            + Create New Passage
          </button>
        </div>

        {success && (
          <div style={{ backgroundColor: 'rgba(72, 187, 120, 0.15)', border: '1px solid #48bb78', color: '#9ae6b4', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            {success}
          </div>
        )}

        {/* Filters */}
        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                className="input input-admin"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)', padding: '0.4rem 0.75rem' }}
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
              >
                <option value="" style={{ color: '#000' }}>All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id} style={{ color: '#000' }}>{c.name}</option>
                ))}
              </select>

              <select
                className="input input-admin"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)', padding: '0.4rem 0.75rem' }}
                value={filterMode}
                onChange={(e) => { setFilterMode(e.target.value); setPage(1); }}
              >
                <option value="" style={{ color: '#000' }}>All Modes</option>
                <option value="PRACTICE" style={{ color: '#000' }}>Practice</option>
                <option value="CHALLENGE" style={{ color: '#000' }}>Challenge</option>
                <option value="BOTH" style={{ color: '#000' }}>Both</option>
              </select>

              <select
                className="input input-admin"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)', padding: '0.4rem 0.75rem' }}
                value={filterDifficulty}
                onChange={(e) => { setFilterDifficulty(e.target.value); setPage(1); }}
              >
                <option value="" style={{ color: '#000' }}>All Difficulties</option>
                <option value="EASY" style={{ color: '#000' }}>Easy</option>
                <option value="MEDIUM" style={{ color: '#000' }}>Medium</option>
                <option value="HARD" style={{ color: '#000' }}>Hard</option>
                <option value="EXPERT" style={{ color: '#000' }}>Expert</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Search passages..."
                className="input input-admin"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)', padding: '0.4rem 0.75rem' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button onClick={() => { setPage(1); fetchContent(); }} className="btn btn-outline btn-sm" style={{ color: '#fff', borderColor: 'var(--admin-border)' }}>
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-admin" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Mode</th>
                  <th>Difficulty</th>
                  <th>Words / Chars</th>
                  <th>Target WPM</th>
                  <th>Min Acc</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-muted)' }}>
                      Loading content repository...
                    </td>
                  </tr>
                ) : contentList.length > 0 ? (
                  contentList.map((item) => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 600, color: '#fff', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </td>
                      <td>
                        <span className="badge badge-teal">
                          {item.category && typeof item.category === 'object' ? item.category.name : 'Category'}
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{item.mode?.toLowerCase()}</td>
                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.difficulty}</span>
                      </td>
                      <td>{item.wordCount}w / {item.characterCount}c</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-accent1)' }}>{item.targetWPM} WPM</td>
                      <td>{item.minimumAccuracy}%</td>
                      <td>
                        <span className={`badge ${item.status === 'ACTIVE' ? 'badge-success' : item.status === 'ARCHIVED' ? 'badge-danger' : 'badge-accent'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => openEditModal(item)}
                            className="btn btn-sm"
                            style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'var(--admin-border)', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          >
                            Edit
                          </button>
                          {item.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleToggleStatus(item, 'INACTIVE')}
                              className="btn btn-sm"
                              style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#fed7d7', borderColor: 'var(--admin-border)', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(item, 'ACTIVE')}
                              className="btn btn-sm"
                              style={{ backgroundColor: 'rgba(72,187,120,0.2)', color: '#9ae6b4', borderColor: 'transparent', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleStatus(item, 'ARCHIVED')}
                            className="btn btn-sm"
                            style={{ backgroundColor: 'transparent', color: 'var(--admin-muted)', borderColor: 'var(--admin-border)', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-muted)' }}>
                      No passages found. Click &quot;Create New Passage&quot; above to add one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--admin-border)', paddingTop: '1rem' }}>
              <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)' }}>
                Page {page} of {pages} ({total} passages)
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

        {/* Create / Edit Modal (Unified for Standard Passages & Dynamic Discharge Summaries) */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: dischargeSummarySelected ? '1180px' : '680px', maxHeight: '92vh', overflowY: 'auto', transition: 'max-width 200ms ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 className="text-h3" style={{ color: '#fff', margin: 0 }}>
                  {editingItem ? 'Edit Typing Passage' : 'Create New Typing Passage'}
                </h3>
                {dischargeSummarySelected && (
                  <span
                    style={{
                      backgroundColor: 'rgba(0, 197, 162, 0.15)',
                      color: 'var(--color-accent2, #00c5a2)',
                      border: '1px solid var(--color-accent2, #00c5a2)',
                      borderRadius: '20px',
                      padding: '0.2rem 0.65rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    Discharge Summary Mode Active
                  </span>
                )}
              </div>

              {error && (
                <div style={{ backgroundColor: 'rgba(229, 62, 62, 0.15)', border: '1px solid #e53e3e', color: '#fc8181', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--admin-muted)', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-admin"
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                    placeholder="e.g. Inpatient Cardiology Discharge Summary"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--admin-muted)', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                      Category *
                    </label>
                    <select
                      required
                      className="input input-admin"
                      style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                      value={form.category}
                      onChange={(e) => {
                        const catId = e.target.value;
                        const cat = categories.find((c) => c._id === catId);
                        const isDischarge = cat?.name?.toLowerCase().includes('discharge summary') || false;
                        setDischargeSummarySelected(isDischarge);
                        if (isDischarge) {
                          setForm((prev) => ({
                            ...prev,
                            category: catId,
                            content: compileDischargeSummaryText(clinicalForm),
                            title: prev.title || clinicalForm.title,
                          }));
                        } else {
                          setForm((prev) => ({ ...prev, category: catId }));
                        }
                      }}
                    >
                      {categories.map((c) => {
                        const isSub = !!c.parentCategory;
                        return (
                          <option key={c._id} value={c._id} style={{ color: '#000', fontWeight: isSub ? 'normal' : 'bold' }}>
                            {isSub ? `  ↳ ${c.name}` : c.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--admin-muted)', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                      Content Format
                    </label>
                    <select
                      className="input input-admin"
                      style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                      value={dischargeSummarySelected ? 'DISCHARGE' : 'STANDARD'}
                      onChange={(e) => {
                        const isDischarge = e.target.value === 'DISCHARGE';
                        setDischargeSummarySelected(isDischarge);
                        if (isDischarge) {
                          setForm((prev) => ({
                            ...prev,
                            content: compileDischargeSummaryText(clinicalForm),
                            title: prev.title || clinicalForm.title,
                          }));
                        }
                      }}
                    >
                      <option value="STANDARD" style={{ color: '#000' }}>Standard Freeform Text</option>
                      <option value="DISCHARGE" style={{ color: '#000' }}>Discharge Summary Typing (Structured Clinical Report)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--admin-muted)', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                      Mode *
                    </label>
                    <select
                      className="input input-admin"
                      style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                      value={form.mode}
                      onChange={(e: any) => setForm({ ...form, mode: e.target.value })}
                    >
                      <option value="BOTH" style={{ color: '#000' }}>Both Practice & Challenge</option>
                      <option value="PRACTICE" style={{ color: '#000' }}>Practice Only</option>
                      <option value="CHALLENGE" style={{ color: '#000' }}>Challenge Only</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--admin-muted)', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                      Difficulty
                    </label>
                    <select
                      className="input input-admin"
                      style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                      value={form.difficulty}
                      onChange={(e: any) => setForm({ ...form, difficulty: e.target.value })}
                    >
                      <option value="EASY" style={{ color: '#000' }}>Easy</option>
                      <option value="MEDIUM" style={{ color: '#000' }}>Medium</option>
                      <option value="HARD" style={{ color: '#000' }}>Hard</option>
                      <option value="EXPERT" style={{ color: '#000' }}>Expert</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--admin-muted)', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                      Target WPM
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={200}
                      className="input input-admin"
                      style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                      value={form.targetWPM}
                      onChange={(e) => setForm({ ...form, targetWPM: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* DYNAMIC SECTION: Either Discharge Summary Clinical Form OR Standard Textarea */}
                {dischargeSummarySelected ? (
                  <div
                    style={{
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '1.25rem',
                      backgroundColor: '#0f172a',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                    }}
                  >
                    {/* Preset Picker Dropdown */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', color: '#93c5fd', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Sparkles size={15} style={{ color: '#38bdf8' }} /> Clinical Report Template Presets:
                      </span>
                      <select
                        value={clinicalForm.preset}
                        onChange={(e) => handleClinicalPresetChange(e.target.value)}
                        style={{
                          backgroundColor: '#1e293b',
                          color: '#ffffff',
                          border: '1px solid #475569',
                          borderRadius: '6px',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.82rem',
                          outline: 'none',
                        }}
                      >
                        <option value="orthopedic_spine">Orthopedic & Spine (Spinal Stenosis & Compression Fracture) [Image Preset]</option>
                        <option value="cardiology_acs">Cardiology (ACS, Stent & Cath Lab)</option>
                        <option value="pulmonology_copd">Pulmonology (COPD Exacerbation & CXR)</option>
                        <option value="blank">Custom / Blank Report</option>
                      </select>
                    </div>

                    {/* Split Layout: Form Inputs on Left, Real-Time Paper Preview on Right */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
                      {/* Left: Section Tabs & Clinical Fields */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                          {[
                            { id: 'encounter', label: 'Encounter', icon: <Calendar size={12} /> },
                            { id: 'diagnoses', label: 'Diagnoses', icon: <Stethoscope size={12} /> },
                            { id: 'labs', label: 'Imaging & Labs', icon: <FlaskConical size={12} /> },
                            { id: 'course', label: 'Hospital Course', icon: <FileText size={12} /> },
                            { id: 'safety', label: 'Facility & Footer', icon: <Layers size={12} /> },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setClinicalTab(tab.id as any)}
                              style={{
                                backgroundColor: clinicalTab === tab.id ? '#044C94' : 'rgba(255,255,255,0.05)',
                                color: clinicalTab === tab.id ? '#fff' : '#94a3b8',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0.3rem 0.55rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontWeight: clinicalTab === tab.id ? 700 : 500,
                              }}
                            >
                              {tab.icon} {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Encounter Tab */}
                        {clinicalTab === 'encounter' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Date of Service</label>
                                <input
                                  type="text"
                                  value={clinicalForm.dateOfService}
                                  onChange={(e) => updateClinicalField('dateOfService', e.target.value)}
                                  placeholder="e.g. 01/12/2026 or blank"
                                  style={{ width: '100%', padding: '0.4rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Admit Date</label>
                                <input
                                  type="text"
                                  value={clinicalForm.admitDate}
                                  onChange={(e) => updateClinicalField('admitDate', e.target.value)}
                                  placeholder="e.g. 01/06/2026 or blank"
                                  style={{ width: '100%', padding: '0.4rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Discharge Date</label>
                                <input
                                  type="text"
                                  value={clinicalForm.dischargeDate}
                                  onChange={(e) => updateClinicalField('dischargeDate', e.target.value)}
                                  placeholder="e.g. 01/12/2026 or blank"
                                  style={{ width: '100%', padding: '0.4rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Attending MD</label>
                                <input
                                  type="text"
                                  value={clinicalForm.attendingMD}
                                  onChange={(e) => updateClinicalField('attendingMD', e.target.value)}
                                  style={{ width: '100%', padding: '0.4rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Consultations</label>
                                <input
                                  type="text"
                                  value={clinicalForm.consultations}
                                  onChange={(e) => updateClinicalField('consultations', e.target.value)}
                                  style={{ width: '100%', padding: '0.4rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Diagnoses Tab */}
                        {clinicalTab === 'diagnoses' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Admitting Diagnosis</label>
                              <input
                                type="text"
                                value={clinicalForm.admittingDiagnosis}
                                onChange={(e) => updateClinicalField('admittingDiagnosis', e.target.value)}
                                style={{ width: '100%', padding: '0.4rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Discharge Diagnosis / Condition</label>
                              <textarea
                                rows={2}
                                value={clinicalForm.dischargeDiagnosis}
                                onChange={(e) => updateClinicalField('dischargeDiagnosis', e.target.value)}
                                style={{ width: '100%', padding: '0.4rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Secondary Diagnoses</label>
                              <textarea
                                rows={2}
                                value={clinicalForm.secondaryDiagnoses}
                                onChange={(e) => updateClinicalField('secondaryDiagnoses', e.target.value)}
                                style={{ width: '100%', padding: '0.4rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Labs & Imaging Tab */}
                        {clinicalTab === 'labs' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Labs/Imaging (CT Head, Spine, etc.)</label>
                              <textarea
                                rows={3}
                                value={clinicalForm.labsImaging}
                                onChange={(e) => updateClinicalField('labsImaging', e.target.value)}
                                style={{ width: '100%', padding: '0.4rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Cardiac Echo Findings</label>
                              <textarea
                                rows={2}
                                value={clinicalForm.cardiacEcho}
                                onChange={(e) => updateClinicalField('cardiacEcho', e.target.value)}
                                style={{ width: '100%', padding: '0.4rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>CXR (Chest X-Ray) Serial Reports</label>
                              <textarea
                                rows={2}
                                value={clinicalForm.cxr}
                                onChange={(e) => updateClinicalField('cxr', e.target.value)}
                                style={{ width: '100%', padding: '0.4rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Lab Panels (CBC, BMP, Urinalysis)</label>
                              <textarea
                                rows={2}
                                value={clinicalForm.labPanels}
                                onChange={(e) => updateClinicalField('labPanels', e.target.value)}
                                style={{ width: '100%', padding: '0.4rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Hospital Course Tab */}
                        {clinicalTab === 'course' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Hospital Course & Narrative Disposition</label>
                              <textarea
                                rows={6}
                                value={clinicalForm.hospitalCourse}
                                onChange={(e) => updateClinicalField('hospitalCourse', e.target.value)}
                                style={{ width: '100%', padding: '0.4rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.82rem', lineHeight: 1.5 }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Facility & Footer Tab */}
                        {clinicalTab === 'safety' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Hospital Chart Name (Footer Box)</label>
                              <input
                                type="text"
                                value={clinicalForm.hospitalName}
                                onChange={(e) => updateClinicalField('hospitalName', e.target.value)}
                                style={{ width: '100%', padding: '0.4rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Real-Time Live Medical Paper Preview */}
                      <div
                        style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '380px',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>
                            Live Clinical Paper Preview
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              backgroundColor: liveWordCount >= 300 && liveWordCount <= 1000 ? '#dcfce7' : '#fee2e2',
                              color: liveWordCount >= 300 && liveWordCount <= 1000 ? '#15803d' : '#b91c1c',
                              fontWeight: 700,
                            }}
                          >
                            {liveWordCount} Words (Target: 300–1,000)
                          </span>
                        </div>

                        <div
                          style={{
                            flex: 1,
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            padding: '1rem',
                            fontFamily: 'Consolas, monospace',
                            fontSize: '0.78rem',
                            lineHeight: 1.6,
                            color: '#1e293b',
                            overflowY: 'auto',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {form.content || 'Report will preview here...'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ color: 'var(--admin-muted)', fontSize: '0.875rem' }}>
                        Paragraph Content *
                      </label>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-accent1)' }}>
                        {liveWordCount} words / {liveCharCount} characters
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      required
                      className="input input-admin"
                      style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)', resize: 'vertical', fontFamily: 'Consolas, monospace', fontSize: '0.9rem' }}
                      placeholder="Paste the passage text for typing evaluation..."
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', color: 'var(--admin-muted)', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                    Description / Context
                  </label>
                  <input
                    type="text"
                    className="input input-admin"
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                    placeholder="Short description for students"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-sm" style={{ backgroundColor: 'transparent', color: 'var(--admin-muted)', borderColor: 'var(--admin-border)' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                    {saving ? 'Saving...' : 'Save Passage'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

