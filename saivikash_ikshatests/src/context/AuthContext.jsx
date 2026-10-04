import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../config/supabase';
import { API_URL } from '../config/api';

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

// Helper to timeout async operations preventing UI lockup
const withTimeout = (promise, ms = 2500) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Auth request timed out')), ms))
  ]);
};

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
    // Fail-safe timer to guarantee loading is never indefinitely stuck
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    // 1. Background verification of the session
    const checkUser = async () => {
      try {
        const initial = getInitialUser();
        if (initial && initial.id === 'mock-admin-id') {
          setLoading(false);
          return;
        }

        const sessionRes = await withTimeout(supabase.auth.getSession(), 2500).catch(() => ({ data: {} }));
        const session = sessionRes?.data?.session;

        if (session) {
          await fetchProfile(session.user);
        } else {
          setUser(null);
          safeSessionStorage.removeItem('ikshatests_user');
        }
      } catch (err) {
        console.error("Auth initialization check failed:", err);
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

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (supabaseUser) => {
    if (!supabaseUser) return null;
    const isAdminEmail = supabaseUser.email?.toLowerCase().trim() === 'karthiksaianala@gmail.com';

    let profileData = null;
    let isAdmin = isAdminEmail;

    // 1. Check dedicated admin_profiles table first
    try {
      const adminRes = await withTimeout(
        supabase
          .from('admin_profiles')
          .select('full_name, designation, department, phone_number')
          .eq('id', supabaseUser.id)
          .maybeSingle(),
        1500
      );
      if (adminRes?.data && !adminRes?.error) {
        profileData = { ...adminRes.data, role: 'admin' };
        isAdmin = true;
      }
    } catch (e) {
      // quiet fallback
    }

    // 2. If not found in admin_profiles, check student profiles table
    if (!isAdmin) {
      try {
        const res = await withTimeout(
          supabase
            .from('profiles')
            .select('role, full_name, user_id, roll_number, class_cohort, target_exam')
            .eq('id', supabaseUser.id)
            .maybeSingle(),
          2000
        );
        if (res?.data && !res?.error) {
          profileData = res.data;
          if (profileData.role === 'admin') isAdmin = true;
        }
      } catch (err) {
        console.warn("Profile fetch skipped/timed out:", err.message);
      }
    }

    const fullUser = { 
      ...supabaseUser, 
      ...(profileData || {}),
      user_id: profileData?.user_id || profileData?.roll_number || supabaseUser.user_metadata?.user_id || supabaseUser.email?.split('@')[0],
      role: (isAdmin || profileData?.role === 'admin') ? 'admin' : (profileData?.role || 'student') 
    };

    setUser(fullUser);
    safeSessionStorage.setItem('ikshatests_user', JSON.stringify(fullUser));
    return fullUser;
  };

  const login = async (identifier, password) => {
    if (!identifier || !password) {
      return { success: false, error: 'Please enter both User ID / Email and password.' };
    }

    const cleanId = String(identifier).trim();
    let authEmail = cleanId;

    // 1. If identifier is a User ID (does not have '@'), resolve it to the student's auth email
    if (!cleanId.includes('@')) {
      try {
        const resolveRes = await axios.post(`${API_URL}/api/auth/resolve-identifier`, { identifier: cleanId });
        if (resolveRes.data?.email) {
          authEmail = resolveRes.data.email;
        } else {
          return { success: false, error: `No registered account found for User ID "${cleanId}".` };
        }
      } catch (err) {
        return { 
          success: false, 
          error: err.response?.data?.error || `Unable to locate User ID "${cleanId}". Please check and try again.` 
        };
      }
    }

    // 2. Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
    if (error) {
      // If direct email failed and cleanId has '@', check if cleanId is a custom User ID in database
      if (cleanId.includes('@')) {
        try {
          const resolveRes = await axios.post(`${API_URL}/api/auth/resolve-identifier`, { identifier: cleanId });
          if (resolveRes.data?.email && resolveRes.data.email !== cleanId) {
            const retry = await supabase.auth.signInWithPassword({ email: resolveRes.data.email, password });
            if (!retry.error && retry.data?.user) {
              const userProfile = await fetchProfile(retry.data.user);
              return { success: true, user: userProfile || retry.data.user };
            }
          }
        } catch {}
      }
      return { success: false, error: error.message || 'Invalid credentials.' };
    }

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
        redirectTo: `${window.location.origin}/admin`,
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
