import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getRules, createRule, deleteRule } from '../api/ruleApi';
import { getUsers } from '../api/userApi';
import toast from 'react-hot-toast';

export default function RulesPage() {
  const [rules, setRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [steps, setSteps] = useState([{ approver_id: '', approver_role_label: '' }]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchData = async () => {
    try {
      const [rulesRes, usersRes] = await Promise.all([getRules(), getUsers({ limit: 100 })]);
      setRules(rulesRes.data.data);
      setUsers(usersRes.data.data.filter((u) => u.is_active));
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addStep = () => setSteps([...steps, { approver_id: '', approver_role_label: '' }]);
  const removeStep = (index) => setSteps(steps.filter((_, i) => i !== index));
  const updateStep = (index, field, value) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  const onSubmit = async (data) => {
    const validSteps = steps.filter((s) => s.approver_id);
    if (validSteps.length === 0) {
      toast.error('Add at least one approval step');
      return;
    }
    try {
      await createRule({
        ...data,
        min_amount: data.min_amount ? parseFloat(data.min_amount) : null,
        max_amount: data.max_amount ? parseFloat(data.max_amount) : null,
        percentage_threshold: data.percentage_threshold ? parseInt(data.percentage_threshold) : null,
        specific_approver_id: data.specific_approver_id || null,
        steps: validSteps,
      });
      toast.success('Rule created');
      setShowModal(false);
      reset();
      setSteps([{ approver_id: '', approver_role_label: '' }]);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create rule');
    }
  };

  const handleDelete = async (ruleId, name) => {
    if (!confirm(`Delete rule "${name}"?`)) return;
    try {
      await deleteRule(ruleId);
      toast.success('Rule deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Approval Rules</h1>
        <button className="btn btn-primary" onClick={() => { reset(); setSteps([{ approver_id: '', approver_role_label: '' }]); setShowModal(true); }}>
          + Create Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No approval rules</h3>
              <p>Create your first approval rule to define the expense workflow.</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {rules.map((rule) => (
            <div key={rule.id} className="card">
              <div className="card-header">
                <div>
                  <h2>{rule.name}</h2>
                  <span className="badge badge-admin" style={{ marginTop: 4 }}>{rule.rule_type}</span>
                </div>
                <div className="flex gap-2">
                  <span className={`badge ${rule.is_active ? 'badge-approved' : 'badge-cancelled'}`}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(rule.id, rule.name)}>Delete</button>
                </div>
              </div>
              <div className="card-body">
                <div className="flex gap-4" style={{ flexWrap: 'wrap', fontSize: 'var(--font-size-sm)', color: 'var(--color-slate-600)' }}>
                  {rule.min_amount && <span>Min Amount: <strong>{rule.min_amount}</strong></span>}
                  {rule.max_amount && <span>Max Amount: <strong>{rule.max_amount}</strong></span>}
                  {rule.percentage_threshold && <span>Threshold: <strong>{rule.percentage_threshold}%</strong></span>}
                  <span>Steps: <strong>{rule.step_count}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2>Create Approval Rule</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                  <label className="form-label">Rule Name *</label>
                  <input className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g. Standard Approval Flow" {...register('name', { required: 'Required' })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Rule Type *</label>
                    <select className="form-select" {...register('rule_type', { required: true })}>
                      <option value="sequential">Sequential</option>
                      <option value="conditional">Conditional (Percentage)</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Percentage Threshold</label>
                    <input type="number" className="form-input" min={1} max={100} placeholder="e.g. 60" {...register('percentage_threshold')} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Min Amount</label>
                    <input type="number" step="0.01" className="form-input" placeholder="0.00" {...register('min_amount')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Amount</label>
                    <input type="number" step="0.01" className="form-input" placeholder="999999.99" {...register('max_amount')} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Specific Approver (for Hybrid)</label>
                  <select className="form-select" {...register('specific_approver_id')}>
                    <option value="">None</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>

                {/* Steps */}
                <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-5)' }}>
                  <div className="flex-between mb-4">
                    <label className="form-label" style={{ marginBottom: 0 }}>Approval Steps *</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addStep}>+ Add Step</button>
                  </div>
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex gap-2 mb-4" style={{ alignItems: 'flex-end' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-slate-400)', minWidth: 24 }}>#{idx + 1}</span>
                      <div style={{ flex: 1 }}>
                        <select className="form-select" value={step.approver_id} onChange={(e) => updateStep(idx, 'approver_id', e.target.value)}>
                          <option value="">Select approver...</option>
                          {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 0.6 }}>
                        <input className="form-input" placeholder="Label, e.g. Finance" value={step.approver_role_label} onChange={(e) => updateStep(idx, 'approver_role_label', e.target.value)} />
                      </div>
                      {steps.length > 1 && (
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeStep(idx)}>×</button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Rule</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
