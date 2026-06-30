import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  email as emailRule,
  isChecked,
  matches,
  minLength,
  passwordStrength,
  required,
  useFormValidation,
} from '../hooks/useFormValidation';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { InfoTip } from '../components/Tooltip';

// Registration form: full live validation (kept from Lab #3) wired to the real
// backend (Lab #4). On submit it calls AuthContext.register → POST
// /api/auth/register; server errors (e.g. "email is already registered") are
// shown inline and as a toast.
const rules = {
  name: [required('Full name'), minLength(2, 'Full name')],
  email: [required('Email'), emailRule],
  password: [required('Password'), minLength(6, 'Password')],
  confirm: [required('Confirmation'), matches('password', 'Passwords do not match')],
  terms: [isChecked('You must accept the Terms to continue')],
};

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

export default function Register() {
  const { values, isValid, handleChange, handleBlur, showError, touchAll } = useFormValidation(
    { name: '', email: '', password: '', confirm: '', terms: false },
    rules,
  );
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const strength = passwordStrength(values.password);

  const onSubmit = async (e) => {
    e.preventDefault();
    touchAll();
    if (!isValid || submitting) return;
    setServerError('');
    setSubmitting(true);
    try {
      const user = await register({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      toast.success(`Account created — welcome to TechShop, ${user.name}!`, { title: 'Registered' });
      navigate('/account');
    } catch (err) {
      setServerError(err.message);
      toast.error(err.message, { title: 'Registration failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldCls = (name) =>
    `field${showError(name) ? ' invalid' : values[name] && !showError(name) ? ' valid' : ''}`;

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li>Register</li>
        </ul>
      </nav>

      <section aria-labelledby="register-heading">
        <h2 id="register-heading">Create an account</h2>

        {serverError && (
          <p className="form-error" role="alert" style={{ color: 'var(--color-danger, #c0392b)', fontWeight: 600 }}>
            ⚠ {serverError}
          </p>
        )}

        <form onSubmit={onSubmit} noValidate>
          <div className={fieldCls('name')}>
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" type="text" autoComplete="name"
              value={values.name} onChange={handleChange} onBlur={handleBlur}
              aria-invalid={!!showError('name')} />
            {showError('name') && <span className="field-error-text">⚠ {showError('name')}</span>}
          </div>

          <div className={fieldCls('email')}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email"
              value={values.email} onChange={handleChange} onBlur={handleBlur}
              aria-invalid={!!showError('email')} />
            {showError('email') && <span className="field-error-text">⚠ {showError('email')}</span>}
          </div>

          <div className={fieldCls('password')}>
            <label htmlFor="password">
              Password <InfoTip text="Use at least 6 characters. Mixing letters, numbers and symbols makes it stronger." />
            </label>
            <input id="password" name="password" type="password" autoComplete="new-password"
              value={values.password} onChange={handleChange} onBlur={handleBlur}
              aria-invalid={!!showError('password')} />
            {values.password && (
              <>
                <div className={`strength-meter s${strength}`} aria-hidden="true">
                  <span /><span /><span /><span />
                </div>
                <span className="strength-label" style={{ color: 'var(--color-text-muted)' }}>
                  Strength: {STRENGTH_LABELS[strength] || 'Very weak'}
                </span>
              </>
            )}
            {showError('password') && <span className="field-error-text">⚠ {showError('password')}</span>}
          </div>

          <div className={fieldCls('confirm')}>
            <label htmlFor="confirm">Confirm password</label>
            <input id="confirm" name="confirm" type="password" autoComplete="new-password"
              value={values.confirm} onChange={handleChange} onBlur={handleBlur}
              aria-invalid={!!showError('confirm')} />
            {showError('confirm') && <span className="field-error-text">⚠ {showError('confirm')}</span>}
            {!showError('confirm') && values.confirm && values.confirm === values.password && (
              <span className="valid-check">✓ Passwords match</span>
            )}
          </div>

          <label style={{ display: 'flex', gap: 'var(--space-2)', fontWeight: 500, alignItems: 'flex-start' }}>
            <input type="checkbox" name="terms" checked={values.terms} onChange={handleChange} onBlur={handleBlur} />
            I agree to the Terms of Service and Privacy Policy
          </label>
          {showError('terms') && <span className="field-error-text">⚠ {showError('terms')}</span>}

          <button type="submit" disabled={!isValid || submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p>Already have an account? <Link to="/login">Sign in here</Link>.</p>
      </section>
    </>
  );
}
