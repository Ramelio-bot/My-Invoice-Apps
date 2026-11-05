import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { X, AlertTriangle, Clock, Lock } from 'lucide-react';

export default function TrialBanner() {
    const { user, profile, effectivePlan, trialDaysLeft, loading } = useAuth();
    const { lang } = useLang();
    const isEn = lang === 'EN';
    const navigate = useNavigate();
    const [dismissedUserId, setDismissedUserId] = useState(null);

    function handleDismiss() {
        if (user) {
            localStorage.setItem(`trial_banner_dismissed_${user.id}`, 'true');
            setDismissedUserId(user.id);
        }
    }

    if (loading || !user) return null;

    const isDismissed = dismissedUserId === user.id || localStorage.getItem(`trial_banner_dismissed_${user.id}`) === 'true';

    // Jika sudah PRO non-trial ATAU ULTIMATE, sembunyikan
    if (effectivePlan === 'pro' && (!profile?.trial_ends_at || trialDaysLeft <= 0)) return null;
    if (effectivePlan === 'ultimate') return null;

    // Logic untuk FREE
    if (effectivePlan === 'free') {
        return (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-blue-700 font-medium text-center sm:text-left">
                    <Lock size={16} />
                    <span>{isEn ? 'You are on the FREE plan. Some features have limits.' : 'Kamu pakai paket FREE. Fitur lebih terbatas.'}</span>
                </div>
                <button
                    onClick={() => navigate('/upgrade')}
                    className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full font-medium transition text-xs shadow-sm"
                >
                    {isEn ? 'Upgrade to PRO →' : 'Upgrade ke PRO →'}
                </button>
            </div>
        );
    }

    // Logic untuk PRO TRIAL
    if (effectivePlan === 'pro' && trialDaysLeft > 0) {
        if (trialDaysLeft > 7) {
            if (isDismissed) return null;

            return (
                <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm relative">
                    <div className="flex items-center gap-2 text-green-700 font-medium text-center sm:text-left">
                        <Clock size={16} />
                        <span>{isEn ? `PRO Trial is active! ${trialDaysLeft} days remaining.` : `PRO Trial sedang aktif! Tersisa ${trialDaysLeft} hari.`}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleDismiss} className="text-green-400 hover:text-green-600 transition p-1" title={isEn ? "Close" : "Tutup"}>
                            <X size={16} />
                        </button>
                    </div>
                </div>
            );
        }

        if (trialDaysLeft > 3) {
            if (isDismissed) return null;

            return (
                <div className="bg-orange-50 border-b border-orange-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm relative">
                    <div className="flex items-center gap-2 text-orange-700 font-medium text-center sm:text-left">
                        <Clock size={16} />
                        <span>{isEn ? `PRO Trial expires in ${trialDaysLeft} days!` : `PRO Trial berakhir dalam ${trialDaysLeft} hari!`}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/upgrade')}
                            className="whitespace-nowrap bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded-full font-medium transition text-xs shadow-sm"
                        >
                            {isEn ? 'Upgrade Now →' : 'Upgrade Sekarang →'}
                        </button>
                        <button onClick={handleDismiss} className="text-orange-400 hover:text-orange-600 transition p-1" title={isEn ? "Close" : "Tutup"}>
                            <X size={16} />
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-red-700 font-medium text-center sm:text-left">
                    <AlertTriangle size={16} />
                    <span>{isEn ? `Trial expires in ${trialDaysLeft} days! Upgrade now.` : `Trial berakhir ${trialDaysLeft} hari lagi! Segera upgrade.`}</span>
                </div>
                <button
                    onClick={() => navigate('/upgrade')}
                    className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full font-medium transition text-xs shadow-sm animate-pulse"
                >
                    {isEn ? 'Upgrade Now →' : 'Upgrade Sekarang →'}
                </button>
            </div>
        );
    }

    return null;
}
