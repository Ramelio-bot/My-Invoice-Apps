import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, Globe, Check, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLang } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { toggleLang, t } = useLang();

  // Registration Form State
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // OTP State
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpToken, setOtpToken] = useState({ hash: null, expiry: null });
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);

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
  
  // Resend Cooldown Timer
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

  // Handle Initial Registration (Send OTP)
  // Force route form submission strictly to custom send-otp edge function
  async function handleSendOtp(e) {
    if (e) e.preventDefault();
    setError("");
    if (!isPasswordValid) return setError(t('auth_pass_min'));
    
    setSubmitting(true);
    setCooldown(60); 

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Gagal mengirim OTP");
      
      setOtpToken({ hash: data.hash, expiry: data.expiry });
      setIsOtpMode(true);
      showToast("Kode OTP telah dikirim ke email Anda", "success");
      
    } catch (err) {
      console.error(err);
      setError(err.message || t('auth_error_generic'));
      setCooldown(0);
    } finally {
      setSubmitting(false);
    }
  }

  // Handle OTP Digit Input
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otpDigits];
    // Allow pasting full 6 digits
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 6) newOtp[index + i] = pasted[i];
      }
      setOtpDigits(newOtp);
      const nextIndex = Math.min(index + pasted.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtpDigits(newOtp);

    // Auto focus next
    if (value !== '' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP Verification
  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    const otpValue = otpDigits.join('');
    
    if (otpValue.length !== 6) {
      return setError("Masukkan 6 digit kode OTP");
    }

    setSubmitting(true);
    
    try {
      const shouldActivateTrial = localStorage.getItem('activate_trial') === 'true';

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: form.email, 
          otp: otpValue, 
          hash: otpToken.hash, 
          expiry: otpToken.expiry,
          password: form.password,
          name: form.name,
          activateTrial: shouldActivateTrial
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Gagal memverifikasi OTP");
      
      // Successfully registered and verified
      localStorage.removeItem('activate_trial');
      
      // Sign in automatically
      const { error: signInErr } = await signIn(form.email, form.password);
      if (signInErr) throw new Error("Registrasi berhasil, tapi gagal masuk otomatis.");
      
      setSuccess(true);
      showToast(t('auth_reg_success_toast'), 'success');
      setTimeout(() => navigate('/dashboard'), 2000);
      
    } catch (err) {
      console.error(err);
      setError(err.message || "OTP Tidak Valid");
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 text-slate-900">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl p-12 text-center border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="w-24 h-24 bg-violet-600/10 text-violet-400 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-violet-500/20 shadow-lg shadow-violet-500/5 transition-transform hover:scale-110">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-950 mb-4 tracking-tight">
          {t('auth_access_granted')}
        </h2>
        <p className="text-slate-500 mb-10 leading-relaxed font-bold text-lg">
          {t('auth_trial_badge') + '. ' + t('auth_redirecting')}
        </p>
        <div className="flex justify-center gap-1.5 mt-8">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"></div>
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.3s]"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 selection:bg-violet-100 font-sans">
      
      {/* Left panel — branding (hidden on mobile & tablet portrait) */}
      <div className="hidden xl:flex xl:w-1/2 bg-gradient-to-br from-white via-violet-50 to-white text-slate-950 p-20 flex-col justify-between relative overflow-hidden border-r border-slate-200">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] -ml-64 -mb-64"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>

        <Link to="/" className="text-2xl font-black text-slate-950 decoration-transparent hover:opacity-80 transition flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 bg-slate-950 text-white rounded-xl flex items-center justify-center shadow-xl">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <span className="tracking-tight">My Invoice</span>
        </Link>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-violet-600/10 border border-violet-500/30 text-violet-400 text-[10px] font-black uppercase tracking-[0.1em] mb-10">
            <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse"></div>
            {t('auth_trial_badge')}
          </div>
          
          <h1 className="text-6xl font-black mb-8 leading-[1.05] tracking-tighter text-slate-950">
            {t('auth_branding_title')}
          </h1>
          <p className="text-slate-500 text-xl mb-12 max-w-sm leading-relaxed font-medium">
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
                <div className="w-6 h-6 rounded-full bg-violet-600/5 border border-violet-500/10 flex items-center justify-center shrink-0 group-hover:border-violet-500/50 transition-colors">
                  <Check size={12} className="text-violet-600" strokeWidth={4} />
                </div>
                <span className="text-slate-700 font-bold text-lg tracking-tight">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between relative z-10">
          <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">
            {t('landing_footer_made_with')}
          </p>
          <div className="flex gap-8">
            <span className="text-[11px] text-slate-400 uppercase tracking-[0.2em] font-black">{t('auth_branding_privacy')}</span>
            <span className="text-[11px] text-slate-400 uppercase tracking-[0.2em] font-black">{t('auth_branding_no_hooks')}</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full xl:w-1/2 flex items-center justify-center p-8 relative bg-slate-50 overflow-y-auto">
        <button
          onClick={toggleLang}
          className="absolute top-10 right-10 flex items-center gap-2.5 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 text-xs font-black uppercase tracking-widest transition hover:border-violet-500/50 hover:text-slate-900 shadow-sm"
        >
          <Globe size={14} />
          {t('auth_lang_toggle')}
        </button>

        <div className="w-full max-w-sm py-12">
          <div className="mb-12 text-center xl:text-left">
            <h2 className="text-4xl font-black text-slate-950 tracking-tighter mb-3">
              {isOtpMode ? "Verifikasi Email" : t('landing_nav_register')}
            </h2>
            <p className="text-slate-500 font-bold text-lg">
              {isOtpMode ? `Kode 6 digit dikirim ke ${form.email}` : t('landing_hero_sub')}
            </p>
          </div>

          {error && (
            <div className="mb-10 p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-[13px] font-bold flex items-center gap-4 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] shrink-0"></div>
              {error}
            </div>
          )}

          {!isOtpMode ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  {t('auth_name')}
                </label>
                <input
                  type="text" name="name" value={form.name} onChange={handleChange}
                  className="w-full px-6 py-4.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-violet-500/50 outline-none transition-all text-slate-900 font-bold placeholder-slate-300 shadow-sm"
                  placeholder={t('auth_name_placeholder')} required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  {t('auth_email')}
                </label>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange}
                  className="w-full px-6 py-4.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-violet-500/50 outline-none transition-all text-slate-900 font-bold placeholder-slate-300 shadow-sm"
                  placeholder="hello.myinvoice@gmail.com" required
                />
              </div>
              
              <div className="space-y-3">
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  {t('auth_password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange}
                    className={`w-full px-6 py-4.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-violet-500/50 outline-none transition-all text-slate-900 font-bold placeholder-slate-300 shadow-sm ${form.password && !isPasswordValid ? 'border-red-500/30' : ''}`}
                    placeholder={t('auth_pass_placeholder')} required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 transition text-slate-600 hover:text-slate-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-3 bg-slate-100 p-5 rounded-2xl border border-slate-200 shadow-inner">
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
                          ? (validations[req.key] ? 'text-violet-600' : 'text-slate-400') 
                          : 'text-slate-400'
                      }`}
                    >
                      {validations[req.key] ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-600 shadow-[0_0_8px_rgba(124,58,237,0.3)]"></div>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                      )}
                      {req.label}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit" 
                disabled={submitting || (form.password && !isPasswordValid)}
                className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl active:scale-[0.98] mt-6"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    {t('auth_processing')}
                  </span>
                ) : (
                  "Lanjutkan dengan OTP"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex gap-3 justify-center mb-8">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => otpInputRefs.current[index] = el}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-black bg-white border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all shadow-sm text-slate-900"
                  />
                ))}
              </div>

              <button
                type="submit" 
                disabled={submitting || otpDigits.join('').length !== 6}
                className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-violet-600/20 active:scale-[0.98]"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Memverifikasi...
                  </span>
                ) : (
                  "Verifikasi & Daftar"
                )}
              </button>

              <div className="text-center mt-6">
                <button 
                  type="button" 
                  onClick={handleSendOtp}
                  disabled={cooldown > 0 || submitting}
                  className="text-sm font-bold text-slate-500 hover:text-slate-900 disabled:text-slate-300 disabled:cursor-not-allowed transition"
                >
                  {cooldown > 0 ? `Kirim Ulang OTP (${cooldown}s)` : "Tidak menerima kode? Kirim ulang"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-12 text-center">
            <p className="text-slate-500 font-bold">
              {t('auth_have_account')}{" "}
              <Link to="/login" className="text-slate-950 font-black hover:text-violet-600 transition ml-2 tracking-tight underline underline-offset-8 decoration-slate-200 hover:decoration-violet-500">
                {t('landing_nav_login')}
              </Link>
            </p>
          </div>
          
          <p className="mt-10 text-[10px] text-center text-slate-400 leading-relaxed font-black uppercase tracking-widest">
            {t('auth_agree')}{' '}
            <Link to="/terms" className="text-slate-500 hover:text-slate-900 transition">{t('landing_footer_terms')}</Link>
            {' '}&{' '}
            <Link to="/privacy" className="text-slate-500 hover:text-slate-900 transition">{t('landing_footer_policy')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
