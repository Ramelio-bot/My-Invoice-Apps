import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Mail, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function VerifyEmail() {
    const { user, signOut, supabase } = useAuth();
    const { t } = useLang();
    const { dark } = useTheme();
    const { showToast } = useToast();
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleResend() {
        if (!user?.email) return;
        setSending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email,
                options: {
                    emailRedirectTo: window.location.origin + '/dashboard'
                }
            });
            if (error) throw error;
            setSent(true);
            showToast(t('auth_verify_success'), 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSending(false);
        }
    }

    return (
        <div className={`min-h-screen flex items-center justify-center px-4 ${dark ? 'bg-slate-900' : 'bg-slate-50'}`}>
            <div className={`w-full max-w-md rounded-2xl shadow-xl p-8 border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className="flex flex-col items-center text-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${dark ? 'bg-violet-900/30 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                        {sent ? <CheckCircle2 size={40} /> : <Mail size={40} />}
                    </div>
                    
                    <h1 className={`text-2xl font-bold mb-3 ${dark ? 'text-white' : 'text-slate-900'}`}>
                        {t('auth_verify_title')}
                    </h1>
                    <p className={`text-sm mb-8 leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {t('auth_verify_desc')}
                        <br /><span className="font-bold">{user?.email}</span>
                    </p>

                    <div className="w-full space-y-3">
                        <button
                            onClick={handleResend}
                            disabled={sending || sent}
                            className="w-full py-3.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            {sending ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                            {t('auth_verify_resend')}
                        </button>

                        <button
                            onClick={() => signOut()}
                            className={`w-full py-3.5 border rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                dark 
                                    ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600' 
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                            }`}
                        >
                            <LogOut size={18} />
                            {t('auth_verify_logout')}
                        </button>
                    </div>

                    <p className="mt-8 text-xs text-slate-400">
                        {dark ? 'Belum menerima email? Periksa folder Spam atau minta kirim ulang.' : 'Check your spam folder if you haven\'t received the email.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
