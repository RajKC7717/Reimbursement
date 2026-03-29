import { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categoryApi';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data.data);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createCategory({ name: newName.trim() });
      setNewName('');
      toast.success('Category created');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    try {
      await updateCategory(id, { name: editName.trim() });
      setEditingId(null);
      toast.success('Category updated');
      fetchCategories();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteCategory(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error('Failed to delete — may be in use');
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  return (
    <div>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
        Expense Categories
      </h1>

      {/* Create Form */}
      <div className="card mb-6">
        <div className="card-body">
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              className="form-input"
              placeholder="New category name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary">Add Category</button>
          </form>
        </div>
      </div>

      {/* List */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {categories.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th style={{ width: 180 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td>
                        {editingId === c.id ? (
                          <div className="flex gap-2">
                            <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                            <button className="btn btn-success btn-sm" onClick={() => handleUpdate(c.id)}>Save</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                          </div>
                        ) : (
                          <span style={{ fontWeight: 500 }}>{c.name}</span>
                        )}
                      </td>
                      <td>
                        {editingId !== c.id && (
                          <div className="flex gap-2">
                            <button className="btn btn-secondary btn-sm" onClick={() => { setEditingId(c.id); setEditName(c.name); }}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id, c.name)}>Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏷️</div>
              <h3>No categories</h3>
              <p>Add categories like Travel, Meals, Office Supplies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
