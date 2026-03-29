import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExpenses } from '../api/expenseApi';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../utils/formatters';
import toast from 'react-hot-toast';
import { gsap } from 'gsap';

export default function ExpensesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 20;

  const tableRef = useRef(null);

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

  // Handle GSAP animations when data changes and is not loading
  useEffect(() => {
    if (!loading && expenses.length > 0 && tableRef.current) {
      let ctx = gsap.context(() => {
        gsap.fromTo('.expense-row', 
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
        );
      }, tableRef);
      return () => ctx.revert();
    }
  }, [loading, expenses]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'var(--space-6)'}}>
        <div>
           <div style={{color:'var(--text-muted)', fontWeight:600, fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px'}}>Ledger</div>
           <h1 className="headline-hero" style={{ fontSize: '2.5rem' }}>Expenses</h1>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/expenses/new')}>+ Create Expense</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'var(--space-6)', overflowX:'auto', paddingBottom:'4px' }}>
        {['', 'draft', 'pending', 'approved', 'rejected', 'cancelled'].map((s) => {
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              style={{
                padding: '8px 16px', borderRadius: '40px', fontSize: '0.85rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize',
                background: isActive ? 'var(--g-950)' : 'var(--c-surface)',
                color: isActive ? 'white' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--g-950)' : '1px solid var(--c-border)',
                boxShadow: isActive ? '0 4px 12px rgba(5,46,22,0.15)' : 'none'
              }}
            >
              {s || 'All Items'}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="card" style={{overflow:'hidden'}}>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : expenses.length > 0 ? (
            <div ref={tableRef}>
              <div className="table-container" style={{margin:0, padding:0}}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{paddingLeft:'2rem'}}>Title</th>
                      <th>Category</th>
                      <th>Original Amount</th>
                      <th>Converted (Co.)</th>
                      <th>Status</th>
                      <th>Date</th>
                      {user.role !== 'employee' && <th>Submitter</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="clickable expense-row" onClick={() => navigate(`/expenses/${exp.id}`)}>
                        <td style={{ paddingLeft:'2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{exp.title}</td>
                        <td>{exp.category_name || '—'}</td>
                        <td className="font-mono text-muted">{formatCurrency(exp.amount, exp.currency_code)}</td>
                        <td className="font-mono" style={{fontWeight:600}}>{formatCurrency(exp.amount_in_company_currency, user?.default_currency_code)}</td>
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
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding: '1.5rem 2rem', borderTop:'1px solid var(--c-border)', background:'var(--c-surface-2)' }}>
                  <span style={{color:'var(--text-muted)', fontSize:'0.9rem', fontWeight:500}}>
                    Showing page <strong style={{color:'var(--text-primary)'}}>{page}</strong> of {totalPages}
                  </span>
                  <div style={{display:'flex', gap:'0.5rem'}}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: '6rem 2rem', color:'var(--text-muted)'}}>
              <div style={{marginBottom:'1rem', color:'var(--g-400)', fontWeight: 800}}>—</div>
              <h3 style={{fontSize:'1.2rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'0.5rem'}}>No expenses found</h3>
              <p>{statusFilter ? 'Try changing the filter or clearing it to see more results.' : 'Submit your first expense to track your spending.'}</p>
              {statusFilter && <button className="btn btn-secondary mt-4" style={{marginTop:'1rem'}} onClick={() => {setStatusFilter(''); setPage(1);}}>Clear Filters</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
