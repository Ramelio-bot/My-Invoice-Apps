import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, Globe, Check, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { useLang } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { signUp, user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { lang, toggleLang, t } = useLang();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [validations, setValidations] = useState({
    min: false,
    case: false,
    number: false,
    symbol: false
  });

  useEffect(() => {
    const p = form.password;
    setValidations({
      min: p.length >= 8,
      case: /[a-z]/.test(p) && /[A-Z]/.test(p),
      number: /[0-9]/.test(p),
      symbol: /[^A-Za-z0-9]/.test(p)
    });
  }, [form.password]);
  
  // Registration Cooldown Timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const isPasswordValid = Object.values(validations).every(v => v);

  /* 
  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://www.myinvoice.space/dashboard' }
    });
  }
  */

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isPasswordValid) return setError(t('auth_pass_min'));
    
    setSubmitting(true);
    setError("");
    setCooldown(30); // Prevent spamming / supabse rate limit protection

    const shouldActivateTrial = localStorage.getItem('activate_trial') === 'true';
    const { data, error: signUpError } = await signUp(form.email, form.password, form.name, shouldActivateTrial);
    
    if (signUpError) {
      console.error('SignUp Error:', signUpError);
      if (signUpError.message.toLowerCase().includes('rate limit')) {
        setCooldown(60); // Extended cooldown on rate limit hit
        setError("Batas pendaftaran tercapai. Silakan tunggu 60 detik.");
      } else if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        setError(t('auth_error_exists') || 'Email already registered.');
      } else if (signUpError.message.includes('weak') || signUpError.message.includes('password')) {
        setError(t('auth_error_weak') || 'Password too weak.');
      } else {
        setError(t('auth_error_generic') || 'Something went wrong. Please try again.');
      }
      setSubmitting(false);
    } else {
      localStorage.removeItem('activate_trial');
      
      if (data.user && !data.session) {
        setNeedsConfirm(true);
        setSuccess(true);
        showToast(
          lang === 'ID' 
            ? "Pendaftaran berhasil! Silakan cek Inbox/Spam email Anda untuk verifikasi." 
            : "Registration successful! Please check your Inbox/Spam to verify your email.",
          'success',
          6000
        );
      } else if (data.session) {
        // Even if session exists, check confirmation
        if (data.user?.email_confirmed_at || data.user?.app_metadata?.provider === 'google') {
          setSuccess(true);
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          setNeedsConfirm(true);
          setSuccess(true);
        }
      }
    }
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 text-center border border-slate-100">
        <div className="w-20 h-20 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-6">
          {needsConfirm ? (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          ) : (
            <CheckCircle size={40} />
          )}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          {needsConfirm ? t('auth_confirm_email') : (lang === 'ID' ? 'Berhasil Terdaftar!' : 'Successfully Registered!')}
        </h2>
        <p className="text-slate-500 mb-8 leading-relaxed font-medium">
          {needsConfirm ? t('auth_confirm_desc') : (t('auth_trial_badge') + '. ' + t('auth_redirecting'))}
        </p>
        {!needsConfirm && <div className="mt-8 animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mx-auto"></div>}
        {needsConfirm && (
          <Link to="/login" className="mt-8 inline-block text-violet-600 font-bold hover:underline">
            {t('landing_nav_login')}
          </Link>
        )}
      </div>
    </div>
  );

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[11px] font-black uppercase tracking-wider mb-8">
            <CheckCircle size={14} />
            {t('auth_trial_badge')}
          </div>
          
          <h1 className="text-5xl font-extrabold mb-6 leading-[1.1] tracking-tight">
            {lang === 'ID' ? 'Mari Mulai Karir\nBisnis Anda.' : 'Let\'s Start Your\nBusiness Career.'}
          </h1>
          <p className="text-slate-400 text-xl mb-12 max-w-md leading-relaxed">
            {lang === 'ID' 
              ? 'Dapatkan akses penuh ke seluruh ekosistem profesional selama 14 hari penuh.' 
              : 'Get full access to the entire professional ecosystem for 14 full days.'}
          </p>

          <div className="grid grid-cols-1 gap-5">
            {[
              lang === 'ID' ? 'Buka Semua Fitur PRO Gratis' : 'Unlock All PRO Features Free',
              lang === 'ID' ? 'Tidak perlu Kartu Kredit' : 'No Credit Card Required',
              lang === 'ID' ? 'Automasi Bisnis Tanpa Batas' : 'Unlimited Business Automation',
              lang === 'ID' ? 'Setup Cepat Kurang dari 5 Menit' : 'Quick Setup in Under 5 Minutes',
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
            <span className="text-xs text-slate-600 uppercase tracking-widest font-bold">Privacy First</span>
            <span className="text-xs text-slate-600 uppercase tracking-widest font-bold">No Hooks</span>
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
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t('landing_nav_register')}</h2>
            <p className="text-slate-500 font-medium">{t('landing_hero_sub')}</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[13px] font-extrabold uppercase tracking-wider text-slate-500 ml-1">
                {t('auth_name')}
              </label>
              <input
                type="text" name="name" value={form.name} onChange={handleChange}
                className="w-full px-5 py-4 border-2 rounded-2xl focus:border-violet-600 outline-none transition-all bg-white border-slate-100 text-slate-900 font-medium placeholder-slate-400 shadow-sm"
                placeholder="John Doe" required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-extrabold uppercase tracking-wider text-slate-500 ml-1">
                {t('auth_email')}
              </label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                className="w-full px-5 py-4 border-2 rounded-2xl focus:border-violet-600 outline-none transition-all bg-white border-slate-100 text-slate-900 font-medium placeholder-slate-400 shadow-sm"
                placeholder="email@bisnisanda.com" required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-[13px] font-extrabold uppercase tracking-wider text-slate-500 ml-1">
                {t('password') || 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange}
                  className={`w-full px-5 py-4 border-2 rounded-2xl focus:border-violet-600 outline-none transition-all bg-white border-slate-100 text-slate-900 font-medium placeholder-slate-400 shadow-sm ${form.password && !isPasswordValid ? 'border-red-500/50' : ''}`}
                  placeholder={lang === 'ID' ? 'Minimal 8 karakter' : 'Minimum 8 characters'} required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {[
                  { key: 'min', label: t('auth_pass_min') },
                  { key: 'case', label: t('auth_pass_case') },
                  { key: 'number', label: t('auth_pass_number') },
                  { key: 'symbol', label: t('auth_pass_symbol') },
                ].map((req) => (
                  <div 
                    key={req.key}
                    className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-tight transition-colors ${
                      form.password 
                        ? (validations[req.key] ? 'text-green-600' : 'text-slate-400') 
                        : 'text-slate-400'
                    }`}
                  >
                    {validations[req.key] ? (
                      <Check size={12} strokeWidth={4} />
                    ) : (
                      <X size={12} strokeWidth={4} className="opacity-30" />
                    )}
                    {req.label}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit" 
              disabled={submitting || cooldown > 0 || (form.password && !isPasswordValid)}
              className="w-full py-4.5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200 active:scale-[0.98] mt-4"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                  {lang === 'ID' ? 'Mendaftarkan Akun...' : 'Registering Account...'}
                </span>
              ) : cooldown > 0 ? (
                `${lang === 'ID' ? 'Tunggu' : 'Wait'} (${cooldown}s)`
              ) : (
                t('auth_submit') || (lang === 'ID' ? 'Daftar Sekarang' : 'Register Now')
              )}
            </button>
          </form>

          {/* Reserved for future reactivation (Commented out as per instructions) */}
          {/* 
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-100"></div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">{t('auth_or')}</span>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>

          <button
            type="button"
            className="w-full py-4 border-2 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all bg-white border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-slate-200 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>
          */}

          <div className="mt-10 text-center">
            <p className="text-slate-500 font-medium whitespace-nowrap">
              {t('auth_have_account')}{" "}
              <Link to="/login" className="text-violet-600 font-extrabold hover:text-violet-700 transition ml-1">
                {t('landing_nav_login')}
              </Link>
            </p>
          </div>
          
          <p className="mt-8 text-[11px] text-center text-slate-400 leading-relaxed font-bold uppercase tracking-tight">
            {t('auth_agree')}{' '}
            <Link to="/terms" className="text-slate-600 hover:text-violet-600 transition">{t('landing_footer_terms')}</Link>
            {' '}&{' '}
            <Link to="/privacy" className="text-slate-600 hover:text-violet-600 transition">{t('landing_footer_policy')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
