import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useStore } from "../store/useStore";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const lastFetchedUserId = useRef(null);

  const fetchProfile = useCallback(async (userId, retries = 3) => {
    // Deduplicate logic using Ref to avoid state dependency in useCallback
    if (lastFetchedUserId.current === userId && initialized.current) return;
    lastFetchedUserId.current = userId;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, plan, role, trial_ends_at, pro_expires_at, created_at, company_logo, onboarding_completed, business_type")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
        initialized.current = true;
        setLoading(false);
      } else if (retries > 0) {
        setTimeout(() => fetchProfile(userId, retries - 1), 1000);
      } else {
        setLoading(false);
      }
    } catch (e) {
      if (retries > 0) {
        setTimeout(() => fetchProfile(userId, retries - 1), 1000);
      } else {
        setLoading(false);
      }
    }
  }, []); // MUST BE STABLE

  useEffect(() => {
    let mounted = true;

    // Load initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Skip initial session event as we handle it above
        if (event === 'INITIAL_SESSION') return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Trigger fetch if user changed or was cleared
          if (lastFetchedUserId.current !== session.user.id) {
            setLoading(true);
            initialized.current = false;
            fetchProfile(session.user.id);
          }
        } else {
          setProfile(null);
          setLoading(false);
          lastFetchedUserId.current = null;
          initialized.current = false;
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(async (email, password, name, activateTrial = false) => {
    return await supabase.auth.signUp({
      email, password,
      options: { 
        data: { 
          full_name: name,
          activate_trial: activateTrial
        } 
      }
    });
  }, []);

  const signIn = useCallback(async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    return await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { 
        redirectTo: "https://www.myinvoice.space/dashboard",
      }
    });
  }, []);

  const signOut = useCallback(async () => {
    const lang = localStorage.getItem('lang');
    const theme = localStorage.getItem('theme');
    localStorage.clear();
    if (lang) localStorage.setItem('lang', lang);
    if (theme) localStorage.setItem('theme', theme);
    
    useStore.getState().reset();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(false);
    lastFetchedUserId.current = null;
  }, []);

  const isAdmin = useMemo(() => profile?.role === "admin", [profile]);

  const trialActive = useMemo(() => {
    return profile?.plan === 'free' && profile?.trial_ends_at
      ? new Date(profile.trial_ends_at) > new Date()
      : false;
  }, [profile]);

  const trialDaysLeft = useMemo(() => {
    return profile?.trial_ends_at
      ? Math.max(0, Math.min(14, Math.ceil((new Date(profile.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))))
      : 0;
  }, [profile]);

  const proExpired = useMemo(() => {
    return profile?.pro_expires_at
      ? new Date(profile.pro_expires_at) < new Date()
      : false;
  }, [profile]);

  const currentServerPlan = proExpired ? 'free' : (profile?.plan?.toLowerCase() || 'free');
  const effectivePlan = trialActive ? "pro" : currentServerPlan;

  const canAccessReport = useCallback(() => effectivePlan !== 'free' || isAdmin, [effectivePlan, isAdmin]);
  const canAccessAdvancedKasir = useCallback(() => ['pro', 'ultimate'].includes(effectivePlan) || isAdmin, [effectivePlan, isAdmin]);
  const canAccessMultiOutlet = useCallback(() => effectivePlan === 'ultimate' || isAdmin, [effectivePlan, isAdmin]);
  const canAccessKaryawan = useCallback(() => ['pro', 'ultimate'].includes(effectivePlan) || isAdmin, [effectivePlan, isAdmin]);
  const canWhiteLabelStruk = useCallback(() => effectivePlan === 'ultimate' || isAdmin, [effectivePlan, isAdmin]);
  const canAccessHPP = useCallback(() => effectivePlan === 'ultimate' || isAdmin, [effectivePlan, isAdmin]);
  
  const isVerified = useMemo(() => {
    return session?.user?.email_confirmed_at != null || session?.user?.app_metadata?.provider === 'google';
  }, [session]);

  const refreshProfile = useCallback(() => user && fetchProfile(user.id), [user, fetchProfile]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`user-changes-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${user.id}` }, () => {
        window.dispatchEvent(new Event('invoice-updated'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cashbook', filter: `user_id=eq.${user.id}` }, () => {
        window.dispatchEvent(new Event('cashbook-updated'));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const value = useMemo(() => ({
    user, profile, session, loading,
    signUp, signIn, signInWithGoogle, signOut,
    isAdmin, trialActive, trialDaysLeft, effectivePlan, isVerified,
    canAccessReport, canAccessAdvancedKasir, canAccessMultiOutlet, canAccessKaryawan, canWhiteLabelStruk, canAccessHPP,
    refreshProfile,
    supabase
  }), [
    user, profile, session, loading,
    signUp, signIn, signInWithGoogle, signOut,
    isAdmin, trialActive, trialDaysLeft, effectivePlan, isVerified,
    canAccessReport, canAccessAdvancedKasir, canAccessMultiOutlet, canAccessKaryawan, canWhiteLabelStruk, canAccessHPP,
    refreshProfile
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
