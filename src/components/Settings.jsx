import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAgent } from '../context/AgentContext';
import { 
  Settings as SettingsIcon, 
  Save, 
  User, 
  Shield, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Phone, 
  MapPin, 
  Award, 
  Heart, 
  AlertCircle,
  CheckCircle2,
  Mail,
  Edit3
} from 'lucide-react';

const Settings = () => {
  const { currentUser, updatePassword, updateUserEmail } = useAuth();
  const { adminSettings, updateAdminSettings, currentAgentData, updateAgentProfile } = useAgent();
  
  // Local state for Agent Profile & Contact Info
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAltPhone, setProfileAltPhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profilePreferredContact, setProfilePreferredContact] = useState('phone'); // 'phone' | 'text' | 'email'
  
  // Email update state
  const [newEmail, setNewEmail] = useState('');
  const [showEmailChangeBox, setShowEmailChangeBox] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState(false);

  // Emergency Contact Info
  const [profileEmergencyName, setProfileEmergencyName] = useState('');
  const [profileEmergencyPhone, setProfileEmergencyPhone] = useState('');
  const [profileEmergencyRelation, setProfileEmergencyRelation] = useState('');

  // Professional & Social
  const [profileLicense, setProfileLicense] = useState('');
  const [profileWebsite, setProfileWebsite] = useState('');
  const [profileInstagram, setProfileInstagram] = useState('');
  const [profileLinkedin, setProfileLinkedin] = useState('');
  const [profileFacebook, setProfileFacebook] = useState('');

  // Personal Background & Goals
  const [profileBirthday, setProfileBirthday] = useState('');
  const [profileInterests, setProfileInterests] = useState('');
  const [profileGoals, setProfileGoals] = useState('');
  
  // Local state for Admin Settings
  const [sponsorName, setSponsorName] = useState(adminSettings.defaultSponsor?.name || '');
  const [sponsorPhone, setSponsorPhone] = useState(adminSettings.defaultSponsor?.phone || '');
  const [sponsorEmail, setSponsorEmail] = useState(adminSettings.defaultSponsor?.email || '');

  // Password update state
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load agent data if they exist
  useEffect(() => {
    if (currentUser?.role === 'agent' && currentAgentData) {
      setProfileName(currentAgentData.name || '');
      setProfileEmail(currentAgentData.id || '');
      const p = currentAgentData.profile || {};
      setProfilePhone(p.phone || '');
      setProfileAltPhone(p.altPhone || '');
      setProfileAddress(p.address || '');
      setProfilePreferredContact(p.preferredContact || 'phone');
      setProfileEmergencyName(p.emergencyName || '');
      setProfileEmergencyPhone(p.emergencyPhone || '');
      setProfileEmergencyRelation(p.emergencyRelation || '');
      setProfileLicense(p.licenseNumber || '');
      setProfileWebsite(p.website || '');
      setProfileInstagram(p.instagram || '');
      setProfileLinkedin(p.linkedin || '');
      setProfileFacebook(p.facebook || '');
      setProfileBirthday(p.birthday || '');
      setProfileInterests(p.interests || '');
      setProfileGoals(p.goals || '');
    } else if (currentUser?.role === 'admin') {
      setProfileName(currentUser.name || '');
      setProfileEmail(currentUser.email || '');
      const p = currentAgentData?.profile || {};
      setProfilePhone(p.phone || '');
      setProfileAltPhone(p.altPhone || '');
      setProfileAddress(p.address || '');
      setProfilePreferredContact(p.preferredContact || 'phone');
    }
  }, [currentUser, currentAgentData]);

  const handleSaveAgent = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      if (currentUser?.role === 'agent') {
        await updateAgentProfile({
          phone: profilePhone,
          altPhone: profileAltPhone,
          address: profileAddress,
          preferredContact: profilePreferredContact,
          emergencyName: profileEmergencyName,
          emergencyPhone: profileEmergencyPhone,
          emergencyRelation: profileEmergencyRelation,
          birthday: profileBirthday,
          licenseNumber: profileLicense,
          website: profileWebsite,
          instagram: profileInstagram,
          linkedin: profileLinkedin,
          facebook: profileFacebook,
          interests: profileInterests,
          goals: profileGoals
        }, profileName);
      }
      setSaveMessage('Contact information and profile saved successfully!');
    } catch (err) {
      console.error(err);
      setSaveMessage('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 4000);
    }
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

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setPasswordError(true);
      setPasswordMessage('Passwords do not match.');
      return;
    }
    if (newPass.length < 6) {
      setPasswordError(true);
      setPasswordMessage('Password must be at least 6 characters.');
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordMessage('');
    setPasswordError(false);

    try {
      await updatePassword(newPass);
      setPasswordError(false);
      setPasswordMessage('Password updated successfully! You can now use this password to sign in.');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => setPasswordMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setPasswordError(true);
      setPasswordMessage(err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    const cleanNewEmail = (newEmail || '').toLowerCase().trim();
    if (!cleanNewEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanNewEmail)) {
      setEmailError(true);
      setEmailMessage('Please enter a valid email address.');
      return;
    }
    if (cleanNewEmail === (profileEmail || '').toLowerCase().trim()) {
      setEmailError(true);
      setEmailMessage('New email address must be different from your current email.');
      return;
    }

    setIsUpdatingEmail(true);
    setEmailMessage('');
    setEmailError(false);

    try {
      const res = await updateUserEmail(cleanNewEmail);
      setEmailError(false);
      setEmailMessage(res?.message || `Email address updated successfully to ${cleanNewEmail}!`);
      setProfileEmail(cleanNewEmail);
      setNewEmail('');
      setShowEmailChangeBox(false);
      setTimeout(() => setEmailMessage(''), 6000);
    } catch (err) {
      console.error(err);
      setEmailError(true);
      setEmailMessage(err.message || 'Failed to update email address.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '80px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2 text-dark-navy">
            <SettingsIcon size={26} color="var(--color-primary)" />
            Account & System Settings
          </h1>
          <p className="text-muted">Manage your personal contact info, directory details, and account security.</p>
        </div>
      </div>

      {saveMessage && (
        <div style={styles.successToast}>
          <CheckCircle2 size={18} /> {saveMessage}
        </div>
      )}

      <div style={styles.grid}>
        
        {/* Contact Information & Profile Card (For Agents & Admins) */}
        <div className="card" style={{ alignSelf: 'start', gridColumn: 'span 2' }}>
          <div className="flex items-center gap-2 mb-4 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
            <User size={22} color="var(--color-primary)" />
            <div>
              <h2 className="text-lg m-0 font-semibold text-dark-navy">My Contact Information & Profile</h2>
              <p className="text-xs text-muted m-0">This information is shown in the syndicate directory and used for team communication.</p>
            </div>
          </div>
          
          <form onSubmit={handleSaveAgent} style={styles.form}>
            
            {/* Section: Basic Identity */}
            <div style={styles.sectionCard}>
              <h3 style={styles.sectionHeading}>
                <User size={16} color="var(--color-primary)" /> Account Identity
              </h3>
              <div style={styles.formGrid}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Full Name / Display Name *</label>
                  <input 
                    type="text" 
                    style={styles.input} 
                    value={profileName} 
                    onChange={(e) => setProfileName(e.target.value)} 
                    placeholder="e.g. Jane Doe"
                    required 
                  />
                </div>
                <div style={styles.inputGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={styles.label}>
                      Primary Email <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>(Login identifier)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowEmailChangeBox(!showEmailChangeBox)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary)',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: 0
                      }}
                    >
                      <Edit3 size={13} /> {showEmailChangeBox ? 'Cancel' : 'Change Email'}
                    </button>
                  </div>
                  <input 
                    type="email" 
                    style={{ ...styles.input, backgroundColor: '#f8fafc', color: '#64748b' }} 
                    value={profileEmail} 
                    disabled 
                  />
                </div>
              </div>

              {/* Expandable Email Change Box in Identity Section */}
              {showEmailChangeBox && (
                <div style={{
                  marginTop: '0.85rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(0, 161, 224, 0.04)',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid rgba(0, 161, 224, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: 'var(--color-primary)', fontWeight: '600', fontSize: '0.85rem' }}>
                    <Mail size={15} /> Update Your Login Email Address
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input 
                      type="email" 
                      placeholder="Enter new email address..."
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      style={{ ...styles.input, flex: '1 1 200px', backgroundColor: 'var(--color-white)' }}
                    />
                    <button 
                      type="button" 
                      onClick={handleUpdateEmail}
                      disabled={isUpdatingEmail || !newEmail}
                      className="btn-primary"
                      style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                    >
                      {isUpdatingEmail ? 'Updating...' : 'Save New Email'}
                    </button>
                  </div>
                  {emailMessage && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: emailError ? '#EF4444' : 'var(--color-success)', fontWeight: '600' }}>
                      {emailMessage}
                    </div>
                  )}
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.4rem 0 0 0' }}>
                    Updating your email will migrate all your onboarding progress, XP points, and directory profile to the new address.
                  </p>
                </div>
              )}
            </div>

            {/* Section: Direct Contact Details */}
            <div style={styles.sectionCard}>
              <h3 style={styles.sectionHeading}>
                <Phone size={16} color="var(--color-primary)" /> Direct Contact Details
              </h3>
              <div style={styles.formGrid}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Primary Phone Number *</label>
                  <input 
                    type="tel" 
                    style={styles.input} 
                    placeholder="(555) 000-0000"
                    value={profilePhone} 
                    onChange={(e) => setProfilePhone(e.target.value)} 
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Alternative / Mobile Phone</label>
                  <input 
                    type="tel" 
                    style={styles.input} 
                    placeholder="(555) 999-9999"
                    value={profileAltPhone} 
                    onChange={(e) => setProfileAltPhone(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ ...styles.formGrid, marginTop: '0.75rem' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Preferred Contact Method</label>
                  <select 
                    style={styles.input}
                    value={profilePreferredContact}
                    onChange={(e) => setProfilePreferredContact(e.target.value)}
                  >
                    <option value="phone">📞 Phone Call</option>
                    <option value="text">💬 Text Message (SMS)</option>
                    <option value="email">✉️ Email</option>
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Mailing / Office Address</label>
                  <input 
                    type="text" 
                    style={styles.input} 
                    placeholder="123 Main St, Suite 100, City, State, ZIP" 
                    value={profileAddress} 
                    onChange={(e) => setProfileAddress(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Section: Emergency Contact */}
            <div style={styles.sectionCard}>
              <h3 style={styles.sectionHeading}>
                <AlertCircle size={16} color="var(--color-primary)" /> Emergency Contact
              </h3>
              <div style={{ ...styles.formGrid, gridTemplateColumns: '1.2fr 1fr 1fr' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Contact Name</label>
                  <input 
                    type="text" 
                    style={styles.input} 
                    placeholder="e.g. John Doe"
                    value={profileEmergencyName} 
                    onChange={(e) => setProfileEmergencyName(e.target.value)} 
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Relationship</label>
                  <input 
                    type="text" 
                    style={styles.input} 
                    placeholder="e.g. Spouse, Parent"
                    value={profileEmergencyRelation} 
                    onChange={(e) => setProfileEmergencyRelation(e.target.value)} 
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Emergency Phone</label>
                  <input 
                    type="tel" 
                    style={styles.input} 
                    placeholder="(555) 000-0000"
                    value={profileEmergencyPhone} 
                    onChange={(e) => setProfileEmergencyPhone(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {currentUser?.role === 'agent' && (
              <>
                {/* Section: Professional & Online Presence */}
                <div style={styles.sectionCard}>
                  <h3 style={styles.sectionHeading}>
                    <Award size={16} color="var(--color-primary)" /> Professional & Web Presence
                  </h3>
                  <div style={styles.formGrid}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>TREC / Real Estate License #</label>
                      <input 
                        type="text" 
                        style={styles.input} 
                        placeholder="e.g. 0748392" 
                        value={profileLicense} 
                        onChange={(e) => setProfileLicense(e.target.value)} 
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Website / Portfolio URL</label>
                      <input 
                        type="url" 
                        style={styles.input} 
                        placeholder="https://yourwebsite.com" 
                        value={profileWebsite} 
                        onChange={(e) => setProfileWebsite(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div style={{ ...styles.formGrid, gridTemplateColumns: '1fr 1fr 1fr', marginTop: '0.75rem' }}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Instagram Profile / Handle</label>
                      <input 
                        type="text" 
                        style={styles.input} 
                        placeholder="@username or URL" 
                        value={profileInstagram} 
                        onChange={(e) => setProfileInstagram(e.target.value)} 
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>LinkedIn Profile URL</label>
                      <input 
                        type="url" 
                        style={styles.input} 
                        placeholder="https://linkedin.com/in/..." 
                        value={profileLinkedin} 
                        onChange={(e) => setProfileLinkedin(e.target.value)} 
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Facebook Profile / Page URL</label>
                      <input 
                        type="url" 
                        style={styles.input} 
                        placeholder="https://facebook.com/..." 
                        value={profileFacebook} 
                        onChange={(e) => setProfileFacebook(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Bio & Goals */}
                <div style={styles.sectionCard}>
                  <h3 style={styles.sectionHeading}>
                    <Heart size={16} color="var(--color-primary)" /> Bio & Goals
                  </h3>
                  <div style={{ ...styles.formGrid, gridTemplateColumns: '1fr 2fr' }}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Birthday</label>
                      <input 
                        type="date" 
                        style={styles.input} 
                        value={profileBirthday} 
                        onChange={(e) => setProfileBirthday(e.target.value)} 
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Hobbies & Interests</label>
                      <input 
                        type="text" 
                        style={styles.input} 
                        placeholder="Hiking, reading, investing, golf..." 
                        value={profileInterests} 
                        onChange={(e) => setProfileInterests(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div style={{ ...styles.inputGroup, marginTop: '0.75rem' }}>
                    <label style={styles.label}>Primary Goals for Improving Your Business</label>
                    <textarea 
                      style={{ ...styles.input, minHeight: '70px', resize: 'vertical' }} 
                      placeholder="Close 24 transactions this year, build a referral network..." 
                      value={profileGoals} 
                      onChange={(e) => setProfileGoals(e.target.value)} 
                    />
                  </div>
                </div>
              </>
            )}

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ marginTop: '0.5rem', width: '100%', padding: '0.85rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} 
              disabled={isSaving}
            >
              <Save size={18} />
              {isSaving ? 'Saving Contact Info...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Login Email Address Card (For all users) */}
        <div className="card" style={{ alignSelf: 'start', borderTop: '4px solid var(--color-primary)' }}>
          <div className="flex items-center gap-2 mb-4 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
            <Mail size={20} color="var(--color-primary)" />
            <h2 className="text-lg m-0 font-semibold text-dark-navy">Login Email Address</h2>
          </div>

          <p className="text-sm text-muted mb-3">
            Your login email identifier for The eXp Syndicate Portal. Changing this updates your login credentials and transfers your records.
          </p>

          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--border-radius-sm)',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>Current Active Login Email</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-dark-navy)', wordBreak: 'break-all' }}>
              {profileEmail || currentUser?.email || 'No email configured'}
            </div>
          </div>

          {emailMessage && (
            <div style={emailError ? styles.errorToast : styles.successToast}>
              {emailMessage}
            </div>
          )}

          <form onSubmit={handleUpdateEmail} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>New Email Address</label>
              <input 
                type="email" 
                style={styles.input} 
                placeholder="e.g. yourname@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={isUpdatingEmail || !newEmail}>
              <Mail size={16} />
              {isUpdatingEmail ? 'Updating Email Address...' : 'Update Login Email'}
            </button>
          </form>
        </div>

        {/* Security & Password Card (For all users) */}
        <div className="card" style={{ alignSelf: 'start', borderTop: '4px solid var(--color-slate-blue)' }}>
          <div className="flex items-center gap-2 mb-4 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
            <Lock size={20} color="var(--color-primary)" />
            <h2 className="text-lg m-0 font-semibold text-dark-navy">Security & Password</h2>
          </div>

          <p className="text-sm text-muted mb-4">
            Set or update your account password to sign in directly with your email and password.
          </p>

          {passwordMessage && (
            <div style={passwordError ? styles.errorToast : styles.successToast}>
              {passwordMessage}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>New Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showNewPass ? 'text' : 'password'} 
                  style={{ ...styles.input, width: '100%', paddingRight: '2.5rem' }} 
                  placeholder="At least 6 characters"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                  minLength={6}
                />
                <button 
                  type="button" 
                  onClick={() => setShowNewPass(!showNewPass)}
                  style={styles.eyeBtn}
                >
                  {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm New Password</label>
              <input 
                type="password" 
                style={styles.input} 
                placeholder="Repeat your password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%' }} disabled={isUpdatingPassword}>
              <KeyRound size={16} />
              {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Admin Only Settings */}
        {currentUser?.role === 'admin' && (
          <div className="card" style={{ alignSelf: 'start', borderTop: '4px solid var(--color-slate-blue)' }}>
            <div className="flex items-center gap-2 mb-4 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
              <Shield size={20} color="var(--color-slate-blue)" />
              <h2 className="text-lg m-0 font-semibold text-dark-navy">Global Admin Defaults</h2>
            </div>
            
            <p className="text-sm text-muted mb-4">
              Configure defaults for new agents added to the syndicate.
            </p>

            <form onSubmit={handleSaveAdmin} style={styles.form}>
              <h3 className="text-sm font-bold mb-2 text-dark-navy">Default Primary Sponsor</h3>
              
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2rem',
  },
  sectionCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 'var(--border-radius-sm)',
    padding: '1.25rem',
    marginBottom: '0.5rem'
  },
  sectionHeading: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--color-dark-navy)',
    margin: '0 0 0.85rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem'
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
    gap: '0.35rem',
  },
  label: {
    fontSize: '0.825rem',
    fontWeight: '600',
    color: 'var(--color-text-main)',
  },
  input: {
    padding: '0.7rem 0.85rem',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-border)',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
    backgroundColor: 'var(--color-background)',
    transition: 'border-color 0.2s',
  },
  successToast: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: 'var(--color-success)',
    padding: '1rem 1.25rem',
    borderRadius: 'var(--border-radius-sm)',
    marginBottom: '1.5rem',
    fontWeight: '600',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    animation: 'fadeInSlideUp 0.3s ease'
  },
  errorToast: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#EF4444',
    padding: '1rem 1.25rem',
    borderRadius: 'var(--border-radius-sm)',
    marginBottom: '1.5rem',
    fontWeight: '600',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    animation: 'fadeInSlideUp 0.3s ease'
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
  notificationBox: {
    backgroundColor: 'rgba(80, 108, 170, 0.05)',
    padding: '0.85rem 1rem',
    borderRadius: 'var(--border-radius-sm)',
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    borderLeft: '3px solid var(--color-slate-blue)'
  }
};

export default Settings;
