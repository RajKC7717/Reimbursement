import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api/authApi';
import { getCountries } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getCountries({ limit: 500 })
      .then((res) => {
        // Deduplicate and sort countries
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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>💰 ReimburseQ</h1>
          <p>Create your account and company</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">Full Name</label>
            <input
              id="signup-name"
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="John Doe"
              {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
            />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="you@company.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Min 8 characters"
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-company">Company Name</label>
            <input
              id="signup-company"
              className={`form-input ${errors.company_name ? 'error' : ''}`}
              placeholder="Acme Corp"
              {...register('company_name', { required: 'Company name is required' })}
            />
            {errors.company_name && <span className="form-error">{errors.company_name.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-country">Country</label>
            <select
              id="signup-country"
              className={`form-select ${errors.country_id ? 'error' : ''}`}
              {...register('country_id', { required: 'Country is required' })}
            >
              <option value="">Select country...</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.currency_code} — {c.currency_symbol})
                </option>
              ))}
            </select>
            {errors.country_id && <span className="form-error">{errors.country_id.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
