import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, googleAuth } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import GoogleLoginButton from '../components/GoogleLoginButton';

const ALLOWED_DOMAINS = ['rguktrkv.ac.in', 'rguktong.ac.in'];

function validate(form) {
  const errs = {};
  if (!form.name.trim()) {
    errs.name = 'Name is required';
  }
  const domain = form.email.split('@')[1];
  if (!form.email || !ALLOWED_DOMAINS.includes(domain)) {
    errs.email = 'Only rguktrkv.ac.in or rguktong.ac.in emails are allowed';
  }
  if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(form.password)) {
    errs.password = 'Must be 8+ chars with at least one letter, number, and symbol (e.g. MyPass@123)';
  }
  return errs;
}

export default function Register() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await register(form);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Google callback — uses stable reference via GoogleLoginButton's internal ref
  const handleGoogle = async (credential) => {
    try {
      const res = await googleAuth({ credential });
      loginUser(res.data.token, res.data.user);
      toast.success(`Welcome, ${res.data.user.name}!`);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Google sign-in failed. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Panel */}
      <div className="auth-left">
        <div className="logo-circle">🎓</div>
        <h1>RGUKT Faculty Feedback System</h1>
        <p>Share your experience and help improve the quality of education at RGUKT campuses.</p>
        <div className="taglines">
          <div className="tagline-item">✅ Anonymous &amp; Confidential</div>
          <div className="tagline-item">📊 Data-driven Improvements</div>
          <div className="tagline-item">🏫 RK Valley &amp; Ongole Campuses</div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-form-box">
          <h2>Create Account</h2>
          <p className="subtitle">Register with your RGUKT college email</p>

          {/* Google Sign-In */}
          <GoogleLoginButton onSuccess={handleGoogle} />
          <div className="divider">or register with email</div>

          {/* Email Registration Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>Full Name</label>
              <input
                className="form-control"
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Venkata Sai"
                autoComplete="name"
              />
              {errors.name && <div className="error-msg">⚠ {errors.name}</div>}
            </div>

            <div className="form-group">
              <label>College Email</label>
              <input
                className="form-control"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="rollno@rguktrkv.ac.in"
                autoComplete="email"
              />
              {errors.email && <div className="error-msg">⚠ {errors.email}</div>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min 8 chars: letter + number + symbol"
                  autoComplete="new-password"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', fontSize: '1.1rem',
                  }}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && <div className="error-msg">⚠ {errors.password}</div>}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Example: MyPass@123
              </div>
            </div>

            <button
              className="btn btn-primary btn-block"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account →'}
            </button>
          </form>

          <div className="auth-link">
            Already have an account? <Link to="/login">Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}