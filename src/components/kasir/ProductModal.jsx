import { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';

const EMOJIS = ['🍜', '🍕', '🍔', '🥤', '🍰', '☕', '🛍️', '👕', '👗', '👟', '📱', '💊', '🧴', '🥑', '🥦', '🥩', '🍗', '🍟', '🧀', '🍓'];
const CATEGORIES = ['Makanan', 'Minuman', 'Pakaian', 'Elektronik', 'Kesehatan', 'Lainnya'];

export default function ProductModal({ isOpen, onClose, product, onSave, onDelete }) {
    const { user } = useAuth();
    const { t } = useLang();
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '',
        category: CATEGORIES[0],
        emoji: EMOJIS[0],
        sku: '',
        product_type: 'fixed', // 'fixed', 'recipe', 'ingredient'
        unit: ''
    });

    const [recipeItems, setRecipeItems] = useState([]);
    const [availableIngredients, setAvailableIngredients] = useState([]);
    const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (product) {
                setFormData({
                    name: product.name,
                    price: (product.price ?? 0).toString(),
                    stock: (product.stock ?? 0).toString(),
                    category: product?.category || 'Umum',
                    emoji: product?.emoji || '📦',
                    sku: product?.sku || '',
                    product_type: product?.product_type || 'fixed',
                    unit: product?.unit || ''
                });
                if (product.product_type === 'recipe') {
                    loadRecipes(product.id);
                } else {
                    setRecipeItems([]);
                }
            } else {
                setFormData({
                    name: '',
                    price: '',
                    stock: '',
                    category: CATEGORIES[0],
                    emoji: EMOJIS[0],
                    sku: '',
                    product_type: initialData?.product_type || 'fixed',
                    unit: ''
                });
                setRecipeItems([]);
            }
            loadIngredients();
        }
    }, [isOpen, product, initialData]);

    const loadIngredients = async () => {
        try {
            setIsLoadingIngredients(true);
            const { data, error } = await supabase
                .from('kasir_products')
                .select('id, name')
                .eq('user_id', user.id)
                .eq('product_type', 'ingredient')
                .eq('is_active', true)
                .order('name');
            if (!error) setAvailableIngredients(data || []);
        } catch (err) {
            console.error('Error loading ingredients:', err);
        } finally {
            setIsLoadingIngredients(false);
        }
    };

    const loadRecipes = async (productId) => {
        try {
            const { data, error } = await supabase
                .from('kasir_recipes')
                .select('ingredient_id, quantity, unit')
                .eq('product_id', productId);
            if (!error) setRecipeItems(data || []);
        } catch (err) {
            console.error('Error loading recipes:', err);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...product, // keep ID if editing
            name: formData.name,
            price: parseFloat(formData.price) || 0,
            stock: formData.stock === '' ? 100 : parseInt(formData.stock, 10) || 0,
            category: formData.category,
            emoji: formData.emoji,
            sku: formData.sku ? formData.sku.toUpperCase() : null,
            product_type: formData.product_type,
            unit: formData.unit,
            recipe_items: formData.product_type === 'recipe' ? recipeItems : []
        });
    };

    const addRecipeItem = () => {
        setRecipeItems([...recipeItems, { ingredient_id: '', quantity: 1, unit: 'pcs' }]);
    };

    const removeRecipeItem = (index) => {
        setRecipeItems(recipeItems.filter((_, i) => i !== index));
    };

    const updateRecipeItem = (index, field, value) => {
        const next = [...recipeItems];
        next[index][field] = value;
        setRecipeItems(next);
    };

    const generateSKU = (productName) => {
        const prefix = productName ? productName.substring(0, 3).toUpperCase() : 'PRD';
        const random = Math.floor(Math.random() * 9000) + 1000;
        return `${prefix}-${random}`;
    };

    const inputClass = "w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 dark:text-white text-sm";
    const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide";

    const isGudangView = initialData?.product_type === 'ingredient';
    const isSellableView = !isGudangView;

    const unitOptions = isGudangView
        ? ['Kg', 'Gram', 'Liter', 'ml', 'Ikat', 'Pcs', 'Karung', 'Box', 'Pack']
        : ['Porsi', 'Gelas', 'Botol', 'Pcs', 'Piring', 'Cup', 'Box'];

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
                        {product ? t('prod_edit_title') : t('prod_add_title')}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className={labelClass}>{t('prod_name')}</label>
                            <input
                                type="text" required autoFocus
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t('prod_name_ph')}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-1.5">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    {t('sku_label') || 'Kode SKU'}
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, sku: generateSKU(formData.name) })}
                                    className="text-[10px] font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 transition-colors bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:hover:bg-violet-800/40 px-2 py-1 rounded"
                                >
                                    {t('generate_sku') || 'Generate Otomatis'}
                                </button>
                            </div>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                placeholder={t('sku_placeholder') || 'Kode SKU (opsional)'}
                                className={inputClass}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>{t('prod_price')}</label>
                                <input
                                    type="number" required min="0" step="100"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="25000"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>{formData.product_type === 'recipe' ? 'Stok (Informasi Only)' : t('prod_stock')}</label>
                                <input
                                    type="number" min="0"
                                    value={formData.stock === 0 || formData.stock === '0' ? '' : formData.stock}
                                    onChange={e => { const val = e.target.value; setFormData({ ...formData, stock: val === '' ? '' : val }); }}
                                    placeholder="100"
                                    className={inputClass}
                                    disabled={formData.product_type === 'recipe'}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipe Produk</label>
                                <select
                                    value={formData.product_type || 'fixed'}
                                    disabled={isGudangView}
                                    onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                                    className={`w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:text-white transition-all focus:ring-2 focus:ring-violet-500 outline-none ${isGudangView ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isGudangView ? (
                                        <option value="ingredient">Bahan Baku (Gudang)</option>
                                    ) : (
                                        <>
                                            <option value="fixed">Barang Jadi (Retail)</option>
                                            <option value="recipe">Olahan Menu (Resep)</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Satuan (Unit)</label>
                                <select
                                    value={formData.unit || ''}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:text-white transition-all focus:ring-2 focus:ring-violet-500 outline-none"
                                >
                                    <option value="">Pilih Satuan</option>
                                    {unitOptions.map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {formData.product_type === 'recipe' && (
                            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">{t('prod_recipe_items')}</label>
                                    <button
                                        type="button"
                                        onClick={addRecipeItem}
                                        className="text-[10px] bg-violet-600 text-white px-2 py-1 rounded-lg font-bold hover:bg-violet-700 transition-colors flex items-center gap-1"
                                    >
                                        <Plus size={12} /> {t('prod_add_ingredient')}
                                    </button>
                                </div>

                                {recipeItems.length === 0 && (
                                    <p className="text-[10px] text-slate-400 text-center py-2 italic">Belum ada bahan baku ditambahkan.</p>
                                )}

                                {recipeItems.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-center animate-fade-in-up">
                                        <select
                                            required
                                            value={item.ingredient_id}
                                            onChange={e => updateRecipeItem(index, 'ingredient_id', e.target.value)}
                                            className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white outline-none focus:ring-1 focus:ring-violet-500"
                                        >
                                            <option value="">-- Pilih Bahan --</option>
                                            {availableIngredients.map(ing => (
                                                <option key={ing.id} value={ing.id}>{ing.name}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number" required min="0.01" step="0.01"
                                            value={item.quantity}
                                            onChange={e => updateRecipeItem(index, 'quantity', parseFloat(e.target.value))}
                                            placeholder="Qty"
                                            className="w-16 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white outline-none focus:ring-1 focus:ring-violet-500"
                                        />
                                        <input
                                            type="text" required
                                            value={item.unit}
                                            onChange={e => updateRecipeItem(index, 'unit', e.target.value)}
                                            placeholder="Unit"
                                            className="w-16 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white outline-none focus:ring-1 focus:ring-violet-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeRecipeItem(index)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        >
                                            <Minus size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div>
                            <label className={labelClass}>{t('prod_category')}</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className={inputClass}
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>{t('prod_emoji')}</label>
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
                            title={t('prod_del_title')}
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-xl font-bold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="submit"
                        form="productForm"
                        className="flex-[2] py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-600/30 flex justify-center items-center gap-2"
                    >
                        <Save size={18} /> {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
