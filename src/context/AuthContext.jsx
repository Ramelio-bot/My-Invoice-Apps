import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // DEBUG LOG — hapus setelah login berhasil!
  useEffect(() => {
    console.log('AUTH STATE:', { user: !!user, loading, profile: !!profile });
  }, [user, loading, profile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AUTH EVENT:', event);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    console.log('FETCH PROFILE untuk:', userId);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      console.log('PROFILE RESULT:', { data, error });
      if (!error) setProfile(data);
    } catch (e) {
      console.error("fetchProfile error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email, password, name) {
    setLoading(true);
    const result = await supabase.auth.signUp({
      email, password,
      options: { data: { name } }
    });
    if (result.error) setLoading(false);
    return result;
  }

  async function signIn(email, password) {
    setLoading(true);
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setLoading(false);
    return result;
  }

  async function signInWithGoogle() {
    return await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" }
    });
  }

  async function signOut() {
    setLoading(true);
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
