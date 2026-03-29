import { useMemo, useState } from 'react'
import ExpenseForm from './components/ExpenseForm'
import './App.css'

const initialRequests = [
  { id: '001', employee: 'Alice Turner', category: 'Travel', amount: 1250, status: 'Approved' },
  { id: '002', employee: 'Marc Vega', category: 'Meals', amount: 76.9, status: 'Pending' },
  { id: '003', employee: 'Priya Nair', category: 'Supplies', amount: 413.2, status: 'Rejected' },
]

function App() {
  const [view, setView] = useState('home') // 'home' | 'dashboard' | 'submit' | 'requests' | 'approvals' | 'reports'
  const [requests, setRequests] = useState(initialRequests)

  const stats = useMemo(() => ({
    pending: requests.filter((r) => r.status === 'Pending').length,
    open: requests.filter((r) => r.status !== 'Rejected').length,
    spend: requests.filter((r) => r.status === 'Approved').reduce((sum, r) => sum + r.amount, 0),
  }), [requests])

  const addRequest = (newRequest) => {
    setRequests((prev) => [
      { ...newRequest, id: (parseInt(prev[0]?.id || 100, 10) + 1).toString() },
      ...prev,
    ])
    setView('dashboard')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
          ReimbursePro
        </div>
        <nav>
          <button className={`link-button ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
            Home
          </button>
          <button className={`link-button ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
            Dashboard
          </button>
          <button className={`link-button ${view === 'requests' ? 'active' : ''}`} onClick={() => setView('requests')}>
            Requests
          </button>
          <button className={`link-button ${view === 'approvals' ? 'active' : ''}`} onClick={() => setView('approvals')}>
            Approvals
          </button>
          <button className={`link-button ${view === 'reports' ? 'active' : ''}`} onClick={() => setView('reports')}>
            Reports
          </button>
        </nav>
      </header>

      <main className="page-content">
        {view === 'home' ? (
          <div className="home-page">
            <section className="hero-section">
              <div className="brand-display">
                <h1 className="main-brand">ReimbursePro</h1>
                <p className="brand-tagline">Streamline Your Expense Management</p>
              </div>
              <div className="hero-description">
                <p>
                  The complete solution for expense tracking, approval workflows, and financial reporting.
                  Built for modern businesses that value efficiency and compliance.
                </p>
              </div>
              <div className="hero-actions">
                <button className="btn primary large" onClick={() => setView('dashboard')}>
                  Get Started
                </button>
                <button className="btn secondary large" onClick={() => setView('submit')}>
                  Submit Expense
                </button>
              </div>
            </section>
            <section className="features-grid">
              <div className="feature-card">
                <h3>Easy Submission</h3>
                <p>Submit expenses with receipts in seconds</p>
              </div>
              <div className="feature-card">
                <h3>Smart Approval</h3>
                <p>Automated workflows with custom rules</p>
              </div>
              <div className="feature-card">
                <h3>Real-time Reports</h3>
                <p>Track spending and generate insights</p>
              </div>
            </section>
          </div>
        ) : (
          <>
            <section className="hero-panel">
              <h1>Expense Reimbursement Gateway</h1>
              <p>
                Submit expenses, monitor approval status, and analyze spend with
                audit-ready reports. Your team's finance workflow, centralized and secure.
              </p>
              <div className="cta-actions">
                <button className="btn primary" onClick={() => setView('submit')}>
                  Submit Expense
                </button>
                <button className="btn secondary" onClick={() => setView('requests')}>
                  View All Requests
                </button>
              </div>
            </section>

            <section className="cards-grid">
              <article className="card">
                <h2>Pending Approvals</h2>
                <p>{stats.pending} requests need review by finance.</p>
              </article>
              <article className="card">
                <h2>Open Requests</h2>
                <p>{stats.open} active expense claims in process.</p>
              </article>
              <article className="card">
                <h2>Monthly Spend</h2>
                <p>${stats.spend.toLocaleString(undefined, { maximumFractionDigits: 2 })} approved</p>
              </article>
            </section>

            {view === 'submit' && (
              <section className="form-wrapper">
                <ExpenseForm onSubmit={addRequest} onCancel={() => setView('dashboard')} />
              </section>
            )}

            {view === 'requests' && (
              <section className="data-section">
                <h2>All Expense Requests</h2>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Employee</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id}>
                        <td>{req.id}</td>
                        <td>{req.employee}</td>
                        <td>{req.category}</td>
                        <td>${req.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td>
                          <span className={`status ${req.status.toLowerCase()}`}>
                            {req.status}
                          </span>
                        </td>
                        <td>Today</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {view === 'approvals' && (
              <section className="data-section">
                <h2>Pending Approvals</h2>
                <p>Approval functionality coming soon...</p>
              </section>
            )}

            {view === 'reports' && (
              <section className="data-section">
                <h2>Reports & Analytics</h2>
                <p>Reporting dashboard coming soon...</p>
              </section>
            )}

            {view === 'dashboard' && (
              <section className="data-section">
                <h2>Recent Submissions</h2>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Employee</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.slice(0, 5).map((req, index) => (
                      <tr key={req.id}>
                        <td>{index + 1}</td>
                        <td>{req.employee}</td>
                        <td>{req.category}</td>
                        <td>${req.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td>
                          <span className={`status ${req.status.toLowerCase()}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <span>© 2026 ReimbursePro. All rights reserved.</span>
      </footer>
    </div>
  )
}

export default App
