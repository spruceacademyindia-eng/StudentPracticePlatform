'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, categoryService, type Category } from '@/lib/services';
import AdminNav from '@/components/AdminNav';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '', parentCategory: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/admin/login');
      return;
    }
    fetchCategories();
  }, [router]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryService.getAll();
      setCategories(res.categories);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm({ name: '', description: '', parentCategory: '' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      parentCategory: cat.parentCategory ? cat.parentCategory._id : '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (editingCategory) {
        await categoryService.update(editingCategory._id, {
          name: form.name,
          description: form.description,
          parentCategory: form.parentCategory ? (form.parentCategory as any) : null,
        });
        setSuccess('Category updated successfully.');
      } else {
        await categoryService.create({
          name: form.name,
          description: form.description,
          parentCategory: form.parentCategory || null,
        });
        setSuccess('Category created successfully.');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (cat: Category, nextStatus: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') => {
    try {
      await categoryService.updateStatus(cat._id, nextStatus);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to change category status.');
    }
  };

  const rootCategories = categories.filter((c) => !c.parentCategory);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--admin-bg)', color: 'var(--admin-text)' }}>
      <AdminNav />

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1140px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-teal" style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>
              Taxonomy & Curriculum
            </span>
            <h1 className="text-h2" style={{ color: '#fff' }}>Category Hierarchy</h1>
            <p style={{ color: 'var(--admin-muted)', marginTop: '0.25rem' }}>
              Manage root assessment domains (Healthcare, English, Speed) and nested subcategories
            </p>
          </div>
          <button onClick={openCreateModal} className="btn btn-primary btn-sm">
            + Add New Category
          </button>
        </div>

        {success && (
          <div style={{ backgroundColor: 'rgba(72, 187, 120, 0.15)', border: '1px solid #48bb78', color: '#9ae6b4', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            {success}
          </div>
        )}

        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-admin" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Type</th>
                  <th>Parent Category</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-muted)' }}>
                      Loading categories...
                    </td>
                  </tr>
                ) : categories.length > 0 ? (
                  categories.map((cat) => (
                    <tr key={cat._id}>
                      <td style={{ fontWeight: 700, color: '#fff' }}>
                        {cat.parentCategory ? `↳ ${cat.name}` : cat.name}
                      </td>
                      <td>
                        <span className={`badge ${cat.parentCategory ? 'badge-accent' : 'badge-teal'}`}>
                          {cat.parentCategory ? 'Subcategory' : 'Root Domain'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--admin-muted)' }}>
                        {cat.parentCategory ? (typeof cat.parentCategory === 'object' ? cat.parentCategory.name : 'Parent') : '—'}
                      </td>
                      <td style={{ color: 'var(--admin-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cat.description || '—'}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            cat.status === 'ACTIVE'
                              ? 'badge-success'
                              : cat.status === 'ARCHIVED'
                              ? 'badge-danger'
                              : 'badge-accent'
                          }`}
                        >
                          {cat.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => openEditModal(cat)}
                            className="btn btn-sm"
                            style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'var(--admin-border)', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          >
                            Edit
                          </button>
                          {cat.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleToggleStatus(cat, 'INACTIVE')}
                              className="btn btn-sm"
                              style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#fed7d7', borderColor: 'var(--admin-border)', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(cat, 'ACTIVE')}
                              className="btn btn-sm"
                              style={{ backgroundColor: 'rgba(72,187,120,0.2)', color: '#9ae6b4', borderColor: 'transparent', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleStatus(cat, 'ARCHIVED')}
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
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-muted)' }}>
                      No categories defined yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Modal */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '480px' }}>
              <h3 className="text-h3" style={{ color: '#fff', marginBottom: '1.25rem' }}>
                {editingCategory ? 'Edit Category' : 'Create Category / Subcategory'}
              </h3>

              {error && (
                <div style={{ backgroundColor: 'rgba(229, 62, 62, 0.15)', border: '1px solid #e53e3e', color: '#fc8181', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--admin-muted)', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-admin"
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                    placeholder="e.g. Discharge Summary Typing"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--admin-muted)', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                    Parent Category (Leave blank for Root Domain)
                  </label>
                  <select
                    className="input input-admin"
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                    value={form.parentCategory}
                    onChange={(e) => setForm({ ...form, parentCategory: e.target.value })}
                  >
                    <option value="" style={{ color: '#000' }}>None (Top-Level Root Domain)</option>
                    {rootCategories
                      .filter((rc) => !editingCategory || rc._id !== editingCategory._id)
                      .map((rc) => (
                        <option key={rc._id} value={rc._id} style={{ color: '#000' }}>
                          {rc.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--admin-muted)', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="input input-admin"
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)', resize: 'vertical' }}
                    placeholder="Brief description of the domain scope..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-sm" style={{ backgroundColor: 'transparent', color: 'var(--admin-muted)', borderColor: 'var(--admin-border)' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                    {saving ? 'Saving...' : 'Save Category'}
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

