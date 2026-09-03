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
    let agentDisplayName = session.user.user_metadata?.name || null;
    let agentPhone = session.user.user_metadata?.phone || null;

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

      // 4. Check agents table status / role
      try {
        const { data: agentData } = await supabase.from('agents').select('*').ilike('id', email).single();
        if (agentData) {
          if (agentData.name) agentDisplayName = agentData.name;
          if (agentData.profile?.phone || agentData.phone) agentPhone = agentData.profile?.phone || agentData.phone;
          
          if (agentData.status === 'admin' || agentData.role === 'admin' || agentData.profile?.role === 'Administrator') {
            role = 'admin';
          } else if (agentData.status === 'guest' || agentData.role === 'guest' || agentData.profile?.role === 'Guest') {
            role = 'guest';
          }
        }
      } catch (err) {
        console.debug('agents table role check:', err);
      }

      // Check session metadata for guest role fallback
      if (role !== 'admin' && (session.user.user_metadata?.role === 'guest' || session.user.app_metadata?.role === 'guest')) {
        role = 'guest';
      }
    }

    const namePrefix = agentDisplayName || email.split('@')[0];
    
    // In emulation mode, load the mock session instead
    const currentlyEmulating = localStorage.getItem('mockAdminSession');
    if (currentlyEmulating) {
      const mockSess = localStorage.getItem('mockSession');
      if (mockSess) {
        try {
          setCurrentUser(JSON.parse(mockSess));
        } catch(e) {
          setCurrentUser({ id: session.user.id, role, name: namePrefix, email, phone: agentPhone });
        }
      } else {
        setCurrentUser({ id: session.user.id, role, name: namePrefix, email, phone: agentPhone });
      }
    } else {
      setCurrentUser({
        id: session.user.id,
        role: role,
        name: namePrefix,
        email: email,
        phone: agentPhone
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
      if (error.message && error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error("Your email address has not been confirmed yet. Please switch to 'Sign in with Email Code' to receive a single-use login code and activate your account, or check your email for the confirmation link.");
      }
      throw error;
    }

    return data.user;
  };

  const updateUserEmail = async (newEmail) => {
    const safeNewEmail = (newEmail || '').toLowerCase().trim();
    if (!safeNewEmail) {
      throw new Error("Email address is required.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(safeNewEmail)) {
      throw new Error("Please enter a valid email address.");
    }

    const oldEmail = (currentUser?.email || currentUser?.id || '').toLowerCase().trim();
    if (safeNewEmail === oldEmail) {
      throw new Error("The new email address is the same as your current email address.");
    }

    // 1. Verify that new email isn't already taken by another agent
    try {
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id')
        .ilike('id', safeNewEmail)
        .maybeSingle();

      if (existingAgent && existingAgent.id.toLowerCase().trim() !== oldEmail) {
        throw new Error(`An account with email "${safeNewEmail}" is already registered.`);
      }
    } catch (checkErr) {
      if (checkErr.message && checkErr.message.includes('already registered')) throw checkErr;
    }

    // 2. Update Supabase Auth user email
    const { data: authData, error: authError } = await supabase.auth.updateUser({
      email: safeNewEmail
    });

    if (authError) {
      throw authError;
    }

    // 3. Migrate the database records in agents table
    try {
      const { data: oldAgentData } = await supabase
        .from('agents')
        .select('*')
        .ilike('id', oldEmail)
        .maybeSingle();

      if (oldAgentData) {
        const newAgentRecord = {
          ...oldAgentData,
          id: safeNewEmail,
          profile: {
            ...(oldAgentData.profile || {}),
            email: safeNewEmail
          }
        };

        await supabase.from('agents').upsert([newAgentRecord]);
        if (oldEmail !== safeNewEmail) {
          await supabase.from('agents').delete().ilike('id', oldEmail);
        }
      }
    } catch (dbErr) {
      console.warn('Could not migrate agents row during self-service email update:', dbErr);
    }

    // 4. Migrate admins table if admin
    try {
      const { data: adminRecord } = await supabase
        .from('admins')
        .select('*')
        .ilike('email', oldEmail)
        .maybeSingle();

      if (adminRecord) {
        await supabase.from('admins').upsert([{ email: safeNewEmail }]);
        if (oldEmail !== safeNewEmail) {
          await supabase.from('admins').delete().ilike('email', oldEmail);
        }
      }
    } catch (admErr) {
      console.warn('Could not migrate admins table during self-service email update:', admErr);
    }

    // 5. Migrate open_house_bookings and posts
    try {
      await supabase
        .from('open_house_bookings')
        .update({ agent_email: safeNewEmail, claimed_by: safeNewEmail })
        .ilike('agent_email', oldEmail);
    } catch (ohErr) {
      console.warn('Could not update open_house_bookings:', ohErr);
    }

    try {
      await supabase
        .from('posts')
        .update({ author_id: safeNewEmail })
        .ilike('author_id', oldEmail);
    } catch (postErr) {
      console.warn('Could not update posts:', postErr);
    }

    // 6. Update local currentUser state
    const updatedUser = {
      ...currentUser,
      id: safeNewEmail,
      email: safeNewEmail
    };
    setCurrentUser(updatedUser);
    if (localStorage.getItem('mockSession')) {
      localStorage.setItem('mockSession', JSON.stringify(updatedUser));
    }

    return {
      success: true,
      email: safeNewEmail,
      user: authData?.user,
      message: `Your login email has been updated to ${safeNewEmail}`
    };
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

  const signUpGuest = async (email, password, name, phone) => {
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      throw new Error("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.");
    }
    const safeEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || safeEmail.split('@')[0]).trim();
    const cleanPhone = (phone || '').trim();

    if (!safeEmail || !password) {
      throw new Error("Email and password are required.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    // 1. Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: safeEmail,
      password: password,
      options: {
        data: {
          name: cleanName,
          role: 'guest',
          phone: cleanPhone
        }
      }
    });

    if (authError && !authError.message.includes('already registered')) {
      throw authError;
    }

    // 2. Insert or upsert into agents table with guest status
    const guestRecord = {
      id: safeEmail,
      name: cleanName,
      xp: 0,
      status: 'guest',
      role: 'guest',
      profile: {
        role: 'Guest',
        phone: cleanPhone,
        email: safeEmail
      },
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('agents').upsert([guestRecord]);
    } catch (dbErr) {
      console.warn('Could not insert guest to agents table:', dbErr);
    }

    // 3. Authenticate user session
    try {
      const loginUser = await loginWithPassword(safeEmail, password);
      return loginUser;
    } catch (loginErr) {
      // If email confirmation is strictly enforced in Supabase, return auth user info
      if (authData?.user) {
        return authData.user;
      }
      throw loginErr;
    }
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
      role: agentProfile.role === 'guest' || agentProfile.status === 'guest' ? 'guest' : 'agent',
      name: agentName,
      email: agentEmail,
      phone: agentPhone
    };

    setCurrentUser(emulatedUser);
    localStorage.setItem('mockSession', JSON.stringify(emulatedUser));
    
    // Explicitly navigate to home to prevent route caching issues
    window.location.href = emulatedUser.role === 'guest' ? '/classroom' : '/';
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
      signUpGuest,
      updateUserEmail,
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
