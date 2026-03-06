import { Trash2, ShoppingCart, Percent, DollarSign, Plus, Minus, List, Save, X as XIcon } from 'lucide-react';

export default function Cart({ cart, onUpdateQty, onRemoveItem, onClear, onCheckout, discount, setDiscount, onSaveBill, onShowSavedBills, clients = [], selectedClient, setSelectedClient }) {

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountAmount = discount.type === 'persen'
        ? Math.floor(subtotal * (discount.value / 100))
        : discount.value;
    const total = Math.max(0, subtotal - discountAmount);

    return (
        <div className="flex flex-col flex-1 min-h-0 w-full">

            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
                <h2 className="font-bold text-lg flex items-center gap-2 dark:text-white">
                    <ShoppingCart size={20} className="text-violet-500" />
                    Keranjang
                </h2>
                <div className="flex items-center gap-3">
                    <button onClick={onShowSavedBills} className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-1">
                        <List size={14} /> Bills
                    </button>
                    {cart.length > 0 && (
                        <button onClick={onClear} className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1">
                            <Trash2 size={14} /> Kosongkan
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
                    placeholder="Nama Pelanggan / Klien (Opsional)..."
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
            <div className="lg:flex-1 lg:overflow-y-auto p-4 space-y-3 lg:custom-scrollbar">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 py-10">
                        <ShoppingCart size={48} className="opacity-20 mb-3" />
                        <p className="text-sm">Keranjang masih kosong</p>
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20 group">
                            <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-2xl">
                                {item.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate pr-2">{item.name}</h4>
                                    <button onClick={() => onRemoveItem(item.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <XIcon size={16} />
                                    </button>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
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
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Subtotal</span>
                        <span className="font-bold dark:text-white">Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Diskon</span>
                            <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden">
                                <button
                                    onClick={() => setDiscount({ ...discount, type: 'nominal', value: 0 })}
                                    className={`px-2 py-0.5 text-[10px] font-bold ${discount.type === 'nominal' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    Rp
                                </button>
                                <button
                                    onClick={() => setDiscount({ ...discount, type: 'persen', value: 0 })}
                                    className={`px-2 py-0.5 text-[10px] font-bold ${discount.type === 'persen' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    %
                                </button>
                            </div>
                        </div>

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
                    </div>

                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 border-dashed">
                        <span className="font-black text-lg text-slate-900 dark:text-white">TOTAL</span>
                        <span className="font-black text-xl text-violet-600 dark:text-violet-400">
                            Rp {total.toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>

            </div>

            {/* Buttons Area */}
            <div className="bg-white dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-700 z-50 shrink-0">
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onSaveBill}
                        disabled={cart.length === 0}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex justify-center items-center gap-2"
                    >
                        <Save size={16} /> SIMPAN
                    </button>
                    <button
                        onClick={onCheckout}
                        disabled={cart.length === 0}
                        className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-600/20 transition-all flex justify-center items-center gap-2"
                    >
                        BAYAR
                    </button>
                </div>
            </div>

        </div>
    );
}
