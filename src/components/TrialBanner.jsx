import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { useLang } from '../context/LanguageContext';
import { trackEvent } from '../utils/analytics';
import { X, AlertTriangle, Clock, Lock } from 'lucide-react';

export default function TrialBanner() {
    const { user, effectivePlan, trialActive, trialExpired, subscriptionExpired, trialDaysLeft, loading } = useAuth();
    const planCtx = usePlan();
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

    // Jika sudah PRO berbayar aktif ATAU ULTIMATE aktif, sembunyikan
    if (effectivePlan === 'ultimate') return null;
    if (effectivePlan === 'pro' && !trialActive) return null;

    const invCount = (planCtx?.getInvoiceCount?.() || 0) + (planCtx?.getQuotationCount?.() || 0);
    const posCount = planCtx?.getKasirTransactionCount?.() || 0;
    const catalogCount = (planCtx?.getClientCount?.() || 0) + (planCtx?.getProductCount?.() || 0);
    const hasActivity = invCount > 0 || posCount > 0 || catalogCount > 0;

    const activitySummary = hasActivity
        ? (isEn
            ? ` (${invCount} docs, ${posCount} POS sales, ${catalogCount} clients/items recorded)`
            : ` (${invCount} dokumen, ${posCount} transaksi kasir, ${catalogCount} klien/produk tercatat)`)
        : '';

    const handleUpgradeClick = (stateLabel) => {
        trackEvent('trial_banner_upgrade_click', {
            state: stateLabel,
            days_left: trialDaysLeft,
            inv_count: invCount,
            pos_count: posCount
        });
        navigate('/upgrade');
    };

    // 1. State ketika Trial 14 Hari atau Langganan Berbayar SUDAH HABIS -> Otomatis Turun ke FREE
    if (effectivePlan === 'free' && (trialExpired || subscriptionExpired)) {
        return (
            <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-red-800 font-medium text-center sm:text-left">
                    <AlertTriangle size={16} className="text-red-600 shrink-0" />
                    <span>
                        {subscriptionExpired
                            ? (isEn
                                ? `Your paid subscription has expired${activitySummary}. Account reverted to Starter FREE limits (10 docs & 50 POS tx/mo + watermark).`
                                : `Masa aktif langganan Anda telah berakhir${activitySummary}. Akun kembali ke kuota Starter FREE (10 dokumen & 50 transaksi kasir/bln + watermark).`)
                            : (isEn
                                ? `Your 14-day PRO Trial has ended${activitySummary}. Account is now on Starter FREE limits (10 docs & 50 POS tx/mo + watermark).`
                                : `Masa Trial PRO 14 hari Anda telah habis${activitySummary}. Akun kini berada pada batas kuota Starter FREE (10 dokumen & 50 transaksi kasir/bln + watermark).`)}
                    </span>
                </div>
                <button
                    onClick={() => handleUpgradeClick(subscriptionExpired ? 'subscription_expired' : 'trial_expired')}
                    className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full font-bold transition text-xs shadow-sm cursor-pointer"
                >
                    {isEn ? 'Reactivate PRO (Rp 49.9k/mo) →' : 'Aktifkan PRO (Rp 49,9rb/bln) →'}
                </button>
            </div>
        );
    }

    // 2. Logic untuk FREE (belum pernah trial atau user FREE biasa)
    if (effectivePlan === 'free') {
        return (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-blue-700 font-medium text-center sm:text-left">
                    <Lock size={16} className="shrink-0" />
                    <span>
                        {isEn
                            ? 'You are on the Starter FREE plan (10 invoices & 50 POS tx/mo). Upgrade to PRO for Unlimited & No Watermark.'
                            : 'Anda menggunakan paket Starter FREE (maks 10 invoice & 50 transaksi kasir/bln). Upgrade ke PRO untuk Unlimited & Tanpa Watermark.'}
                    </span>
                </div>
                <button
                    onClick={() => handleUpgradeClick('free_plan')}
                    className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full font-medium transition text-xs shadow-sm cursor-pointer"
                >
                    {isEn ? 'Upgrade to PRO →' : 'Upgrade ke PRO →'}
                </button>
            </div>
        );
    }

    // 3. Logic untuk PRO TRIAL Aktif
    if (effectivePlan === 'pro' && trialActive && trialDaysLeft > 0) {
        if (trialDaysLeft > 7) {
            if (isDismissed) return null;

            return (
                <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm relative">
                    <div className="flex items-center gap-2 text-green-700 font-medium text-center sm:text-left">
                        <Clock size={16} className="shrink-0" />
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

        if (trialDaysLeft > 4) {
            if (isDismissed) return null;

            return (
                <div className="bg-orange-50 border-b border-orange-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm relative">
                    <div className="flex items-center gap-2 text-orange-700 font-medium text-center sm:text-left">
                        <Clock size={16} className="shrink-0" />
                        <span>{isEn ? `PRO Trial expires in ${trialDaysLeft} days${activitySummary}!` : `PRO Trial berakhir dalam ${trialDaysLeft} hari${activitySummary}!`}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleUpgradeClick('trial_mid')}
                            className="whitespace-nowrap bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded-full font-medium transition text-xs shadow-sm cursor-pointer"
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

        // End-Game Trial Nudge (Days 10–14 / <= 4 days left)
        return (
            <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-red-700 font-medium text-center sm:text-left">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>
                        {isEn
                            ? `Final ${trialDaysLeft} day(s) of PRO Trial${activitySummary}! Lock in PRO (Rp 49.9k/mo) to keep Unlimited access & zero watermark.`
                            : `Sisa ${trialDaysLeft} hari Trial PRO${activitySummary}! Kunci paket PRO (Rp 49,9rb/bln) agar tetap Unlimited & tanpa watermark.`}
                    </span>
                </div>
                <button
                    onClick={() => handleUpgradeClick('trial_endgame')}
                    className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full font-bold transition text-xs shadow-sm animate-pulse cursor-pointer"
                >
                    {isEn ? 'Lock PRO Plan →' : 'Kunci Paket PRO →'}
                </button>
            </div>
        );
    }

    return null;
}
