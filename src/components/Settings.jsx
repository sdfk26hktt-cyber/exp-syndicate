import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAgent } from '../context/AgentContext';
import { Settings as SettingsIcon, Save, User, Shield } from 'lucide-react';

const Settings = () => {
  const { currentUser } = useAuth();
  const { adminSettings, updateAdminSettings, currentAgentData, updateAgentProfile } = useAgent();
  
  // Local state for Agent Profile
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileBirthday, setProfileBirthday] = useState('');
  const [profileLicense, setProfileLicense] = useState('');
  const [profileInterests, setProfileInterests] = useState('');
  const [profileGoals, setProfileGoals] = useState('');
  
  // Local state for Admin Settings
  const [sponsorName, setSponsorName] = useState(adminSettings.defaultSponsor.name);
  const [sponsorPhone, setSponsorPhone] = useState(adminSettings.defaultSponsor.phone);
  const [sponsorEmail, setSponsorEmail] = useState(adminSettings.defaultSponsor.email);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load agent data if they exist
  useEffect(() => {
    if (currentUser?.role === 'agent' && currentAgentData) {
      setProfileName(currentAgentData.name || '');
      setProfileEmail(currentAgentData.id || '');
      const p = currentAgentData.profile || {};
      setProfilePhone(p.phone || '');
      setProfileAddress(p.address || '');
      setProfileBirthday(p.birthday || '');
      setProfileLicense(p.licenseNumber || '');
      setProfileInterests(p.interests || '');
      setProfileGoals(p.goals || '');
    } else if (currentUser?.role === 'admin') {
      setProfileName(currentUser.name);
      setProfileEmail(currentUser.email);
    }
  }, [currentUser, currentAgentData]);

  const handleSaveAgent = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (currentUser?.role === 'agent') {
      updateAgentProfile({
        phone: profilePhone,
        address: profileAddress,
        birthday: profileBirthday,
        licenseNumber: profileLicense,
        interests: profileInterests,
        goals: profileGoals
      }, profileName);
    }

    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('Profile settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    }, 800);
  };

  const handleSaveAdmin = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    updateAdminSettings({
      defaultSponsor: {
        name: sponsorName,
        phone: sponsorPhone,
        email: sponsorEmail
      }
    });

    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('Global admin settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    }, 800);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2">
            <SettingsIcon size={24} color="var(--color-primary)" />
            System Settings
          </h1>
          <p className="text-muted">Manage your account and preferences.</p>
        </div>
      </div>

      {saveMessage && (
        <div style={styles.successToast}>
          {saveMessage}
        </div>
      )}

      <div style={styles.grid}>
        
        {/* Profile Settings (For all users) */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="flex items-center gap-2 mb-4 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
            <User size={20} color="var(--color-primary)" />
            <h2 className="text-lg m-0">My Profile</h2>
          </div>
          
          <form onSubmit={handleSaveAgent} style={styles.form}>
            
            <h3 className="text-sm font-bold text-dark-navy mt-2">Account Info</h3>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Display Name</label>
                <input type="text" style={styles.input} value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input type="email" style={styles.input} value={profileEmail} disabled />
              </div>
            </div>

            {currentUser?.role === 'agent' && (
              <>
                <h3 className="text-sm font-bold text-dark-navy mt-4">Personal Details</h3>
                <div style={styles.formGrid}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Phone Number</label>
                    <input type="text" style={styles.input} value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Birthday</label>
                    <input type="date" style={styles.input} value={profileBirthday} onChange={(e) => setProfileBirthday(e.target.value)} />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Personal Address</label>
                  <input type="text" style={styles.input} placeholder="123 Main St, City, State, ZIP" value={profileAddress} onChange={(e) => setProfileAddress(e.target.value)} />
                </div>

                <h3 className="text-sm font-bold text-dark-navy mt-4">Professional Details</h3>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>TREC License Number</label>
                  <input type="text" style={styles.input} placeholder="e.g. 123456" value={profileLicense} onChange={(e) => setProfileLicense(e.target.value)} />
                </div>

                <h3 className="text-sm font-bold text-dark-navy mt-4">Get To Know You</h3>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>What are some of your hobbies and interests?</label>
                  <textarea style={{...styles.input, minHeight: '80px'}} placeholder="Hiking, reading, investing..." value={profileInterests} onChange={(e) => setProfileInterests(e.target.value)} />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>What are your primary goals for improving your business?</label>
                  <textarea style={{...styles.input, minHeight: '80px'}} placeholder="Close 20 deals this year, build a team..." value={profileGoals} onChange={(e) => setProfileGoals(e.target.value)} />
                </div>
              </>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%' }} disabled={isSaving}>
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Admin Only Settings */}
        {currentUser?.role === 'admin' && (
          <div className="card" style={{ alignSelf: 'start', borderTop: '3px solid var(--color-slate-blue)' }}>
            <div className="flex items-center gap-2 mb-4 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
              <Shield size={20} color="var(--color-slate-blue)" />
              <h2 className="text-lg m-0">Global Admin Settings</h2>
            </div>
            
            <p className="text-sm text-muted mb-4">
              Configure defaults for the entire platform. These settings affect all new agents added to the system.
            </p>

            <form onSubmit={handleSaveAdmin} style={styles.form}>
              <h3 className="text-sm font-bold mb-2">Default Primary Sponsor</h3>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Sponsor Name</label>
                <input 
                  type="text" 
                  style={styles.input} 
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  required
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Sponsor Phone</label>
                <input 
                  type="text" 
                  style={styles.input} 
                  value={sponsorPhone}
                  onChange={(e) => setSponsorPhone(e.target.value)}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Sponsor Email</label>
                <input 
                  type="email" 
                  style={styles.input} 
                  value={sponsorEmail}
                  onChange={(e) => setSponsorEmail(e.target.value)}
                  required
                />
              </div>

              <div style={styles.notificationBox}>
                <strong>Tip:</strong> Changing this will not affect agents who have already been added to the system. It only changes the pre-filled defaults when adding new agents.
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%', backgroundColor: 'var(--color-dark-navy)' }} disabled={isSaving}>
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Save Global Settings'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
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
    outline: 'none',
    fontFamily: 'inherit',
    backgroundColor: 'var(--color-background)'
  },
  successToast: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: 'var(--color-success)',
    padding: '1rem',
    borderRadius: 'var(--border-radius-sm)',
    marginBottom: '1.5rem',
    fontWeight: '600',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    animation: 'fadeInSlideUp 0.3s ease'
  },
  notificationBox: {
    backgroundColor: 'rgba(80, 108, 170, 0.05)',
    padding: '1rem',
    borderRadius: 'var(--border-radius-sm)',
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    borderLeft: '3px solid var(--color-slate-blue)'
  }
};

export default Settings;
