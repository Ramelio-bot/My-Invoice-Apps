import { useState, useEffect, useMemo } from 'react';
import { Package, Search, Plus, Filter, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLang } from '../../context/LanguageContext';
import { usePlan } from '../../context/PlanContext';
import ProductModal from '../../components/kasir/ProductModal';

export default function KasirProduk({ viewType = 'all' }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { t, lang } = useLang();
    const { isPro, isPremium, checkProductLimit, refreshUsage } = usePlan();

    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Semua');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const pageTitle = viewType === 'ingredient' ? t('prod_gudang_title') : (viewType === 'sellable' ? t('prod_sellable_title') : t('kasir_products_title'));

    const handleAddClick = () => {
        setEditingProduct({
            product_type: viewType === 'ingredient' ? 'ingredient' : 'fixed'
        });
        setIsModalOpen(true);
    };

    useEffect(() => {
        if (user) loadProducts();
    }, [user]);

    const loadProducts = async () => {
        try {
            setIsLoading(true);
            let query = supabase
                .from('kasir_products')
                .select('id, user_id, name, price, stock, category, emoji, is_active, updated_at, sku, product_type')
                .eq('is_active', true);

            // Apply filter based on viewType
            if (viewType === 'ingredient') {
                query = query.eq('product_type', 'ingredient');
            } else if (viewType === 'sellable') {
                query = query.in('product_type', ['fixed', 'recipe']);
            }

            const { data, error } = await query.order('name');

            if (error) throw error;
            setProducts(data || []);
            refreshUsage();
        } catch (err) {
            console.error('Error loading products:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const categories = useMemo(() => {
        return ['Semua', ...new Set(products.map(p => p.category).filter(Boolean))];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
            const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [products, selectedCategory, searchQuery]);

    const handleSaveProduct = async (productData) => {
        if (!isPro && !checkProductLimit()) {
            showToast('Batas gratis tercapai (5 produk). Upgrade PRO untuk tanpa batas!', 'warning');
            return;
        }
        try {
            // BYPASS for mock user
            if (user.id === '00000000-0000-0000-0000-000000000000') {
                const newProd = {
                    ...productData,
                    id: Math.random().toString(36).substr(2, 9),
                    user_id: user.id,
                    updated_at: new Date().toISOString()
                };
                setProducts([newProd, ...products]);
                showToast(t('saved'));
                setIsModalOpen(false);
                return;
            }

            if (productData.id) {
                // Update
                const { error } = await supabase
                    .from('kasir_products')
                    .update({
                        name: productData.name,
                        price: productData.price,
                        stock: productData.stock,
                        category: productData.category,
                        emoji: productData.emoji,
                        sku: productData.sku || null,
                        product_type: productData.product_type || 'fixed',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', productData.id)
                    .eq('user_id', user.id);

                if (error) throw error;
            } else {
                // Insert
                const { data, error } = await supabase
                    .from('kasir_products')
                    .insert({
                        user_id: user.id,
                        name: productData.name,
                        price: productData.price,
                        stock: productData.stock,
                        category: productData.category,
                        emoji: productData.emoji,
                        sku: productData.sku || null,
                        product_type: productData.product_type || 'fixed'
                    });

                if (error) throw error;
            }

            showToast(t('saved'));
            setIsModalOpen(false);
            loadProducts();
        } catch (err) {
            console.error('Save product error:', err);
            showToast('Gagal menyimpan produk. Coba lagi.', 'error', 5000);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

        try {
            // Soft delete by setting is_active = false or hard delete
            const { error } = await supabase
                .from('kasir_products')
                .update({ is_active: false }) // soft delete
                .eq('id', productId)
                .eq('user_id', user.id);

            if (error) throw error;

            setIsModalOpen(false);
            loadProducts();
        } catch (err) {
            console.error('Delete product error:', err);
            showToast('Gagal menghapus produk.', 'error', 5000);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto h-full flex flex-col animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <button
                        onClick={() => navigate('/kasir')}
                        className="text-slate-500 hover:text-violet-600 mb-2 flex items-center gap-1 text-sm font-bold transition-colors"
                    >
                        <ArrowLeft size={16} /> {t('kasir_back')}
                    </button>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <Package className="text-violet-500" size={28} />
                        {pageTitle}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{t('kasir_products_desc')}</p>
                </div>

                <button
                    onClick={handleAddClick}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> {t('kasir_add_product')}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-col sm:flex-row gap-4 shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('kasir_search_name')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    />
                </div>

                <div className="relative sm:w-64">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white appearance-none focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium"
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-visible">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin w-10 h-10 rounded-full border-4 border-violet-500 border-t-transparent"></div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
                        <Package size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">{t('kasir_no_products')}</h3>
                        <p className="text-slate-500 mt-2 max-w-md mx-auto">{t('kasir_no_products_desc')}</p>
                        <button
                            onClick={handleAddClick}
                            className="mt-6 text-violet-600 font-bold hover:underline"
                        >
                            + {t('kasir_add_now')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex gap-4 hover:border-violet-500 transition-colors group">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-3xl border border-slate-100 dark:border-slate-700 shrink-0">
                                    {product.emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 dark:text-white truncate" title={product.name}>{product.name}</h3>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-2">
                                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{product.category}</span>
                                        <span className={`${product.stock <= 5 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'} px-2 py-0.5 rounded font-bold`}>
                                            {t('kasir_stock_label')}: {product.stock}
                                        </span>
                                    </div>
                                    <div className="font-black text-violet-600 dark:text-violet-400 mt-2">
                                        Rp {product.price.toLocaleString('id-ID')}
                                    </div>
                                </div>
                                <div className="flex flex-col justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        title="Hapus"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={editingProduct}
                onSave={handleSaveProduct}
                onDelete={handleDeleteProduct}
            />
        </div>
    );
}
