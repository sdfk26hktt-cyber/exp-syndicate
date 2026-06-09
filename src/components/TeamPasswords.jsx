import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useAgent } from '../context/AgentContext';
import { KeyRound, Plus, Lock, Copy, Eye, EyeOff, ExternalLink, Trash2 } from 'lucide-react';

const TeamPasswords = () => {
  const { currentUser } = useAuth();
  const { currentAgentData } = useAgent();
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [appName, setAppName] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  
  // Visibility state per password ID
  const [visiblePasswords, setVisiblePasswords] = useState({});

  useEffect(() => {
    fetchPasswords();
  }, []);

  if (currentUser?.role !== 'admin' && currentAgentData?.status !== 'team_agent') {
    return (
      <div className="animate-fade-in p-6">
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #f87171',
          padding: '1.5rem',
          borderRadius: '8px',
          color: '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <Lock size={24} />
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>Access Restricted</h3>
            <p style={{ margin: 0 }}>The Team Passwords vault is only accessible to fully onboarded Team Agents.</p>
          </div>
        </div>
      </div>
    );
  }

  const fetchPasswords = async () => {
    try {
      const { data, error } = await supabase.from('team_passwords').select('*').order('app_name', { ascending: true });
      if (data) {
        setPasswords(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPassword = async (e) => {
    e.preventDefault();
    if (!appName || !password) return;
    
    const newEntry = {
      id: `pwd-${Date.now()}`,
      app_name: appName,
      url,
      username,
      password,
      notes
    };
    
    try {
      const { error } = await supabase.from('team_passwords').insert([newEntry]);
      if (!error) {
        setPasswords([...passwords, newEntry].sort((a, b) => a.app_name.localeCompare(b.app_name)));
        setShowForm(false);
        setAppName('');
        setUrl('');
        setUsername('');
        setPassword('');
        setNotes('');
      } else {
        alert("Error saving password: " + error.message + "\n\nDid you run the features_schema.sql in Supabase?");
        console.error(error);
      }
    } catch (err) {
      alert("Error saving password: " + err.message);
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this password?')) {
      try {
        await supabase.from('team_passwords').delete().eq('id', id);
        setPasswords(passwords.filter(p => p.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (currentUser?.role !== 'admin' && currentAgentData?.status !== 'team_agent') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <Lock size={48} className="mx-auto mb-4 text-muted" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted">You must be a Team Agent to view the password repository.</p>
        </div>
      </div>
    );
  }

  const styles = {
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '8px',
      border: '1px solid var(--color-border)',
      fontSize: '0.9rem',
      backgroundColor: 'var(--color-background)',
      color: 'var(--color-dark-navy)'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontSize: '0.85rem',
      fontWeight: '600',
      color: 'var(--color-text-muted)'
    }
  };

  return (
    <div className="animate-fade-in p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2">
            <KeyRound size={24} color="var(--color-primary)" />
            Team Passwords
          </h1>
          <p className="text-muted">Secure password repository for Team Agents.</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(!showForm)}>
            <Plus size={18} /> Add Password
          </button>
        )}
      </div>

      {showForm && currentUser?.role === 'admin' && (
        <div className="card mb-6" style={{ border: '2px solid var(--color-primary)' }}>
          <h2 className="text-lg font-bold mb-4">Add New App Credential</h2>
          <form onSubmit={handleAddPassword} className="grid-layout">
            <div>
              <label style={styles.label}>App Name *</label>
              <input type="text" required value={appName} onChange={e => setAppName(e.target.value)} style={styles.input} placeholder="e.g. Follow Up Boss" />
            </div>
            <div>
              <label style={styles.label}>Login URL</label>
              <input type="url" value={url} onChange={e => setUrl(e.target.value)} style={styles.input} placeholder="https://..." />
            </div>
            <div>
              <label style={styles.label}>Username / Email</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Password *</label>
              <input type="text" required value={password} onChange={e => setPassword(e.target.value)} style={styles.input} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={styles.label}>Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} style={styles.input} placeholder="e.g. Shared admin account" />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Save Credential</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-muted">Loading passwords...</div>
      ) : passwords.length === 0 ? (
        <div className="card text-center py-10 text-muted">
          <KeyRound size={48} className="mx-auto mb-4 opacity-50" />
          <p>No passwords saved yet.</p>
        </div>
      ) : (
        <div className="grid-layout">
          {passwords.map((pwd) => (
            <div key={pwd.id} className="card flex flex-col justify-between" style={{ padding: '1.5rem', height: '100%' }}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg" style={{ color: 'var(--color-dark-navy)' }}>{pwd.app_name}</h3>
                  <div className="flex gap-2">
                    {pwd.url && (
                      <a href={pwd.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:opacity-80" title="Open Link">
                        <ExternalLink size={18} />
                      </a>
                    )}
                    {currentUser?.role === 'admin' && (
                      <button onClick={() => handleDelete(pwd.id)} className="text-red hover:opacity-80" title="Delete">
                        <Trash2 size={18} color="var(--color-alert)" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-xs text-muted mb-1 font-semibold uppercase">Username</div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <span className="font-mono text-sm">{pwd.username || '-'}</span>
                    {pwd.username && (
                      <button onClick={() => copyToClipboard(pwd.username)} className="text-muted hover:text-primary">
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-xs text-muted mb-1 font-semibold uppercase flex justify-between">
                    Password
                    <button onClick={() => toggleVisibility(pwd.id)} className="text-primary flex items-center gap-1 hover:opacity-80">
                      {visiblePasswords[pwd.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                      {visiblePasswords[pwd.id] ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <span className="font-mono text-sm">
                      {visiblePasswords[pwd.id] ? pwd.password : '••••••••••••'}
                    </span>
                    <button onClick={() => copyToClipboard(pwd.password)} className="text-muted hover:text-primary">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {pwd.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-muted">{pwd.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamPasswords;
