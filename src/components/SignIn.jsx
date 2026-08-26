import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';

const SignIn = () => {
  // mode: 'password' | 'code' | 'set_password' | 'recovery'
  const [authMode, setAuthMode] = useState('password');
  const [codeStep, setCodeStep] = useState(1); // 1 = request code, 2 = verify code
  const [resetStep, setResetStep] = useState(1); // 1 = request reset code, 2 = verify code + enter new password
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    requestOtp, 
    login, 
    loginWithPassword, 
    updatePassword, 
    verifyOtpAndSetPassword, 
    isPasswordRecovery, 
    currentUser 
  } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();

  // Check URL params or hash for recovery mode
  useEffect(() => {
    if (isPasswordRecovery || location.hash.includes('type=recovery') || location.search.includes('mode=recovery')) {
      setAuthMode('recovery');
    }
  }, [isPasswordRecovery, location]);

  // Redirect on successful login
  useEffect(() => {
    if (currentUser && authMode !== 'recovery') {
      if (currentUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [currentUser, navigate, authMode]);

  // 1. Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await loginWithPassword(identifier, password);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Login failed. Please check your credentials or try using an email code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Email Code Login - Request OTP
  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await requestOtp(identifier);
      setCodeStep(2);
      setSuccessMessage(`Login code sent to ${identifier.trim()}`);
    } catch (err) {
      console.error(err);
      setError(`Error: ${err.message || 'Failed to send code. Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Email Code Login - Verify OTP
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await login(identifier, code);
    } catch (err) {
      console.error(err);
      setError(`Login failed: ${err.message || 'Invalid code. Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Set/Reset Password - Step 1: Request Code
  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await requestOtp(identifier);
      setResetStep(2);
      setSuccessMessage(`Verification code sent to ${identifier.trim()}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Set/Reset Password - Step 2: Verify Code & Set Password
  const handleVerifyAndSetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await verifyOtpAndSetPassword(identifier, code, newPassword);
      setSuccessMessage('Password successfully saved! Redirecting...');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(`Failed to set password: ${err.message || 'Invalid verification code.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Direct Recovery from Email Link
  const handleDirectRecovery = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await updatePassword(newPassword);
      setSuccessMessage('New password saved successfully! Redirecting...');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(`Failed to update password: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (mode) => {
    setAuthMode(mode);
    setError('');
    setSuccessMessage('');
    setCode('');
    setCodeStep(1);
    setResetStep(1);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img src="/long-syndicate.png" alt="EXP Syndicate" className="dynamic-logo" style={{ height: '48px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }} />
        </div>
        <h2 style={styles.title}>Welcome to The Syndicate</h2>

        {/* Success / Error Banners */}
        {error && <div style={styles.error}>{error}</div>}
        {successMessage && <div style={styles.success}>{successMessage}</div>}

        {/* ----------------- DIRECT RECOVERY MODE (From Email Reset Link) ----------------- */}
        {authMode === 'recovery' && (
          <div>
            <p style={styles.subtitle}>Set a new password for your account.</p>
            <form onSubmit={handleDirectRecovery} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>New Password</label>
                <div style={styles.passwordWrapper}>
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    style={styles.passwordInput} 
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNewPassword(!showNewPassword)} 
                    style={styles.eyeBtn}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm New Password</label>
                <input 
                  type="password" 
                  style={styles.input} 
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="btn-primary" style={styles.button} disabled={isLoading}>
                {isLoading ? 'Saving Password...' : 'Save Password & Sign In'}
              </button>
            </form>
          </div>
        )}

        {/* ----------------- SET / RESET PASSWORD MODE ----------------- */}
        {authMode === 'set_password' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <button 
                type="button" 
                onClick={() => switchMode('password')}
                style={styles.backBtn}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            </div>

            {resetStep === 1 ? (
              <>
                <p style={styles.subtitle}>
                  Enter your email to receive a secure code to set or reset your password.
                </p>
                <form onSubmit={handleRequestResetCode} style={styles.form}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Email Address</label>
                    <input 
                      type="email" 
                      style={styles.input} 
                      placeholder="agent@exprealty.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={styles.button} disabled={isLoading}>
                    {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <p style={styles.subtitle}>
                  Enter the 6-digit code sent to <strong>{identifier}</strong> and your new password.
                </p>
                <form onSubmit={handleVerifyAndSetPassword} style={styles.form}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>6-Digit Verification Code</label>
                    <input 
                      type="text" 
                      style={{...styles.input, textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.2rem'}} 
                      placeholder="------"
                      maxLength={10}
                      value={code}
                      onChange={(e) => setCode(e.target.value.trim())}
                      required
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>New Password</label>
                    <div style={styles.passwordWrapper}>
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        style={styles.passwordInput} 
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowNewPassword(!showNewPassword)} 
                        style={styles.eyeBtn}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Confirm New Password</label>
                    <input 
                      type="password" 
                      style={styles.input} 
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={styles.button} disabled={isLoading || code.length < 6}>
                    {isLoading ? 'Saving...' : 'Set Password & Sign In'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setResetStep(1); setCode(''); setError(''); }}
                    style={styles.linkBtn}
                  >
                    Resend code or use different email
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* ----------------- STANDARD LOGIN MODES (PASSWORD / CODE) ----------------- */}
        {(authMode === 'password' || authMode === 'code') && (
          <>
            {/* Mode Selector Tabs */}
            <div style={styles.tabContainer}>
              <button
                type="button"
                onClick={() => switchMode('password')}
                style={{
                  ...styles.tabBtn,
                  ...(authMode === 'password' ? styles.activeTabBtn : {})
                }}
              >
                <Lock size={16} />
                Password
              </button>
              <button
                type="button"
                onClick={() => switchMode('code')}
                style={{
                  ...styles.tabBtn,
                  ...(authMode === 'code' ? styles.activeTabBtn : {})
                }}
              >
                <Mail size={16} />
                Email Code
              </button>
            </div>

            {/* Password Login Form */}
            {authMode === 'password' && (
              <>
                <p style={styles.subtitle}>Sign in with your email and password.</p>
                <form onSubmit={handlePasswordLogin} style={styles.form}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Email Address</label>
                    <input 
                      type="email" 
                      style={styles.input} 
                      placeholder="agent@exprealty.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={styles.label}>Password</label>
                      <button 
                        type="button" 
                        onClick={() => switchMode('set_password')} 
                        style={styles.forgotBtn}
                      >
                        Set / Reset Password?
                      </button>
                    </div>
                    <div style={styles.passwordWrapper}>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        style={styles.passwordInput} 
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        style={styles.eyeBtn}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" style={styles.button} disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </button>

                  <div style={styles.switchOptionContainer}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Prefer a one-time code?</span>
                    <button 
                      type="button" 
                      onClick={() => switchMode('code')}
                      style={styles.switchLinkBtn}
                    >
                      Sign in with Email Code
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Email Code (OTP) Login Form */}
            {authMode === 'code' && (
              <>
                {codeStep === 1 ? (
                  <>
                    <p style={styles.subtitle}>Enter your email to receive a 6-digit login code.</p>
                    <form onSubmit={handleRequestCode} style={styles.form}>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Email Address</label>
                        <input 
                          type="email" 
                          style={styles.input} 
                          placeholder="agent@exprealty.com"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          required
                        />
                      </div>
                      <button type="submit" className="btn-primary" style={styles.button} disabled={isLoading}>
                        {isLoading ? 'Sending Code...' : 'Send Login Code'}
                      </button>

                      <div style={styles.switchOptionContainer}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Have a password?</span>
                        <button 
                          type="button" 
                          onClick={() => switchMode('password')}
                          style={styles.switchLinkBtn}
                        >
                          Sign in with Password
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <p style={styles.subtitle}>We've sent a 6-digit code to <strong>{identifier}</strong>.</p>
                    <form onSubmit={handleVerifyCode} style={styles.form}>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Verification Code</label>
                        <input 
                          type="text" 
                          style={{...styles.input, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.25rem'}} 
                          placeholder="------"
                          maxLength={10}
                          value={code}
                          onChange={(e) => setCode(e.target.value.trim())}
                          required
                        />
                      </div>
                      <button type="submit" className="btn-primary" style={styles.button} disabled={isLoading || code.length < 6}>
                        {isLoading ? 'Verifying...' : 'Sign In'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setCodeStep(1); setCode(''); setError(''); }}
                        style={styles.linkBtn}
                      >
                        Use a different email or resend code
                      </button>
                    </form>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-background)',
    padding: '2rem',
  },
  card: {
    backgroundColor: 'var(--color-card-bg)',
    padding: '2.5rem',
    borderRadius: 'var(--border-radius-md)',
    boxShadow: 'var(--shadow-lg)',
    width: '100%',
    maxWidth: '450px',
    border: '1px solid var(--color-border)',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  title: {
    textAlign: 'center',
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
    color: 'var(--color-dark-navy)',
    fontWeight: '700'
  },
  subtitle: {
    textAlign: 'center',
    color: 'var(--color-text-muted)',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
  },
  tabContainer: {
    display: 'flex',
    gap: '0.5rem',
    backgroundColor: 'var(--color-bg-secondary)',
    padding: '0.35rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
  },
  tabBtn: {
    flex: 1,
    padding: '0.6rem 0.5rem',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    transition: 'all 0.2s ease',
  },
  activeTabBtn: {
    backgroundColor: 'var(--color-white)',
    color: 'var(--color-primary)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--color-text-main)',
  },
  input: {
    padding: '0.75rem',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-border)',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
    backgroundColor: 'var(--color-background)',
    color: 'var(--color-text-main)'
  },
  passwordWrapper: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    width: '100%',
    padding: '0.75rem 2.5rem 0.75rem 0.75rem',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-border)',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
    backgroundColor: 'var(--color-background)',
    color: 'var(--color-text-main)'
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    padding: '0.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: '100%',
    padding: '0.85rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    marginTop: '0.25rem',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#EF4444',
    padding: '0.75rem',
    borderRadius: 'var(--border-radius-sm)',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    textAlign: 'center',
    border: '1px solid rgba(239, 68, 68, 0.2)'
  },
  success: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: 'var(--color-success)',
    padding: '0.75rem',
    borderRadius: 'var(--border-radius-sm)',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    textAlign: 'center',
    border: '1px solid rgba(16, 185, 129, 0.2)'
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    padding: 0,
  },
  switchOptionContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    marginTop: '0.5rem',
  },
  switchLinkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
  },
  linkBtn: {
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    border: 'none',
    padding: '0.5rem',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'center',
    marginTop: '-0.25rem'
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-muted)',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.25rem 0',
  }
};

export default SignIn;
