import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useStore } from "../store/useStore";

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
          setLoading(true);
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId, retries = 3) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, plan, role, trial_ends_at, pro_expires_at, created_at, company_logo")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
      } else if (error && retries > 0) {
        // Jika profile belum terbentuk (kemungkinan trigger/RLS lambat), coba lagi
        setTimeout(() => fetchProfile(userId, retries - 1), 1000);
        return; // Jangan setLoading(false) dulu
      }
    } catch (e) {
      if (retries > 0) {
        setTimeout(() => fetchProfile(userId, retries - 1), 1000);
        return;
      }
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
    localStorage.clear();
    useStore.getState().reset();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(false);
  }

  const isAdmin = profile?.role === "admin";

  const trialActive = profile?.plan === 'free' && profile?.trial_ends_at
    ? new Date(profile.trial_ends_at) > new Date()
    : false;

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.min(14, Math.ceil((new Date(profile.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))))
    : 0;

  // Cek apakah paket berbayar sudah kadaluarsa
  const proExpired = profile?.pro_expires_at
    ? new Date(profile.pro_expires_at) < new Date()
    : false;

  const currentServerPlan = proExpired ? 'free' : (profile?.plan?.toLowerCase() || 'free');
  const effectivePlan = trialActive ? "pro" : currentServerPlan;

  // Role & Plan semantic helpers
  const canAccessReport = () => effectivePlan !== 'free' || isAdmin;
  const canAccessAdvancedKasir = () => ['pro', 'ultimate'].includes(effectivePlan) || isAdmin;
  const canAccessMultiOutlet = () => effectivePlan === 'ultimate' || isAdmin;
  const canAccessKaryawan = () => effectivePlan === 'ultimate' || isAdmin;
  const canWhiteLabelStruk = () => effectivePlan === 'ultimate' || isAdmin;
  const canAccessHPP = () => effectivePlan === 'ultimate' || isAdmin;

  // Supabase Realtime Subscription Global
  useEffect(() => {
    if (!user) return;

    // Membuat channel khusus untuk mendengarkan perubahan (Realtime)
    const channel = supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        (payload) => {
          // Memanggil event global agar Dashboard, Laporan, dll tahu ada perubahan dokumen
          window.dispatchEvent(new Event('invoice-updated'));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cashbook' },
        (payload) => {
          // Memanggil event global agar Dashboard, Catatan Bisnis, dll tahu ada perubahan cashbook
          window.dispatchEvent(new Event('cashbook-updated'));
        }
      )
      .subscribe();

    // Cleanup: remove channel saat user logout atau komponen unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      signUp, signIn, signInWithGoogle, signOut,
      isAdmin, trialActive, trialDaysLeft, effectivePlan,
      canAccessReport, canAccessAdvancedKasir, canAccessMultiOutlet, canAccessKaryawan, canWhiteLabelStruk, canAccessHPP,
      refreshProfile: () => user && fetchProfile(user.id),
      supabase
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
