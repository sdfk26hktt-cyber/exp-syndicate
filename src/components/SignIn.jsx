import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

const SignIn = () => {
  const [step, setStep] = useState(1); // 1 = request code, 2 = verify code
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { requestOtp, login, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    
    setError('');
    setIsLoading(true);

    try {
      await requestOtp(identifier);
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(`Error: ${err.message || 'Failed to send code. Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(identifier, code);
      // Wait for the onAuthStateChange listener to update currentUser state.
      // The useEffect above will handle the navigation automatically once it's set.
    } catch (err) {
      console.error(err);
      setError(`Login failed: ${err.message || 'Invalid code. Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img src="/long-syndicate.png" alt="EXP Syndicate" className="dynamic-logo" style={{ height: '48px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }} />
        </div>
        <h2 style={styles.title}>Welcome to The Syndicate</h2>
        {step === 1 ? (
          <>
            <p style={styles.subtitle}>Enter your email to sign in.</p>
            {error && <div style={styles.error}>{error}</div>}
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
            </form>
          </>
        ) : (
          <>
            <p style={styles.subtitle}>We've sent a secure code to <strong>{identifier}</strong>.</p>
            {error && <div style={styles.error}>{error}</div>}
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
                onClick={() => { setStep(1); setCode(''); setError(''); }}
                style={{...styles.button, backgroundColor: 'transparent', color: 'var(--color-primary)', border: 'none', padding: '0.5rem', marginTop: '-0.5rem'}}
              >
                Use a different email
              </button>
            </form>
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
    padding: '3rem',
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
    marginBottom: '2rem',
  },
  logoIcon: {
    backgroundColor: 'var(--color-slate-blue)',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: 'var(--color-dark-navy)',
    letterSpacing: '0.5px'
  },
  title: {
    textAlign: 'center',
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
  },
  subtitle: {
    textAlign: 'center',
    color: 'var(--color-text-muted)',
    marginBottom: '2rem',
    fontSize: '0.875rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
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
    fontSize: '1rem',
    fontFamily: 'inherit',
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '0.875rem',
    fontSize: '1rem',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#EF4444',
    padding: '0.75rem',
    borderRadius: 'var(--border-radius-sm)',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
    textAlign: 'center',
  },
  hint: {
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: 'var(--color-background)',
    borderRadius: 'var(--border-radius-sm)',
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    border: '1px solid var(--color-border)',
  }
};

export default SignIn;
