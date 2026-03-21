import { forwardRef } from 'react';
import { usePlan } from '../../context/PlanContext';
import { useLang } from '../../context/LanguageContext';

const ThermalReceipt = forwardRef(({ transaction, settings, id = "thermal-receipt" }, ref) => {
    const { isPremium } = usePlan();
    const { t, lang } = useLang();

    if (!transaction) return null;

    return (
        <div
            id={id}
            ref={ref}
            className="hidden print:block bg-white text-black font-mono text-sm leading-tight print:w-full print:max-w-none print:mx-0 print:bg-white print:text-black print:p-12"
        >
            <style dangerouslySetInnerHTML={{ __html: '@media print { @page { margin: 1cm; size: A4; } }' }} />

            <div className="print:max-w-[180mm] print:mx-auto">
                <div className="text-center mb-10 print:break-inside-avoid">
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
                    }} className="print:text-6xl">
                        {transaction.storeSettings?.name || settings?.storeName || 'My Store'}
                    </h2>
                    {transaction.storeSettings?.address && <p className="text-xs print:text-3xl mt-2">{transaction.storeSettings.address}</p>}
                    {transaction.storeSettings?.phone && <p className="text-xs print:text-3xl mt-1">{transaction.storeSettings.phone}</p>}
                </div>

                <div className="border-t-2 border-dashed border-black my-6"></div>

                {/* Transaction Info - Grouped to avoid break */}
                <div className="mb-10 space-y-1 print:space-y-4 print:text-3xl print:break-inside-avoid">
                    <div className="flex justify-between">
                        <span>{t('kasir_receipt_no')}</span>
                        <span className="text-right">{transaction.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t('kasir_receipt_date')}</span>
                        <span className="text-right">{new Date(transaction.date).toLocaleDateString(lang === 'ID' ? 'id-ID' : 'en-US')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t('kasir_receipt_time')}</span>
                        <span className="text-right">{new Date(transaction.date).toLocaleTimeString(lang === 'ID' ? 'id-ID' : 'en-US')} {lang === 'ID' ? 'WIB' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t('kasir_receipt_kasir')}</span>
                        <span className="text-right">{transaction.kasir_name || settings?.kasirName || 'Admin'}</span>
                    </div>
                    {transaction.clientName && (
                        <div className="flex justify-between mt-4 pt-4 border-t border-dotted border-gray-400">
                            <span>{t('kasir_receipt_client')}</span>
                            <span className="text-right truncate">{transaction.clientName}</span>
                        </div>
                    )}
                </div>

                <div className="border-t-2 border-dashed border-black my-6"></div>

                {/* Items - Each item avoids breaking */}
                <div className="mb-10 space-y-4 print:space-y-8">
                    {transaction.items?.map((item, idx) => (
                        <div key={item.id || idx} className="flex flex-col print:break-inside-avoid">
                            <div className="truncate w-full font-semibold print:text-4xl">{item.name}</div>
                            <div className="flex justify-between pl-4 print:pl-10 print:text-3xl">
                                <span>{item.qty} x {(item.price).toLocaleString('id-ID')}</span>
                                <span>{((item.price || 0) * (item.qty || 0)).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t-2 border-dashed border-black my-6"></div>

                {/* Totals - Grouped to avoid break */}
                <div className="mb-10 space-y-1 print:space-y-4 print:text-3xl print:break-inside-avoid">
                    <div className="flex justify-between">
                        <span>{t('kasir_subtotal')}:</span>
                        <span>Rp {transaction.subtotal?.toLocaleString('id-ID')}</span>
                    </div>
                    {transaction.discountAmount > 0 && (
                        <div className="flex justify-between">
                            <span>{t('kasir_discount')}:</span>
                            <span>- Rp {transaction.discountAmount?.toLocaleString('id-ID')}</span>
                        </div>
                    )}
                    {transaction.tax_amount > 0 && (
                        <div className="flex justify-between text-orange-600 print:text-black">
                            <span>{lang === 'ID' ? 'Pajak' : 'Tax'} ({transaction.tax_percent}%):</span>
                            <span>+Rp {transaction.tax_amount?.toLocaleString('id-ID')}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-base print:text-5xl mt-4 pt-4 border-t-4 border-black">
                        <span>{t('kasir_total')}:</span>
                        <span>Rp {transaction.total?.toLocaleString('id-ID')}</span>
                    </div>
                </div>

                <div className="border-t-2 border-dashed border-black my-6"></div>

                {/* Payment Info - Grouped to avoid break */}
                <div className="mb-10 space-y-1 print:space-y-4 print:text-3xl print:break-inside-avoid">
                    <div className="flex justify-between">
                        <span>{t('kasir_payment_method')}:</span>
                        <span className="uppercase">{transaction.method}</span>
                    </div>
                    {transaction.method === 'cash' && (
                        <>
                            <div className="flex justify-between">
                                <span>{t('kasir_amount_received')}:</span>
                                <span>Rp {transaction.cash?.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('kasir_change')}:</span>
                                <span>Rp {transaction.change?.toLocaleString('id-ID')}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Loyalty Points Info - Grouped to avoid break */}
                {(transaction.points_earned > 0 || transaction.points_redeemed > 0) && (
                    <>
                        <div className="border-t-2 border-dashed border-black my-6"></div>
                        <div className="mb-10 space-y-1 print:space-y-4 print:text-3xl print:break-inside-avoid">
                            {transaction.points_earned > 0 && (
                                <div className="flex justify-between font-bold">
                                    <span>{lang === 'ID' ? 'Poin Didapat' : 'Points Earned'}:</span>
                                    <span>+{transaction.points_earned.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            {transaction.points_redeemed > 0 && (
                                <div className="flex justify-between font-bold text-red-600 print:text-black">
                                    <span>{lang === 'ID' ? 'Poin Dipakai' : 'Points Redeemed'}:</span>
                                    <span>-{transaction.points_redeemed.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div className="border-t-2 border-dashed border-black my-6"></div>

                {/* Footer */}
                <div className="text-center font-bold mt-10 mb-2 print:break-inside-avoid">
                    <p className="print:text-4xl whitespace-pre-wrap font-normal leading-relaxed">{transaction.storeSettings?.footer || t('kasir_thanks')}</p>
                    {!isPremium && <p className="text-xs print:text-2xl mt-4 text-slate-500 font-normal opacity-50 italic">Generated by MyInvoice.space</p>}
                </div>
                <div className="h-12 print:block hidden"></div>
            </div>
        </div>
    );
});

ThermalReceipt.displayName = 'ThermalReceipt';

export default ThermalReceipt;
