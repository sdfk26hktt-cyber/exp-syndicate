import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import ResourceBoard from './components/ResourceBoard';
import Checklist from './components/Checklist';
import SignIn from './components/SignIn';
import AdminDashboard from './components/AdminDashboard';
import Settings from './components/Settings';
import CommunityFeed from './components/CommunityFeed';
import FullCalendar from './components/FullCalendar';
import TeamPasswords from './components/TeamPasswords';
import Directory from './components/Directory';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AgentProvider } from './context/AgentContext';
import { CommunityProvider } from './context/CommunityContext';

const ProtectedRoute = ({ children, role }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (role && currentUser.role !== role) {
    if (currentUser.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppLayout = ({ children }) => {
  const { currentUser, originalAdminUser, stopEmulating } = useAuth();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {originalAdminUser && (
        <div style={{
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          padding: '0.75rem',
          textAlign: 'center',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          zIndex: 1000,
          flexShrink: 0
        }}>
          <span>🕵️‍♂️ You are emulating {currentUser.name}.</span>
          <button 
            onClick={stopEmulating} 
            style={{
              backgroundColor: 'white',
              color: 'var(--color-primary)',
              border: 'none',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            End Emulation
          </button>
        </div>
      )}
      <div className="app-container" style={{ flexGrow: 1, height: 'auto', minHeight: 0 }}>
        <Sidebar />
        <main className="main-content" style={{ overflowY: 'auto' }}>
          {children}
        </main>
        {currentUser?.role === 'agent' && <MobileNav />}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AgentProvider>
        <CommunityProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<SignIn />} />
              
              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute role="admin">
                    <AppLayout>
                      <AdminDashboard />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/passwords" 
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <TeamPasswords />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              {/* Agent Routes */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute role="agent">
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/checklist" 
                element={
                  <ProtectedRoute role="agent">
                    <AppLayout>
                      <Checklist />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/resources" 
                element={
                  <ProtectedRoute role="agent">
                    <AppLayout>
                      <ResourceBoard />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/achievements" 
                element={
                  <ProtectedRoute role="agent">
                    <AppLayout>
                      <div className="animate-fade-in">
                        <h1 className="text-2xl font-semibold mb-2">Achievements</h1>
                        <p className="text-muted mb-6">Track your onboarding milestones and rewards.</p>
                        <div className="card">
                          <p>Full achievements view coming soon...</p>
                        </div>
                      </div>
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              {/* Shared Protected Routes (Accessible by Admin and Agent) */}
              <Route 
                path="/community" 
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <CommunityFeed />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/calendar" 
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <FullCalendar />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/directory" 
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Directory />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings"  
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Settings />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </CommunityProvider>
      </AgentProvider>
    </AuthProvider>
  );
}

export default App;
