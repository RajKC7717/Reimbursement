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
    <div style={{ position: 'relative' }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'var(--space-6)'}}>
        <div>
           <div style={{color:'var(--text-muted)', fontWeight:600, fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px'}}>Workflows</div>
           <h1 className="headline-hero" style={{ fontSize: '2.5rem' }}>Approval Rules</h1>
        </div>
        <button className="btn btn-primary" onClick={() => { reset(); setSteps([{ approver_id: '', approver_role_label: '' }]); setShowModal(true); }}>
          + Create Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: '4rem 2rem', color:'var(--text-muted)'}}>
              <div style={{marginBottom:'1rem', color:'var(--g-400)', fontWeight: 800}}>—</div>
              <h3 style={{fontSize:'1.2rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'0.5rem'}}>No approval rules</h3>
              <p>Create your first approval rule to define the expense workflow.</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {rules.map((rule) => (
            <div key={rule.id} className="card" style={{ transition: 'transform 0.2s', border:'1px solid var(--c-border)' }}>
              <div className="card-header" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize:'1.25rem', fontWeight:700, margin:0, color:'var(--text-primary)' }}>{rule.name}</h2>
                  <span className="badge badge-draft" style={{ marginTop: '8px', display:'inline-block' }}>Type: {rule.rule_type}</span>
                </div>
                <div className="flex gap-2" style={{ alignItems: 'center' }}>
                  <span className={`badge ${rule.is_active ? 'badge-approved' : 'badge-danger'}`} style={{marginRight: '1rem'}}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(rule.id, rule.name)} style={{color:'var(--color-danger)'}}>Delete</button>
                </div>
              </div>
              <div className="card-body" style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {rule.min_amount && <span style={{display:'flex', flexDirection:'column'}}><strong style={{color:'var(--text-muted)', fontSize:'0.75rem', textTransform:'uppercase'}}>Min Amount</strong><span style={{fontWeight:600}}>${rule.min_amount}</span></span>}
                  {rule.max_amount && <span style={{display:'flex', flexDirection:'column'}}><strong style={{color:'var(--text-muted)', fontSize:'0.75rem', textTransform:'uppercase'}}>Max Amount</strong><span style={{fontWeight:600}}>${rule.max_amount}</span></span>}
                  {rule.percentage_threshold && <span style={{display:'flex', flexDirection:'column'}}><strong style={{color:'var(--text-muted)', fontSize:'0.75rem', textTransform:'uppercase'}}>Threshold</strong><span style={{fontWeight:600}}>{rule.percentage_threshold}%</span></span>}
                  <span style={{display:'flex', flexDirection:'column'}}><strong style={{color:'var(--text-muted)', fontSize:'0.75rem', textTransform:'uppercase'}}>Steps</strong><span style={{fontWeight:600}}>{rule.step_count}</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Spacious Create Modal */}
      {showModal && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(5, 46, 22, 0.4)', backdropFilter:'blur(4px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem'}} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background:'var(--c-surface)', width:'100%', maxWidth:'700px', maxHeight:'90vh', overflowY:'auto', borderRadius:'24px', boxShadow:'0 24px 48px rgba(0,0,0,0.1)', padding:'2.5rem', position:'relative' }}>
            <div style={{marginBottom:'2rem', display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <div>
                <h2 style={{fontSize:'1.8rem', fontWeight:700, margin:0, color:'var(--text-primary)'}}>Create Workflow Rule</h2>
                <p style={{color:'var(--text-muted)', margin:'0.5rem 0 0 0'}}>Define a new approval chain condition for your workspace.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{background:'var(--c-surface-2)', border:'none', width:'36px', height:'36px', borderRadius:'18px', cursor:'pointer', fontWeight:700, color:'var(--text-primary)', display:'flex', alignItems:'center', justifyContent:'center'}}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight:600 }}>Rule Name *</label>
                <input className={`form-input ${errors.name ? 'error' : ''}`} style={{ padding: '12px' }} placeholder="e.g. Travel > $1,000 Approval" {...register('name', { required: 'Required' })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight:600 }}>Rule Strategy *</label>
                  <select className="form-select" style={{ padding: '12px' }} {...register('rule_type', { required: true })}>
                    <option value="sequential">Sequential</option>
                    <option value="conditional">Conditional (Percentage)</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight:600 }}>Percentage Threshold</label>
                  <input type="number" className="form-input" style={{ padding: '12px' }} min={1} max={100} placeholder="e.g. 60" {...register('percentage_threshold')} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight:600 }}>Min Amount ($)</label>
                  <input type="number" step="0.01" className="form-input" style={{ padding: '12px' }} placeholder="0.00" {...register('min_amount')} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight:600 }}>Max Amount ($)</label>
                  <input type="number" step="0.01" className="form-input" style={{ padding: '12px' }} placeholder="No Limit" {...register('max_amount')} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight:600 }}>Specific Approver (for Hybrid)</label>
                <select className="form-select" style={{ padding: '12px' }} {...register('specific_approver_id')}>
                  <option value="">None / Automatic</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>

              {/* Steps Area */}
              <div style={{ marginTop: '1rem', background: 'var(--c-surface-2)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--c-border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '1rem' }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight:700 }}>Approval Chain *</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addStep} style={{ background:'var(--c-surface)', padding:'6px 12px' }}>+ Add Chain Step</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {steps.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background:'var(--c-surface)', padding:'12px', borderRadius:'12px', border:'1px solid var(--c-border)' }}>
                      <span style={{ fontWeight: 800, color: 'var(--g-400)', width: '20px', textAlign:'center' }}>{idx + 1}</span>
                      <div style={{ flex: 1 }}>
                        <select className="form-select" style={{ background:'transparent', border:'none', padding:'0', outline:'none', fontWeight:600 }} value={step.approver_id} onChange={(e) => updateStep(idx, 'approver_id', e.target.value)}>
                          <option value="">Choose approver...</option>
                          {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                        </select>
                      </div>
                      <div style={{ width: '40%' }}>
                        <input className="form-input" style={{ background:'var(--c-surface-2)', border:'none', padding:'8px 12px' }} placeholder="Role Label (e.g. Finance)" value={step.approver_role_label} onChange={(e) => updateStep(idx, 'approver_role_label', e.target.value)} />
                      </div>
                      {steps.length > 1 && (
                        <button type="button" onClick={() => removeStep(idx)} style={{ background:'transparent', border:'none', color:'var(--color-danger)', cursor:'pointer', fontWeight:800, padding:'8px' }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', gap:'1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ padding: '0 2rem' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0 2rem' }}>Create Workflow</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
