import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // Cek session awal SEKALI SAJA
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
      initialized.current = true;
    });

    // Listen perubahan auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip event pertama kalau sudah dihandle getSession
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name, plan, role, trial_ends_at, pro_expires_at, created_at")
        .eq("id", userId)
        .single();
      if (data) setProfile(data);
    } catch (e) {
      // Profile tidak ditemukan — tidak masalah
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email, password, name) {
    return await supabase.auth.signUp({
      email, password,
      options: { data: { name } }
    });
  }

  async function signIn(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
  }

  async function signInWithGoogle() {
    return await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" }
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(false);
  }

  const isAdmin = profile?.role === "admin";

  const trialActive = profile?.trial_ends_at
    ? new Date(profile.trial_ends_at) > new Date()
    : false;

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.ceil((new Date(profile.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const effectivePlan = trialActive ? "pro" : (profile?.plan || "free");

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      signUp, signIn, signInWithGoogle, signOut,
      isAdmin, trialActive, trialDaysLeft, effectivePlan,
      refreshProfile: () => user && fetchProfile(user.id)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
