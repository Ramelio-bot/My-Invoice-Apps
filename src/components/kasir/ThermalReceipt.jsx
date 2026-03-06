import { forwardRef } from 'react';
import { usePlan } from '../../context/PlanContext';

const ThermalReceipt = forwardRef(({ transaction, settings, id = "thermal-receipt" }, ref) => {
    const { isPremium } = usePlan();

    if (!transaction) return null;

    return (
        <div
            id={id}
            ref={ref}
            className="hidden print:block bg-white text-black font-mono text-sm leading-tight print:w-full print:max-w-none print:mx-0 print:bg-white print:text-black print:p-12"
        >
            <style dangerouslySetInnerHTML={{ __html: '@media print { @page { margin: 1cm; size: A4; } }' }} />

            <div className="print:max-w-[180mm] print:mx-auto">
                {/* Header */}
                <div className="text-center mb-10 print:break-inside-avoid">
                    {settings?.logoUrl && (
                        <img src={settings.logoUrl} alt="Logo" className="max-w-[100px] print:max-w-[300px] mx-auto mb-6 opacity-80 mix-blend-multiply" />
                    )}
                    <h2 className="font-bold text-lg print:text-6xl mb-2">{settings?.storeName || 'My Store'}</h2>
                </div>

                <div className="border-t-2 border-dashed border-black my-6"></div>

                {/* Transaction Info - Grouped to avoid break */}
                <div className="mb-10 space-y-1 print:space-y-4 print:text-3xl print:break-inside-avoid">
                    <div className="flex justify-between">
                        <span>No:</span>
                        <span className="text-right">{transaction.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tgl:</span>
                        <span className="text-right">{new Date(transaction.date).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Jam:</span>
                        <span className="text-right">{new Date(transaction.date).toLocaleTimeString('id-ID')} WIB</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Kasir:</span>
                        <span className="text-right">{settings?.kasirName || 'Admin'}</span>
                    </div>
                    {transaction.clientName && (
                        <div className="flex justify-between mt-4 pt-4 border-t border-dotted border-gray-400">
                            <span>Plg:</span>
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
                        <span>Subtotal:</span>
                        <span>Rp {transaction.subtotal?.toLocaleString('id-ID')}</span>
                    </div>
                    {transaction.discountAmount > 0 && (
                        <div className="flex justify-between">
                            <span>Diskon:</span>
                            <span>- Rp {transaction.discountAmount?.toLocaleString('id-ID')}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-base print:text-5xl mt-4 pt-4 border-t-4 border-black">
                        <span>TOTAL:</span>
                        <span>Rp {transaction.total?.toLocaleString('id-ID')}</span>
                    </div>
                </div>

                <div className="border-t-2 border-dashed border-black my-6"></div>

                {/* Payment Info - Grouped to avoid break */}
                <div className="mb-10 space-y-1 print:space-y-4 print:text-3xl print:break-inside-avoid">
                    <div className="flex justify-between">
                        <span>Metode:</span>
                        <span className="uppercase">{transaction.method}</span>
                    </div>
                    {transaction.method === 'cash' && (
                        <>
                            <div className="flex justify-between">
                                <span>Bayar:</span>
                                <span>Rp {transaction.cash?.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Kembali:</span>
                                <span>Rp {transaction.change?.toLocaleString('id-ID')}</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="border-t-2 border-dashed border-black my-6"></div>

                {/* Footer */}
                <div className="text-center font-bold mt-10 mb-2 print:break-inside-avoid">
                    <p className="print:text-4xl">Terima kasih!</p>
                    {!isPremium && <p className="text-xs print:text-2xl mt-4 text-slate-500 font-normal">MyInvoice.space</p>}
                </div>
                <div className="h-12 print:block hidden"></div>
            </div>
        </div>
    );
});

ThermalReceipt.displayName = 'ThermalReceipt';

export default ThermalReceipt;
