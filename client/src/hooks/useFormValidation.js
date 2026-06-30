import { useCallback, useMemo, useState } from 'react';

// Generic live form-validation hook.
// `rules` maps each field name to an array of validator fns that return an
// error string (or null/undefined when valid). Validation runs on every
// keystroke so error hints appear/disappear in real time, and `isValid`
// drives the submit button's disabled state.
//
// Example rule: (value, values) => value ? null : 'Required'
export function useFormValidation(initialValues, rules) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});

  const errors = useMemo(() => {
    const out = {};
    for (const field of Object.keys(rules)) {
      const validators = rules[field] || [];
      for (const validate of validators) {
        const msg = validate(values[field], values);
        if (msg) {
          out[field] = msg;
          break;
        }
      }
    }
    return out;
  }, [values, rules]);

  const isValid = Object.keys(errors).length === 0;

  const handleChange = useCallback((e) => {
    const { name, type, checked, value } = e.target;
    setValues((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const setValue = useCallback((name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
  }, []);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
  }, []);

  const touchAll = useCallback(() => {
    const all = {};
    for (const field of Object.keys(rules)) all[field] = true;
    setTouched(all);
  }, [rules]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setTouched({});
  }, [initialValues]);

  // show an error only after the user interacted with the field
  const showError = (field) => (touched[field] ? errors[field] : undefined);

  return {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    setValue,
    touchAll,
    reset,
    showError,
  };
}

// ---- reusable validators ------------------------------------------------
export const required = (label = 'This field') => (v) =>
  v === undefined || v === null || String(v).trim() === '' ? `${label} is required` : null;

export const isChecked = (msg = 'You must accept to continue') => (v) => (v ? null : msg);

export const minLength = (n, label = 'Value') => (v) =>
  v && String(v).length < n ? `${label} must be at least ${n} characters` : null;

export const email = (v) => {
  if (!v) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : 'Enter a valid email address';
};

export const matches = (otherField, msg = 'Values do not match') => (v, values) =>
  v && values[otherField] && v !== values[otherField] ? msg : null;

// password strength 0..4, used by the meter on the register page
export function passwordStrength(pw = '') {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}
