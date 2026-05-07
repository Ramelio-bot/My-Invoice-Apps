import { forwardRef } from 'react';
import { usePlan } from '../../context/PlanContext';
import { useLang } from '../../context/LanguageContext';

const ThermalReceipt = forwardRef(({ transaction, settings, id = "thermal-receipt", printMode = 'receipt' }, ref) => {
//     const { isPremium } = usePlan();
    const { t } = useLang();

    if (!transaction) return null;

    const kitchenItems = printMode === 'kitchen' 
        ? transaction.items?.filter(item => {
            const name = (item.name || item.product_name || '').toLowerCase();
            // Saring barang yang BUKAN makanan/minuman
            const nonFnB = ['laptop', 'service', 'elektronik', 'pulsa', 'ongkir'];
            return !nonFnB.some(key => name.includes(key));
        })
        : transaction.items;

    return (
        <div
            id={id}
            ref={ref}
            className="hidden print:block bg-white text-black font-mono w-full text-left"
        >


            <div className="thermal-wrapper px-2">
                {printMode === 'kitchen' ? (
                    /* KITCHEN MODE - BIG & NO PRICE */
                    <div className="kitchen-order py-2">
                        <div className="text-center border-b-4 border-black pb-3 mb-4">
                            <h1 className="text-xl font-black uppercase tracking-tighter">{t('receipt_kitchen_order')}</h1>
                            <div className="text-[10pt] font-mono mt-1 opacity-80">
                                {new Date(transaction.date || transaction.created_at).toLocaleTimeString(t('locale_code'), { hour: '2-digit', minute: '2-digit', second: '2-digit' })} | {transaction.kasir_name || 'KASIR'}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {kitchenItems?.map((item, idx) => (
                                <div key={item.id || idx} className="flex gap-4 items-start border-b border-dotted border-gray-300 pb-3">
                                    <div className="text-3xl font-black min-w-[45px]">
                                        {item.qty || item.quantity}x
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xl font-bold leading-none uppercase">
                                            {item.name || item.product_name}
                                        </div>
                                        {item.notes && (
                                            <div className="text-base font-black bg-black text-white px-2 py-0.5 mt-2 rounded inline-block">
                                                {t('receipt_note')}: {item.notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 text-center border-t-2 border-black pt-4">
                            <div className="text-sm font-bold">{t('receipt_queue')}: {transaction.receipt_number || transaction.id?.slice(-4)}</div>
                            <div className="text-[9pt] mt-1 italic opacity-60">
                                {new Date(transaction.date || transaction.created_at).toLocaleDateString(t('locale_code'))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* RECEIPT MODE - ORIGINAL STYLE */
                    <>
                        <div className="text-center mb-4 print:break-inside-avoid border-b border-dashed border-black pb-4">
                            {transaction.storeSettings?.logoUrl && (
                                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                                    <img 
                                        src={transaction.storeSettings.logoUrl} 
                                        alt="Logo" 
                                        style={{ 
                                            maxHeight: '70px', 
                                            maxWidth: '180px', 
                                            objectFit: 'contain',
                                            margin: '0 auto'
                                        }} 
                                    />
                                </div>
                            )}
                            <h2 className="print:text-[15pt] font-black uppercase tracking-tight leading-none mb-1">
                                {transaction.storeSettings?.name || settings?.storeName || 'My Store'}
                            </h2>
                            {transaction.storeSettings?.address && <p className="print:text-[10pt] leading-tight mt-1">{transaction.storeSettings.address}</p>}
                            {transaction.storeSettings?.phone && <p className="print:text-[10pt] leading-tight mt-0.5">{transaction.storeSettings.phone}</p>}
                        </div>

                        <div className="mb-4 space-y-0.5 print:text-[11pt] print:break-inside-avoid border-b border-dashed border-black pb-4">
                            <div className="flex justify-between">
                                <span>{t('kasir_receipt_no')}</span>
                                <span className="font-bold">{transaction.receipt_number || transaction.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('kasir_receipt_date')}</span>
                                <span>{new Date(transaction.date || transaction.created_at).toLocaleDateString(t('locale_code'), { dateStyle: 'short' })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('kasir_receipt_time')}</span>
                                <span>{new Date(transaction.date || transaction.created_at).toLocaleTimeString(t('locale_code'), { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('kasir_receipt_kasir')}</span>
                                <span>{transaction.kasir_name || transaction.employee_name || 'Admin'}</span>
                            </div>
                            {transaction.clientName && (
                                <div className="flex justify-between mt-2 pt-2 border-t border-dotted border-gray-400">
                                    <span>{t('kasir_receipt_client')}</span>
                                    <span className="truncate ml-2">{transaction.clientName}</span>
                                </div>
                            )}
                        </div>

                        {/* Items */}
                        <div className="mb-4 space-y-2 print:text-[11pt]">
                            {transaction.items?.map((item, idx) => (
                                <div key={item.id || idx} className="flex flex-col print:break-inside-avoid">
                                    <div className="flex justify-between gap-2">
                                        <span className="flex-1 leading-tight font-bold truncate max-w-[65%]">{item.name || item.product_name}</span>
                                        <span className="whitespace-nowrap font-black">
                                            {((item.price || 0) * (item.qty || item.quantity || 0)).toLocaleString(t('locale_code'))}
                                        </span>
                                    </div>
                                    <div className="print:text-[10pt] opacity-70">
                                        {item.qty || item.quantity} x {(item.price || 0).toLocaleString(t('locale_code'))}
                                    </div>
                                    {item.notes && <div className="text-[9pt] italic mt-0.5 text-slate-600">*{item.notes}</div>}
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-black my-4"></div>

                        {/* Totals */}
                        <div className="mb-4 space-y-1 print:text-[11pt] print:break-inside-avoid">
                            <div className="flex justify-between">
                                <span>{t('kasir_subtotal')}:</span>
                                <span>{transaction.subtotal?.toLocaleString(t('locale_code'))}</span>
                            </div>
                            {(transaction?.discount_amount > 0 || transaction?.discountAmount > 0) && (
                                <div className="flex justify-between">
                                    <span>
                                        {t('kasir_discount')}
                                        {['persen', 'percent', '%'].includes(transaction?.discount_type)
                                            ? ` ${transaction?.discount_value}%`
                                            : ''
                                        }:
                                    </span>
                                    <span>-{(transaction?.discount_amount || transaction?.discountAmount || 0).toLocaleString(t('locale_code'))}</span>
                                </div>
                            )}
                            {(transaction?.points_redeemed > 0) && (
                                <div className="flex justify-between">
                                    <span>{t('member_discount_label')}:</span>
                                    <span>-{(transaction?.points_discount_amount || transaction?.points_redeemed * 10 || 0).toLocaleString(t('locale_code'))}</span>
                                </div>
                            )}
                            {(transaction?.tax_amount > 0) && (
                                <div className="flex justify-between">
                                    <span>{t('inv_tax')} {transaction?.tax_percent || 0}%:</span>
                                    <span>+{(transaction?.tax_amount || 0).toLocaleString(t('locale_code'))}</span>
                                </div>
                            )}
                            <div className="flex justify-between print:text-[14pt] font-black mt-1 pt-1 border-t border-black">
                                <span>{t('kasir_total')}:</span>
                                <span>{transaction.total?.toLocaleString(t('locale_code'))}</span>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="mb-4 space-y-0.5 print:text-[11pt] print:break-inside-avoid border-t border-dashed border-black pt-4">
                            <div className="flex justify-between">
                                <span>{t('kasir_payment_method')}:</span>
                                <span className="uppercase font-bold">{transaction.method || transaction.payment_method}</span>
                            </div>
                            {(transaction.method === 'cash' || transaction.payment_method === 'cash') && (
                                <>
                                    <div className="flex justify-between">
                                        <span>{t('kasir_amount_received')}:</span>
                                        <span>{(transaction.cash || transaction.amount_received || 0).toLocaleString(t('locale_code'))}</span>
                                    </div>
                                    <div className="flex justify-between font-bold">
                                        <span>{t('kasir_change')}:</span>
                                        <span>{(transaction.change || (transaction.amount_received - transaction.total) || 0).toLocaleString(t('locale_code'))}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Loyalty Points Info */}
                        {(transaction.points_earned > 0 || transaction.points_redeemed > 0) && (
                            <div className="mb-4 space-y-0.5 print:text-[11pt] print:break-inside-avoid border-t border-dotted border-black pt-4">
                                {transaction.points_earned > 0 && (
                                    <div className="flex justify-between">
                                        <span>{t('member_earn')}:</span>
                                        <span className="font-bold">+{transaction.points_earned.toLocaleString(t('locale_code'))}</span>
                                    </div>
                                )}
                                {transaction.points_redeemed > 0 && (
                                    <div className="flex justify-between">
                                        <span>{t('member_redeem_label')}:</span>
                                        <span className="font-bold">-{transaction.points_redeemed.toLocaleString(t('locale_code'))}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="text-center mt-6 mb-2 print:break-inside-avoid border-t border-black pt-4">
                            <p className="print:text-[11pt] font-bold leading-tight mb-1">{transaction.storeSettings?.footer || settings?.footerText || t('kasir_thanks_footer')}</p>
                            <p className="print:text-[9pt] opacity-60">Powered by myinvoice.space</p>
                        </div>
                        <div className="h-8 print:block hidden"></div>
                    </>
                )}
            </div>
        </div>
    );
});

ThermalReceipt.displayName = 'ThermalReceipt';

export default ThermalReceipt;
