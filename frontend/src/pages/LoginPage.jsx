import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { gsap } from 'gsap';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const headlineRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo(
        headlineRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
      gsap.fromTo(
        formRef.current,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' }
      );
    });
    return () => ctx.revert();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await login(data);
      const { user, access_token, refresh_token } = res.data.data;
      authLogin(user, access_token, refresh_token);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      <div className="auth-left">
        <div className="bg-grid"></div>
        <div className="auth-brand"><span className="logo-icon" style={{width:'28px', height:'28px', background:'var(--c-surface)', color:'var(--g-950)', fontSize:'0.8rem', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'6px', fontWeight:800}}>R</span> ReimburseQ</div>
        <div ref={headlineRef} style={{marginTop: 'auto', marginBottom: 'auto'}}>
          <h1 className="auth-headline">Welcome<br/>back <em>to</em><br/>ReimburseQ.</h1>
          <p className="auth-sub" style={{marginTop: '1.5rem'}}>Sign in to manage your expenses, track approvals, and review team spending securely.</p>
        </div>
        <div style={{marginTop: 'auto', fontSize: '0.8rem', color: 'var(--g-400)', opacity: 0.8}}>
          © 2026 ReimburseQ Inc.
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card-inner" ref={formRef}>
          <h2 style={{fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 800}}>Sign In</h2>
          <p style={{color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem'}}>Enter your email and password to access your dashboard.</p>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@company.com"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>

            <div className="form-group" style={{marginBottom: '2rem'}}>
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            </button>
          </form>

          <div className="auth-footer" style={{textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)'}}>
            Don't have an account? <Link to="/signup" style={{fontWeight: 700}}>Create a workspace</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
