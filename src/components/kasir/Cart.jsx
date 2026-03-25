import { useState } from 'react';
import { Trash2, ShoppingCart, Percent, DollarSign, Plus, Minus, List, Save, X as XIcon, Tag } from 'lucide-react';
import { useLang } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Cart({ cart, onUpdateQty, onRemoveItem, onClear, onCheckout, discount, setDiscount, tax, setTax, onSaveBill, onShowSavedBills, clients = [], selectedClient, setSelectedClient }) {
    const { t } = useLang();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [voucherInput, setVoucherInput] = useState('');
    const [isVerifyingVoucher, setIsVerifyingVoucher] = useState(false);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountAmount = discount.type === 'persen'
        ? Math.floor(subtotal * (discount.value / 100))
        : discount.type === 'voucher' ? discount.value : discount.value;

    const total = Math.max(0, subtotal - discountAmount);
    const taxPercent = parseFloat(tax) || 0;
    const taxAmount = Math.floor(total * (taxPercent / 100));
    const grandTotal = total + taxAmount;

    const applyVoucher = async () => {
        if (!voucherInput.trim()) return;
        setIsVerifyingVoucher(true);

        try {
            const { data, error } = await supabase
                .from('kasir_vouchers')
                .select('*')
                .eq('code', voucherInput.toUpperCase())
                .maybeSingle();

            if (error || !data) {
                showToast(t('voucher_not_found') || 'Kode voucher tidak ditemukan', 'error');
                return;
            }

            if (!data.is_active) {
                showToast(t('voucher_inactive') || 'Voucher ini sedang tidak aktif', 'error');
                return;
            }

            if (new Date(data.valid_until) < new Date()) {
                showToast(t('voucher_expired') || 'Voucher sudah kadaluarsa', 'error');
                return;
            }

            if (data.max_uses > 0 && data.used_count >= data.max_uses) {
                showToast(t('voucher_max_used') || 'Voucher sudah mencapai batas penggunaan', 'error');
                return;
            }

            if (data.min_purchase > 0 && subtotal < data.min_purchase) {
                showToast(`${t('voucher_min_purchase')} Rp ${data.min_purchase.toLocaleString('id-ID')}`, 'error');
                return;
            }

            // Valid!
            let val = data.discount_value;
            if (data.discount_type === 'persen') {
                 // Convert percent to nominal relative to current subtotal to max out properly against future subtotal changes if we store absolute,
                 // Wait, we can store it as either nominal, persen, or voucher type containing both to re-evaluate dynamically.
                 // To make it simple, we can store type 'voucher' and apply math dynamically.
            }
            
            // To be precise with existing discount format: 
            setDiscount({
                type: data.discount_type, // 'nominal' or 'persen'
                value: data.discount_value,
                code: data.code // Keep track of the code for checkout handling!
            });
            showToast(t('voucher_applied') || 'Voucher berhasil diterapkan!', 'success');
            setVoucherInput('');

        } catch (err) {
            console.error('Voucher verification error', err);
            showToast(t('kasir_process_fail'), 'error');
        } finally {
            setIsVerifyingVoucher(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-1 lg:min-h-0 w-full lg:h-full">

            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
                <h2 className="font-bold text-lg flex items-center gap-2 dark:text-white">
                    <ShoppingCart size={20} className="text-violet-500" />
                    {t('kasir_cart')}
                </h2>
                <div className="flex items-center gap-3">
                    <button onClick={onShowSavedBills} className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-1">
                        <List size={14} /> {t('kasir_open_bills')}
                    </button>
                    {cart.length > 0 && (
                        <button onClick={onClear} className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1">
                            <Trash2 size={14} /> {t('kasir_clear_cart')}
                        </button>
                    )}
                </div>
            </div>

            {/* Client Input/Select */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
                <input
                    type="text"
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    list="client-options"
                    placeholder={t('kasir_customer_name_placeholder')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium"
                />
                {clients && clients.length > 0 && (
                    <datalist id="client-options">
                        {clients.map(c => (
                            <option key={c.id} value={c.name} />
                        ))}
                    </datalist>
                )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scrollbar-hide lg:custom-scrollbar">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 py-10">
                        <ShoppingCart size={48} className="opacity-20 mb-3" />
                        <p className="text-sm">{t('kasir_cart_empty')}</p>
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 hover:shadow-md transition-all group">
                            <div className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600 text-2xl">
                                {item.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate pr-2">{item.name}</h4>
                                    <button onClick={() => onRemoveItem(item.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <XIcon size={16} />
                                    </button>
                                </div>
                                <div className="text-xs text-slate-700 dark:text-slate-400 mb-2 font-bold">
                                    Rp {item.price.toLocaleString('id-ID')}
                                </div>
                                <div className="flex items-center justify-between">
                                    {/* Qty Controls */}
                                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-7">
                                        <button
                                            onClick={() => onUpdateQty(item.id, item.qty - 1)}
                                            className="w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        >
                                            <Minus size={12} />
                                        </button>
                                        <span className="text-xs font-bold dark:text-white w-4 text-center">{item.qty}</span>
                                        <button
                                            onClick={() => onUpdateQty(item.id, item.qty + 1)}
                                            disabled={item.qty >= item.stock}
                                            className="w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                    <span className="font-bold text-sm dark:text-white">
                                        Rp {(item.price * item.qty).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Cart Summary */}
            <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 space-y-4 flex-shrink-0">

                {/* Discount Toggle & Input */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-black uppercase tracking-wider text-[10px]">{t('kasir_subtotal')}</span>
                        <span className="font-black text-slate-900 dark:text-white">Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">{t('kasir_discount')}</span>
                            <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden">
                                <button
                                    onClick={() => setDiscount({ type: 'nominal', value: 0 })}
                                    className={`px-2 py-0.5 text-[10px] font-bold ${discount.type === 'nominal' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    Rp
                                </button>
                                <button
                                    onClick={() => setDiscount({ type: 'persen', value: 0 })}
                                    className={`px-2 py-0.5 text-[10px] font-bold ${discount.type === 'persen' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    %
                                </button>
                                {discount.code && (
                                    <button
                                        onClick={() => setDiscount({ type: 'nominal', value: 0 })}
                                        className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 flex items-center gap-1"
                                        title="Remove Voucher"
                                    >
                                        <Tag size={10} /> {discount.code} ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {!discount.code && (
                            <div className="relative w-24">
                                <input
                                    type="number"
                                    value={discount.value || ''}
                                    onChange={e => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
                                    min="0"
                                    max={discount.type === 'persen' ? 100 : subtotal}
                                    className="w-full text-right py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-violet-500 dark:text-white"
                                />
                            </div>
                        )}
                        {discount.code && (
                           <div className="font-bold text-red-500">- Rp {discountAmount.toLocaleString('id-ID')}</div>
                        )}
                    </div>
                    
                    {!discount.code && (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder={t('voucher_code')}
                            value={voucherInput}
                            onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && applyVoucher()}
                            className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white uppercase placeholder:normal-case font-mono focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                        />
                        <button
                            onClick={applyVoucher}
                            disabled={!voucherInput.trim() || isVerifyingVoucher}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-black disabled:bg-slate-300 dark:disabled:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-lg text-sm transition-colors"
                        >
                            {isVerifyingVoucher ? '...' : t('voucher_apply')}
                        </button>
                    </div>
                    )}

                    {/* Pajak */}
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{t('inv_tax').replace(' (%)', '')}</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={tax || ''}
                                onChange={e => setTax && setTax(e.target.value)}
                                placeholder="0"
                                className="w-14 text-right px-2 py-1 text-sm font-bold border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white focus:ring-1 focus:ring-violet-500 focus:outline-none"
                            />
                            <span className="text-slate-400 text-sm">%</span>
                            {taxAmount > 0 && (
                                <span className="font-bold text-orange-500 text-sm">
                                    +Rp {taxAmount.toLocaleString('id-ID')}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 border-dashed">
                        <span className="font-black text-lg text-slate-900 dark:text-white">{t('kasir_total')}</span>
                        <span className="font-black text-xl text-violet-600 dark:text-violet-400">
                            Rp {grandTotal.toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>

            </div>

            {/* Buttons Area - Sticky for Mobile Anti-Cutoff */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 p-4 pb-[calc(env(safe-area-inset-bottom,1rem)+1rem)] border-t border-slate-200 dark:border-slate-700 z-30 shrink-0">
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onSaveBill}
                        disabled={cart.length === 0}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex justify-center items-center gap-2"
                    >
                        <Save size={16} /> {t('kasir_save')}
                    </button>
                    <button
                        onClick={onCheckout}
                        disabled={cart.length === 0}
                        className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-600/20 transition-all flex justify-center items-center gap-2"
                    >
                        {t('kasir_pay')}
                    </button>
                </div>
            </div>

        </div>
    );
}
