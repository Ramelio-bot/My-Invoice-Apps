import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LanguageContext'

const copy = {
  ID: {
    title: 'Reset Kata Sandi',
    subtitle: 'Masukkan kata sandi baru untuk akun Anda.',
    new_password: 'Kata Sandi Baru',
    confirm_password: 'Konfirmasi Kata Sandi',
    placeholder_new: 'Minimal 8 karakter',
    placeholder_confirm: 'Ulangi kata sandi baru',
    submit: 'Simpan Kata Sandi Baru',
    submitting: 'Menyimpan...',
    success_title: 'Kata Sandi Berhasil Diubah!',
    success_desc: 'Kata sandi Anda telah berhasil diperbarui. Silakan login dengan kata sandi baru.',
    go_login: 'Pergi ke Halaman Login',
    error_mismatch: 'Kata sandi tidak cocok.',
    error_short: 'Kata sandi minimal 8 karakter.',
    error_generic: 'Terjadi kesalahan. Silakan coba lagi atau minta tautan reset baru.',
    error_expired: 'Tautan reset sudah kadaluarsa. Silakan minta tautan baru.',
  },
  EN: {
    title: 'Reset Password',
    subtitle: 'Enter a new password for your account.',
    new_password: 'New Password',
    confirm_password: 'Confirm Password',
    placeholder_new: 'Minimum 8 characters',
    placeholder_confirm: 'Repeat new password',
    submit: 'Save New Password',
    submitting: 'Saving...',
    success_title: 'Password Changed Successfully!',
    success_desc: 'Your password has been successfully updated. Please login with your new password.',
    go_login: 'Go to Login Page',
    error_mismatch: 'Passwords do not match.',
    error_short: 'Password must be at least 8 characters.',
    error_generic: 'An error occurred. Please try again or request a new reset link.',
    error_expired: 'Reset link has expired. Please request a new link.',
  }
}

export default function ResetPassword() {
  const { dark } = useTheme()
  const { lang, toggleLang } = useLang()
  const navigate = useNavigate()
  const c = copy[lang]

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // Handle manual session setting from recovery link hash
  useEffect(() => {
    // Supabase recovery token ada di URL hash
    const hashStr = window.location.hash
    if (hashStr) {
      // Hilangkan '#' di awal untuk URLSearchParams
      const hashParams = new URLSearchParams(hashStr.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')
      
      if (type === 'recovery' && accessToken) {
        console.log('Password recovery mode active, setting session...')
        // Set session manual dari token
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || ''
        })
      }
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError(c.error_short)
      return
    }
    if (password !== confirm) {
      setError(c.error_mismatch)
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        setError(c.error_expired)
      } else {
        setError(c.error_generic)
      }
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)

    // Auto redirect after 3 seconds
    setTimeout(() => navigate('/login'), 3000)
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

        {!done ? (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={28} className="text-violet-600" />
              </div>
              <h1 className={`text-2xl font-black mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>{c.title}</h1>
              <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{c.subtitle}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {c.new_password}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={c.placeholder_new}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition ${
                      dark 
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {c.confirm_password}
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder={c.placeholder_confirm}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition ${
                      dark 
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all hover:-translate-y-0.5"
              >
                {loading ? c.submitting : c.submit}
              </button>
            </form>
          </>
        ) : (
          // Success state
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h2 className={`text-2xl font-black mb-3 ${dark ? 'text-white' : 'text-slate-900'}`}>{c.success_title}</h2>
            <p className={`text-sm mb-6 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{c.success_desc}</p>
            <p className={`text-xs mb-6 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              {lang === 'ID' ? 'Mengalihkan ke halaman login...' : 'Redirecting to login page...'}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all"
            >
              {c.go_login}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
