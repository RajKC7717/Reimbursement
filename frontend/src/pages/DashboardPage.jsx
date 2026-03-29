import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getPendingApprovals } from '../api/dashboardApi';
import { approveExpense, rejectExpense } from '../api/expenseApi';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../utils/formatters';
import toast from 'react-hot-toast';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const bentoRef = useRef(null);
  
  const totalSpanRef = useRef(null);
  
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

  useEffect(() => { 
    fetchData(); 
  }, []);

  // GSAP animations after load
  useEffect(() => {
    if (!loading && bentoRef.current) {
      let ctx = gsap.context(() => {
        const cards = gsap.utils.toArray('.bento-card');
        gsap.fromTo(cards,
          { opacity: 0, y: 30, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out' }
        );
        
        // Count Up total amount
        if (totalSpanRef.current && stats?.summary?.total_approved_amount) {
          const target = Number(stats.summary.total_approved_amount);
          const obj = { val: 0 };
          gsap.to(obj, {
            val: target,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: () => {
              if (totalSpanRef.current) {
                totalSpanRef.current.innerText = formatCurrency(obj.val, user?.default_currency_code);
              }
            }
          });
        }
      }, bentoRef);
      return () => ctx.revert();
    }
  }, [loading, stats]);

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
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'var(--space-6)'}}>
        <div>
           <div style={{color:'var(--text-muted)', fontWeight:600, fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px'}}>Overview</div>
           <h1 className="headline-hero" style={{ fontSize: '2.5rem' }}>Welcome back, {user?.name.split(' ')[0]}</h1>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/expenses/new')}>+ Create Expense</button>
      </div>

      {/* Bento Grid layout */}
      <div className="bento-grid" ref={bentoRef}>
        
        {/* Main Summary Card -> Span 2 Rows, dark green */}
        <div className="bento-card tall primary wide" style={{position:'relative'}}>
          {/* Decorative mesh */}
          <svg className="bg-grid" style={{opacity:0.2}} xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="grid-light" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4ADE80" strokeWidth="0.5"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid-light)"/>
          </svg>
          
          <div style={{position:'relative', zIndex:10}}>
            <div className="bento-label">Total Approved Spend</div>
            <div className="stat-number" style={{fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight:1}} ref={totalSpanRef}>
              {formatCurrency(0, user?.default_currency_code)}
            </div>
            <div style={{display:'flex', gap:'1rem', marginTop:'2rem'}}>
                <div>
                   <div style={{color:'var(--g-400)', fontSize:'0.8rem', fontWeight:600}}>APPROVED ITEMS</div>
                   <div style={{fontSize:'1.5rem', fontWeight:700}}>{summary?.approved_count || 0}</div>
                </div>
                <div>
                   <div style={{color:'var(--g-400)', fontSize:'0.8rem', fontWeight:600}}>TOTAL SUBMISSIONS</div>
                   <div style={{fontSize:'1.5rem', fontWeight:700}}>{summary?.total_expenses || 0}</div>
                </div>
            </div>
          </div>
        </div>

        {/* Small Stat Cards */}
        <div className="bento-card">
          <div className="bento-icon" style={{background:'#FEF3C7', color:'#D97706', fontWeight: 800}}>!</div>
          <div className="stat-number">{summary?.pending_count || 0}</div>
          <div className="bento-label" style={{marginBottom:0, marginTop:'4px'}}>Pending Review</div>
        </div>

        <div className="bento-card">
          <div className="bento-icon" style={{background:'#FEE2E2', color:'#DC2626', fontWeight: 800}}>x</div>
          <div className="stat-number">{summary?.rejected_count || 0}</div>
          <div className="bento-label" style={{marginBottom:0, marginTop:'4px'}}>Rejected</div>
        </div>

        {/* User Identity / Actions */}
        <div className="bento-card wide" style={{background: 'var(--c-surface-2)', borderStyle: 'dashed'}}>
           <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
              <div style={{width:'48px', height:'48px', borderRadius:'12px', background:'var(--c-border)', color:'var(--g-800)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', fontWeight: 800}}>{user?.name?.[0]}</div>
              <div>
                 <div style={{fontWeight:700, fontSize:'1.1rem'}}>{user?.name}</div>
                 <div style={{color:'var(--text-muted)', fontSize:'0.85rem'}}>{user?.role.toUpperCase()} • {user?.company_name}</div>
              </div>
              <button className="btn btn-secondary btn-sm" style={{marginLeft:'auto'}} onClick={() => navigate('/profile')}>View Profile</button>
           </div>
        </div>

      </div>

      {/* Tables Row */}
      <div className="form-row" style={{alignItems:'flex-start'}}>
        
        {/* Pending Actions (if admin/manager) */}
        {['admin', 'manager'].includes(user.role) && pending.length > 0 && (
          <div className="card bento-card">
            <div className="card-header" style={{paddingBottom:'1rem', borderBottom:'1px dashed var(--c-border)'}}>
              <h2 style={{display:'flex', alignItems:'center', gap:'8px'}}>Action Required ({pending.length})</h2>
            </div>
            <div className="card-body" style={{ padding: '0 1rem' }}>
              <table className="data-table" style={{width:'100%', borderCollapse:'collapse'}}>
                <tbody>
                  {pending.map((item) => (
                    <tr key={item.approval_id} style={{borderBottom:'1px solid var(--c-bg)'}}>
                      <td style={{padding:'1rem 0'}}>
                         <div style={{fontWeight:600, color:'var(--text-primary)'}}>{item.title}</div>
                         <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{item.submitter_name} • {formatDate(item.created_at)}</div>
                      </td>
                      <td className="font-mono text-right" style={{padding:'1rem 0', fontWeight:600}}>{formatCurrency(item.amount_in_company_currency, user?.default_currency_code)}</td>
                      <td style={{padding:'1rem 0', textAlign:'right'}}>
                        <div style={{display:'flex', gap:'0.5rem', justifyContent:'flex-end'}}>
                           <button className="btn btn-sm" style={{background:'#DC2626', color:'white', border:'none'}} onClick={() => handleQuickAction(item.expense_id, 'reject')}>Reject</button>
                           <button className="btn btn-sm btn-primary" onClick={() => handleQuickAction(item.expense_id, 'approve')}>Approve</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Expenses List */}
        <div className="card bento-card" style={(!['admin', 'manager'].includes(user.role) || pending.length === 0) ? {gridColumn:'span 2'} : {}}>
          <div className="card-header" style={{paddingBottom:'1rem', borderBottom:'none'}}>
            <h2 style={{display:'flex', alignItems:'center', gap:'8px'}}>Recent Expenses</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/expenses')}>View All</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {stats?.recent_expenses?.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{paddingLeft:'1.5rem'}}>Title</th>
                    <th>Amount</th>
                    <th style={{paddingRight:'1.5rem', textAlign:'right'}}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_expenses.slice(0, 5).map((exp) => (
                    <tr key={exp.id} className="clickable" onClick={() => navigate(`/expenses/${exp.id}`)}>
                      <td style={{paddingLeft:'1.5rem'}}>
                        <div style={{fontWeight:600, color:'var(--text-primary)'}}>{exp.title}</div>
                        <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{formatDate(exp.created_at)}</div>
                      </td>
                      <td className="font-mono" style={{fontWeight:600}}>{formatCurrency(exp.amount_in_company_currency, user?.default_currency_code)}</td>
                      <td style={{paddingRight:'1.5rem', textAlign:'right'}}>
                         <span className={`badge ${getStatusBadgeClass(exp.status)}`}>{exp.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{padding:'3rem 1rem', textAlign:'center', color:'var(--text-muted)'}}>
                <div style={{marginBottom:'1rem', color:'var(--g-400)', fontWeight: 800}}>—</div>
                <div style={{fontWeight:600, fontSize:'0.9rem'}}>No recent expenses</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
