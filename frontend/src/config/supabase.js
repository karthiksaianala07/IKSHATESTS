import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing! Check your .env file.");
}

// Helper to safely get sessionStorage, falling back to a mock in-memory storage if blocked
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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // sessionStorage keeps you logged in during a refresh/tab staying open
    // but automatically logs you out when the tab/window is closed.
    storage: getSafeSessionStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
