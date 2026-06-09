import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Library, ListChecks, Video, Calendar, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgent } from '../context/AgentContext';

const MobileNav = () => {
  const { currentUser } = useAuth();
  const { currentAgentData } = useAgent();

  return (
    <nav className="mobile-nav">
      <NavLink 
        to="/" 
        className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
      >
        <Home size={24} />
        <span>Home</span>
      </NavLink>
      
      <NavLink 
        to="/checklist" 
        className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
      >
        <ListChecks size={24} />
        <span>Playbook</span>
      </NavLink>
      
      <NavLink 
        to="/resources" 
        className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
      >
        <Library size={24} />
        <span>Resources</span>
      </NavLink>
      
      <NavLink 
        to="/calendar" 
        className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
      >
        <Calendar size={24} />
        <span>Calendar</span>
      </NavLink>
      
      <NavLink 
        to="/community" 
        className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
      >
        <Video size={24} />
        <span>Feed</span>
      </NavLink>
      
      
      {(currentUser?.role === 'admin' || currentAgentData?.status === 'team_agent') && (
        <NavLink 
          to="/passwords" 
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
        >
          <KeyRound size={24} />
          <span>Passwords</span>
        </NavLink>
      )}
    </nav>
  );
};

export default MobileNav;
