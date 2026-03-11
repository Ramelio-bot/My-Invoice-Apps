import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LanguageContext'

const copy = {
  ID: {
    title: 'Lupa Kata Sandi',
    subtitle: 'Masukkan email Anda dan kami akan mengirimkan tautan untuk mereset kata sandi.',
    email_label: 'Alamat Email',
    email_placeholder: 'email@anda.com',
    submit: 'Kirim Tautan Reset',
    submitting: 'Mengirim...',
    back: 'Kembali ke Login',
    success_title: 'Email Terkirim!',
    success_desc: 'Kami telah mengirimkan tautan reset kata sandi ke email Anda. Silakan cek inbox atau folder spam.',
    success_note: 'Tautan akan kadaluarsa dalam 1 jam.',
    error_not_found: 'Email tidak ditemukan. Pastikan email yang Anda masukkan sudah benar.',
    error_generic: 'Terjadi kesalahan. Silakan coba lagi.',
  },
  EN: {
    title: 'Forgot Password',
    subtitle: 'Enter your email and we will send you a link to reset your password.',
    email_label: 'Email Address',
    email_placeholder: 'your@email.com',
    submit: 'Send Reset Link',
    submitting: 'Sending...',
    back: 'Back to Login',
    success_title: 'Email Sent!',
    success_desc: 'We have sent a password reset link to your email. Please check your inbox or spam folder.',
    success_note: 'The link will expire in 1 hour.',
    error_not_found: 'Email not found. Please make sure the email you entered is correct.',
    error_generic: 'An error occurred. Please try again.',
  }
}

export default function ForgotPassword() {
  const { dark } = useTheme()
  const { lang, toggleLang } = useLang()
  const navigate = useNavigate()
  const c = copy[lang]

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      setError(c.error_generic)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${dark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className={`w-full max-w-md rounded-2xl shadow-xl p-8 relative ${dark ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
        
        {/* Language toggle */}
        <button onClick={toggleLang} className="absolute top-6 right-6 text-sm font-semibold text-slate-500 hover:text-violet-600">
          {lang === 'ID' ? 'EN' : 'ID'}
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-black text-violet-600">My Invoice</span>
        </div>

        {!sent ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-violet-600" />
              </div>
              <h1 className={`text-2xl font-black mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>{c.title}</h1>
              <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{c.subtitle}</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {c.email_label}
                </label>
                <input
                  type="email" required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={c.email_placeholder}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition ${
                    dark 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all hover:-translate-y-0.5"
              >
                {loading ? c.submitting : c.submit}
              </button>
            </form>

            {/* Back to login */}
            <button
              onClick={() => navigate('/login')}
              className={`mt-6 w-full flex items-center justify-center gap-2 text-sm font-semibold ${dark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} transition-colors`}
            >
              <ArrowLeft size={14} />
              {c.back}
            </button>
          </>
        ) : (
          // Success state
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h2 className={`text-2xl font-black mb-3 ${dark ? 'text-white' : 'text-slate-900'}`}>{c.success_title}</h2>
            <p className={`text-sm mb-2 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{c.success_desc}</p>
            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{c.success_note}</p>
            
            <button
              onClick={() => navigate('/login')}
              className="mt-8 w-full flex items-center justify-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
            >
              <ArrowLeft size={14} />
              {c.back}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
