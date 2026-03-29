import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExpenseById, approveExpense, rejectExpense, overrideExpense } from '../api/expenseApi';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, formatDateTime, getStatusBadgeClass } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function ExpenseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchExpense = async () => {
    try {
      const res = await getExpenseById(id);
      setExpense(res.data.data);
    } catch (err) {
      toast.error('Expense not found');
      navigate('/expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpense(); }, [id]);

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      if (action === 'approve') {
        await approveExpense(id, { comments: comment });
      } else if (action === 'reject') {
        await rejectExpense(id, { comments: comment });
      } else if (action === 'force-approve') {
        await overrideExpense(id, { action: 'approve', comments: comment });
      } else if (action === 'force-reject') {
        await overrideExpense(id, { action: 'reject', comments: comment });
      }
      toast.success(`Expense ${action.replace('force-', '')}d`);
      fetchExpense();
      setComment('');
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action}`);
    } finally {
      setActionLoading('');
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;
  if (!expense) return null;

  const isApprover = expense.approvals?.some(
    (a) => a.approver_id === user.id && a.status === 'pending' && a.step_number === expense.current_approval_step
  );
  const canAct = expense.status === 'pending' && (isApprover || user.role === 'admin');

  return (
    <div>
      <button className="btn btn-secondary btn-sm mb-6" onClick={() => navigate('/expenses')}>
        ← Back to Expenses
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Left — Expense Details */}
        <div>
          <div className="card mb-6">
            <div className="card-header">
              <h2>{expense.title}</h2>
              <span className={`badge ${getStatusBadgeClass(expense.status)}`}>{expense.status}</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)', marginBottom: 2 }}>Original Amount</div>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{formatCurrency(expense.amount, expense.currency_code)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)', marginBottom: 2 }}>Converted Amount</div>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{formatCurrency(expense.amount_in_company_currency)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)', marginBottom: 2 }}>Category</div>
                  <div>{expense.category_name || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)', marginBottom: 2 }}>Expense Date</div>
                  <div>{formatDate(expense.expense_date)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)', marginBottom: 2 }}>Submitted By</div>
                  <div>{expense.submitter_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)', marginBottom: 2 }}>Exchange Rate</div>
                  <div className="font-mono">{expense.exchange_rate || '1.0'}</div>
                </div>
              </div>
              {expense.description && (
                <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)', marginBottom: 4 }}>Description</div>
                  <p>{expense.description}</p>
                </div>
              )}
              {expense.rejection_reason && (
                <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-danger-light)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
                  <strong>Rejection Reason:</strong> {expense.rejection_reason}
                </div>
              )}
            </div>
          </div>

          {/* Action Panel */}
          {canAct && (
            <div className="card mb-6">
              <div className="card-header"><h2>Take Action</h2></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Comments (optional)</label>
                  <textarea className="form-textarea" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." />
                </div>
                <div className="flex gap-2">
                  {isApprover && (
                    <>
                      <button className="btn btn-success" onClick={() => handleAction('approve')} disabled={!!actionLoading}>
                        {actionLoading === 'approve' ? 'Approving...' : '✅ Approve'}
                      </button>
                      <button className="btn btn-danger" onClick={() => handleAction('reject')} disabled={!!actionLoading}>
                        {actionLoading === 'reject' ? 'Rejecting...' : '❌ Reject'}
                      </button>
                    </>
                  )}
                  {user.role === 'admin' && !isApprover && (
                    <>
                      <button className="btn btn-success" onClick={() => handleAction('force-approve')} disabled={!!actionLoading}>
                        ⚡ Force Approve
                      </button>
                      <button className="btn btn-danger" onClick={() => handleAction('force-reject')} disabled={!!actionLoading}>
                        ⚡ Force Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right — Approval Timeline */}
        <div>
          <div className="card">
            <div className="card-header"><h2>Approval Trail</h2></div>
            <div className="card-body">
              {expense.approvals?.length > 0 ? (
                <div className="approval-timeline">
                  {expense.approvals.map((a) => (
                    <div key={a.id} className="timeline-item">
                      <div className={`timeline-dot ${a.status}`} />
                      <div className="timeline-content">
                        <div className="timeline-name">Step {a.step_number}: {a.approver_name}</div>
                        <div className="timeline-meta">
                          <span className={`badge ${getStatusBadgeClass(a.status)}`} style={{ marginRight: 6 }}>{a.status}</span>
                          {a.decided_at && formatDateTime(a.decided_at)}
                        </div>
                        {a.comments && <p style={{ marginTop: 4, fontSize: 'var(--font-size-xs)' }}>"{a.comments}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No approval steps</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
