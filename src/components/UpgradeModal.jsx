import React from 'react';
import { X, Crown, FileText, Store, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';

const upgradeMessages = {
    invoice_limit: {
        icon: <FileText size={32} className="text-violet-500" />,
        title: 'Batas Invoice FREE Tercapai',
        desc: 'Kamu sudah membuat 3 dokumen bulan ini. Upgrade ke PRO untuk invoice unlimited!',
        titleEN: 'FREE Document Limit Reached',
        descEN: 'You have created 3 documents this month. Upgrade to PRO for unlimited documents!'
    },
    pos_limit: {
        icon: <Store size={32} className="text-violet-500" />,
        title: 'Batas Transaksi Kasir Tercapai',
        desc: 'Kamu sudah melakukan 10 transaksi hari ini. Upgrade ke PRO untuk transaksi unlimited!',
        titleEN: 'Daily POS Limit Reached',
        descEN: 'You have reached 10 transactions today. Upgrade to PRO for unlimited transactions!'
    },
    client_limit: {
        icon: <Users size={32} className="text-violet-500" />,
        title: 'Batas Klien FREE Tercapai',
        desc: 'Paket FREE hanya mendukung 1 klien. Upgrade ke PRO untuk klien unlimited!',
        titleEN: 'FREE Client Limit Reached',
        descEN: 'FREE plan supports only 1 client. Upgrade to PRO for unlimited clients!'
    },
    advanced_kasir: {
        icon: <Crown size={32} className="text-amber-500" />,
        title: 'Fitur Kasir Lanjutan Terkunci',
        desc: 'Open Bill, Laporan Kasir, dan manajemen operasional hanya untuk pengguna PRO/ULTIMATE.',
        titleEN: 'Advanced POS Features Locked',
        descEN: 'Open Bill, POS Reports, and operational management are for PRO/ULTIMATE users only.'
    },
    report_locked: {
        icon: <Crown size={32} className="text-amber-500" />,
        title: 'Fitur Laporan Terkunci',
        desc: 'Akses statistik dan analitik penjualan tanpa batas dengan upgrade ke paket PRO.',
        titleEN: 'Reports Feature Locked',
        descEN: 'Access unlimited sales statistics and analytics by upgrading to the PRO plan.'
    }
};

export default function UpgradeModal({ isOpen, onClose, featureType }) {
    const navigate = useNavigate();
    const { lang, t } = useLang();

    if (!isOpen || !featureType || !upgradeMessages[featureType]) return null;

    const content = upgradeMessages[featureType];
    const title = lang === 'ID' ? content.title : content.titleEN;
    const desc = lang === 'ID' ? content.desc : content.descEN;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div
                className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 flex flex-col items-center text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="w-16 h-16 bg-violet-50 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mb-4">
                        {content.icon}
                    </div>

                    <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 leading-tight">
                        {title}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        {desc}
                    </p>

                    {/* Pricing Highlight */}
                    <div className="w-full bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-slate-700 dark:to-slate-700/50 rounded-xl p-4 border border-violet-100 dark:border-slate-600 mb-6 text-left">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-black text-violet-700 dark:text-violet-400 text-lg">PRO</span>
                            <span className="font-bold text-slate-700 dark:text-white">Rp 99.000<span className="text-xs text-slate-500 font-normal">/bln</span></span>
                        </div>
                        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 font-medium">
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span> Transaksi kasir unlimited
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span> Invoice & dokumen unlimited
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span> Laporan keuangan lengkap
                            </li>
                        </ul>
                    </div>

                    <div className="w-full flex flex-col gap-2">
                        <button
                            onClick={() => {
                                onClose();
                                navigate('/upgrade');
                            }}
                            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 transition-all flex justify-center items-center gap-2"
                        >
                            ⭐ {lang === 'ID' ? 'Upgrade ke PRO' : 'Upgrade to PRO'}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        >
                            {lang === 'ID' ? 'Nanti saja' : 'Maybe later'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
