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
          showToast(lang === 'ID' ? 'Silakan verifikasi email Anda terlebih dahulu!' : 'Please verify your email first!', 'warning');
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
        showToast(lang === 'ID' ? 'Link login telah dikirim ke email Anda!' : 'Login link has been sent to your email!', 'success');
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 text-center border border-slate-100">
          <div className="w-20 h-20 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            {lang === 'ID' ? 'Cek Email Anda' : 'Check Your Email'}
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            {lang === 'ID' 
              ? `Kami telah mengirimkan link login ajaib ke ${email}. Klik link tersebut untuk masuk secara instan.` 
              : `We've sent a magic login link to ${email}. Click the link to sign in instantly.`}
          </p>
          <button 
            onClick={() => setMagicLinkSent(false)}
            className="text-violet-600 font-bold hover:underline"
          >
            {lang === 'ID' ? 'Kembali ke Login' : 'Back to Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      
      {/* Left panel — branding (hidden on mobile & tablet portrait) */}
      <div className="hidden xl:flex xl:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-16 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -ml-48 -mb-48"></div>

        <Link to="/" className="text-2xl font-black text-white decoration-transparent hover:opacity-80 transition flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          My Invoice
        </Link>
        
        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold mb-6 leading-[1.1] tracking-tight">
            {lang === 'ID' ? 'Efisiensi Bisnis\ndalam Satu Platform.' : 'Business Efficiency\nin One Platform.'}
          </h1>
          <p className="text-slate-400 text-xl mb-12 max-w-md leading-relaxed">
            {lang === 'ID' 
              ? 'Kelola invoice, kasir digital, dan laporan keuangan dengan standar profesional.' 
              : 'Manage invoices, digital POS, and financial reports with professional standards.'}
          </p>

          <div className="grid grid-cols-1 gap-5">
            {[
              lang === 'ID' ? 'Sistem Kasir POS Terintegrasi' : 'Integrated POS System',
              lang === 'ID' ? 'Automasi Invoice & Penagihan' : 'Invoice & Billing Automation',
              lang === 'ID' ? 'Analitik Bisnis Real-time' : 'Real-time Business Analytics',
              lang === 'ID' ? 'Keamanan Data Berstandar Bank' : 'Bank-Grade Data Security',
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 group-hover:bg-violet-500/30 transition-colors">
                  <CheckCircle size={14} className="text-violet-400" />
                </div>
                <span className="text-slate-300 font-medium text-lg">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between relative z-10">
          <p className="text-sm text-slate-500 font-medium">
            © {new Date().getFullYear()} MyInvoice.space
          </p>
          <div className="flex gap-6">
            <span className="text-xs text-slate-600 uppercase tracking-widest font-bold">Standalone</span>
            <span className="text-xs text-slate-600 uppercase tracking-widest font-bold">Secure</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full xl:w-1/2 flex items-center justify-center p-8 relative">
        <button
          onClick={toggleLang}
          className="absolute top-8 right-8 flex items-center gap-2.5 px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-bold transition text-slate-600 hover:border-violet-200 hover:text-violet-600 shadow-sm"
        >
          <Globe size={16} />
          {lang === 'ID' ? 'English' : 'Bahasa'}
        </button>

        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t('auth_login_title')}</h2>
            <p className="text-slate-500 font-medium">{t('auth_login_subtitle')}</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0"></div>
              {error}
            </div>
          )}

          <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
            <button 
              onClick={() => { setMagicLinkMode(false); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!magicLinkMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Password
            </button>
            <button 
              onClick={() => { setMagicLinkMode(true); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${magicLinkMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Magic Link
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[13px] font-extrabold uppercase tracking-wider text-slate-500 ml-1">
                {t('auth_email')}
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-5 py-4 border-2 rounded-2xl focus:border-violet-600 outline-none transition-all bg-white border-slate-100 text-slate-900 font-medium placeholder-slate-400 shadow-sm"
                placeholder="email@bisnisanda.com" required
              />
            </div>
            
            {!magicLinkMode && (
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-[13px] font-extrabold uppercase tracking-wider text-slate-500">
                    {t('auth_password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs text-violet-600 hover:text-violet-700 font-bold transition"
                  >
                    {t('auth_login_forgot')}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-5 py-4 border-2 rounded-2xl focus:border-violet-600 outline-none transition-all bg-white border-slate-100 text-slate-900 font-medium placeholder-slate-400 shadow-sm"
                    placeholder="••••••••" required={!magicLinkMode}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit" disabled={submitting}
              className="w-full py-4.5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl shadow-slate-200 active:scale-[0.98] mt-4"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                  {t('auth_login_submitting')}
                </span>
              ) : (
                magicLinkMode ? (lang === 'ID' ? 'Kirim Link Login' : 'Send Magic Link') : t('auth_login_submit')
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

          <div className="mt-12 text-center">
            <p className="text-slate-500 font-medium whitespace-nowrap">
              {t('auth_login_no_account')}{" "}
              <Link to="/register" className="text-violet-600 font-extrabold hover:text-violet-700 transition ml-1">
                {t('auth_login_register')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
