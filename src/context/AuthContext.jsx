import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [originalAdminUser, setOriginalAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const handleSession = async (session) => {
    if (!session) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    const email = (session.user.email || session.user.phone || '').toLowerCase();
    let role = 'agent';

    // Default master admin
    if (email === 'brian@brianburds.com' || email === 'brenda@brianburds.com') {
      role = 'admin';
    } else {
      // 1. Check if user is in 'admins' table in Supabase
      try {
        const { data } = await supabase.from('admins').select('email').ilike('email', email).single();
        if (data) role = 'admin';
      } catch (err) {
        console.debug('admins table lookup error:', err);
      }

      // 2. Check snapshot in global_settings fallback
      if (role !== 'admin') {
        try {
          const { data: snapshot } = await supabase.from('global_settings').select('*').eq('id', 'syndicate_admins_snapshot').single();
          if (snapshot?.data && Array.isArray(snapshot.data)) {
            const match = snapshot.data.some(a => {
              const aEmail = (typeof a === 'string' ? a : a.email || '').toLowerCase().trim();
              return aEmail === email;
            });
            if (match) role = 'admin';
          }
        } catch (err) {
          console.debug('global_settings snapshot admin check:', err);
        }
      }

      // 3. Check localStorage cache
      if (role !== 'admin') {
        try {
          const saved = localStorage.getItem('syndicate_admins_list');
          if (saved) {
            const list = JSON.parse(saved);
            if (Array.isArray(list) && list.some(a => (a.email || '').toLowerCase().trim() === email)) {
              role = 'admin';
            }
          }
        } catch (err) {
          console.debug('localStorage admin check:', err);
        }
      }

      // 4. Check agents table status === 'admin'
      if (role !== 'admin') {
        try {
          const { data: agentData } = await supabase.from('agents').select('status').ilike('id', email).single();
          if (agentData?.status === 'admin') role = 'admin';
        } catch (err) {
          console.debug('agents table admin check:', err);
        }
      }
    }

    const namePrefix = email.split('@')[0];
    
    // In emulation mode, load the mock session instead
    const currentlyEmulating = localStorage.getItem('mockAdminSession');
    if (currentlyEmulating) {
      const mockSess = localStorage.getItem('mockSession');
      if (mockSess) {
        try {
          setCurrentUser(JSON.parse(mockSess));
        } catch(e) {
          setCurrentUser({ id: session.user.id, role, name: namePrefix, email });
        }
      } else {
        setCurrentUser({ id: session.user.id, role, name: namePrefix, email });
      }
    } else {
      setCurrentUser({
        id: session.user.id,
        role: role,
        name: namePrefix,
        email: email
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    // Restore original admin user if emulating
    const savedAdmin = localStorage.getItem('mockAdminSession');
    if (savedAdmin) {
      try {
        setOriginalAdminUser(JSON.parse(savedAdmin));
      } catch (e) {
        console.error("Failed to parse mockAdminSession", e);
      }
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserAuthorized = async (safeId) => {
    const normalized = (safeId || '').toLowerCase().trim();
    if (normalized === 'brian@brianburds.com' || normalized === 'brenda@brianburds.com') {
      return true;
    }
    try {
      const { data: adminData } = await supabase.from('admins').select('email').ilike('email', normalized).single();
      if (adminData) return true;
    } catch (err) {
      console.debug(err);
    }

    try {
      const { data: snapshot } = await supabase.from('global_settings').select('*').eq('id', 'syndicate_admins_snapshot').single();
      if (snapshot?.data && Array.isArray(snapshot.data)) {
        const match = snapshot.data.some(a => {
          const aEmail = (typeof a === 'string' ? a : a.email || '').toLowerCase().trim();
          return aEmail === normalized;
        });
        if (match) return true;
      }
    } catch (err) {
      console.debug(err);
    }

    try {
      const saved = localStorage.getItem('syndicate_admins_list');
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list) && list.some(a => (a.email || '').toLowerCase().trim() === normalized)) {
          return true;
        }
      }
    } catch (err) {
      console.debug(err);
    }

    try {
      const { data: agentData } = await supabase.from('agents').select('id').ilike('id', normalized).single();
      if (agentData) return true;
    } catch (err) {
      console.debug(err);
    }
    return false;
  };

  const requestOtp = async (identifier) => {
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
       throw new Error("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.");
    }
    const safeId = identifier.toLowerCase().trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeId);
    const authData = isEmail ? { email: safeId } : { phone: safeId.replace(/\D/g, '') };

    // Prevent unauthorized accounts from being created
    const isAuth = await checkUserAuthorized(safeId);
    if (!isAuth) {
      throw new Error("Account not found. You must be invited or added by an admin to log in.");
    }

    const { error } = await supabase.auth.signInWithOtp(authData);
    if (error) throw error;
    return { success: true, message: 'Code sent successfully' };
  };

  const login = async (identifier, code) => {
    const safeId = identifier.toLowerCase().trim();
    const safeCode = code.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeId);
    
    if (!isEmail) {
      const { data, error } = await supabase.auth.verifyOtp({ phone: safeId.replace(/\D/g, ''), token: safeCode, type: 'sms' });
      if (error) throw error;
      return data.user;
    }

    // Attempt 1: 'magiclink' type (signInWithOtp generates this for existing users)
    let res = await supabase.auth.verifyOtp({ email: safeId, token: safeCode, type: 'magiclink' });
    
    if (res.error) {
      // Attempt 2: 'signup' type (signInWithOtp generates this for new users)
      res = await supabase.auth.verifyOtp({ email: safeId, token: safeCode, type: 'signup' });
      
      if (res.error) {
        // Attempt 3: 'email' type (Fallback for specific email OTP configs)
        res = await supabase.auth.verifyOtp({ email: safeId, token: safeCode, type: 'email' });
      }
    }

    if (res.error) throw res.error;
    return res.data.user;
  };

  const loginWithPassword = async (identifier, password) => {
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      throw new Error("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.");
    }
    const safeId = identifier.toLowerCase().trim();
    if (!password) {
      throw new Error("Please enter your password.");
    }

    // Check authorization first if not master admin
    const isAuth = await checkUserAuthorized(safeId);
    if (!isAuth) {
      throw new Error("Account not found. You must be invited or added by an admin to log in.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: safeId,
      password: password
    });

    if (error) {
      if (error.message && (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials'))) {
        throw new Error("Invalid password or email. If you haven't set a password yet, please use 'Sign in with Email Code' or click 'Set up Password'.");
      }
      throw error;
    }

    return data.user;
  };

  const updatePassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    setIsPasswordRecovery(false);
    return data.user;
  };

  const resetPasswordForEmail = async (email) => {
    const safeEmail = email.toLowerCase().trim();
    const isAuth = await checkUserAuthorized(safeEmail);
    if (!isAuth) {
      throw new Error("Account not found. You must be invited or added by an admin to reset a password.");
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(safeEmail, {
      redirectTo: `${window.location.origin}/login?mode=recovery`
    });
    if (error) throw error;
    return data;
  };

  const verifyOtpAndSetPassword = async (identifier, code, newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }
    // First verify OTP to log in and create an active session
    await login(identifier, code);
    // Then set the user's password on the newly authenticated session
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data.user;
  };

  const createUserWithPassword = async (email, password) => {
    const safeEmail = email.toLowerCase().trim();
    const { data, error } = await supabase.auth.signUp({
      email: safeEmail,
      password: password
    });
    if (error && !error.message.includes('already registered')) {
      throw error;
    }
    return data;
  };

  const emulateUser = (agentProfile) => {
    if (currentUser?.role !== 'admin') return;
    
    // Save current admin session
    setOriginalAdminUser(currentUser);
    localStorage.setItem('mockAdminSession', JSON.stringify(currentUser));

    const agentEmail = (
      agentProfile.email || 
      agentProfile.profile?.email || 
      (typeof agentProfile.id === 'string' && agentProfile.id.includes('@') ? agentProfile.id : '') ||
      'agent@brianburds.com'
    ).toLowerCase().trim();

    const agentName = agentProfile.name || (agentProfile.title ? agentProfile.title.replace(' (Demo)', '') : 'Emulated Agent');
    const agentPhone = agentProfile.phone || agentProfile.profile?.phone || '';

    // Create mock agent user from profile
    const emulatedUser = {
      id: agentProfile.id || agentEmail,
      role: 'agent',
      name: agentName,
      email: agentEmail,
      phone: agentPhone
    };

    setCurrentUser(emulatedUser);
    localStorage.setItem('mockSession', JSON.stringify(emulatedUser));
    
    // Explicitly navigate to home to prevent route caching issues
    window.location.href = '/';
  };

  const stopEmulating = () => {
    if (originalAdminUser) {
      setCurrentUser(originalAdminUser);
      localStorage.setItem('mockSession', JSON.stringify(originalAdminUser));
      setOriginalAdminUser(null);
      localStorage.removeItem('mockAdminSession');
      window.location.href = '/admin';
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setCurrentUser(null);
      setOriginalAdminUser(null);
      localStorage.removeItem('mockSession');
      localStorage.removeItem('mockAdminSession');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      originalAdminUser, 
      requestOtp, 
      login, 
      loginWithPassword,
      updatePassword,
      resetPasswordForEmail,
      verifyOtpAndSetPassword,
      createUserWithPassword,
      isPasswordRecovery,
      setIsPasswordRecovery,
      logout, 
      emulateUser, 
      stopEmulating, 
      loading 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
