import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { Capacitor } from "@capacitor/core";
import { useStore } from "../store/useStore";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const lastFetchedUserId = useRef(null);
  const failureCount = useRef(0);

  const createProfileIfMissing = useCallback(async (userId, email) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email: email,
            plan: 'free',
            trial_ends_at: null, // User must activate manually
            onboarding_completed: false,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .maybeSingle();

      return data;
    } catch (e) {
      return null;
    }
  }, []);

  const fetchProfile = useCallback(async (userId, force = false, retries = 3) => {
    // Deduplicate logic using Ref to avoid state dependency in useCallback
    if (!force && lastFetchedUserId.current === userId && initialized.current) return null; // Don't return state here
    lastFetchedUserId.current = userId;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, plan, role, trial_ends_at, pro_expires_at, created_at, company_logo, onboarding_completed, business_type, store_name, store_address, store_phone, store_footer, store_logo_url")
        .eq("id", userId)
        .maybeSingle();


      if (data) {
        setProfile(data);
        initialized.current = true;
        setLoading(false);
        failureCount.current = 0;
        return data;
      } else if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchProfile(userId, force, retries - 1);
      } else {
        // PERBAIKAN: Jika profiling kosong setelah retry, buat baru
        if (failureCount.current < 2) { // Limit auto-creation attempts
          failureCount.current++;
          const newProfile = await createProfileIfMissing(userId, user?.email);
          if (newProfile) {
            setProfile(newProfile);
            initialized.current = true;
            setLoading(false);
            return newProfile;
          }
        }
        initialized.current = true; // Stop loop even on failure
        setLoading(false);
        return null;
      }
    } catch (e) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchProfile(userId, force, retries - 1);
      } else {
        initialized.current = true;
        setLoading(false);
        return null;
      }
    }
  }, [user?.email, createProfileIfMissing]);

  useEffect(() => {
    let mounted = true;

    // Safety timeout: Jangan biarkan loading macet selamanya
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 10000);

    // Load initial session
    // Wipe stale plan cache keys that may override Supabase truth
    ['user-plan', 'plan', 'effectivePlan', 'trialActive', 'trial_status'].forEach(k => localStorage.removeItem(k));

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      clearTimeout(safetyTimer);
      
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
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          // Trigger fetch if user changed or was cleared, or if profile is missing
          if (lastFetchedUserId.current !== currentUser.id || !profile) {
            setLoading(true);
            initialized.current = false;
            fetchProfile(currentUser.id);
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

  /* 
  const signInWithGoogle = useCallback(async () => {
    const isNative = Capacitor.isNativePlatform();
    return await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { 
        redirectTo: isNative 
          ? 'com.ramelio.myinvoice://login-callback' 
          : `${window.location.origin}/dashboard`,
        skipBrowserRedirect: isNative
      }
    });
  }, []);
  */

  const signInWithOtp = useCallback(async (email) => {
    return await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      }
    });
  }, []);

  const signOut = useCallback(async () => {
    const lang = localStorage.getItem('lang');
    const theme = localStorage.getItem('theme');
    const companyLogo = localStorage.getItem('company_logo'); 
    
    localStorage.clear();
    
    if (lang) localStorage.setItem('lang', lang);
    if (theme) localStorage.setItem('theme', theme);
    if (companyLogo) localStorage.setItem('company_logo', companyLogo);
    
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
    // Now supports both free (legacy) and pro (new hard-sync) plans during trial
    if (!profile?.trial_ends_at) return false;
    const plan = profile?.plan?.toLowerCase() || 'free';
    // Allow trial regardless of current plan, as long as it's not ultimate
    if (plan === 'ultimate') return false; 

    try {
      if (!profile.trial_ends_at) return false;
      const endsTime = new Date(profile.trial_ends_at).getTime();
      const nowTime = new Date().getTime();
      
      const isActive = endsTime > nowTime;
      
      
      return isActive;
    } catch (e) {
      return false;
    }
  }, [profile?.trial_ends_at, profile?.plan]);

  const canStartTrial = useMemo(() => {
    // User can only start trial if they've NEVER had a trial_ends_at set
    // Use strict null check to ensure new profiles (which start with null) are eligible
    return profile?.trial_ends_at === null;
  }, [profile?.trial_ends_at]);

  const trialDaysLeft = useMemo(() => {
    return profile?.trial_ends_at
      ? Math.max(0, Math.min(14, Math.ceil((new Date(profile.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))))
      : 0;
  }, [profile?.trial_ends_at]);

  const proExpired = useMemo(() => {
    return profile?.pro_expires_at
      ? new Date(profile.pro_expires_at) < new Date()
      : false;
  }, [profile?.pro_expires_at]);

  const effectivePlan = useMemo(() => {
    const dbPlan = profile?.plan?.toLowerCase();
    // JIKA sedang trial, atau memang sudah PRO/ULTIMATE di DB
    if (trialActive || dbPlan === 'pro' || dbPlan === 'ultimate') {
      // Kalau di DB dia Ultimate, biarkan tetap Ultimate. 
      // Kalau selain itu (Free/Null tapi Trial aktif), paksa jadi PRO.
      return dbPlan === 'ultimate' ? 'ultimate' : 'pro';
    }
    return 'free';
  }, [profile?.plan, trialActive]);



  const canAccessReport = useCallback(() => effectivePlan !== 'free' || isAdmin, [effectivePlan, isAdmin]);
  const canAccessAdvancedKasir = useCallback(() => ['pro', 'ultimate'].includes(effectivePlan) || isAdmin, [effectivePlan, isAdmin]);
  const canAccessMultiOutlet = useCallback(() => effectivePlan === 'ultimate' || isAdmin, [effectivePlan, isAdmin]);
  const canAccessKaryawan = useCallback(() => effectivePlan === 'ultimate' || isAdmin, [effectivePlan, isAdmin]);
  const canWhiteLabelStruk = useCallback(() => effectivePlan === 'ultimate' || isAdmin, [effectivePlan, isAdmin]);
  const canAccessHPP = useCallback(() => effectivePlan === 'ultimate' || isAdmin, [effectivePlan, isAdmin]);
  
  const isVerified = useMemo(() => {
    return !!user && !!session && (!!user.email_confirmed_at || user.app_metadata?.provider === 'google');
  }, [user, session]);

  const refreshProfile = useCallback(async (force = false) => {
    if (user) {
      return await fetchProfile(user.id, force);
    }
    return null;
  }, [user, fetchProfile]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`user-changes-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${user.id}` }, () => {
        window.dispatchEvent(new Event('invoice-updated'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cashbook', filter: `user_id=eq.${user.id}` }, () => {
        window.dispatchEvent(new Event('cashbook-updated'));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => {
        // Plan/trial changed in DB (e.g., from another device) — refresh immediately
        fetchProfile(user.id, true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchProfile]);

  // Cross-device sync: re-fetch profile when the browser tab/app regains focus
  useEffect(() => {
    if (!user) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchProfile(user.id, true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user, fetchProfile]);

  const value = useMemo(() => ({
    user, profile, session, loading,
    signUp, signIn, signInWithOtp, signOut,
    isAdmin, trialActive, trialDaysLeft, effectivePlan, isVerified,
    canAccessReport, canAccessAdvancedKasir, canAccessMultiOutlet, canAccessKaryawan, canWhiteLabelStruk, canAccessHPP,
    refreshProfile,
    supabase
  }), [
    user, profile, session, loading,
    signUp, signIn, signInWithOtp, signOut,
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
