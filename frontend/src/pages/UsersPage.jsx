import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getUsers, createUser, updateUser, deleteUser } from '../api/userApi';
import { getRoleBadgeClass } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchUsers = async () => {
    try {
      const res = await getUsers({ limit: 100 });
      setUsers(res.data.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    reset({ name: '', email: '', password: '', role: 'employee', manager_id: '', is_manager_approver: false });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    reset({
      name: u.name,
      role: u.role,
      manager_id: u.manager_id || '',
      is_manager_approver: u.is_manager_approver,
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingUser) {
        const payload = { ...data };
        delete payload.email;
        delete payload.password;
        if (!payload.manager_id) payload.manager_id = null;
        await updateUser(editingUser.id, payload);
        toast.success('User updated');
      } else {
        if (!data.manager_id) data.manager_id = null;
        await createUser(data);
        toast.success('User created');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (userId, name) => {
    if (!confirm(`Deactivate ${name}?`)) return;
    try {
      await deleteUser(userId);
      toast.success('User deactivated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate');
    }
  };

  const managers = users.filter((u) => ['admin', 'manager'].includes(u.role) && u.is_active);

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>User Management</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Manager</th>
                  <th>Manager Approves?</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge ${getRoleBadgeClass(u.role)}`}>{u.role}</span></td>
                    <td>{u.manager_name || '—'}</td>
                    <td>{u.is_manager_approver ? '✅ Yes' : '—'}</td>
                    <td>{u.is_active ? <span className="badge badge-approved">Active</span> : <span className="badge badge-cancelled">Inactive</span>}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
                        {u.is_active && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id, u.name)}>Deactivate</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Create User'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className={`form-input ${errors.name ? 'error' : ''}`} {...register('name', { required: 'Name is required' })} />
                  {errors.name && <span className="form-error">{errors.name.message}</span>}
                </div>
                {!editingUser && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input type="email" className={`form-input ${errors.email ? 'error' : ''}`} {...register('email', { required: 'Email is required' })} />
                      {errors.email && <span className="form-error">{errors.email.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password *</label>
                      <input type="password" className={`form-input ${errors.password ? 'error' : ''}`} {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })} />
                      {errors.password && <span className="form-error">{errors.password.message}</span>}
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select className="form-select" {...register('role', { required: true })}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Direct Manager</label>
                  <select className="form-select" {...register('manager_id')}>
                    <option value="">None</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input type="checkbox" {...register('is_manager_approver')} />
                    <span className="form-label" style={{ marginBottom: 0 }}>Manager must approve first</span>
                  </label>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingUser ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
