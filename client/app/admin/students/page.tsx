'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, userService, type User } from '@/lib/services';
import AdminNav from '@/components/AdminNav';

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'INACTIVE' | 'BLOCKED'>('ACTIVE');
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/admin/login');
      return;
    }
    fetchStudents();
  }, [page, statusFilter, router]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await userService.getStudents({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: 15,
      });
      setStudents(res.users);
      setTotal(res.total);
      setPages(res.pages);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleStatusUpdate = async () => {
    if (!selectedStudent) return;
    setActionLoading(true);
    try {
      await userService.updateStatus(selectedStudent._id, newStatus);
      setShowStatusModal(false);
      setMessage(`Status updated to ${newStatus} for ${selectedStudent.email}`);
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedStudent || !newPassword) return;
    setActionLoading(true);
    try {
      await userService.resetPassword(selectedStudent._id, newPassword);
      setShowPasswordModal(false);
      setNewPassword('');
      setMessage(`Password reset successfully for ${selectedStudent.email}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--admin-bg)', color: 'var(--admin-text)' }}>
      <AdminNav />

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-teal" style={{ marginBottom: '0.35rem', display: 'inline-flex' }}>
              Cohort Administration
            </span>
            <h1 className="text-h2" style={{ color: '#fff' }}>Student Directory</h1>
            <p className="text-body" style={{ color: 'var(--admin-muted)', marginTop: '0.25rem' }}>
              Search, inspect, update account status, and manage student credentials
            </p>
          </div>
        </div>

        {message && (
          <div style={{ backgroundColor: 'rgba(72, 187, 120, 0.15)', border: '1px solid #48bb78', color: '#9ae6b4', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            {message}
          </div>
        )}

        {/* Search & Filter Bar */}
        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
              <input
                type="text"
                placeholder="Search by student name or email..."
                className="input input-admin"
                style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm">Search</button>
            </div>

            <div>
              <select
                className="input input-admin"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)', padding: '0.4rem 0.75rem' }}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="" style={{ color: '#000' }}>All Statuses</option>
                <option value="ACTIVE" style={{ color: '#000' }}>Active Only</option>
                <option value="INACTIVE" style={{ color: '#000' }}>Inactive</option>
                <option value="BLOCKED" style={{ color: '#000' }}>Blocked</option>
              </select>
            </div>
          </form>
        </div>

        {/* Students Table */}
        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-admin" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Total Attempts</th>
                  <th>Best Speed</th>
                  <th>Avg Accuracy</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-muted)' }}>
                      Loading students directory...
                    </td>
                  </tr>
                ) : students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student._id}>
                      <td style={{ fontWeight: 600 }}>
                        <a href={`/admin/students/${student._id}`} style={{ color: '#fff', textDecoration: 'none' }}>
                          {student.firstName} {student.lastName}
                        </a>
                      </td>
                      <td style={{ color: 'var(--admin-muted)' }}>{student.email}</td>
                      <td>
                        <span
                          className={`badge ${
                            student.status === 'ACTIVE'
                              ? 'badge-success'
                              : student.status === 'BLOCKED'
                              ? 'badge-danger'
                              : 'badge-accent'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td>{student.stats?.totalAttempts || 0}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-accent1)' }}>
                        {student.stats?.bestWpm || 0} WPM
                      </td>
                      <td>{student.stats?.avgAccuracy || 0}%</td>
                      <td style={{ color: 'var(--admin-muted)', fontSize: '0.85rem' }}>
                        {new Date(student.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setNewStatus(student.status);
                              setShowStatusModal(true);
                            }}
                            className="btn btn-sm"
                            style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'var(--admin-border)', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          >
                            Status
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowPasswordModal(true);
                            }}
                            className="btn btn-sm"
                            style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'var(--admin-border)', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          >
                            Reset Pwd
                          </button>
                          <a
                            href={`/admin/students/${student._id}`}
                            className="btn btn-sm"
                            style={{ backgroundColor: 'var(--color-accent)', color: '#fff', borderColor: 'transparent', fontSize: '0.75rem', padding: '0.2rem 0.5rem', textDecoration: 'none' }}
                          >
                            Details
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-muted)' }}>
                      No students found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--admin-border)', paddingTop: '1rem' }}>
              <span style={{ fontSize: 'var(--text-meta)', color: 'var(--admin-muted)' }}>
                Page {page} of {pages} ({total} students)
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

        {/* Change Status Modal */}
        {showStatusModal && selectedStudent && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '420px' }}>
              <h3 className="text-h3" style={{ color: '#fff', marginBottom: '0.5rem' }}>Update Account Status</h3>
              <p style={{ color: 'var(--admin-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Change status for <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong>
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'var(--admin-muted)', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Select Status</label>
                <select
                  className="input input-admin"
                  style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                  value={newStatus}
                  onChange={(e: any) => setNewStatus(e.target.value)}
                >
                  <option value="ACTIVE" style={{ color: '#000' }}>ACTIVE — Normal access</option>
                  <option value="INACTIVE" style={{ color: '#000' }}>INACTIVE — Suspended</option>
                  <option value="BLOCKED" style={{ color: '#000' }}>BLOCKED — Prohibited from login</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowStatusModal(false)} className="btn btn-sm" style={{ backgroundColor: 'transparent', color: 'var(--admin-muted)', borderColor: 'var(--admin-border)' }}>Cancel</button>
                <button onClick={handleStatusUpdate} disabled={actionLoading} className="btn btn-primary btn-sm">
                  {actionLoading ? 'Saving...' : 'Apply Status'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showPasswordModal && selectedStudent && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '420px' }}>
              <h3 className="text-h3" style={{ color: '#fff', marginBottom: '0.5rem' }}>Reset Student Password</h3>
              <p style={{ color: 'var(--admin-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Set a temporary or new password for <strong>{selectedStudent.email}</strong>
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'var(--admin-muted)', marginBottom: '0.4rem', fontSize: '0.875rem' }}>New Password</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  className="input input-admin"
                  style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'var(--admin-border)' }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowPasswordModal(false)} className="btn btn-sm" style={{ backgroundColor: 'transparent', color: 'var(--admin-muted)', borderColor: 'var(--admin-border)' }}>Cancel</button>
                <button onClick={handleResetPassword} disabled={actionLoading || !newPassword} className="btn btn-primary btn-sm">
                  {actionLoading ? 'Saving...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

