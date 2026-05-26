import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Invalid login credentials. Use "admin" or any email to test.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}><Users size={24} color="white" /></div>
          <div style={styles.logoText}>
            <span style={{color: '#00A1E0'}}>eXp</span> Syndicate
          </div>
        </div>
        <h2 style={styles.title}>Welcome to The Syndicate</h2>
        <p style={styles.subtitle}>Sign in to access your onboarding playbook.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSignIn} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input 
              type="text" 
              style={styles.input} 
              placeholder="e.g. agent@example.com or admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password (mock)</label>
            <input 
              type="password" 
              style={styles.input} 
              placeholder="Any password works for mock"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" style={styles.button} disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.hint}>
          <strong>Demo hints:</strong><br/>
          Admin Login: <code>admin</code> or <code>brian@brianburds.com</code><br/>
          Agent Login: <code>agent@test.com</code> (or any email)
        </div>
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
