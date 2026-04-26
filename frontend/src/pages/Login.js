import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, googleAuth } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });
  const [adminLoading, setAdminLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setAdmin = (field) => (e) => setAdminForm({ ...adminForm, [field]: e.target.value });

  // Student login
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  // Admin login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminForm.email || !adminForm.password) return toast.error('Please fill admin credentials');
    setAdminLoading(true);
    try {
      const res = await login(adminForm);
      if (res.data.user.role !== 'admin') {
        toast.error('This account does not have admin privileges');
        return;
      }
      loginUser(res.data.token, res.data.user);
      toast.success(`Welcome, Admin ${res.data.user.name}!`);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Admin login failed');
    } finally { setAdminLoading(false); }
  };

  // Quick-fill admin credentials (demo helper)
  const fillAdminCredentials = () => {
    setAdminForm({ email: 'admin@rguktrkv.ac.in', password: 'Admin@123' });
  };

  // Google login
  const handleGoogle = async (credential) => {
    try {
      const res = await googleAuth({ credential });
      loginUser(res.data.token, res.data.user);
      toast.success(`Welcome, ${res.data.user.name}!`);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    }
  };

  return (
    <div className="auth-container">
      {/* ── Left Panel ── */}
      <div className="auth-left">
        <div className="logo-circle">🎓</div>
        <h1>RGUKT Faculty Feedback System</h1>
        <p>Your honest feedback helps faculty grow and improves teaching quality across campuses.</p>
        

        
              
            </form>
          )}
        </div>
      </div>

      {/* ── Right Panel (Student Login) ── */}
      <div className="auth-right">
        <div className="auth-form-box">
          <h2>Student Login</h2>
          <p className="subtitle">Login with your RGUKT college credentials</p>

          <GoogleLoginButton onSuccess={handleGoogle} />
          <div className="divider">or login with email</div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>College Email</label>
              <input
                className="form-control"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="rollno@rguktrkv.ac.in"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Forgot Password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Your password"
                  autoComplete="current-password"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : '🎓 Student Login →'}
            </button>
          </form>

          <div className="auth-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </div>

          {/* Mobile Admin Login Button */}
          <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="btn btn-secondary btn-block"
              style={{ fontSize: '0.875rem' }}
            >
              🛡️ Admin Login
            </button>
            {showAdminPanel && (
              <form onSubmit={handleAdminLogin} style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Admin Email</label>
                  <input
                    className="form-control"
                    type="email"
                    value={adminForm.email}
                    onChange={setAdmin('email')}
                    placeholder="admin@rguktrkv.ac.in"
                    autoComplete="off"
                  />
                </div>
                <div className="form-group">
                  <label>Admin Password</label>
                  <input
                    className="form-control"
                    type="password"
                    value={adminForm.password}
                    onChange={setAdmin('password')}
                    placeholder="Admin password"
                    autoComplete="off"
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {adminLoading ? 'Logging in...' : '🛡️ Login as Admin'}
                  </button>
                  <button
                    type="button"
                    onClick={fillAdminCredentials}
                    className="btn btn-secondary"
                  >
                    Demo
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
