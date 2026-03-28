import { useState, useEffect } from 'react';
import { X, Wallet, CreditCard, QrCode } from 'lucide-react';
import { useLang } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function PaymentModal({ isOpen, onClose, total, onConfirm, isProcessing = false }) {
    const { t } = useLang();
    const { user } = useAuth();
    const [method, setMethod] = useState('cash');
    const [cash, setCash] = useState('');
    const [loyaltySettings, setLoyaltySettings] = useState(null);
    
    // Member search states per user request
    const [phoneSearch, setPhoneSearch] = useState('');
    const [foundMember, setFoundMember] = useState(null);
    const [isSearchingMember, setIsSearchingMember] = useState(false);
    
    const [usePoints, setUsePoints] = useState(false);
    const [redeemAmount, setRedeemAmount] = useState('');
    
    // New member states
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [isAddingMember, setIsAddingMember] = useState(false);

    // reset on open
    useEffect(() => {
        if (isOpen) {
            setMethod('cash');
            setCash('');
            setPhoneSearch('');
            setFoundMember(null);
            setUsePoints(false);
            setRedeemAmount('');
            setIsSearchingMember(false);
        }
    }, [isOpen]);

    // Fetch loyalty settings
    useEffect(() => {
        if (!user) return;
        const fetchSettings = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('loyalty_enabled, points_per_amount, points_value')
                .eq('id', user.id)
                .maybeSingle(); // Bug #5 Fix: use maybeSingle
            
            setLoyaltySettings({
                loyalty_enabled: data?.loyalty_enabled ?? false,
                points_per_amount: data?.points_per_amount ?? 1000,
                points_value: data?.points_value ?? 10
            });
        };
        fetchSettings();
    }, [user]);

    const searchMember = async () => {
        if (!phoneSearch || phoneSearch.length < 5) return;
        setIsSearchingMember(true);
        try {
            const { data } = await supabase
                .from('kasir_members')
                .select('id, name, phone, email, total_points, total_spent, total_transactions, joined_at')
                .eq('user_id', user.id) // Bug #6 Fix: filter by user_id
                .ilike('phone', `%${phoneSearch.trim()}%`) // Bug #6 Fix: fuzzy search
                .maybeSingle(); // Bug #6 Fix: use maybeSingle

            if (data) {
                setFoundMember(data);
                setUsePoints(false);
                setRedeemAmount('');
            } else {
                setFoundMember(null);
            }
        } catch (err) {
            console.error('Search error:', err);
            setFoundMember(null);
        } finally {
            setIsSearchingMember(false);
        }
    };

    const addMember = async () => {
        if (!newMemberName || !phoneSearch) return;
        setIsAddingMember(true);
        try {
            const { data, error } = await supabase
                .from('kasir_members')
                .insert({
                    user_id: user.id,
                    name: newMemberName,
                    phone: phoneSearch.trim(),
                    total_points: 0,
                    total_spent: 0,
                    total_transactions: 0,
                    joined_at: new Date().toISOString()
                })
                .select()
                .single();

            if (data) {
                setFoundMember(data);
                setShowAddMember(false);
                setNewMemberName('');
            }
        } catch (err) {
            console.error('Add member error:', err);
        } finally {
            setIsAddingMember(false);
        }
    };

    if (!isOpen) return null;

    const maxRedeemPoints = foundMember ? foundMember.total_points : 0;
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
            customerPhone: foundMember?.phone || phoneSearch,
            memberId: foundMember?.id || null,
            foundMember: foundMember,
            pointsRedeemed: usePoints ? (parseInt(redeemAmount) || 0) : 0,
            pointsDiscountAmount: usePoints ? nominalDiscount : 0,
            discount: usePoints && clampedPoints > 0 ? {
                type: 'poin',
                value: nominalDiscount,
                member_id: foundMember?.id
            } : null
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
            <div
                className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200 overflow-hidden scale-in flex flex-col max-h-[82dvh] sm:max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">{t('kasir_payment_title')}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 min-h-0 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto scrollbar-hide custom-scrollbar">
                    <div className="text-center">
                        <div className="text-slate-600 mb-1 font-black uppercase tracking-widest text-xs">{t('kasir_total_bill')}</div>
                        {nominalDiscount > 0 ? (
                            <>
                                <div className="text-xl font-bold text-slate-300 line-through">
                                    Rp {total.toLocaleString(t('locale_code'))}
                                </div>
                                <div className="text-4xl font-black text-slate-900">
                                    Rp {finalTotal.toLocaleString(t('locale_code'))}
                                </div>
                                <div className="text-xs text-emerald-600 font-black mt-1">
                                    - Rp {nominalDiscount.toLocaleString(t('locale_code'))} ({t('member_points')})
                                </div>
                            </>
                        ) : (
                            <div className="text-4xl font-black text-slate-900">
                                Rp {total.toLocaleString(t('locale_code'))}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="text-sm font-bold text-slate-700 mb-3">{t('kasir_payment_method')}</div>
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
                                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'
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
                            <label className="text-sm font-bold text-slate-700">{t('payment_search_member')}</label>
                            {isSearchingMember && <span className="text-xs text-slate-400">{t('payment_searching')}</span>}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="tel"
                                value={phoneSearch}
                                onChange={e => setPhoneSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && searchMember()}
                                placeholder={t('payment_search_ph')}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            <button
                                onClick={searchMember}
                                disabled={isSearchingMember || phoneSearch.length < 5}
                                className="px-4 py-3 font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm transition-colors whitespace-nowrap disabled:opacity-50 shadow-lg shadow-violet-600/20"
                            >
                                {t('payment_search_btn')}
                            </button>
                        </div>
                        
                        {foundMember && (
                            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl animate-fade-in text-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-emerald-900">✅ {foundMember.name}</div>
                                        <div className="text-emerald-600 font-medium">✨ {foundMember.total_points} {t('member_points')}</div>
                                    </div>
                                    {foundMember.total_points > 0 && (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={usePoints} 
                                                onChange={(e) => setUsePoints(e.target.checked)} 
                                                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-gray-300 pointer-events-auto"
                                            />
                                            <span className="text-xs font-bold text-violet-700 px-2 py-1 bg-white rounded-md border border-violet-200">{t('member_redeem')}</span>
                                        </label>
                                    )}
                                </div>
                                
                                {usePoints && (
                                    <div className="mt-2 pt-2 border-t border-emerald-200">
                                        <label className="block text-xs text-emerald-700 mb-1">{t('payment_redeem_label')} (Max {foundMember.total_points})</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number"
                                                min="1"
                                                max={foundMember.total_points}
                                                value={redeemAmount}
                                                onChange={(e) => setRedeemAmount(e.target.value)}
                                                className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-sm"
                                                placeholder={t('member_redeem_ph')}
                                            />
                                            <button 
                                                onClick={() => setRedeemAmount(foundMember.total_points.toString())}
                                                className="px-3 py-2 bg-emerald-200 hover:bg-emerald-300 text-emerald-800 font-bold text-xs rounded-lg whitespace-nowrap"
                                            >
                                                MAX
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {loyaltySettings?.loyalty_enabled && phoneSearch && !foundMember && !isSearchingMember && !showAddMember && (
                            <div className="mt-2 px-2 flex flex-col gap-2">
                                <div className="text-xs text-red-500 font-bold flex items-center gap-1">
                                    ❌ {t('payment_member_not_found')}
                                </div>
                                <button 
                                    onClick={() => {
                                        setNewMemberName('');
                                        setShowAddMember(true);
                                    }}
                                    className="text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 p-2 rounded-lg border border-dashed border-violet-300"
                                >
                                    {t('members_add')}
                                </button>
                            </div>
                        )}

                        {showAddMember && (
                            <div className="mt-3 p-3 bg-violet-50 border border-violet-100 rounded-xl animate-fade-in space-y-3">
                                <div className="text-sm font-bold text-violet-900">✨ {t('members_add_title')}</div>
                                <input 
                                    type="text"
                                    value={newMemberName}
                                    onChange={e => setNewMemberName(e.target.value)}
                                    placeholder={t('members_field_name')}
                                    className="w-full p-2 bg-white border border-violet-200 rounded-lg text-sm"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setShowAddMember(false)}
                                        className="flex-1 px-3 py-2 bg-slate-200 font-bold text-xs rounded-lg"
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button 
                                        onClick={addMember}
                                        disabled={!newMemberName || isAddingMember}
                                        className="flex-1 px-3 py-2 bg-violet-600 text-white font-bold text-xs rounded-lg disabled:opacity-50"
                                    >
                                        {isAddingMember ? '...' : t('save')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {method === 'cash' && (
                        <div className="space-y-4 pt-4 border-t border-slate-200 border-dashed">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">{t('kasir_amount_received')}</label>
                                <input
                                    type="number"
                                    value={cash}
                                    onChange={e => setCash(e.target.value)}
                                    placeholder={t('cash_placeholder')}
                                    className="w-full p-4 text-xl font-bold text-center bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 text-slate-900"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-between items-center text-lg p-4 rounded-xl bg-violet-50 text-violet-700 font-bold border border-violet-100">
                                <span>{t('kasir_change')}:</span>
                                <span>Rp {change.toLocaleString(t('locale_code'))}</span>
                            </div>
                        </div>
                    )}

                    {method !== 'cash' && (
                        <div className="p-6 text-center text-sm font-black text-slate-600 bg-slate-50 rounded-xl border border-slate-200">
                            {t('kasir_payment_confirm_msg')}
                        </div>
                    )}
                </div>

                {/* Isolated Footer for Absolute Visibility */}
                <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex gap-3 shrink-0 pb-[calc(1.5rem+env(safe-area-inset-bottom, 1rem))]">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition-all text-sm sm:text-base"
                    >
                        {t('kasir_cancel')}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isValid || isProcessing}
                        className="flex-1 py-3 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-600/30 flex justify-center items-center gap-2 text-sm sm:text-base"
                    >
                        {isProcessing ? '⏳ ...' : `✅ ${t('kasir_confirm')}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
