import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, Globe, Check, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { useLang } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

// Teks spesifik login/register sekarang diambil dari LanguageContext (t())

export default function Register() {
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { lang, toggleLang, t } = useLang();
  const { dark } = useTheme();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
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

  const isPasswordValid = Object.values(validations).every(v => v);



  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' }
    });
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isPasswordValid) return setError(t('auth_pass_min'));
    
    setSubmitting(true);
    const shouldActivateTrial = localStorage.getItem('activate_trial') === 'true';
    const { data, error: signUpError } = await signUp(form.email, form.password, form.name, shouldActivateTrial);
    
    if (signUpError) {
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        setError(t('error_exists') || 'Email already registered.');
      } else if (signUpError.message.includes('weak') || signUpError.message.includes('password')) {
        setError(t('error_weak') || 'Password too weak.');
      } else {
        setError(t('error_generic') || 'Something went wrong.');
      }
      setSubmitting(false);
    } else {
      localStorage.removeItem('activate_trial');
      localStorage.removeItem('guest_mode');
      
      // If no session, it means email confirmation is required
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
        setSuccess(true);
        // data.session exists, will be handled by AuthRedirector or manual redirect
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    }
  }

  if (success) return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${dark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">{needsConfirm ? '📧' : '🎉'}</div>
        <h2 className={`text-2xl font-black ${dark ? 'text-white' : 'text-slate-900'}`}>
          {needsConfirm ? t('confirm_email') : t('navbar_register')}
        </h2>
        <p className={`mt-3 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          {needsConfirm ? t('confirm_desc') : (t('trial_badge') + '. ' + (lang === 'ID' ? 'Sedang masuk ke dashboard...' : 'Redirecting to dashboard...'))}
        </p>
        {!needsConfirm && <div className="mt-8 animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mx-auto"></div>}
        {needsConfirm && (
          <Link to="/login" className="mt-8 inline-block text-violet-600 font-bold hover:underline">
            {t('navbar_login')}
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex ${dark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      
      {/* Left panel — branding (hidden on mobile & tablet portrait) */}
      <div className="hidden xl:flex xl:w-1/2 bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-900 text-white p-12 flex-col justify-between">
        <Link to="/" className="text-2xl font-black text-white decoration-transparent hover:text-violet-200 transition">
          My Invoice
        </Link>
        
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/30 border border-violet-400/30 text-violet-100 text-xs font-bold mb-6">
            <CheckCircle size={14} />
            {t('trial_badge') || '14 Days Free PRO Trial'}
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            {lang === 'ID' ? 'Mulai Transformasi Bisnis Anda Sekarang' : 'Start Your Business Transformation Today'}
          </h1>
          <p className="text-violet-200 text-lg mb-8 max-w-md">
            {t('landing_hero_sub') || 'Start managing your business more professionally today.'}
          </p>

          <div className="space-y-4">
            {[
              lang === 'ID' ? '14 Hari PRO Trial Gratis' : '14-Day Free PRO Trial',
              lang === 'ID' ? 'Tidak perlu kartu kredit' : 'No credit card required',
              lang === 'ID' ? 'Kasir POS & Invoice Profesional' : 'Professional POS & Invoice',
              lang === 'ID' ? 'Setup dalam 2 menit' : 'Setup in 2 minutes',
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle size={20} className="text-violet-300" />
                <span className="text-violet-100 font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-violet-300">
          © {new Date().getFullYear()} MyInvoice.space
        </p>
      </div>

      {/* Right panel — form */}
      <div className="w-full xl:w-1/2 flex items-center justify-center p-6 relative">
        <button
          onClick={toggleLang}
          className={`absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-2 text-sm font-semibold transition ${dark ? 'text-slate-400 hover:text-violet-400' : 'text-slate-500 hover:text-violet-600'}`}
        >
          <Globe size={16} />
          {lang === 'ID' ? 'EN' : 'ID'}
        </button>

        <div className={`w-full max-w-md rounded-2xl shadow-xl p-8 ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} border`}>
          <div className="text-center mb-8">
            <h2 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{t('navbar_register')}</h2>
            <p className={`mt-2 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('landing_hero_sub')}</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                {rc.name}
              </label>
              <input
                type="text" name="name" value={form.name} onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition ${
                  dark 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
                placeholder="John Doe" required
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                {rc.email}
              </label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition ${
                  dark 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
                placeholder="email@company.com" required
              />
            </div>
            
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                {t('password') || 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition ${
                    dark 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  } ${form.password && !isPasswordValid ? 'border-red-500/50 focus:ring-red-500' : ''}`}
                  placeholder={lang === 'ID' ? 'Minimal 8 karakter' : 'Minimum 8 characters'} required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition ${dark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Password Validator UI */}
              <div className="mt-3 space-y-2">
                {[
                  { key: 'min', label: t('auth_pass_min') },
                  { key: 'case', label: t('auth_pass_case') },
                  { key: 'number', label: t('auth_pass_number') },
                  { key: 'symbol', label: t('auth_pass_symbol') },
                ].map((req) => (
                  <div 
                    key={req.key}
                    className={`flex items-center gap-2 text-xs transition-colors ${
                      form.password 
                        ? (validations[req.key] ? 'text-green-500' : 'text-slate-400') 
                        : 'text-slate-400'
                    }`}
                  >
                    {validations[req.key] ? (
                      <Check size={14} className="flex-shrink-0" />
                    ) : (
                      <div className={`w-3.5 h-3.5 rounded-full border ${dark ? 'border-slate-600' : 'border-slate-300'} flex-shrink-0`}></div>
                    )}
                    <span className={validations[req.key] ? 'line-through opacity-70' : ''}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit" 
              disabled={submitting || (form.password && !isPasswordValid)}
              className="w-full py-3.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 mt-2"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {rc.submitting}
                </span>
              ) : rc.submit}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className={`flex-1 h-px ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
            <span className={`text-sm font-medium ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{t('landing_nav_or') || 'or'}</span>
            <div className={`flex-1 h-px ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className={`w-full py-3.5 border rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
              dark 
                ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t('landing_nav_google') || 'Sign up with Google'}
          </button>

          <p className="text-xs text-center text-slate-400 mt-6 leading-relaxed">
            {lang === 'ID' ? 'Dengan mendaftar, Anda menyetujui' : 'By signing up, you agree to our'}{' '}
            <Link to="/terms" className="text-violet-600 hover:underline font-medium">{t('landing_footer_terms')}</Link>
            {' '}{lang === 'ID' ? 'dan' : 'and'}{' '}
            <Link to="/privacy" className="text-violet-600 hover:underline font-medium">{t('landing_footer_policy')}</Link>
          </p>

          <p className={`text-center text-sm mt-8 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            {lang === 'ID' ? 'Sudah punya akun?' : 'Already have an account?'}{" "}
            <Link to="/login" className="text-violet-600 dark:text-violet-400 font-bold hover:text-violet-700 dark:hover:text-violet-300 transition">
              {t('navbar_login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
