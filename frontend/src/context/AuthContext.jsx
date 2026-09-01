import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext();

// Helper to safely access sessionStorage, falling back to a mock in-memory storage if blocked
const getSafeSessionStorage = () => {
  try {
    const storage = window.sessionStorage;
    storage.setItem('__test__', '1');
    storage.removeItem('__test__');
    return storage;
  } catch (e) {
    console.warn("sessionStorage is blocked or unavailable in this environment. Falling back to in-memory storage.");
    const store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { for (const k in store) delete store[k]; }
    };
  }
};
const safeSessionStorage = getSafeSessionStorage();

export function AuthProvider({ children }) {
  // OPTIMISTIC HYDRATION: Synchronously check for a stored user to avoid the refresh delay
  const getInitialUser = () => {
    try {
      const stored = safeSessionStorage.getItem('ikshatests_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState(getInitialUser());
  const [loading, setLoading] = useState(!getInitialUser()); // Only "load" if we have no cached state

  useEffect(() => {
    // 1. Background verification of the session
    const checkUser = async () => {
      try {
        const initial = getInitialUser();
        if (initial && initial.id === 'mock-admin-id') {
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetchProfile(session.user);
        } else {
          setUser(null);
          safeSessionStorage.removeItem('ikshatests_user');
        }
      } catch (err) {
        console.error("Auth initialization check failed:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // 2. Continuous Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        const initial = getInitialUser();
        if (initial && initial.id === 'mock-admin-id') {
          setLoading(false);
          return;
        }

        if (session) {
          await fetchProfile(session.user);
        } else {
          setUser(null);
          safeSessionStorage.removeItem('ikshatests_user');
        }
      } catch (err) {
        console.error("Auth state change verification failed:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (supabaseUser) => {
    if (!supabaseUser) return null;
    const isAdminEmail = supabaseUser.email?.toLowerCase().trim() === 'karthiksaianala@gmail.com';

    const { data, error } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', supabaseUser.id)
      .single();

    let fullUser;
    if (error) {
      console.warn("Profile fetch error:", error.message);
      fullUser = { ...supabaseUser, role: isAdminEmail ? 'admin' : 'student' };
    } else {
      fullUser = { 
        ...supabaseUser, 
        ...data,
        role: (data.role === 'admin' || isAdminEmail) ? 'admin' : (data.role || 'student') 
      };
    }
    setUser(fullUser);
    safeSessionStorage.setItem('ikshatests_user', JSON.stringify(fullUser));
    return fullUser;
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { success: false, error: error.message };
    let userProfile = null;
    if (data?.user) {
      userProfile = await fetchProfile(data.user);
    }
    return { success: true, user: userProfile || data.user };
  };

  const register = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    if (error) return { success: false, error: error.message };
    return { success: true, user: data.user, session: data.session };
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const logout = async () => {
    // Optimistically clear local React auth state & sessionStorage first 
    // to prevent network/CORS sign-out latency from blocking the UI.
    setUser(null);
    safeSessionStorage.removeItem('ikshatests_user');

    try {
      // Fire-and-forget Supabase sign-out in the background
      supabase.auth.signOut().catch(err => {
        console.warn("Background Supabase sign-out failed/prevented:", err.message);
      });
    } catch (e) {
      console.error("Sign-out trigger error:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
