import { X, Download, Printer } from 'lucide-react';
import { useRef } from 'react';

export default function ReceiptModal({ isOpen, onClose, transaction, settings }) {
    const receiptRef = useRef(null);

    if (!isOpen || !transaction) return null;

    const handlePrint = () => {
        const printContent = receiptRef.current.innerHTML;
        const windowPrint = window.open('', '', 'width=350,height=600');
        windowPrint.document.write(`
      <html>
        <head>
          <title>Struk Pembayaran</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #000; margin: 0; }
            .receipt-container { width: 100%; max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .space-between { display: flex; justify-content: space-between; }
            .font-bold { font-weight: bold; }
            .text-center { text-align: center; }
            .logo { max-width: 80px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
        windowPrint.document.close();
        windowPrint.focus();
        setTimeout(() => {
            windowPrint.print();
            windowPrint.close();
        }, 250);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div
                className="w-full max-w-sm bg-slate-100 dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 bg-slate-800 text-white shrink-0">
                    <h2 className="font-bold flex items-center gap-2">Struk Pembayaran</h2>
                    <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-white mx-4 mt-4 shadow-sm relative custom-scrollbar">
                    {/* Sawtooth top & bottom decoration */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDIwLDEwIDEwLDAiIGZpbGw9IiNGMUY1RjkiLz48L3N2Zz4=')] rotate-180 bg-repeat-x bg-[length:20px_10px]"></div>

                    <div ref={receiptRef} className="receipt-container text-slate-800 mt-2 font-mono text-xs">
                        {/* Header */}
                        <div className="header text-center mb-4">
                            {settings?.logoUrl && (
                                <img src={settings.logoUrl} alt="Logo" className="logo mx-auto mb-2 opacity-80 mix-blend-multiply" />
                            )}
                            <h2 className="font-bold text-lg mb-1">{settings?.storeName || 'My Store'}</h2>
                        </div>

                        <div className="divider border-t border-dashed border-slate-300 my-3"></div>

                        <div className="mb-4">
                            <div className="row"><span>No:</span> <span>{transaction.id}</span></div>
                            <div className="row"><span>Tgl:</span> <span>{new Date(transaction.date).toLocaleDateString('id-ID')}</span></div>
                            <div className="row"><span>Jam:</span> <span>{new Date(transaction.date).toLocaleTimeString('id-ID')} WIB</span></div>
                            <div className="row"><span>Kasir:</span> <span>{settings?.kasirName || 'Admin'}</span></div>
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
                                <span>Subtotal:</span>
                                <span>Rp {transaction.subtotal.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="row">
                                <span>Diskon:</span>
                                <span>Rp {transaction.discountAmount.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="row font-bold text-sm mt-1">
                                <span>TOTAL:</span>
                                <span>Rp {transaction.total.toLocaleString('id-ID')}</span>
                            </div>
                        </div>

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
                                        <span>Bayar:</span>
                                        <span>Rp {transaction.cash.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="row">
                                        <span>Kembali:</span>
                                        <span>Rp {transaction.change.toLocaleString('id-ID')}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="divider border-t border-dashed border-slate-300 my-3"></div>

                        <div className="text-center font-bold mt-4 mb-2">
                            <p>Terima kasih!</p>
                            <p className="text-[10px] mt-1 text-slate-500">myinvoice.space</p>
                        </div>
                    </div>

                </div>

                <div className="p-4 bg-slate-100 dark:bg-slate-800 flex gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg font-bold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                        Tutup
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-md flex justify-center items-center gap-2"
                    >
                        <Printer size={18} /> Cetak
                    </button>
                </div>
            </div>
        </div>
    );
}
