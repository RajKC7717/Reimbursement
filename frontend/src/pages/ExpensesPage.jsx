import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExpenses } from '../api/expenseApi';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function ExpensesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 20;

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (statusFilter) params.status = statusFilter;
      const res = await getExpenses(params);
      setExpenses(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, [page, statusFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex-between mb-6">
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Expenses</h1>
        <button className="btn btn-primary" onClick={() => navigate('/expenses/new')}>
          + New Expense
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body" style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <div className="flex gap-2" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-slate-600)' }}>Filter:</span>
            {['', 'draft', 'pending', 'approved', 'rejected', 'cancelled'].map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setStatusFilter(s); setPage(1); }}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : expenses.length > 0 ? (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Converted</th>
                      <th>Status</th>
                      <th>Date</th>
                      {user.role !== 'employee' && <th>Submitted By</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="clickable" onClick={() => navigate(`/expenses/${exp.id}`)}>
                        <td style={{ fontWeight: 500 }}>{exp.title}</td>
                        <td>{exp.category_name || '—'}</td>
                        <td className="font-mono">{formatCurrency(exp.amount, exp.currency_code)}</td>
                        <td className="font-mono">{formatCurrency(exp.amount_in_company_currency)}</td>
                        <td><span className={`badge ${getStatusBadgeClass(exp.status)}`}>{exp.status}</span></td>
                        <td>{formatDate(exp.expense_date)}</td>
                        {user.role !== 'employee' && <td>{exp.submitter_name}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination" style={{ padding: 'var(--space-4) var(--space-6)' }}>
                  <span>Page {page} of {totalPages} ({total} total)</span>
                  <div className="pagination-buttons">
                    <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📑</div>
              <h3>No expenses found</h3>
              <p>{statusFilter ? 'Try changing the filter.' : 'Submit your first expense to get started.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
