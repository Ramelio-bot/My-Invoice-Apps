import { useState } from 'react';
import { Trash2, ShoppingCart, Plus, Minus, List, Save, X as XIcon, Tag, X, User, Package } from 'lucide-react';
import { useLang } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function Cart({ 
    cart, 
    onUpdateQty, 
    onRemoveItem, 
    onClear, 
    onCheckout, 
    discount, 
    setDiscount, 
    tax, 
    setTax, 
    onSaveBill, 
    onShowSavedBills, 
    clients = [], 
    selectedClient, 
    setSelectedClient, 
    onPrintKitchen, 
    isFnbMode = true 
}) {
    const { t } = useLang();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [voucherInput, setVoucherInput] = useState('');
    const [isVerifyingVoucher, setIsVerifyingVoucher] = useState(false);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountAmount = discount.type === 'persen'
        ? Math.floor(subtotal * (discount.value / 100))
        : discount.value || 0;

    const total = Math.max(0, subtotal - discountAmount);
    const taxPercent = parseFloat(tax) || 0;
    const taxAmount = Math.floor(total * (taxPercent / 100));
    const grandTotal = total + taxAmount;
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

    const applyVoucher = async () => {
        if (!voucherInput.trim()) return;
        setIsVerifyingVoucher(true);

        try {
            let voucherQuery = supabase
                .from('kasir_vouchers')
                .select('*')
                .eq('code', voucherInput.toUpperCase());
            if (user?.id) {
                voucherQuery = voucherQuery.eq('user_id', user.id);
            }
            const { data, error } = await voucherQuery.maybeSingle();

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
                showToast(`${t('voucher_min_purchase')} Rp ${data.min_purchase.toLocaleString(t('locale_code'))}`, 'error');
                return;
            }

            setDiscount({
                type: data.discount_type,
                value: data.discount_value,
                code: data.code
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
        <div className="flex flex-col flex-1 min-h-0 w-full h-full bg-white">

            {/* Unified Cart Header */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-950 text-white flex items-center justify-center">
                        <ShoppingCart size={13} />
                    </div>
                    <h2 className="font-black text-sm text-slate-900 tracking-tight">
                        {t('kasir_cart')}
                    </h2>
                    <span className="bg-slate-200/80 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {totalItems} Item
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button 
                        type="button"
                        onClick={onShowSavedBills} 
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors flex items-center gap-1"
                    >
                        <List size={13} /> 
                        <span className="hidden sm:inline">{t('kasir_open_bills')}</span>
                    </button>
                    {cart.length > 0 && (
                        <button 
                            type="button"
                            onClick={onClear} 
                            className="px-2 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1"
                            title={t('kasir_clear_cart')}
                        >
                            <Trash2 size={13} />
                            <span className="hidden sm:inline">{t('kasir_clear_cart') || 'Kosongkan'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Client Input/Select */}
            <div className="px-4 py-2.5 border-b border-slate-100 bg-white shrink-0">
                <div className="relative">
                    <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        list="client-options"
                        placeholder={t('kasir_customer_name_placeholder') || 'Nama Pelanggan (Opsional)...'}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:ring-1 focus:ring-slate-900 focus:bg-white outline-none transition-all text-slate-900 placeholder:text-slate-400"
                    />
                </div>
                {clients && clients.length > 0 && (
                    <datalist id="client-options">
                        {clients.map(c => (
                            <option key={c.id} value={c.name} />
                        ))}
                    </datalist>
                )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 scrollbar-hide custom-scrollbar">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3 text-slate-300 border border-slate-100">
                            <ShoppingCart size={22} />
                        </div>
                        <p className="text-xs font-bold text-slate-500">{t('kasir_cart_empty') || 'Keranjang masih kosong'}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Pilih produk di katalog untuk mulai transaksi</p>
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.id} className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition-all group">
                            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/70 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden shadow-2xs">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Package size={16} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-xs text-slate-900 truncate pr-2">{item.name}</h4>
                                    <button 
                                        type="button"
                                        onClick={() => onRemoveItem(item.id)} 
                                        className="text-slate-300 hover:text-rose-600 transition-colors p-0.5"
                                    >
                                        <XIcon size={13} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-lg p-0.5 shadow-2xs">
                                        <button
                                            type="button"
                                            onClick={() => onUpdateQty(item.id, item.qty - 1)}
                                            className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
                                        >
                                            <Minus size={10} />
                                        </button>
                                        <span className="text-xs font-black text-slate-900 font-mono min-w-[14px] text-center">{item.qty}</span>
                                        <button
                                            type="button"
                                            onClick={() => onUpdateQty(item.id, item.qty + 1)}
                                            disabled={item.qty >= item.stock}
                                            className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors"
                                        >
                                            <Plus size={10} />
                                        </button>
                                    </div>
                                    <span className="font-black text-xs text-slate-950 font-mono">
                                        Rp {(item.price * item.qty).toLocaleString(t('locale_code'))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Cart Summary */}
            <div className="bg-slate-50/70 border-t border-slate-200/80 p-3.5 space-y-2.5 shrink-0">
                <div className="space-y-1.5 text-xs">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center text-slate-600">
                        <span className="font-semibold uppercase tracking-wider text-[10px]">{t('kasir_subtotal')}</span>
                        <span className="font-bold text-slate-900 font-mono">Rp {subtotal.toLocaleString(t('locale_code'))}</span>
                    </div>

                    {/* Diskon & Voucher */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium">{t('kasir_discount')}</span>
                            <div className="flex bg-white border border-slate-200 rounded-md overflow-hidden text-[10px]">
                                <button
                                    type="button"
                                    onClick={() => setDiscount({ type: 'nominal', value: 0 })}
                                    className={`px-1.5 py-0.5 font-bold ${discount.type === 'nominal' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    Rp
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDiscount({ type: 'persen', value: 0 })}
                                    className={`px-1.5 py-0.5 font-bold ${discount.type === 'persen' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    %
                                </button>
                                {discount.code && (
                                    <button
                                        type="button"
                                        onClick={() => setDiscount({ type: 'nominal', value: 0 })}
                                        className="px-1.5 py-0.5 font-bold bg-amber-100 text-amber-700 flex items-center gap-1"
                                        title="Hapus Voucher"
                                    >
                                        <Tag size={9} /> {discount.code} <X size={9} className="inline" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {!discount.code ? (
                            <div className="w-20">
                                <input
                                    type="number"
                                    value={discount.value || ''}
                                    onChange={e => {
                                        const rawValue = parseFloat(e.target.value) || 0;
                                        const safeValue = Math.max(0, Math.abs(rawValue));
                                        setDiscount({ ...discount, value: safeValue });
                                    }}
                                    min="0"
                                    max={discount.type === 'persen' ? 100 : subtotal}
                                    className="w-full text-right py-0.5 px-1.5 text-xs bg-white border border-slate-200 rounded-md font-mono focus:ring-1 focus:ring-slate-900 text-slate-900 outline-none"
                                />
                            </div>
                        ) : (
                            <div className="font-bold text-rose-600 font-mono">- Rp {discountAmount.toLocaleString(t('locale_code'))}</div>
                        )}
                    </div>

                    {/* Input Voucher Code */}
                    {!discount.code && (
                        <div className="flex gap-1.5 pt-0.5">
                            <input
                                type="text"
                                placeholder={t('voucher_code') || 'KODE VOUCHER'}
                                value={voucherInput}
                                onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                                onKeyDown={e => e.key === 'Enter' && applyVoucher()}
                                className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 uppercase placeholder:normal-case font-mono focus:ring-1 focus:ring-slate-900 outline-none"
                            />
                            <button
                                type="button"
                                onClick={applyVoucher}
                                disabled={!voucherInput.trim() || isVerifyingVoucher}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-lg text-xs transition-colors"
                            >
                                {isVerifyingVoucher ? '...' : (t('voucher_apply') || 'Gunakan')}
                            </button>
                        </div>
                    )}

                    {/* Pajak */}
                    <div className="flex justify-between items-center text-slate-600">
                        <span className="font-medium">{t('inv_tax').replace(' (%)', '')}</span>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={tax || ''}
                                onChange={e => setTax && setTax(e.target.value)}
                                placeholder="0"
                                className="w-12 text-right px-1.5 py-0.5 text-xs font-mono font-bold border border-slate-200 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                            />
                            <span className="text-slate-400 text-xs">%</span>
                            {taxAmount > 0 && (
                                <span className="font-bold text-orange-600 text-xs font-mono">
                                    +Rp {taxAmount.toLocaleString(t('locale_code'))}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Total Bayar Highlight */}
                <div className="flex justify-between items-baseline pt-2.5 border-t border-slate-200 border-dashed">
                    <span className="font-black text-xs uppercase tracking-wider text-slate-900">{t('kasir_total')}</span>
                    <span className="font-black text-lg text-slate-950 font-mono tracking-tight">
                        Rp {grandTotal.toLocaleString(t('locale_code'))}
                    </span>
                </div>
            </div>

            {/* Actions Button Area */}
            <div className="p-3 bg-white border-t border-slate-200/80 shrink-0 space-y-2">
                <div className={`grid ${isFnbMode ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                    {isFnbMode && (
                        <button
                            type="button"
                            onClick={onPrintKitchen}
                            disabled={cart.length === 0}
                            className="w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-2xs transition-all flex justify-center items-center gap-1.5 active:scale-98"
                        >
                            {t('kasir_print_kitchen') || 'Cetak Dapur'}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onSaveBill}
                        disabled={cart.length === 0}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed text-slate-800 rounded-xl font-bold text-xs transition-all flex justify-center items-center gap-1.5 active:scale-98"
                    >
                        <Save size={13} /> {t('kasir_save')}
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onCheckout}
                    disabled={cart.length === 0}
                    className="w-full py-3 bg-slate-950 hover:bg-black disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm shadow-md transition-all flex justify-center items-center gap-2 active:scale-98 cursor-pointer"
                >
                    <ShoppingCart size={15} />
                    <span>
                        {cart.length === 0 
                            ? (t('kasir_cart_empty') || 'Keranjang Kosong') 
                            : `${t('kasir_pay')} (Rp ${grandTotal.toLocaleString(t('locale_code'))})`}
                    </span>
                </button>
            </div>

        </div>
    );
}
