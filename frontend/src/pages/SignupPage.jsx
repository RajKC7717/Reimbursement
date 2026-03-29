import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api/authApi';
import { getCountries } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { gsap } from 'gsap';

export default function SignupPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  
  const headlineRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo(headlineRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
      gsap.fromTo(formRef.current, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' });
    });

    getCountries({ limit: 500 })
      .then((res) => {
        const unique = [];
        const seen = new Set();
        for (const c of res.data.data) {
          const key = `${c.name}-${c.currency_code}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(c);
          }
        }
        unique.sort((a, b) => a.name.localeCompare(b.name));
        setCountries(unique);
      })
      .catch(() => toast.error('Failed to load countries'));
      
    return () => ctx.revert();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await signup(data);
      const { user, access_token, refresh_token } = res.data.data;
      authLogin(user, access_token, refresh_token);
      toast.success(`Welcome, ${user.name}! Your company has been set up.`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      <div className="auth-left">
        <div className="bg-grid"></div>
        <div className="auth-brand"><span className="logo-icon" style={{width:'28px', height:'28px', background:'var(--c-surface)', color:'var(--g-950)', fontSize:'0.8rem', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'6px', fontWeight:800}}>R</span> ReimburseQ</div>
        <div ref={headlineRef} style={{marginTop: '4rem'}}>
          <h1 className="auth-headline">Create your<br/><em>Workspace.</em></h1>
          <p className="auth-sub" style={{marginTop: '1.5rem', maxWidth: '300px'}}>Set up your company profile and streamline expense management today.</p>
          
          <div style={{display:'flex', gap:'1rem', marginTop:'4rem'}}>
            <svg width="24" height="150" viewBox="0 0 24 150" xmlns="http://www.w3.org/2000/svg">
              {/* Step 1 */}
              <circle cx="12" cy="12" r="10" fill="#22C55E"/>
              <text x="12" y="16" textAnchor="middle" fill="#0A0F0D" fontSize="10" fontWeight="800">1</text>
              <line x1="12" y1="26" x2="12" y2="60" stroke="#16A34A" strokeWidth="2" strokeDasharray="4,4"/>
              {/* Step 2 */}
              <circle cx="12" cy="74" r="10" fill="transparent" stroke="#1F3329" strokeWidth="2"/>
              <line x1="12" y1="88" x2="12" y2="122" stroke="#1F3329" strokeWidth="2" strokeDasharray="4,4"/>
              {/* Step 3 */}
              <circle cx="12" cy="136" r="10" fill="transparent" stroke="#1F3329" strokeWidth="2"/>
            </svg>
            <div style={{display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'4px 0', height:'142px'}}>
              <div style={{color:'white', fontWeight:700, fontSize:'0.95rem'}}>Create Account<br/><span style={{color:'var(--g-400)', fontWeight:500, fontSize:'0.8rem'}}>Register your details</span></div>
              <div style={{color:'var(--text-muted)', fontWeight:600, fontSize:'0.95rem'}}>Invite Team<br/><span style={{fontWeight:500, fontSize:'0.8rem'}}>Add employees to workspace</span></div>
              <div style={{color:'var(--text-muted)', fontWeight:600, fontSize:'0.95rem'}}>Go Live<br/><span style={{fontWeight:500, fontSize:'0.8rem'}}>Start approving expenses</span></div>
            </div>
          </div>
        </div>
        <div style={{marginTop: 'auto', fontSize: '0.8rem', color: 'var(--g-400)', opacity: 0.8}}>
          © 2026 ReimburseQ Inc.
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card-inner" ref={formRef} style={{maxWidth: '520px'}}>
          <h2 style={{fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 800}}>Sign Up</h2>
          <p style={{color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem'}}>Enter your company details to create an administrator account.</p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="signup-name">Full Name</label>
                <input
                  id="signup-name"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="John Doe"
                  {...register('name', { required: 'Name required', minLength: { value: 2, message: 'Min 2 chars' } })}
                />
                {errors.name && <span className="form-error">{errors.name.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="signup-company">Company</label>
                <input
                  id="signup-company"
                  className={`form-input ${errors.company_name ? 'error' : ''}`}
                  placeholder="Acme Corp"
                  {...register('company_name', { required: 'Company required' })}
                />
                {errors.company_name && <span className="form-error">{errors.company_name.message}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@company.com"
                {...register('email', { required: 'Email required' })}
              />
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-country">Home Country</label>
              <select
                id="signup-country"
                className={`form-select ${errors.country_id ? 'error' : ''}`}
                {...register('country_id', { required: 'Country required' })}
              >
                <option value="">Select country...</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.currency_code} — {c.currency_symbol || c.currency_code})
                  </option>
                ))}
              </select>
              {errors.country_id && <span className="form-error">{errors.country_id.message}</span>}
            </div>

            <div className="form-group" style={{marginBottom: '2rem'}}>
              <label className="form-label" htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Min 8 characters"
                {...register('password', { required: 'Password required', minLength: { value: 8, message: 'Min 8 chars' } })}
              />
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Setting up workspace...' : 'Create Workspace'}
            </button>
          </form>

          <div className="auth-footer" style={{textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)'}}>
           Already have an account? <Link to="/login" style={{fontWeight: 700}}>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
