import { useState, useEffect } from 'react';
import { X, Wallet, CreditCard, QrCode } from 'lucide-react';
import { useLang } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';

export default function PaymentModal({ isOpen, onClose, total, onConfirm }) {
    const { t } = useLang();
    const [method, setMethod] = useState('cash');
    const [cash, setCash] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [loyaltySettings, setLoyaltySettings] = useState(null);
    const [member, setMember] = useState(null);
    const [usePoints, setUsePoints] = useState(false);
    const [redeemAmount, setRedeemAmount] = useState('');
    const [isSearchingMember, setIsSearchingMember] = useState(false);

    // reset on open
    useEffect(() => {
        if (isOpen) {
            setMethod('cash');
            setCash('');
            setCustomerPhone('');
            setMember(null);
            setUsePoints(false);
            setRedeemAmount('');
            setIsSearchingMember(false);
        }
    }, [isOpen]);

    // Fetch loyalty settings
    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('profiles').select('loyalty_enabled, points_per_amount, points_value').single();
            if (data) setLoyaltySettings(data);
        };
        fetchSettings();
    }, []);

    const searchMember = async () => {
        if (!customerPhone || customerPhone.length < 9) return;
        setIsSearchingMember(true);
        try {
            const { data } = await supabase.from('kasir_members').select('*').eq('phone', customerPhone).single();
            if (data) {
                setMember(data);
                setUsePoints(false);
                setRedeemAmount('');
            } else {
                setMember(null);
            }
        } catch (err) {
            setMember(null);
        } finally {
            setIsSearchingMember(false);
        }
    };

    // Auto search when phone length looks like a number
    useEffect(() => {
        if (loyaltySettings?.loyalty_enabled && customerPhone.length >= 10) {
            const delay = setTimeout(() => searchMember(), 800);
            return () => clearTimeout(delay);
        } else {
            setMember(null);
            setUsePoints(false);
            setRedeemAmount('');
        }
    }, [customerPhone, loyaltySettings]);

    if (!isOpen) return null;

    const maxRedeemPoints = member ? member.total_points : 0;
    const pointsValue = loyaltySettings?.points_value || 10;
    
    // Calculate final redeem nominal if using points
    const pointsToRedeem = usePoints ? (parseInt(redeemAmount) || 0) : 0;
    const clampedPoints = Math.min(pointsToRedeem, maxRedeemPoints);
    const nominalDiscount = clampedPoints * pointsValue;
    
    const finalTotal = Math.max(0, total - nominalDiscount);
    const cashVal = parseFloat(cash) || 0;
    const change = Math.max(0, cashVal - finalTotal);
    const isValid = method !== 'cash' || cashVal >= finalTotal;

    const handleConfirm = () => {
        onConfirm({ 
            method, 
            cash: cashVal, 
            change, 
            customerPhone,
            discount: usePoints && clampedPoints > 0 ? {
                type: 'poin',
                value: nominalDiscount,
                member_id: member?.id
            } : null
        });
    };

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
                        {nominalDiscount > 0 ? (
                            <>
                                <div className="text-xl font-bold text-slate-400 dark:text-slate-500 line-through">
                                    Rp {total.toLocaleString('id-ID')}
                                </div>
                                <div className="text-4xl font-black text-violet-600 dark:text-violet-400">
                                    Rp {finalTotal.toLocaleString('id-ID')}
                                </div>
                                <div className="text-xs text-emerald-600 font-bold mt-1">
                                    - Rp {nominalDiscount.toLocaleString('id-ID')} (Poin)
                                </div>
                            </>
                        ) : (
                            <div className="text-4xl font-black text-violet-600 dark:text-violet-400">
                                Rp {total.toLocaleString('id-ID')}
                            </div>
                        )}
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

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('customer_phone')}</label>
                            {isSearchingMember && <span className="text-xs text-slate-400">Mencari...</span>}
                        </div>
                        <input
                            type="tel"
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            placeholder="08123xxxxx"
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                        />
                        
                        {loyaltySettings?.loyalty_enabled && member && (
                            <div className="mt-3 p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 rounded-xl animate-fade-in text-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-violet-900 dark:text-violet-200">{member.name}</div>
                                        <div className="text-violet-600 dark:text-violet-400 font-medium">✨ {member.total_points} {t('member_points')}</div>
                                    </div>
                                    {member.total_points > 0 && (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={usePoints} 
                                                onChange={(e) => setUsePoints(e.target.checked)} 
                                                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-gray-300 pointer-events-auto"
                                            />
                                            <span className="text-xs font-bold text-violet-700 dark:text-violet-300">{t('member_redeem')}</span>
                                        </label>
                                    )}
                                </div>
                                
                                {usePoints && (
                                    <div className="mt-2 pt-2 border-t border-violet-200 dark:border-violet-800">
                                        <label className="block text-xs text-violet-700 dark:text-violet-300 mb-1">Jumlah Poin Ditukar (Max {member.total_points})</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number"
                                                min="1"
                                                max={member.total_points}
                                                value={redeemAmount}
                                                onChange={(e) => setRedeemAmount(e.target.value)}
                                                className="w-full p-2 bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-700 rounded-lg text-sm"
                                            />
                                            <button 
                                                onClick={() => setRedeemAmount(member.total_points.toString())}
                                                className="px-3 py-2 bg-violet-200 hover:bg-violet-300 dark:bg-violet-800 text-violet-800 dark:text-violet-200 font-bold text-xs rounded-lg whitespace-nowrap"
                                            >
                                                MAX
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {loyaltySettings?.loyalty_enabled && customerPhone.length >= 10 && !member && !isSearchingMember && (
                            <div className="mt-2 px-2 text-xs text-slate-500 dark:text-slate-400">
                                {t('member_not_found')}
                            </div>
                        )}
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
                        onClick={handleConfirm}
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
