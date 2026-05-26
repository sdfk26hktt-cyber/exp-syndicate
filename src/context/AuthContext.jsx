import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [originalAdminUser, setOriginalAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for mock session on load
    const savedUser = localStorage.getItem('mockSession');
    const savedAdmin = localStorage.getItem('mockAdminSession');
    
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    if (savedAdmin) {
      setOriginalAdminUser(JSON.parse(savedAdmin));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      // Mock Login Logic
      setTimeout(() => {
        let user = null;
        if (email === 'admin' || email === 'brian@brianburds.com') {
          user = { id: 'admin-1', role: 'admin', name: 'Brian Burds', email };
        } else if (email === 'agent' || email.includes('@')) {
          user = { id: email, role: 'agent', name: email.split('@')[0], email };
        }

        if (user) {
          setCurrentUser(user);
          setOriginalAdminUser(null);
          localStorage.setItem('mockSession', JSON.stringify(user));
          localStorage.removeItem('mockAdminSession');
          resolve(user);
        } else {
          reject(new Error('Invalid login credentials'));
        }
      }, 500);
    });
  };

  const emulateUser = (agentProfile) => {
    if (currentUser?.role !== 'admin') return;
    
    // Save current admin session
    setOriginalAdminUser(currentUser);
    localStorage.setItem('mockAdminSession', JSON.stringify(currentUser));

    // Create mock agent user from profile
    const emulatedUser = {
      id: agentProfile.email || `agent-${Date.now()}`,
      role: 'agent',
      name: agentProfile.title ? agentProfile.title.replace(' (Demo)', '') : 'Emulated Agent',
      email: agentProfile.profile?.email || 'agent@example.com'
    };

    setCurrentUser(emulatedUser);
    localStorage.setItem('mockSession', JSON.stringify(emulatedUser));
  };

  const stopEmulating = () => {
    if (originalAdminUser) {
      setCurrentUser(originalAdminUser);
      localStorage.setItem('mockSession', JSON.stringify(originalAdminUser));
      setOriginalAdminUser(null);
      localStorage.removeItem('mockAdminSession');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setOriginalAdminUser(null);
    localStorage.removeItem('mockSession');
    localStorage.removeItem('mockAdminSession');
  };

  return (
    <AuthContext.Provider value={{ currentUser, originalAdminUser, login, logout, emulateUser, stopEmulating, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
