import { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { usePlan } from '../../context/PlanContext';
import { useLang } from '../../context/LanguageContext';


export default function ReceiptModal({ isOpen, onClose, transaction, settings, setPrintMode, isFnbMode = true }) {
    const receiptRef = useRef(null);
    const { showToast } = useToast();
    const { isPremium } = usePlan();
    const { t, lang } = useLang();

    if (!isOpen || !transaction) return null;

    const handlePrint = () => {
        try {
            setPrintMode('receipt');
            // Gunakan 500ms agar Mobile tidak Blank
            setTimeout(() => {
                window.print();
            }, 500);
        } catch (err) {
            console.error('Cetak gagal:', err);
        }
    };

    const handlePrintKitchen = () => {
        try {
            setPrintMode('kitchen');
            setTimeout(() => {
                window.print();
                setPrintMode('receipt');
            }, 500);
        } catch (err) {
            console.error('Cetak Dapur gagal:', err);
            if (showToast) showToast(t('kasir_print_fail'), 'error');
        }
    };

    const shareViaWhatsApp = () => {
        const company = transaction.storeSettings || {
            name: settings?.storeName,
            phone: settings?.storePhone,
            address: settings?.storeAddress
        };

        const message = `${t('wa_hello')}\n${t('wa_find_doc').replace('{docType}', t('kasir_receipt_title')).replace('{companyName}', company.name || 'Toko Kami')}\n\n${t('wa_doc_num')}: ${transaction.receipt_number || transaction.id}\n${t('wa_doc_date')}: ${new Date(transaction.date || transaction.created_at).toLocaleDateString(t('locale_code'))}, ${new Date(transaction.date || transaction.created_at).toLocaleTimeString(t('locale_code'), { hour: '2-digit', minute: '2-digit' })}\n${t('wa_doc_total')}: Rp ${transaction.total?.toLocaleString(t('locale_code'))}\n\n${t('wa_contact_us')}\n*${company.name || 'Toko Kami'}*`;

        const encodedMessage = encodeURIComponent(message);
        const phoneNumber = transaction.customerPhone || ''; // Jika kosong, API WA akan meminta pilih kontak
        
        const waUrl = phoneNumber 
            ? `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`
            : `https://api.whatsapp.com/send?text=${encodedMessage}`;

        window.open(waUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
            <div className="flex min-h-full items-start sm:items-center justify-center p-4">
                <div
                    className="w-full max-w-sm bg-slate-100 rounded-xl shadow-2xl scale-in flex flex-col my-4 max-h-[90vh] overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                <div className="flex justify-between items-center p-4 bg-slate-900 text-white shrink-0">
                    <h2 className="font-black flex items-center gap-2">{t('kasir_receipt_title')}</h2>
                    <button onClick={onClose} className="hover:bg-slate-800 p-1 rounded transition-colors"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white mx-4 mt-4 shadow-sm relative custom-scrollbar">
                    {/* Success Animation Overlay */}
                    <div className="flex flex-col items-center justify-center py-4 mb-4 border-b border-slate-100">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce-checkmark shadow-lg shadow-emerald-200/50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <h3 className="text-emerald-700 font-black mt-3 text-sm uppercase tracking-widest">{t('kasir_payment_success') || 'PEMBAYARAN BERHASIL'}</h3>
                        
                        {/* Elite Confetti Burst (for > 500k) */}
                        {(transaction?.total || 0) >= 500000 && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {[...Array(12)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className="absolute animate-confetti"
                                        style={{
                                            left: `${Math.random() * 80 + 10}%`,
                                            top: `-20px`,
                                            backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#7C3AED'][i % 5],
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: i % 2 === 0 ? '50%' : '0',
                                            animationDelay: `${Math.random() * 1}s`,
                                            animationDuration: `${1.5 + Math.random()}s`
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sawtooth top & bottom decoration */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDIwLDEwIDEwLDAiIGZpbGw9IiNGMUY1RjkiLz48L3N2Zz4=')] rotate-180 bg-repeat-x bg-[length:20px_10px]"></div>

                    <div ref={receiptRef} className="receipt-container text-slate-800 mt-2 font-mono text-xs">
                        {/* Header */}
                        <div className="header text-center mb-4">
                            {transaction.storeSettings?.logoUrl && (
                                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                                    <img 
                                        src={transaction.storeSettings.logoUrl} 
                                        alt="Logo" 
                                        style={{ 
                                            maxHeight: '60px', 
                                            maxWidth: '160px', 
                                            objectFit: 'contain',
                                            margin: '0 auto'
                                        }} 
                                    />
                                </div>
                            )}
                            <h2 style={{ 
                                color: '#1a1a1a', 
                                fontWeight: 700, 
                                fontSize: 16, 
                                textAlign: 'center', 
                                margin: '4px 0' 
                            }}>
                                {transaction.storeSettings?.name || settings?.storeName || 'My Store'}
                            </h2>
                            {transaction.storeSettings?.address && <p className="text-[10px] text-slate-500 leading-tight">{transaction.storeSettings.address}</p>}
                            {transaction.storeSettings?.phone && <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{transaction.storeSettings.phone}</p>}
                        </div>

                        <div className="divider border-t border-dashed border-slate-300 my-3"></div>

                        <div className="mb-4">
                            <div className="row"><span>{t('kasir_receipt_no')}</span> <span>{transaction.id}</span></div>
                            <div className="row"><span>{t('kasir_receipt_date')}</span> <span>{new Date(transaction.date).toLocaleDateString(t('locale_code'))}</span></div>
                            <div className="row"><span>{t('kasir_receipt_time')}</span> <span>{new Date(transaction.date).toLocaleTimeString(t('locale_code'))} {t('timezone_label')}</span></div>
                            <div className="row"><span>{t('kasir_receipt_kasir')}</span> <span>{transaction.kasir_name || settings?.kasirName || 'Admin'}</span></div>
                        </div>

                        <div className="divider border-t border-dashed border-slate-300 my-3"></div>

                        {/* Items */}
                        <div className="mb-4 space-y-2">
                            {transaction.items.map(item => (
                                <div key={item.id} className="row">
                                    <div className="truncate pr-2">{item.name} <span className="text-slate-500">x{item.qty}</span></div>
                                    <div>{(item.price * item.qty).toLocaleString(t('locale_code'))}</div>
                                </div>
                            ))}
                        </div>

                        <div className="divider border-t border-dashed border-slate-300 my-3"></div>

                        {/* Totals */}
                        <div className="mb-4 space-y-1">
                            <div className="row">
                                <span>{t('kasir_subtotal')}:</span>
                                <span>Rp {transaction.subtotal.toLocaleString(t('locale_code'))}</span>
                            </div>
                            {(transaction?.discount_amount > 0 || transaction?.discountAmount > 0) && (
                                <div className="row">
                                    <span>
                                        {t('kasir_discount')}
                                        {['persen', 'percent', '%'].includes(transaction?.discount_type)
                                            ? ` ${transaction?.discount_value}%`
                                            : ''
                                        }:
                                    </span>
                                    <span>-Rp {(transaction?.discount_amount || transaction?.discountAmount || 0).toLocaleString(t('locale_code'))}</span>
                                </div>
                            )}
                            {(transaction?.points_redeemed > 0) && (
                        <div className="flex justify-between">
                            <span>{t('member_discount_label')} ({transaction?.points_redeemed} {t('member_points')}):</span>
                            <span>- Rp {(transaction?.points_discount_amount || transaction?.points_redeemed * 10 || 0).toLocaleString(t('locale_code'))}</span>
                        </div>
                    )}
                    {(transaction?.tax_amount > 0) && (
                        <div className="flex justify-between text-orange-600 print:text-black">
                            <span>{t('inv_tax')} {transaction?.tax_percent || 0}%:</span>
                            <span>+Rp {(transaction?.tax_amount || 0).toLocaleString(t('locale_code'))}</span>
                        </div>
                    )}
                            <div className="row font-bold text-sm mt-1">
                                <span>{t('kasir_total')}:</span>
                                <span>Rp {transaction.total.toLocaleString(t('locale_code'))}</span>
                            </div>
                        </div>

                        {/* Watermark for FREE users */}
                        {!isPremium && (
                            <div className="mt-6 pt-4 border-t border-dashed border-zinc-200 text-center">
                                <p className="text-[10px] text-zinc-400 italic">
                                    Generated by MyInvoice.space
                                </p>
                            </div>
                        )}

                        <div className="divider border-t border-dashed border-slate-300 my-3"></div>

                        {/* Payment Details */}
                        <div className="mb-4 space-y-1">
                            <div className="row">
                                <span>{t('kasir_payment_method')}:</span>
                                <span className="uppercase">{transaction.method}</span>
                            </div>
                            {transaction.method === 'cash' && (
                                <>
                                    <div className="row">
                                        <span>{t('kasir_amount_received')}:</span>
                                        <span>Rp {transaction.cash.toLocaleString(t('locale_code'))}</span>
                                    </div>
                                    <div className="row">
                                        <span>{t('kasir_change')}:</span>
                                        <span>Rp {transaction.change.toLocaleString(t('locale_code'))}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="divider border-t border-dashed border-slate-300 my-3"></div>

                        <div className="text-center font-bold mt-4 mb-2">
                            <p className="whitespace-pre-wrap">{transaction.storeSettings?.footer || t('kasir_thanks_footer')}</p>
                        </div>
                    </div>

                </div>

                <div className="p-4 bg-slate-100 flex gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-black text-slate-700 transition-colors"
                    >
                        {t('kasir_close')}
                    </button>
                    <button
                        onClick={shareViaWhatsApp}
                        className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-all shadow-md flex justify-center items-center gap-2"
                        title={t('share_wa')}
                    >
                        <span>💬</span> WA
                    </button>
                    {isFnbMode && (
                    <button
                        onClick={handlePrintKitchen}
                        className="flex-1 py-2.5 px-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-all shadow-md flex justify-center items-center gap-1 text-[10px] sm:text-xs"
                    >
                        🍳 {t('kasir_print_kitchen') || 'Cetak Dapur'}
                    </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="flex-[1.2] py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-md flex justify-center items-center gap-1 text-[10px] sm:text-xs"
                    >
                        🖨️ {t('kasir_print_receipt')}
                    </button>
                </div>
            </div>
        </div>
    </div>
    );
}
