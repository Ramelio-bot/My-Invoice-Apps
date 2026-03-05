import { forwardRef } from 'react';
import { usePlan } from '../../context/PlanContext';

const ThermalReceipt = forwardRef(({ transaction, settings, id = "thermal-receipt" }, ref) => {
    const { isPro, isPremium } = usePlan();

    if (!transaction) return null;

    return (
        <div id={id} ref={ref} className="hidden print:block bg-white text-black font-mono text-[10px] sm:text-xs leading-tight w-[58mm] mx-auto p-2">

            {/* Header */}
            <div className="text-center mb-3">
                {settings?.logoUrl && (
                    <img src={settings.logoUrl} alt="Logo" className="max-w-[80px] mx-auto mb-2 opacity-80 mix-blend-multiply" />
                )}
                <h2 className="font-bold text-sm mb-1">{settings?.storeName || 'My Store'}</h2>
            </div>

            <div className="border-t border-dashed border-black my-2"></div>

            {/* Transaction Info */}
            <div className="mb-3 space-y-0.5">
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
                    <div className="flex justify-between mt-1 pt-1 border-t border-dotted border-gray-400">
                        <span>Plg:</span>
                        <span className="text-right truncate max-w-[120px]">{transaction.clientName}</span>
                    </div>
                )}
            </div>

            <div className="border-t border-dashed border-black my-2"></div>

            {/* Items */}
            <div className="mb-3 space-y-1.5">
                {transaction.items?.map((item, idx) => (
                    <div key={item.id || idx} className="flex flex-col">
                        <div className="truncate w-full font-semibold">{item.name}</div>
                        <div className="flex justify-between pl-2">
                            <span>{item.qty} x {(item.price).toLocaleString('id-ID')}</span>
                            <span>{((item.price || 0) * (item.qty || 0)).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-dashed border-black my-2"></div>

            {/* Totals */}
            <div className="mb-3 space-y-0.5">
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
                <div className="flex justify-between font-bold text-sm mt-1 pt-1 border-t-2 border-black">
                    <span>TOTAL:</span>
                    <span>Rp {transaction.total?.toLocaleString('id-ID')}</span>
                </div>
            </div>

            <div className="border-t border-dashed border-black my-2"></div>

            {/* Payment Info */}
            <div className="mb-3 space-y-0.5">
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

            <div className="border-t border-dashed border-black my-2"></div>

            {/* Footer */}
            <div className="text-center font-bold mt-3 mb-1">
                <p>Terima kasih!</p>
                {!isPro && <p className="text-[9px] mt-1 text-slate-500 font-normal">myinvoice.space</p>}
            </div>
            {/* Some extra padding at bottom for tear-off */}
            <div className="h-4"></div>
        </div>
    );
});

ThermalReceipt.displayName = 'ThermalReceipt';

export default ThermalReceipt;
