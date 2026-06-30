import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { email as emailRule, minLength, required, useFormValidation } from '../hooks/useFormValidation';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { InfoTip } from '../components/Tooltip';

// Login form with live, per-field validation (kept from Lab #3) wired to the
// real backend (Lab #4). On submit it calls AuthContext.login → POST
// /api/auth/login; server errors (e.g. "invalid email or password") surface as
// an inline message and a toast.
const rules = {
  email: [required('Email'), emailRule],
  password: [required('Password'), minLength(6, 'Password')],
};

export default function Login() {
  const { values, isValid, handleChange, handleBlur, showError, touchAll } = useFormValidation(
    { email: '', password: '', remember: false },
    rules,
  );
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    touchAll();
    if (!isValid || submitting) return;
    setServerError('');
    setSubmitting(true);
    try {
      const user = await login({ email: values.email, password: values.password });
      toast.success(`Welcome back, ${user.name}! You are now signed in.`, { title: 'Logged in' });
      navigate('/account');
    } catch (err) {
      setServerError(err.message);
      toast.error(err.message, { title: 'Login failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name) => `field${showError(name) ? ' invalid' : values[name] && !showError(name) ? ' valid' : ''}`;

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li>Login</li>
        </ul>
      </nav>

      <section aria-labelledby="login-heading">
        <h2 id="login-heading">Sign in to your account</h2>

        {serverError && (
          <p className="form-error" role="alert" style={{ color: 'var(--color-danger, #c0392b)', fontWeight: 600 }}>
            ⚠ {serverError}
          </p>
        )}

        <form onSubmit={onSubmit} noValidate>
          <div className={field('email')}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!showError('email')}
            />
            {showError('email') && <span className="field-error-text">⚠ {showError('email')}</span>}
          </div>

          <div className={field('password')}>
            <label htmlFor="password">
              Password <InfoTip text="Use the password you registered with (at least 6 characters)." />
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!showError('password')}
            />
            {showError('password') && <span className="field-error-text">⚠ {showError('password')}</span>}
          </div>

          <label style={{ display: 'flex', gap: 'var(--space-2)', fontWeight: 500 }}>
            <input type="checkbox" name="remember" checked={values.remember} onChange={handleChange} /> Remember me
          </label>

          <button type="submit" disabled={!isValid || submitting}>
            {submitting ? 'Signing in…' : 'Log in'}
          </button>
        </form>
        <p><Link to="/login">Forgot your password?</Link></p>
        <p>Don't have an account? <Link to="/register">Create one here</Link>.</p>
      </section>
    </>
  );
}
