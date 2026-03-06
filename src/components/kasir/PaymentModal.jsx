import { useState, useEffect } from 'react';
import { X, Wallet, CreditCard, QrCode } from 'lucide-react';
import { useLang } from '../../context/LanguageContext';

export default function PaymentModal({ isOpen, onClose, total, onConfirm }) {
    const { t } = useLang();
    const [method, setMethod] = useState('cash');
    const [cash, setCash] = useState('');

    // reset on open
    useEffect(() => {
        if (isOpen) {
            setMethod('cash');
            setCash('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const cashVal = parseFloat(cash) || 0;
    const change = Math.max(0, cashVal - total);
    const isValid = method !== 'cash' || cashVal >= total;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div
                className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                    <h2 className="text-xl font-bold dark:text-white">{t('kasir_payment_title')}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <div className="text-slate-500 dark:text-slate-400 mb-1 font-medium">{t('kasir_total_bill')}</div>
                        <div className="text-4xl font-black text-violet-600 dark:text-violet-400">
                            Rp {total.toLocaleString('id-ID')}
                        </div>
                    </div>

                    <div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{t('kasir_payment_method')}</div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'cash', label: t('kasir_cash'), icon: Wallet },
                                { id: 'transfer', label: t('kasir_transfer'), icon: CreditCard },
                                { id: 'qris', label: t('kasir_qris'), icon: QrCode }
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setMethod(m.id)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${method === m.id
                                        ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                        }`}
                                >
                                    <m.icon size={24} />
                                    <span className="text-xs font-bold">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {method === 'cash' && (
                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700 border-dashed">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('kasir_amount_received')}</label>
                                <input
                                    type="number"
                                    value={cash}
                                    onChange={e => setCash(e.target.value)}
                                    placeholder="Misal: 100000"
                                    className="w-full p-4 text-xl font-bold text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 dark:text-white"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-between items-center text-lg p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 font-bold border border-violet-100 dark:border-violet-500/30">
                                <span>{t('kasir_change')}:</span>
                                <span>Rp {change.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    )}

                    {method !== 'cash' && (
                        <div className="p-6 text-center text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            {t('kasir_payment_confirm_msg')}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-xl font-bold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                        {t('kasir_cancel')}
                    </button>
                    <button
                        onClick={() => onConfirm({ method, cash: cashVal, change })}
                        disabled={!isValid}
                        className="flex-1 py-3 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-600/30 flex justify-center items-center gap-2"
                    >
                        ✅ {t('kasir_confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}
