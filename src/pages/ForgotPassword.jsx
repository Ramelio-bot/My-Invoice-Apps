import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLang } from '../context/LanguageContext'

export default function ForgotPassword() {
  const { lang, toggleLang, t } = useLang()
  const navigate = useNavigate()

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
      setError(t('auth_error_generic'))
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-md rounded-2xl shadow-xl p-8 relative bg-white border border-slate-100">
        
        {/* Language toggle */}
        <button onClick={toggleLang} className="absolute top-6 right-6 text-sm font-semibold text-slate-500 hover:text-violet-600">
          {t('locale_suffix') === 'ID' ? 'EN' : 'ID'}
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-black text-violet-600">My Invoice</span>
        </div>

        {!sent ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-violet-600" />
              </div>
              <h1 className="text-2xl font-black mb-2 text-slate-900">{t('auth_forgot_title')}</h1>
              <p className="text-sm text-slate-500">{t('auth_forgot_subtitle')}</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">
                  {t('auth_email')}
                </label>
                <input
                  type="email" required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('auth_email_placeholder')}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all hover:-translate-y-0.5"
              >
                {loading ? t('auth_processing') : t('auth_forgot_submit')}
              </button>
            </form>

            {/* Back to login */}
            <button
              onClick={() => navigate('/login')}
              className="mt-6 w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={14} />
              {t('auth_back_to_login')}
            </button>
          </>
        ) : (
          // Success state
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-black mb-3 text-slate-900">{t('auth_forgot_success_title')}</h2>
            <p className="text-sm mb-2 text-slate-600">{t('auth_forgot_success_desc')}</p>
            <p className="text-xs text-slate-400">{t('auth_forgot_success_note')}</p>
            
            <button
              onClick={() => navigate('/login')}
              className="mt-8 w-full flex items-center justify-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
            >
              <ArrowLeft size={14} />
              {t('auth_back_to_login')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
