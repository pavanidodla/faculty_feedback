import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, verifyOTP, resetPassword } from '../api';
import { toast } from 'react-toastify';

// Step indicators
const STEPS = ['Enter Email', 'Verify OTP', 'New Password'];

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', gap: 0 }}>
      {STEPS.map((label, idx) => (
        <React.Fragment key={idx}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.3s',
              background: idx < current ? 'var(--success)' : idx === current ? 'var(--primary)' : '#e5e7eb',
              color: idx <= current ? 'white' : 'var(--text-muted)',
              boxShadow: idx === current ? '0 0 0 4px rgba(26,86,219,0.15)' : 'none'
            }}>
              {idx < current ? '✓' : idx + 1}
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: idx === current ? 700 : 400, color: idx === current ? 'var(--primary)' : idx < current ? 'var(--success)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: idx < current ? 'var(--success)' : '#e5e7eb', margin: '0 0.5rem', marginBottom: '1.4rem', transition: 'background 0.3s', minWidth: 40 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// OTP input boxes
function OTPInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split('');

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = val;
    onChange(next.join(''));
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', margin: '1.5rem 0' }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          style={{
            width: 48, height: 56, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700,
            border: `2px solid ${digits[i] ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 10, outline: 'none', fontFamily: "'Space Grotesk', sans-serif",
            background: digits[i] ? 'var(--primary-light)' : '#f9fafb',
            color: 'var(--text)', transition: 'all 0.15s'
          }}
        />
      ))}
    </div>
  );
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown for resend OTP
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
    }, 1000);
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await forgotPassword({ email });
      toast.success('OTP sent! Check your college email inbox.');
      setStep(1);
      startCountdown();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Please enter the complete 6-digit OTP');
    setLoading(true);
    try {
      const res = await verifyOTP({ email, otp });
      setResetToken(res.data.resetToken);
      toast.success('OTP verified! Set your new password.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0) return;
    setOtp('');
    setLoading(true);
    try {
      await forgotPassword({ email });
      toast.success('New OTP sent!');
      startCountdown();
    } catch (err) {
      toast.error('Failed to resend OTP');
    } finally { setLoading(false); }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return toast.error('Please enter new password');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(newPassword))
      return toast.error('Password must be 8+ chars with letter, number, and symbol');
    setLoading(true);
    try {
      await resetPassword({ resetToken, newPassword });
      toast.success('Password reset successfully! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      {/* Left Panel */}
      <div className="auth-left">
        <div className="logo-circle">🔐</div>
        <h1>Reset Your Password</h1>
        <p>We'll send a one-time password to your RGUKT college email to verify your identity.</p>
        <div className="taglines" style={{ marginTop: '2rem' }}>
          <div className="tagline-item">📧 OTP sent to your college email</div>
          <div className="tagline-item">⏱ Valid for 10 minutes only</div>
          <div className="tagline-item">🔒 Secure 3-step verification</div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-form-box">
          <h2>Forgot Password</h2>
          <p className="subtitle">
            {step === 0 && 'Enter your college email to receive an OTP'}
            {step === 1 && `OTP sent to ${email}`}
            {step === 2 && 'Create a strong new password'}
          </p>

          <StepIndicator current={step} />

          {/* ── Step 0: Email ── */}
          {step === 0 && (
            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label>College Email</label>
                <input
                  className="form-control"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rollno@rguktrkv.ac.in"
                  autoFocus
                  required
                />
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Must be a registered RGUKT college email
                </div>
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                {loading ? 'Sending OTP...' : '📨 Send OTP →'}
              </button>
              <div className="auth-link"><Link to="/login">← Back to Login</Link></div>
            </form>
          )}

          {/* ── Step 1: OTP ── */}
          {step === 1 && (
            <form onSubmit={handleVerifyOTP}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: '#f0f4ff', borderRadius: '10px', padding: '1rem', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--primary)' }}>
                  📧 Check your inbox at <strong>{email}</strong>
                </div>
                <OTPInput value={otp} onChange={setOtp} />
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Enter the 6-digit OTP (valid 10 min)
                </div>
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying...' : '✓ Verify OTP'}
              </button>
              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Didn't receive it?{' '}
                <span
                  onClick={handleResend}
                  style={{ color: countdown > 0 ? 'var(--text-muted)' : 'var(--primary)', fontWeight: 600, cursor: countdown > 0 ? 'not-allowed' : 'pointer' }}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </span>
              </div>
              <div className="auth-link">
                <span onClick={() => { setStep(0); setOtp(''); }} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                  ← Change Email
                </span>
              </div>
            </form>
          )}

          {/* ── Step 2: New Password ── */}
          {step === 2 && (
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-control"
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars: letter + number + symbol"
                    style={{ paddingRight: '3rem' }}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>e.g. MyPass@123</div>
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-control"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    style={{ paddingRight: '3rem' }}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                    {showConfirm ? '🙈' : '👁'}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <div className="error-msg">⚠ Passwords do not match</div>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--success)', marginTop: '0.3rem' }}>✓ Passwords match</div>
                )}
              </div>
              <button
                className="btn btn-primary btn-block"
                type="submit"
                disabled={loading || newPassword !== confirmPassword || !newPassword}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}