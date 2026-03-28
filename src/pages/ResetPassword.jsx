import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLang } from '../context/LanguageContext'

// Local copy object removed - using global t() system

export default function ResetPassword() {
  const { lang, toggleLang, t } = useLang()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const [tokenValid, setTokenValid] = useState(null) // null=checking, true=ok, false=invalid

  useEffect(() => {
    const run = async () => {
      const hashStr = window.location.hash
      if (!hashStr || !hashStr.includes('type=recovery')) {
        setTokenValid(false)
        setError(t('rp_error_expired'))
        return
      }

      const hashParams = new URLSearchParams(hashStr.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')

      if (type === 'recovery' && accessToken) {
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || ''
          })
          if (sessionError) {
            setTokenValid(false)
            setError(t('rp_error_expired'))
          } else {
            setTokenValid(true)
          }
        } catch {
          setTokenValid(false)
          setError(t('rp_error_expired'))
        }
      } else {
        setTokenValid(false)
        setError(t('rp_error_expired'))
      }
    }
    run()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError(t('rp_error_short'))
      return
    }
    if (password !== confirm) {
      setError(t('rp_error_mismatch'))
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        setError(t('rp_error_expired'))
      } else {
        setError(t('auth_error_generic'))
      }
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)

    setTimeout(() => navigate('/login'), 3000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-md rounded-2xl shadow-xl p-8 relative bg-white border border-slate-100">

          {t('auth_lang_toggle')}

        <div className="text-center mb-8">
          <span className="text-2xl font-black text-violet-600">My Invoice</span>
        </div>

        {tokenValid === null && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mx-auto mb-4" />
            <p className="text-sm text-slate-500">
              {t('rp_verifying')}
            </p>
          </div>
        )}

        {tokenValid === false && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-red-500" />
            </div>
            <h2 className="text-xl font-black mb-3 text-slate-900">
              {t('rp_invalid_link')}
            </h2>
            <p className="text-sm mb-6 text-slate-600">
              {t('rp_error_expired')}
            </p>
            <Link
              to="/forgot-password"
              className="inline-block w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all text-center"
            >
              {t('rp_request_new')}
            </Link>
          </div>
        )}

        {tokenValid === true && !done ? (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={28} className="text-violet-600" />
              </div>
              <h1 className="text-2xl font-black mb-2 text-slate-900">{t('rp_title')}</h1>
              <p className="text-sm text-slate-500">{t('rp_subtitle')}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">
                  {t('rp_new_password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('rp_placeholder_new')}
                    className="w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">
                  {t('rp_confirm_password')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder={t('rp_placeholder_confirm')}
                    className="w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
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
                {loading ? t('rp_submitting') : t('rp_submit')}
              </button>
            </form>
          </>
        ) : null}

        {tokenValid === true && done && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-black mb-3 text-slate-900">{t('rp_success_title')}</h2>
            <p className="text-sm mb-6 text-slate-600">{t('rp_success_desc')}</p>
            <p className="text-xs mb-6 text-slate-400">
              {t('rp_redirecting')}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all"
            >
              {t('rp_go_login')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
