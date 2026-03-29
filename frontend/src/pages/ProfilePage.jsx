import { useState, useEffect } from 'react';
import { getProfile } from '../api/authApi';
import { getCompany } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';
import { formatDate, getRoleBadgeClass } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProfile(), getCompany()])
      .then(([profileRes, companyRes]) => {
        setProfile(profileRes.data.data);
        setCompany(companyRes.data.data);
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  return (
    <div>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>My Profile</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* User Info */}
        <div className="card">
          <div className="card-header"><h2>👤 Personal Information</h2></div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)' }}>Name</div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>{profile?.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)' }}>Email</div>
                <div>{profile?.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)' }}>Role</div>
                <span className={`badge ${getRoleBadgeClass(profile?.role)}`}>{profile?.role}</span>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)' }}>Direct Manager</div>
                <div>{profile?.manager_name || 'None assigned'}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)' }}>Manager Approval Required</div>
                <div>{profile?.is_manager_approver ? '✅ Yes' : 'No'}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)' }}>Member Since</div>
                <div>{formatDate(profile?.created_at)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="card">
          <div className="card-header"><h2>🏢 Company</h2></div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)' }}>Company Name</div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>{company?.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)' }}>Country</div>
                <div>{company?.country_name || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)' }}>Default Currency</div>
                <div style={{ fontWeight: 600 }}>{company?.default_currency_code} {company?.currency_symbol && `(${company.currency_symbol})`}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-slate-500)' }}>Created</div>
                <div>{formatDate(company?.created_at)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
