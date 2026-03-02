import { useState } from 'react';
import { Search, Plus, Filter, Tag } from 'lucide-react';

export default function ProductGrid({ products, onAddProduct, onEditProduct, onAddToCart }) {
    const [search, setSearch] = useState('');

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Header & Search */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama / kategori produk..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 text-sm dark:text-white"
                    />
                </div>
                <button
                    onClick={onAddProduct}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
                >
                    <Plus size={16} /> Tambah Produk
                </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {filtered.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                        <Tag size={48} className="opacity-20" />
                        <p>Belum ada produk ditemukan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filtered.map(p => {
                            const isOutOfStock = p.stock <= 0;
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => !isOutOfStock && onAddToCart(p)}
                                    className={`relative group rounded-2xl p-4 border transition-all ${isOutOfStock
                                            ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-violet-400 hover:shadow-md cursor-pointer'
                                        }`}
                                >
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEditProduct(p); }}
                                            className="p-1.5 rounded-md bg-white/80 dark:bg-slate-900/80 shadow-sm text-slate-500 hover:text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ✏️
                                        </button>
                                    </div>

                                    <div className="text-4xl mb-3 text-center">{p.emoji || '📦'}</div>

                                    <div className="text-center">
                                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 truncate" title={p.name}>
                                            {p.name}
                                        </h3>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
                                            {p.category}
                                        </div>
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                            <span className="font-bold text-violet-600 dark:text-violet-400">
                                                Rp {p.price.toLocaleString('id-ID')}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOutOfStock ? 'bg-red-100 text-red-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}>
                                                {isOutOfStock ? 'Habis' : `Sisa ${p.stock}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
