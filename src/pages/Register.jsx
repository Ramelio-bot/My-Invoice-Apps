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

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isPasswordValid) return setError(t('auth_pass_min'));
    
    setSubmitting(true);
    setError("");
    setCooldown(30); 

    const shouldActivateTrial = localStorage.getItem('activate_trial') === 'true';
    const { data, error: signUpError } = await signUp(form.email, form.password, form.name, shouldActivateTrial);
    
    if (signUpError) {
      console.error('SignUp Error:', signUpError);
      if (signUpError.message.toLowerCase().includes('rate limit')) {
        setCooldown(60); 
        setError(t('auth_rate_limit'));
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
          t('auth_reg_success_toast'),
          'success',
          6000
        );
      } else if (data.session) {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-slate-200">
      <div className="w-full max-w-md bg-slate-900 rounded-[32px] shadow-2xl p-12 text-center border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        <div className="w-24 h-24 bg-violet-600/10 text-violet-400 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-violet-500/20 shadow-lg shadow-violet-500/5 transition-transform hover:scale-110">
          {needsConfirm ? (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          ) : (
            <CheckCircle size={48} />
          )}
        </div>
        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
          {needsConfirm ? t('auth_confirm_email') : t('auth_access_granted')}
        </h2>
        <p className="text-slate-400 mb-10 leading-relaxed font-bold text-lg">
          {needsConfirm ? t('auth_confirm_desc') : (t('auth_trial_badge') + '. ' + t('auth_redirecting'))}
        </p>
        {!needsConfirm && (
          <div className="flex justify-center gap-1.5 mt-8">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"></div>
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.3s]"></div>
          </div>
        )}
        {needsConfirm && (
          <Link to="/login" className="mt-8 inline-block text-white font-black hover:text-violet-400 transition underline underline-offset-8 decoration-slate-800 hover:decoration-violet-500 tracking-tight">
            {t('landing_nav_login')}
          </Link>
        )}
      </div>
    </div>
  );

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
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-violet-600/10 border border-violet-500/30 text-violet-400 text-[10px] font-black uppercase tracking-[0.1em] mb-10">
            <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse"></div>
            {t('auth_trial_badge')}
          </div>
          
          <h1 className="text-6xl font-black mb-8 leading-[1.05] tracking-tighter">
            {t('auth_branding_title')}
          </h1>
          <p className="text-slate-400 text-xl mb-12 max-w-sm leading-relaxed font-medium">
            {t('auth_branding_desc')}
          </p>

          <div className="space-y-6">
            {[
              t('auth_feat_pro_free'),
              t('auth_feat_no_cc'),
              t('auth_feat_unlimited'),
              t('auth_feat_fast'),
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-5 group">
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-violet-500/50 transition-colors">
                  <Check size={12} className="text-violet-400" strokeWidth={4} />
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
            <span className="text-[11px] text-slate-600 uppercase tracking-[0.2em] font-black">Privacy First</span>
            <span className="text-[11px] text-slate-600 uppercase tracking-[0.2em] font-black">No Hooks</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full xl:w-1/2 flex items-center justify-center p-8 relative bg-slate-950 overflow-y-auto">
        <button
          onClick={toggleLang}
          className="absolute top-10 right-10 flex items-center gap-2.5 px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-400 text-xs font-black uppercase tracking-widest transition hover:border-violet-500/50 hover:text-white backdrop-blur-md"
        >
          <Globe size={14} />
          {t('auth_lang_toggle')}
        </button>

        <div className="w-full max-w-sm py-12">
          <div className="mb-12 text-center xl:text-left">
            <h2 className="text-4xl font-black text-white tracking-tighter mb-3">{t('landing_nav_register')}</h2>
            <p className="text-slate-500 font-bold text-lg">{t('landing_hero_sub')}</p>
          </div>

          {error && (
            <div className="mb-10 p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-[13px] font-bold flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] shrink-0"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                {t('auth_name') || 'Full Name'}
              </label>
              <input
                type="text" name="name" value={form.name} onChange={handleChange}
                className="w-full px-6 py-4.5 bg-slate-900/50 border-2 border-slate-800 rounded-2xl focus:border-violet-500/50 focus:bg-slate-900 outline-none transition-all text-white font-bold placeholder-slate-800 shadow-inner"
                placeholder="Ex: John Doe" required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                {t('auth_email')}
              </label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                className="w-full px-6 py-4.5 bg-slate-900/50 border-2 border-slate-800 rounded-2xl focus:border-violet-500/50 focus:bg-slate-900 outline-none transition-all text-white font-bold placeholder-slate-800 shadow-inner"
                placeholder="email@perusahaan.com" required
              />
            </div>
            
            <div className="space-y-3">
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                {t('password') || 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange}
                  className={`w-full px-6 py-4.5 bg-slate-900/50 border-2 border-slate-800 rounded-2xl focus:border-violet-500/50 focus:bg-slate-900 outline-none transition-all text-white font-bold placeholder-slate-800 shadow-inner ${form.password && !isPasswordValid ? 'border-red-500/30' : ''}`}
                  placeholder="Min 8 characters" required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 transition text-slate-600 hover:text-slate-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-3 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-inner">
                {[
                  { key: 'min', label: t('auth_pass_min') },
                  { key: 'case', label: t('auth_pass_case') },
                  { key: 'number', label: t('auth_pass_number') },
                  { key: 'symbol', label: t('auth_pass_symbol') },
                ].map((req) => (
                  <div 
                    key={req.key}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-tight transition-colors ${
                      form.password 
                        ? (validations[req.key] ? 'text-violet-400' : 'text-slate-600') 
                        : 'text-slate-600'
                    }`}
                  >
                    {validations[req.key] ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.5)]"></div>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                    )}
                    {req.label}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit" 
              disabled={submitting || cooldown > 0 || (form.password && !isPasswordValid)}
              className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)] active:scale-[0.98] mt-6"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
                  {t('auth_processing')}
                </span>
              ) : cooldown > 0 ? (
                `${t('auth_wait')} (${cooldown}s)`
              ) : (
                t('auth_submit') || t('auth_register_now')
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-slate-500 font-bold">
              {t('auth_have_account')}{" "}
              <Link to="/login" className="text-white font-black hover:text-violet-400 transition ml-2 tracking-tight underline underline-offset-8 decoration-slate-800 hover:decoration-violet-500">
                {t('landing_nav_login')}
              </Link>
            </p>
          </div>
          
          <p className="mt-10 text-[10px] text-center text-slate-600 leading-relaxed font-black uppercase tracking-widest">
            {t('auth_agree')}{' '}
            <Link to="/terms" className="text-slate-400 hover:text-white transition">{t('landing_footer_terms')}</Link>
            {' '}&{' '}
            <Link to="/privacy" className="text-slate-400 hover:text-white transition">{t('landing_footer_policy')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
