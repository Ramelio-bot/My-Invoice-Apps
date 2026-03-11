import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { useLang } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const loginCopy = {
  ID: {
    title: 'Selamat Datang',
    subtitle: 'Masuk ke akun My Invoice Anda',
    email: 'Alamat Email',
    password: 'Kata Sandi',
    forgot: 'Lupa kata sandi?',
    submit: 'Masuk',
    submitting: 'Memproses...',
    or: 'atau',
    google: 'Masuk dengan Google',
    no_account: 'Belum punya akun?',
    register: 'Daftar gratis',
    error_invalid: 'Email atau password salah.',
  },
  EN: {
    title: 'Welcome Back',
    subtitle: 'Sign in to your My Invoice account',
    email: 'Email Address',
    password: 'Password',
    forgot: 'Forgot password?',
    submit: 'Sign In',
    submitting: 'Processing...',
    or: 'or',
    google: 'Continue with Google',
    no_account: "Don't have an account?",
    register: 'Sign up free',
    error_invalid: 'Invalid email or password.',
  }
};

export default function Login() {
  const { signIn, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const { lang, toggleLang } = useLang();
  const { dark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const lc = loginCopy[lang];

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' }
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const { data, error } = await signIn(email, password);

    if (error) {
      if (error.message.includes("Invalid login credentials") || error.message.includes("credentials")) {
        setError(lc.error_invalid);
      } else {
        setError(error.message);
      }
      setSubmitting(false);
      return;
    }
    // Berhasil → useEffect akan menyadari user sudah ter-set dan akan redirect ke dashboard
    // Kita biarkan submitting = true agar tombol tetap menunjukkan 'Memproses...'
  }

  return (
    <div className={`min-h-screen flex ${dark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      
      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-900 text-white p-12 flex-col justify-between">
        <Link to="/" className="text-2xl font-black text-white decoration-transparent hover:text-violet-200 transition">
          My Invoice
        </Link>
        
        <div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            {lang === 'ID' ? 'Kendalikan Bisnis Anda dalam Satu Sentuhan' : 'Control Your Business in One Touch'}
          </h1>
          <p className="text-violet-200 text-lg mb-8 max-w-md">
            {lang === 'ID' 
              ? 'Platform POS & Invoicing untuk UMKM Indonesia' 
              : 'POS & Invoicing Platform for Indonesian SMEs'}
          </p>

          <div className="space-y-4">
            {[
              lang === 'ID' ? 'Kasir POS & Invoice Profesional' : 'Professional POS & Invoice',
              lang === 'ID' ? 'Laporan Keuangan Real-time' : 'Real-time Financial Reports',
              lang === 'ID' ? 'Program Loyalitas Pelanggan' : 'Customer Loyalty Program',
              lang === 'ID' ? 'Gratis untuk memulai' : 'Free to start',
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <button
          onClick={toggleLang}
          className={`absolute top-6 right-6 flex items-center gap-2 text-sm font-semibold transition ${dark ? 'text-slate-400 hover:text-violet-400' : 'text-slate-500 hover:text-violet-600'}`}
        >
          <Globe size={16} />
          {lang === 'ID' ? 'EN' : 'ID'}
        </button>

        <div className={`w-full max-w-md rounded-2xl shadow-xl p-8 ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} border`}>
          <div className="text-center mb-8">
            <h2 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{lc.title}</h2>
            <p className={`mt-2 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{lc.subtitle}</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                {lc.email}
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition ${
                  dark 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
                placeholder="email@company.com" required
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className={`block text-sm font-semibold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {lc.password}
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition"
                >
                  {lc.forgot}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition ${
                    dark 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                  placeholder="••••••••" required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition ${dark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={submitting}
              className="w-full py-3.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {lc.submitting}
                </span>
              ) : lc.submit}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className={`flex-1 h-px ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
            <span className={`text-sm font-medium ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{lc.or}</span>
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
            {lc.google}
          </button>

          <p className={`text-center text-sm mt-8 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            {lc.no_account}{" "}
            <Link to="/register" className="text-violet-600 dark:text-violet-400 font-bold hover:text-violet-700 dark:hover:text-violet-300 transition">
              {lc.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
