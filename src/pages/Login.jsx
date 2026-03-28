import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { useLang } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';


export default function Login() {
  const { signIn, signInWithOtp, user, session, loading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { lang, toggleLang, t } = useLang();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkMode, setMagicLinkMode] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
 
  useEffect(() => {
    if (user && !loading) {
      if (user.email_confirmed_at || user.app_metadata?.provider === 'google') {
        navigate("/dashboard");
      } else {
        // Only show if not using magic link (which usually auto-confirms or leads to dashboard)
        if (!magicLinkSent) {
          showToast(t('auth_verify_email_toast'), 'warning');
        }
      }
    }
  }, [user, loading, navigate, lang, showToast, magicLinkSent]);

  /* 
  async function handleGoogleLogin() {
    console.log("Google login initiated");
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google login error:", err);
    }
  }
  */

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (magicLinkMode) {
      try {
        const { error } = await signInWithOtp(email);
        if (error) throw error;
        setMagicLinkSent(true);
        showToast(t('auth_magic_sent_toast'), 'success');
      } catch (err) {
        setError(err.message);
        showToast(err.message, 'error');
        setSubmitting(false);
      }
      return;
    }

    const { data, error } = await signIn(email, password);

    if (error) {
      if (error.message.includes("Invalid login credentials") || error.message.includes("credentials")) {
        setError(t('auth_invalid_credentials'));
        showToast(t('auth_invalid_credentials'), 'error');
      } else if (error.message.includes("Email not confirmed")) {
        setError(t('auth_email_not_confirmed'));
        showToast(t('auth_email_not_confirmed'), 'warning');
      } else {
        setError(error.message);
      }
      setSubmitting(false);
      return;
    }
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-slate-200">
        <div className="w-full max-w-md bg-slate-900 rounded-[32px] shadow-2xl p-12 text-center border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <div className="w-24 h-24 bg-violet-600/10 text-violet-400 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-violet-500/20 shadow-lg shadow-violet-500/5 transition-transform hover:scale-110">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
            {t('auth_magic_check_email')}
          </h2>
          <p className="text-slate-400 mb-10 leading-relaxed font-bold text-lg">
            {t('auth_magic_desc').replace('{email}', email)}
          </p>
          <button 
            onClick={() => setMagicLinkSent(false)}
            className="text-white font-black hover:text-violet-400 transition underline underline-offset-8 decoration-slate-800 hover:decoration-violet-500 tracking-tight"
          >
            {t('auth_back_to_login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-200 selection:bg-violet-500/30 font-sans">
      
      {/* Left panel — branding (hidden on mobile & tablet portrait) */}
      <div className="hidden xl:flex xl:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-20 flex-col justify-between relative overflow-hidden border-r border-slate-900">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] -ml-64 -mb-64"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>

        <Link to="/" className="text-2xl font-black text-white decoration-transparent hover:opacity-80 transition flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 bg-white text-slate-950 rounded-xl flex items-center justify-center shadow-2xl shadow-white/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <span className="tracking-tight">My Invoice</span>
        </Link>
        
        <div className="relative z-10">
          <div className="h-1 w-12 bg-violet-500 mb-10 rounded-full"></div>
          <h1 className="text-6xl font-black mb-8 leading-[1.05] tracking-tighter">
            {t('auth_branding_title')}
          </h1>
          <p className="text-slate-400 text-xl mb-12 max-w-sm leading-relaxed font-medium">
            {t('auth_branding_desc')}
          </p>

          <div className="space-y-6">
            {[
              t('auth_feat_pos'),
              t('auth_feat_inv'),
              t('auth_feat_ana'),
              t('auth_feat_sec'),
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-5 group">
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-violet-500/50 transition-colors">
                  <CheckCircle size={12} className="text-violet-400" strokeWidth={4} />
                </div>
                <span className="text-slate-300 font-bold text-lg tracking-tight">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between relative z-10">
          <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} MyInvoice.space
          </p>
          <div className="flex gap-8">
            <span className="text-[11px] text-slate-600 uppercase tracking-[0.2em] font-black">Elite Edition</span>
            <span className="text-[11px] text-slate-600 uppercase tracking-[0.2em] font-black">Encrypted</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full xl:w-1/2 flex items-center justify-center p-8 relative bg-slate-950">
        <button
          onClick={toggleLang}
          className="absolute top-10 right-10 flex items-center gap-2.5 px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-400 text-xs font-black uppercase tracking-widest transition hover:border-violet-500/50 hover:text-white backdrop-blur-md"
        >
          <Globe size={14} />
          {t('auth_lang_toggle')}
        </button>

        <div className="w-full max-w-sm">
          <div className="mb-12 text-center xl:text-left">
            <h2 className="text-4xl font-black text-white tracking-tighter mb-3">{t('auth_login_title')}</h2>
            <p className="text-slate-500 font-bold text-lg">{t('auth_login_subtitle')}</p>
          </div>

          {error && (
            <div className="mb-10 p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-[13px] font-bold flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] shrink-0"></div>
              {error}
            </div>
          )}

          <div className="flex p-1.5 bg-slate-900 border border-slate-800 rounded-2xl mb-10">
            <button 
              onClick={() => { setMagicLinkMode(false); setError(""); }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${!magicLinkMode ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Password
            </button>
            <button 
              onClick={() => { setMagicLinkMode(true); setError(""); }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${magicLinkMode ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Magic Link
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                {t('auth_email')}
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-6 py-5 bg-slate-900/50 border-2 border-slate-800 rounded-2xl focus:border-violet-500/50 focus:bg-slate-900 outline-none transition-all text-white font-bold placeholder-slate-800"
                placeholder="email@perusahaan.com" required
              />
            </div>
            
            {!magicLinkMode && (
              <div className="space-y-3">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                    {t('auth_password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-[11px] text-violet-400 hover:text-violet-300 font-extrabold uppercase tracking-widest transition"
                  >
                    {t('auth_login_forgot')}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-6 py-5 bg-slate-900/50 border-2 border-slate-800 rounded-2xl focus:border-violet-500/50 focus:bg-slate-900 outline-none transition-all text-white font-bold placeholder-slate-800"
                    placeholder="••••••••" required={!magicLinkMode}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 transition text-slate-600 hover:text-slate-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit" disabled={submitting}
              className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 disabled:opacity-50 transition-all shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)] active:scale-[0.98] mt-6"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
                  {t('auth_login_submitting')}
                </span>
              ) : (
                magicLinkMode ? t('auth_send_magic') : t('auth_login_submit')
              )}
            </button>
          </form>

          {/* Reserved for future reactivation (Commented out as per instructions) */}
          {/* 
          <div className="my-10 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-100"></div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">{t('auth_or')}</span>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-4 border-2 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all bg-white border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-slate-200 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
          */}

          <div className="mt-16 text-center">
            <p className="text-slate-500 font-bold">
              {t('auth_login_no_account')}{" "}
              <Link to="/register" className="text-white font-black hover:text-violet-400 transition ml-2 tracking-tight underline underline-offset-8 decoration-slate-800 hover:decoration-violet-500">
                {t('auth_login_register')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
