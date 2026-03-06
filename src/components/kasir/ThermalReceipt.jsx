import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import { usePlan } from '../../context/PlanContext';

const ThermalReceipt = forwardRef(({ transaction, settings, id = "thermal-receipt" }, ref) => {
    const { isPremium } = usePlan();
    const [scale, setScale] = useState(1);

    // Force A4 and Remove Margins globally for print
    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'print-a4-setup';
        style.innerHTML = `
            @media print {
                @page { margin: 0; size: A4; }
                body { margin: 0; padding: 0; }
                #root { display: none !important; }
                #${id} { display: flex !important; margin: 0 !important; width: 100vw !important; height: 100vh !important; }
            }
        `;
        document.head.appendChild(style);
        return () => {
            const existing = document.getElementById('print-a4-setup');
            if (existing) existing.remove();
        };
    }, [id]);

    // Calculate scale to fit in one page (A4 height is ~1122px at 96dpi, or roughly 297mm)
    useLayoutEffect(() => {
        const timer = setTimeout(() => {
            if (ref.current) {
                const contentHeight = ref.current.scrollHeight;
                const a4HeightPx = 1100; // Leaving a small buffer
                if (contentHeight > a4HeightPx) {
                    const newScale = a4HeightPx / contentHeight;
                    setScale(Math.max(0.4, newScale)); // Don't scale down past 40%
                } else {
                    setScale(1);
                }
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [transaction, ref]);

    if (!transaction) return null;

    return (
        <div
            id={id}
            ref={ref}
            className="hidden print:flex flex-col items-center justify-center bg-white text-black w-full"
            style={{
                height: '100vh',
                overflow: 'hidden',
                backgroundColor: 'white'
            }}
        >
            <div
                className="bg-white font-mono text-base leading-snug w-[120mm] mx-auto p-8"
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center',
                    width: '500px', // Standardized thermal width for better scaling
                    backgroundColor: 'white'
                }}
            >
                {/* Header */}
                <div className="text-center mb-6">
                    {settings?.logoUrl && (
                        <img src={settings.logoUrl} alt="Logo" className="max-w-[150px] mx-auto mb-4 opacity-80 mix-blend-multiply" />
                    )}
                    <h2 className="font-bold text-3xl mb-1">{settings?.storeName || 'My Store'}</h2>
                </div>

                <div className="border-t border-dashed border-black my-4"></div>

                {/* Transaction Info */}
                <div className="mb-6 space-y-2">
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

                <div className="border-t border-dashed border-black my-4"></div>

                {/* Items */}
                <div className="mb-6 space-y-4">
                    {transaction.items?.map((item, idx) => (
                        <div key={item.id || idx} className="flex flex-col">
                            <div className="truncate w-full font-semibold">{item.name}</div>
                            <div className="flex justify-between pl-6">
                                <span>{item.qty} x {(item.price).toLocaleString('id-ID')}</span>
                                <span>{((item.price || 0) * (item.qty || 0)).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-dashed border-black my-4"></div>

                {/* Totals */}
                <div className="mb-6 space-y-2">
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
                    <div className="flex justify-between font-bold text-2xl mt-4 pt-4 border-t-2 border-black">
                        <span>TOTAL:</span>
                        <span>Rp {transaction.total?.toLocaleString('id-ID')}</span>
                    </div>
                </div>

                <div className="border-t border-dashed border-black my-4"></div>

                {/* Payment Info */}
                <div className="mb-6 space-y-2">
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

                <div className="border-t border-dashed border-black my-4"></div>

                {/* Footer */}
                <div className="text-center font-bold mt-8 mb-1">
                    <p>Terima kasih!</p>
                    {!isPremium && <p className="text-lg mt-2 text-slate-500 font-normal">MyInvoice.space</p>}
                </div>
            </div>
        </div>
    );
});

ThermalReceipt.displayName = 'ThermalReceipt';

export default ThermalReceipt;
