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
    const isAdminEmail = supabaseUser.email?.toLowerCase() === 'karthiksaianala@gmail.com';

    const { data, error } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.warn("Profile fetch error:", error.message);
      const fallbackUser = { ...supabaseUser, role: isAdminEmail ? 'admin' : 'student' };
      setUser(fallbackUser);
      safeSessionStorage.setItem('ikshatests_user', JSON.stringify(fallbackUser));
    } else {
      const fullUser = { 
        ...supabaseUser, 
        ...data,
        role: isAdminEmail ? 'admin' : (data.role || 'student') 
      };
      setUser(fullUser);
      safeSessionStorage.setItem('ikshatests_user', JSON.stringify(fullUser));
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
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
      options: { redirectTo: window.location.origin }
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      safeSessionStorage.removeItem('ikshatests_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
