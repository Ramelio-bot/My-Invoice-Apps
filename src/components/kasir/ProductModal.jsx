import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';

const EMOJIS = ['🍜', '🍕', '🍔', '🥤', '🍰', '☕', '🛍️', '👕', '👗', '👟', '📱', '💊', '🧴', '🥑', '🥦', '🥩', '🍗', '🍟', '🧀', '🍓'];
const CATEGORIES = ['Makanan', 'Minuman', 'Pakaian', 'Elektronik', 'Kesehatan', 'Lainnya'];

export default function ProductModal({ isOpen, onClose, product, onSave, onDelete }) {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '',
        category: CATEGORIES[0],
        emoji: EMOJIS[0]
    });

    useEffect(() => {
        if (isOpen) {
            if (product) {
                setFormData({
                    name: product.name,
                    price: product.price.toString(),
                    stock: product.stock.toString(),
                    category: product.category,
                    emoji: product.emoji
                });
            } else {
                setFormData({
                    name: '',
                    price: '',
                    stock: '',
                    category: CATEGORIES[0],
                    emoji: EMOJIS[0]
                });
            }
        }
    }, [isOpen, product]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...product, // keep ID if editing
            name: formData.name,
            price: parseFloat(formData.price) || 0,
            stock: formData.stock === '' ? 100 : parseInt(formData.stock, 10) || 0,
            category: formData.category,
            emoji: formData.emoji
        });
    };

    const inputClass = "w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 dark:text-white text-sm";
    const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide";

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full sm:max-w-md bg-white dark:bg-slate-800 sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up flex flex-col max-h-[95vh] sm:max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 shrink-0">
                    <h2 className="text-xl font-bold dark:text-white">
                        {product ? 'Edit Produk' : 'Tambah Produk Baru'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className={labelClass}>Nama Produk</label>
                            <input
                                type="text" required autoFocus
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Misal: Nasi Goreng Spesial"
                                className={inputClass}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Harga (Rp)</label>
                                <input
                                    type="number" required min="0" step="100"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="25000"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Stok Awal</label>
                                <input
                                    type="number" min="0"
                                    value={formData.stock === 0 || formData.stock === '0' ? '' : formData.stock}
                                    onChange={e => { const val = e.target.value; setFormData({ ...formData, stock: val === '' ? '' : val }); }}
                                    placeholder="100"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Kategori</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className={inputClass}
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Ikon Emoji</label>
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                                <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                                    {EMOJIS.map(e => (
                                        <button
                                            key={e}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, emoji: e })}
                                            className={`text-2xl p-2 rounded-lg transition-transform ${formData.emoji === e
                                                ? 'bg-violet-100 dark:bg-violet-900/50 scale-110 shadow-sm'
                                                : 'hover:bg-slate-200 dark:hover:bg-slate-800 opacity-60 hover:opacity-100'
                                                }`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex gap-3 shrink-0 max-md:pb-24">
                    {product && (
                        <button
                            type="button"
                            onClick={() => onDelete(product.id)}
                            className="py-3 px-4 bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-xl font-bold transition-all flex items-center justify-center shrink-0"
                            title="Hapus Produk"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-xl font-bold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        form="productForm"
                        className="flex-[2] py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-600/30 flex justify-center items-center gap-2"
                    >
                        <Save size={18} /> Simpan
                    </button>
                </div>
            </div>
        </div>
    );
}
