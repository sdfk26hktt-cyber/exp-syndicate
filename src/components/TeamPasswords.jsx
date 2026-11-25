import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useAgent } from '../context/AgentContext';
import { KeyRound, Plus, Lock, Copy, Eye, EyeOff, ExternalLink, Trash2, Edit2, X, Check } from 'lucide-react';

const TeamPasswords = () => {
  const { currentUser } = useAuth();
  const { currentAgentData } = useAgent();
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Add Form State
  const [appName, setAppName] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);

  // Edit Modal State
  const [editingEntry, setEditingEntry] = useState(null);
  const [editAppName, setEditAppName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Visibility & feedback state
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedKey, setCopiedKey] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  useEffect(() => {
    let isMounted = true;
    const loadPasswords = async () => {
      try {
        const { data } = await supabase.from('team_passwords').select('*').order('app_name', { ascending: true });
        if (isMounted && data) {
          setPasswords(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadPasswords();
    return () => {
      isMounted = false;
    };
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

  const normalizeExternalUrl = (rawUrl) => {
    const trimmed = (rawUrl || '').trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleAddPassword = async (e) => {
    e.preventDefault();
    if (!appName.trim() || !password) return;

    setIsSavingNew(true);
    const newEntry = {
      id: `pwd-${Date.now()}`,
      app_name: appName.trim(),
      url: url.trim(),
      username: username.trim(),
      password,
      notes: notes.trim()
    };

    try {
      const { data, error } = await supabase
        .from('team_passwords')
        .insert([newEntry])
        .select()
        .maybeSingle();

      if (!error) {
        const inserted = data || newEntry;
        setPasswords(prev => [...prev, inserted].sort((a, b) => (a.app_name || '').localeCompare(b.app_name || '')));
        setShowForm(false);
        setAppName('');
        setUrl('');
        setUsername('');
        setPassword('');
        setNotes('');
        showToast(`Added "${inserted.app_name}" to Team Passwords.`);
      } else {
        alert('Error saving password: ' + error.message + '\n\nDid you run the features_schema.sql in Supabase?');
        console.error(error);
      }
    } catch (err) {
      alert('Error saving password: ' + err.message);
      console.error(err);
    } finally {
      setIsSavingNew(false);
    }
  };

  const openEditModal = (pwd) => {
    setEditingEntry(pwd);
    setEditAppName(pwd.app_name || '');
    setEditUrl(pwd.url || '');
    setEditUsername(pwd.username || '');
    setEditPassword(pwd.password || '');
    setEditNotes(pwd.notes || '');
    setShowEditPassword(true);
    setEditError('');
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!editingEntry) return;
    if (!editAppName.trim() || !editPassword) {
      setEditError('App Name and Password are required.');
      return;
    }

    setIsSavingEdit(true);
    setEditError('');

    const updates = {
      app_name: editAppName.trim(),
      url: editUrl.trim(),
      username: editUsername.trim(),
      password: editPassword,
      notes: editNotes.trim()
    };

    try {
      const { data, error } = await supabase
        .from('team_passwords')
        .update(updates)
        .eq('id', editingEntry.id)
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      const updatedRow = data || { ...editingEntry, ...updates };
      setPasswords(prev =>
        prev
          .map(p => (p.id === editingEntry.id ? updatedRow : p))
          .sort((a, b) => (a.app_name || '').localeCompare(b.app_name || ''))
      );
      setEditingEntry(null);
      showToast(`Updated "${updatedRow.app_name}" credentials.`);
    } catch (err) {
      console.error(err);
      setEditError(err.message || 'Failed to update credential.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this password?')) {
      try {
        const { error } = await supabase.from('team_passwords').delete().eq('id', id);
        if (error) throw error;
        setPasswords(prev => prev.filter(p => p.id !== id));
        showToast('Credential deleted.');
      } catch (err) {
        console.error(err);
        alert('Error deleting password: ' + err.message);
      }
    }
  };

  const toggleVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(prev => (prev === key ? '' : prev));
    }, 1800);
  };

  const styles = {
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '8px',
      border: '1px solid var(--color-border)',
      fontSize: '0.9rem',
      backgroundColor: 'var(--color-background)',
      color: 'var(--color-dark-navy)',
      boxSizing: 'border-box'
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
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
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

      {toastMsg && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: 'var(--color-success, #059669)',
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          marginBottom: '1.25rem',
          fontWeight: '600',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Check size={18} /> {toastMsg}
        </div>
      )}

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
              <input type="text" value={url} onChange={e => setUrl(e.target.value)} style={styles.input} placeholder="https://..." />
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
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)} disabled={isSavingNew}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isSavingNew}>
                {isSavingNew ? 'Saving...' : 'Save Credential'}
              </button>
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
                <div className="flex justify-between items-start mb-4" style={{ gap: '0.75rem' }}>
                  <h3 className="font-bold text-lg" style={{ color: 'var(--color-dark-navy)', margin: 0 }}>{pwd.app_name}</h3>
                  <div className="flex items-center" style={{ gap: '0.5rem', flexShrink: 0 }}>
                    {pwd.url && (
                      <a
                        href={normalizeExternalUrl(pwd.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:opacity-80"
                        title="Open Login URL"
                        style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem' }}
                      >
                        <ExternalLink size={18} />
                      </a>
                    )}
                    {currentUser?.role === 'admin' && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditModal(pwd)}
                          title="Edit Credential"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.55rem',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-secondary, #f8fafc)',
                            color: 'var(--color-dark-navy)',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={14} color="var(--color-primary)" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(pwd.id)}
                          className="text-red hover:opacity-80"
                          title="Delete Credential"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'inline-flex', alignItems: 'center' }}
                        >
                          <Trash2 size={18} color="var(--color-alert, var(--color-danger, #ef4444))" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-xs text-muted mb-1 font-semibold uppercase">Username</div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100" style={{ backgroundColor: 'rgba(0,0,0,0.02)', gap: '0.5rem' }}>
                    <span className="font-mono text-sm" style={{ wordBreak: 'break-all' }}>{pwd.username || '-'}</span>
                    {pwd.username && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(pwd.username, `user-${pwd.id}`)}
                        className="text-muted hover:text-primary"
                        title="Copy Username"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}
                      >
                        {copiedKey === `user-${pwd.id}` ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-xs text-muted mb-1 font-semibold uppercase flex justify-between">
                    Password
                    <button
                      type="button"
                      onClick={() => toggleVisibility(pwd.id)}
                      className="text-primary flex items-center gap-1 hover:opacity-80"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
                    >
                      {visiblePasswords[pwd.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                      {visiblePasswords[pwd.id] ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100" style={{ backgroundColor: 'rgba(0,0,0,0.02)', gap: '0.5rem' }}>
                    <span className="font-mono text-sm" style={{ wordBreak: 'break-all' }}>
                      {visiblePasswords[pwd.id] ? pwd.password : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(pwd.password, `pass-${pwd.id}`)}
                      className="text-muted hover:text-primary"
                      title="Copy Password"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}
                    >
                      {copiedKey === `pass-${pwd.id}` ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {pwd.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-muted" style={{ margin: 0 }}>{pwd.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Credential Modal */}
      {editingEntry && currentUser?.role === 'admin' && (
        <div
          onClick={() => !isSavingEdit && setEditingEntry(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            className="card animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--color-white, #ffffff)',
              position: 'relative',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <button
              type="button"
              onClick={() => setEditingEntry(null)}
              disabled={isSavingEdit}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
              title="Close"
            >
              <X size={20} color="var(--color-text-muted)" />
            </button>

            <h2 style={{ marginTop: 0, marginBottom: '0.25rem', color: 'var(--color-dark-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <KeyRound size={20} color="var(--color-primary)" />
              Edit App Credential
            </h2>
            <p className="text-xs text-muted mb-4">Update login details, password, or notes for {editingEntry.app_name}</p>

            {editError && (
              <div style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: '#fee2e2',
                border: '1px solid #f87171',
                borderRadius: '6px',
                color: '#991b1b',
                fontSize: '0.84rem',
                marginBottom: '1rem'
              }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={styles.label}>App Name *</label>
                <input
                  type="text"
                  required
                  value={editAppName}
                  onChange={(e) => setEditAppName(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. Follow Up Boss"
                />
              </div>

              <div>
                <label style={styles.label}>Login URL</label>
                <input
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  style={styles.input}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label style={styles.label}>Username / Email</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ ...styles.label, marginBottom: 0 }}>Password *</label>
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-primary)',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {showEditPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    {showEditPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showEditPassword ? 'text' : 'password'}
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Notes</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. Shared admin account"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingEntry(null)}
                  disabled={isSavingEdit}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSavingEdit}>
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPasswords;
