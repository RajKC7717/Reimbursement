import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getPendingApprovals } from '../api/dashboardApi';
import { approveExpense, rejectExpense } from '../api/expenseApi';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, pendingRes] = await Promise.all([
        getDashboardStats(),
        ['admin', 'manager'].includes(user.role) ? getPendingApprovals() : Promise.resolve({ data: { data: [] } }),
      ]);
      setStats(statsRes.data.data);
      setPending(pendingRes.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleQuickAction = async (expenseId, action) => {
    try {
      if (action === 'approve') {
        await approveExpense(expenseId, {});
        toast.success('Expense approved');
      } else {
        await rejectExpense(expenseId, { comments: 'Rejected from dashboard' });
        toast.success('Expense rejected');
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action}`);
    }
  };

  if (loading) {
    return <div className="spinner-container"><div className="spinner" /></div>;
  }

  const summary = stats?.summary;

  return (
    <div>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
        Welcome back, {user?.name} 👋
      </h1>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">📋</div>
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">{summary?.total_expenses || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">⏳</div>
          <div className="stat-label">Pending</div>
          <div className="stat-value">{summary?.pending_count || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-label">Approved</div>
          <div className="stat-value">{summary?.approved_count || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">❌</div>
          <div className="stat-label">Rejected</div>
          <div className="stat-value">{summary?.rejected_count || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">💰</div>
          <div className="stat-label">Total Approved Amount</div>
          <div className="stat-value" style={{ fontSize: 'var(--font-size-xl)' }}>
            {formatCurrency(summary?.total_approved_amount)}
          </div>
        </div>
      </div>

      {/* Pending Approvals (Manager/Admin) */}
      {['admin', 'manager'].includes(user.role) && pending.length > 0 && (
        <div className="card mb-8">
          <div className="card-header">
            <h2>⏳ Pending Approvals ({pending.length})</h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Submitted By</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((item) => (
                    <tr key={item.approval_id}>
                      <td>
                        <a onClick={() => navigate(`/expenses/${item.expense_id}`)} style={{ cursor: 'pointer', fontWeight: 600 }}>
                          {item.title}
                        </a>
                      </td>
                      <td>{item.submitter_name}</td>
                      <td className="font-mono">{formatCurrency(item.amount_in_company_currency)}</td>
                      <td>{formatDate(item.created_at)}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-success btn-sm" onClick={() => handleQuickAction(item.expense_id, 'approve')}>
                            Approve
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleQuickAction(item.expense_id, 'reject')}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recent Expenses */}
      <div className="card">
        <div className="card-header">
          <h2>Recent Expenses</h2>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/expenses/new')}>
            + New Expense
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {stats?.recent_expenses?.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Submitter</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_expenses.map((exp) => (
                    <tr key={exp.id} className="clickable" onClick={() => navigate(`/expenses/${exp.id}`)}>
                      <td style={{ fontWeight: 500 }}>{exp.title}</td>
                      <td>{exp.submitter_name}</td>
                      <td className="font-mono">{formatCurrency(exp.amount_in_company_currency)}</td>
                      <td><span className={`badge ${getStatusBadgeClass(exp.status)}`}>{exp.status}</span></td>
                      <td>{formatDate(exp.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No expenses yet</h3>
              <p>Submit your first expense to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
