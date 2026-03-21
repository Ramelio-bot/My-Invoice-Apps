import { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { usePlan } from '../../context/PlanContext';
import { useLang } from '../../context/LanguageContext';

export default function ReceiptModal({ isOpen, onClose, transaction, settings }) {
    const receiptRef = useRef(null);
    const { showToast } = useToast();
    const { isPremium } = usePlan();
    const { t } = useLang();

    if (!isOpen || !transaction) return null;

    const handlePrint = () => {
        try {
            window.print();
        } catch (err) {
            console.error('Cetak gagal:', err);
            if (showToast) showToast('Gagal mencetak struk.', 'error');
        }
    };

    const shareViaWhatsApp = () => {
        const formatRp = (num) => 'Rp ' + (num || 0).toLocaleString('id-ID')
        const items = transaction.items.map(item =>
            `• ${item.name} x${item.qty} = ${formatRp(item.price * item.qty)}`
        ).join('\n')

        const message = `
🧾 *STRUK PEMBELIAN*
${transaction.storeSettings?.name || settings?.storeName || 'My Store'}
${transaction.storeSettings?.address || settings?.storeAddress || ''}
${new Date(transaction.date || new Date()).toLocaleString('id-ID')}
─────────────────
${items}
─────────────────
*TOTAL: ${formatRp(transaction.total)}*
Metode: ${transaction.method}
${transaction.discountAmount > 0 ? `Diskon: -${formatRp(transaction.discountAmount)}` : ''}

Terima kasih telah berbelanja! 🙏
${transaction.storeSettings?.footer || settings?.storeFooter || ''}
        `.trim()

        const phone = transaction.customerPhone || ''
        const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
            <div className="flex min-h-full items-start sm:items-center justify-center p-4">
                <div
                    className="w-full max-w-sm bg-slate-100 dark:bg-slate-800 rounded-xl shadow-2xl animate-fade-in-up flex flex-col my-4 max-h-[90vh] overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                <div className="flex justify-between items-center p-4 bg-slate-800 text-white shrink-0">
                    <h2 className="font-bold flex items-center gap-2">{t('kasir_receipt_title')}</h2>
                    <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded transition-colors"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white mx-4 mt-4 shadow-sm relative custom-scrollbar">
                    {/* Sawtooth top & bottom decoration */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDIwLDEwIDEwLDAiIGZpbGw9IiNGMUY1RjkiLz48L3N2Zz4=')] rotate-180 bg-repeat-x bg-[length:20px_10px]"></div>

                    <div ref={receiptRef} className="receipt-container text-slate-800 mt-2 font-mono text-xs">
                        {/* Header */}
                        <div className="header text-center mb-4">
                            {transaction.storeSettings?.logoUrl && (
                                <img src={transaction.storeSettings.logoUrl} alt="Logo" className="logo mx-auto mb-2 opacity-80 mix-blend-multiply" />
                            )}
                            <h2 className="font-bold text-lg mb-1">{transaction.storeSettings?.name || 'My Store'}</h2>
                            {transaction.storeSettings?.address && <p className="text-[10px] text-slate-500 leading-tight">{transaction.storeSettings.address}</p>}
                            {transaction.storeSettings?.phone && <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{transaction.storeSettings.phone}</p>}
                        </div>

                        <div className="divider border-t border-dashed border-slate-300 my-3"></div>

                        <div className="mb-4">
                            <div className="row"><span>{t('kasir_receipt_no')}</span> <span>{transaction.id}</span></div>
                            <div className="row"><span>{t('kasir_receipt_date')}</span> <span>{new Date(transaction.date).toLocaleDateString('id-ID')}</span></div>
                            <div className="row"><span>{t('kasir_receipt_time')}</span> <span>{new Date(transaction.date).toLocaleTimeString('id-ID')} WIB</span></div>
                            <div className="row"><span>{t('kasir_receipt_kasir')}</span> <span>{transaction.kasir_name || settings?.kasirName || 'Admin'}</span></div>
                        </div>

                        <div className="divider border-t border-dashed border-slate-300 my-3"></div>

                        {/* Items */}
                        <div className="mb-4 space-y-2">
                            {transaction.items.map(item => (
                                <div key={item.id} className="row">
                                    <div className="truncate pr-2">{item.name} <span className="text-slate-500">x{item.qty}</span></div>
                                    <div>{(item.price * item.qty).toLocaleString('id-ID')}</div>
                                </div>
                            ))}
                        </div>

                        <div className="divider border-t border-dashed border-slate-300 my-3"></div>

                        {/* Totals */}
                        <div className="mb-4 space-y-1">
                            <div className="row">
                                <span>{t('kasir_subtotal')}:</span>
                                <span>Rp {transaction.subtotal.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="row">
                                <span>{t('kasir_discount')}:</span>
                                <span>Rp {transaction.discountAmount.toLocaleString('id-ID')}</span>
                            </div>
                            {transaction.tax_amount > 0 && (
                                <div className="row">
                                    <span>Pajak ({transaction.tax_percent}%):</span>
                                    <span>+Rp {transaction.tax_amount.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            <div className="row font-bold text-sm mt-1">
                                <span>{t('kasir_total')}:</span>
                                <span>Rp {transaction.total.toLocaleString('id-ID')}</span>
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
                                <span>Metode:</span>
                                <span className="uppercase">{transaction.method}</span>
                            </div>
                            {transaction.method === 'cash' && (
                                <>
                                    <div className="row">
                                        <span>{t('kasir_amount_received')}:</span>
                                        <span>Rp {transaction.cash.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="row">
                                        <span>{t('kasir_change')}:</span>
                                        <span>Rp {transaction.change.toLocaleString('id-ID')}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="divider border-t border-dashed border-slate-300 my-3"></div>

                        <div className="text-center font-bold mt-4 mb-2">
                            <p className="whitespace-pre-wrap">{transaction.storeSettings?.footer || t('kasir_thanks')}</p>
                        </div>
                    </div>

                </div>

                <div className="p-4 bg-slate-100 dark:bg-slate-800 flex gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg font-bold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                        {t('kasir_close')}
                    </button>
                    <button
                        onClick={shareViaWhatsApp}
                        className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg font-bold transition-all shadow-md flex justify-center items-center gap-2"
                        title={t('share_wa')}
                    >
                        <span>💬</span> WA
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-[1.5] py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-md flex justify-center items-center gap-2"
                    >
                        🖨️ <span className="hidden sm:inline">{t('kasir_print_receipt')}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    );
}
