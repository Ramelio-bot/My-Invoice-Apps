import { useState, useEffect, useMemo } from 'react';
import { Package, Search, Plus, Filter, Edit2, Trash2, ArrowLeft, AlertTriangle } from 'lucide-react';
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
    const [imageErrors, setImageErrors] = useState({});
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
        // Reset state on view change to prevent "leaking" data and filters between views
        setProducts([]);
        setSearchQuery('');
        setSelectedCategory('Semua');
        setIsLoading(true);
        if (user) loadProducts();
    }, [user, viewType]);

    const loadProducts = async () => {
        try {
            setIsLoading(true);
            let query = supabase
                .from('kasir_products')
                .select('id, name, price, stock, category, emoji, is_active, updated_at, sku, product_type, unit, min_stock, image_url')
                .eq('is_active', true);

            // STRICT ISOLATION based on viewType
            if (viewType === 'ingredient') {
                query = query.eq('product_type', 'ingredient');
            } else {
                // IMPORTANT: Strictly exclude 'ingredient' from product management view
                query = query.in('product_type', ['fixed', 'recipe']);
            }

            let { data, error } = await query.order('name');

            if (error) {
                throw error;
            }

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
            const matchSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [products, selectedCategory, searchQuery]);

    const handleSaveProduct = async (productData) => {
        if (!isPro && !checkProductLimit()) {
            showToast('Batas gratis tercapai (5 produk). Upgrade PRO untuk tanpa batas!', 'warning');
            return;
        }
        try {
            const payload = {
                name: productData.name,
                price: productData.price,
                stock: productData.stock,
                category: productData.category,
                emoji: productData.emoji,
                sku: productData.sku || null,
                product_type: productData.product_type || 'fixed',
                unit: productData.unit || null,
                image_url: productData.image_url || null,
                updated_at: new Date().toISOString()
            };


            let savedProductId = productData.id;

            if (productData.id) {
                // Update
                const { error } = await supabase
                    .from('kasir_products')
                    .update(payload)
                    .eq('id', productData.id);

                if (error) throw error;
            } else {
                // Insert
                let { data: newProduct, error } = await supabase
                    .from('kasir_products')
                    .insert({ ...payload, user_id: user.id })
                    .select()
                    .single();

                if (error) throw error;
                
                savedProductId = newProduct?.id;
            }

            // Sync Recipes if applicable
            if (productData.product_type === 'recipe' && savedProductId) {
                // Hapus resep lama
                await supabase
                    .from('kasir_recipes')
                    .delete()
                    .eq('product_id', savedProductId);

                // Insert resep baru
                const recipeRows = (productData.recipe_items || [])
                    .filter(item => item.ingredient_id)
                    .map(item => ({
                        user_id: user.id,
                        product_id: savedProductId,
                        ingredient_id: item.ingredient_id,
                        quantity: parseFloat(item.quantity) || 0,
                        unit: item.unit || ''
                    }));

                if (recipeRows.length > 0) {
                    const { error: recipeErr } = await supabase
                        .from('kasir_recipes')
                        .insert(recipeRows);
                    if (recipeErr) {
                        console.error('Gagal simpan resep:', recipeErr);
                    }
                }
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
                .eq('id', productId);

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
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <Package className="text-violet-500" size={28} />
                        {pageTitle}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('kasir_products_desc')}</p>
                </div>

                <button
                    onClick={handleAddClick}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> {t('kasir_add_product')}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('kasir_search_name')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    />
                </div>

                <div className="relative sm:w-64">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium"
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
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                        <Package size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700">{t('kasir_no_products')}</h3>
                        <p className="text-slate-500 mt-2 max-w-md mx-auto">{t('kasir_no_products_desc')}</p>
                        <button
                            onClick={handleAddClick}
                            className="mt-6 text-violet-600 font-bold hover:underline"
                        >
                            + {t('kasir_add_now')}
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">#</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('nav_kasir_products')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('prod_column_category')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{viewType === 'ingredient' ? t('prod_cost_price') : t('prod_sell_price')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">{t('prod_column_stock')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">{t('prod_column_unit')}</th>
                                        {viewType === 'ingredient' && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('prod_total_value')}</th>}
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('prod_column_action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredProducts.map((p) => {
                                        const minStock = p.min_stock ?? 5;
                                        const isLowStock = (p.stock || 0) <= minStock;
                                        const totalValue = (p.price || 0) * (p.stock || 0);
                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 text-center">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xl mx-auto overflow-hidden">
                                                        {p.image_url && !imageErrors[p.id] ? (
                                                            <img 
                                                                src={p.image_url} 
                                                                alt={p.name} 
                                                                className="w-full h-full object-cover" 
                                                                onError={() => setImageErrors(prev => ({ ...prev, [p.id]: true }))}
                                                            />
                                                        ) : (
                                                            p.emoji || '📦'
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">{p.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-block px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600">
                                                        {p.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-violet-600">
                                                        Rp {(p.price || 0).toLocaleString('id-ID')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className={`inline-flex flex-col items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                        isLowStock 
                                                        ? 'bg-red-100 text-red-600 ring-1 ring-red-400/20' 
                                                        : (p.stock || 0) <= (minStock * 2) 
                                                        ? 'bg-amber-100 text-amber-600' 
                                                        : 'bg-emerald-100 text-emerald-600'
                                                    }`}>
                                                        {p.stock || 0}
                                                        {isLowStock && <span className="text-[9px] uppercase mt-0.5 font-black">{t('prod_low_stock_warning')}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm font-semibold text-slate-500 uppercase">
                                                        {p.unit || '-'}
                                                    </span>
                                                </td>
                                                {viewType === 'ingredient' && (
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-bold text-slate-700">
                                                            Rp {totalValue.toLocaleString('id-ID')}
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}
                                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteProduct(p.id)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={editingProduct}
                onSave={handleSaveProduct}
                onDelete={handleDeleteProduct}
                viewType={viewType}
            />
        </div>
    );
}
