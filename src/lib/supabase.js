import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

const customStorageAdapter = {
  getItem: (key) => {
    if (typeof window === 'undefined') return null;
    let val = window.localStorage.getItem(key);
    if (!val) {
      const match = document.cookie.match(new RegExp('(^| )' + encodeURIComponent(key) + '=([^;]+)'));
      if (match) val = decodeURIComponent(match[2]);
    }
    return val;
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
    const d = new Date();
    d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
    document.cookie = `${encodeURIComponent(key)}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: customStorageAdapter
  }
})
