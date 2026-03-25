import React from 'react';
import { X, Crown, FileText, Store, Users, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export default function UpgradeModal({ isOpen, onClose, featureType, planType = 'PRO' }) {
    const navigate = useNavigate();
    const { lang, t } = useLang();
    const { user, canStartTrial, refreshProfile, effectivePlan, isAdmin } = useAuth();
    const isFree = effectivePlan === 'free';
    const { showToast } = useToast();
    const [activatingTrial, setActivatingTrial] = React.useState(false);

    const handleStartTrial = async () => {
        if (!user || !canStartTrial) return;
        setActivatingTrial(true);
        try {
            const trialData = { 
                plan: 'pro', 
                trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() 
            };
            const { error: dbError } = await supabase
                .from('profiles')
                .update(trialData)
                .eq('id', user.id);

            if (dbError) throw dbError;
            await refreshProfile(true, trialData);
            showToast(t('upgrade_success'), 'success');
            onClose();
            navigate('/dashboard');
        } catch (e) {
            console.error(e);
            showToast('Gagal mengaktifkan Trial.', 'error');
        } finally {
            setActivatingTrial(false);
        }
    };

    const upgradeMessages = {
        invoice_limit: {
            icon: <FileText size={32} className="text-violet-500" />,
            title: t('up_limit_inv_t'),
            desc: t('up_limit_inv_d')
        },
        pos_limit: {
            icon: <Store size={32} className="text-violet-500" />,
            title: t('up_limit_pos_t'),
            desc: t('up_limit_pos_d')
        },
        client_limit: {
            icon: <Users size={32} className="text-violet-500" />,
            title: t('up_limit_kl_t'),
            desc: t('up_limit_kl_d')
        },
        advanced_kasir: {
            icon: <Crown size={32} className="text-amber-500" />,
            title: t('up_lock_pos_t'),
            desc: t('up_lock_pos_d')
        },
        report_locked: {
            icon: <Crown size={32} className="text-amber-500" />,
            title: t('up_lock_rep_t'),
            desc: t('up_lock_rep_d')
        },
        pro_locked: {
            icon: <Crown size={32} className="text-blue-500" />,
            title: t('up_lock_pro_t'),
            desc: t('up_lock_pro_d')
        },
        ultimate_locked: {
            icon: <Crown size={32} className="text-violet-500" />,
            title: t('up_lock_ult_t'),
            desc: t('up_lock_ult_d')
        },
        report: {
            icon: <Crown size={32} className="text-amber-500" />,
            title: t('up_lock_rep_t'),
            desc: t('up_lock_rep_d')
        },
        karyawan: {
            icon: <Crown size={32} className="text-violet-500" />,
            title: t('up_lock_kar_t'),
            desc: t('up_lock_kar_d')
        },
        hpp: {
            icon: <Calculator size={32} className="text-violet-500" />,
            title: t('up_lock_hpp_t'),
            desc: t('up_lock_hpp_d')
        },
    };

    if (!isOpen || !featureType || !upgradeMessages[featureType]) return null;

    const content = upgradeMessages[featureType];
    const { title, desc } = content;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh] custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 flex flex-col items-center text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:bg-slate-100 p-1 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
                        {content.icon}
                    </div>

                    <h2 className="text-xl font-black text-slate-800 mb-2 leading-tight">
                        {title}
                    </h2>
                    <p className="text-slate-500 text-sm mb-6">
                        {desc}
                    </p>

                    {/* Pricing Highlight */}
                    <div className={`w-full bg-gradient-to-br ${planType === 'ULTIMATE' ? 'from-purple-50 to-fuchsia-50' : 'from-violet-50 to-indigo-50'} rounded-xl p-4 border ${planType === 'ULTIMATE' ? 'border-purple-200' : 'border-violet-100'} mb-6 text-left`}>
                        <div className="flex justify-between items-center mb-3">
                            <span className={`font-black ${planType === 'ULTIMATE' ? 'text-purple-700' : 'text-violet-700'} text-lg`}>
                                {planType}
                            </span>
                            <span className="font-bold text-slate-700">
                                {planType === 'ULTIMATE' ? (lang === 'ID' ? 'Rp 149.000' : 'Rp 149,000') : (lang === 'ID' ? 'Rp 129.000' : 'Rp 129,000')}<span className="text-xs text-slate-500 font-normal">/{lang === 'ID' ? 'bln' : 'month'}</span>
                            </span>
                        </div>
                        <ul className="text-xs text-slate-600 space-y-2 font-medium">
                            {planType === 'ULTIMATE' ? (
                                <>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-500">✓</span> {lang === 'ID' ? 'Semua fitur PRO' : 'Everything in PRO'}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-500">✓</span> {lang === 'ID' ? 'Multi Outlet (banyak cabang)' : 'Multi Outlet (multiple branches)'}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-500">✓</span> {lang === 'ID' ? 'Transaksi & Dokumen Unlimited' : 'Unlimited Transactions & Documents'}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-500">✓</span> {lang === 'ID' ? 'Export Excel/CSV & HPP' : 'Excel/CSV Export & HPP'}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-500">✓</span> {lang === 'ID' ? 'VIP Support' : 'VIP Support'}
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-500">✓</span> {lang === 'ID' ? '500 Transaksi Kasir/bulan' : '500 POS Transactions/month'}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-500">✓</span> {lang === 'ID' ? '100 Dokumen/bulan' : '100 Documents/month'}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-500">✓</span> {lang === 'ID' ? 'Loyalty Member & Voucher' : 'Loyalty Member & Voucher'}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-500">✓</span> {lang === 'ID' ? 'Shift Karyawan & Laporan' : 'Employee Shifts & Reports'}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-500">✓</span> {lang === 'ID' ? 'Tanpa Watermark' : 'No Watermark'}
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>

                    <div className="w-full flex flex-col gap-2">
                        <button
                            onClick={() => {
                                onClose();
                                window.location.href = planType === 'ULTIMATE' 
                                    ? 'https://my-invoice.myr.id/pl/my-invoice-pro-bulanan-7spr' 
                                    : 'https://my-invoice.myr.id/pl/my-invoice-pro-bulanan';
                            }}
                            className={`w-full py-3 bg-white hover:bg-slate-50 border ${planType === 'ULTIMATE' ? 'border-purple-200 text-purple-700' : 'border-violet-200 text-violet-700'} font-bold rounded-xl transition-all flex justify-center items-center gap-2`}
                        >
                            <Crown size={18} /> {t('up_btn_upgrade')} {planType}
                        </button>

                        {(!isPro) && planType !== 'ULTIMATE' && (
                            <button
                                onClick={handleStartTrial}
                                disabled={activatingTrial || effectivePlan !== 'free' || profile?.trial_ends_at !== null}
                                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {activatingTrial ? '...' : (profile?.trial_ends_at === null ? t('upgrade_trial_start') : (lang === 'ID' ? 'Trial Sudah Digunakan' : 'Trial Already Used'))}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            {t('up_btn_later')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
