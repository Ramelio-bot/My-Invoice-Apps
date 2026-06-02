import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save, Trash2, Plus, Minus, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import { useOutlet } from '../../context/OutletContext';
import { useToast } from '../../context/ToastContext';

const EMOJIS = ['🍜', '🍕', '🍔', '🥤', '🍰', '☕', '🛍️', '👕', '👗', '👟', '📱', '💊', '🧴', '🥑', '🥦', '🥩', '🍗', '🍟', '🧀', '🍓'];
const CATEGORIES = [
    { value: 'cat_makanan', label: 'Makanan' },
    { value: 'cat_minuman', label: 'Minuman' },
    { value: 'cat_pakaian', label: 'Pakaian' },
    { value: 'cat_elektronik', label: 'Elektronik' },
    { value: 'cat_kesehatan', label: 'Kesehatan' },
    { value: 'cat_lainnya', label: 'Lainnya' }
];

const mapCategoryToDbValue = (cat) => {
    const mapping = {
        'Makanan': 'cat_makanan',
        'Minuman': 'cat_minuman',
        'Pakaian': 'cat_pakaian',
        'Elektronik': 'cat_elektronik',
        'Kesehatan': 'cat_kesehatan',
        'Lainnya': 'cat_lainnya',
        'Umum': 'cat_lainnya'
    };
    return mapping[cat] || cat;
};

const mapUnitToDbValue = (unit) => {
    const mapping = {
        'Porsi': 'unit_porsi',
        'Gelas': 'unit_gelas',
        'Botol': 'unit_botol',
        'Buah': 'buah',
        'Piring': 'unit_piring',
        'Cup': 'unit_cup',
        'Kotak': 'kotak'
    };
    return mapping[unit] || unit;
};

const formatUnit = (unit) => {
    const UNIT_MAP = {
        'unit_porsi': 'Porsi',
        'unit_gelas': 'Gelas',
        'unit_botol': 'Botol',
        'buah': 'Buah',
        'unit_piring': 'Piring',
        'unit_cup': 'Cup',
        'kotak': 'Kotak',
        'Pcs': 'Pcs',
        'Kg': 'Kg',
        'Gram': 'Gram',
        'Liter': 'Liter',
        'ml': 'ml',
        'Ikat': 'Ikat',
        'Karung': 'Karung',
        'Box': 'Box',
        'Pack': 'Pack',
        'Porsi': 'Porsi',
        'Gelas': 'Gelas',
        'Botol': 'Botol',
        'Buah': 'Buah',
        'Piring': 'Piring',
        'Cup': 'Cup',
        'Kotak': 'Kotak',
        'Bungkus': 'Bungkus',
        'Set': 'Set'
    };
    return UNIT_MAP[unit] || unit;
};


export default function ProductModal({ isOpen, onClose, product, onSave, onDelete, viewType }) {
    const { user } = useAuth();
    const { t } = useLang();
    const { activeOutlet } = useOutlet();
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '',
        category: '',
        emoji: EMOJIS[0],
        sku: '',
        product_type: 'fixed', // 'fixed', 'recipe', 'ingredient'
        unit: '',
        min_stock: '5',
        image_url: ''
    });

    const { showToast } = useToast();

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [recipeItems, setRecipeItems] = useState([]);
    const [availableIngredients, setAvailableIngredients] = useState([]);
    const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);

    const loadIngredients = useCallback(async () => {
        try {
            setIsLoadingIngredients(true);
            let query = supabase
                .from('kasir_products')
                .select('id, name, unit')
                .eq('product_type', 'ingredient')
                .eq('is_active', true)
                .eq('user_id', user.id);

            // ISOLASI OUTLET: Tampilkan ingredient dari outlet aktif saja
            if (activeOutlet?.id) {
                query = query.eq('outlet_id', activeOutlet.id);
            }

            const { data, error } = await query.order('name');
            if (!error) setAvailableIngredients(data || []);
        } catch (err) {
            console.error('Error loading ingredients:', err);
        } finally {
            setIsLoadingIngredients(false);
        }
    }, [user.id, activeOutlet?.id]);

    useEffect(() => {
        if (isOpen) {
            if (product) {
                setFormData({
                    name: product.name,
                    price: (product.price ?? 0).toString(),
                    stock: (product.stock ?? 0).toString(),
                    category: mapCategoryToDbValue(product?.category || 'cat_lainnya'),
                    emoji: product?.emoji || '📦',
                    sku: product?.sku || '',
                    product_type: product?.product_type || 'fixed',
                    unit: mapUnitToDbValue(product?.unit || ''),
                    min_stock: (product?.min_stock ?? 5).toString(),
                    image_url: product?.image_url || ''
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
                    category: '',
                    emoji: EMOJIS[0],
                    sku: '',
                    product_type: viewType === 'ingredient' ? 'ingredient' : 'fixed',
                    unit: '',
                    min_stock: '5',
                    image_url: ''
                });
                setRecipeItems([]);
            }
            loadIngredients();
        }
    }, [isOpen, product, viewType, loadIngredients]);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preliminary validation
        if (file.size > 5 * 1024 * 1024) {
            alert(t('prod_img_size_err'));
            return;
        }

        try {
            setIsUploading(true);
            
            // SMART RESIZE & COMPRESS (512x512 Square WebP)
            const compressedFile = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const targetSize = 512;
                        canvas.width = targetSize;
                        canvas.height = targetSize;
                        const ctx = canvas.getContext('2d');

                        // Square Crop logic
                        const minDimension = Math.min(img.width, img.height);
                        const sourceX = (img.width - minDimension) / 2;
                        const sourceY = (img.height - minDimension) / 2;

                        // Draw and resize
                        ctx.drawImage(
                            img,
                            sourceX, sourceY, minDimension, minDimension,
                            0, 0, targetSize, targetSize
                        );

                        // High quality resizing
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';

                        canvas.toBlob((blob) => {
                            if (blob) resolve(blob);
                            else reject(new Error('Gagal kompres gambar'));
                        }, 'image/webp', 0.95); // High quality (95%) for professional visuals
                    };
                };
                reader.onerror = error => reject(error);
            });

            const fileName = `${user.id}/${Date.now()}.webp`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, compressedFile, {
                    contentType: 'image/webp',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
        } catch (err) {
            console.error('Error uploading image:', err);
            
            // Comprehensive check for missing bucket or RLS error
            const errMsg = (err.message || err.error || err.code || '').toString().toLowerCase();
            if (errMsg.includes('bucket not found') || errMsg.includes('404')) {
                alert(t('prod_bucket_err'));
            } else if (errMsg.includes('security policy') || errMsg.includes('permission denied') || errMsg.includes('403')) {
                alert(t('prod_rls_err'));
            } else {
                alert(t('prod_upload_err'));
            }
        } finally {
            setIsUploading(false);
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

        // VALIDASI DISIPLIN KATEGORI
        if (!formData.category) {
            showToast(t('kasir_error_select_category'), 'error');
            return;
        }

        onSave({
            id: product?.id, // Only include if it exists
            name: formData.name || '',
            price: formData.price === '' ? 0 : parseFloat(formData.price || 0),
            stock: formData.stock === '' ? 100 : parseInt(formData.stock, 10) || 0,
            category: formData.category,
            emoji: formData.emoji || '🛍️',
            sku: formData.sku ? formData.sku.toUpperCase() : null,
            product_type: formData.product_type || 'fixed',
            unit: formData.unit || '',
            min_stock: parseFloat(formData.min_stock || 0),
            image_url: formData.image_url || '',
            recipe_items: formData.product_type === 'recipe' ? (recipeItems || []) : []
        });
    };

    const addRecipeItem = () => {
        setRecipeItems([...recipeItems, { ingredient_id: '', quantity: 1, unit: 'Gram' }]);
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

    const inputClass = "w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 text-sm";
    const labelClass = "block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide";

    const isGudangView = viewType === 'ingredient';
//     const isSellableView = !isGudangView;

    const unitOptions = isGudangView
        ? ['Kg', 'Gram', 'Liter', 'ml', 'Ikat', 'Pcs', 'Karung', 'Box', 'Pack']
        : ['unit_porsi', 'unit_gelas', 'unit_botol', 'buah', 'unit_piring', 'unit_cup', 'kotak'];


    return (
        <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200 overflow-hidden scale-in flex flex-col max-h-[95vh] sm:max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                    <h2 className="text-xl font-bold">
                        {product ? t('prod_edit_title') : t('prod_add_title')}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
                        {/* Image Upload Selection */}
                        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative overflow-hidden group" onClick={() => fileInputRef.current?.click()}>
                            {formData.image_url ? (
                                <div className="relative w-full aspect-square max-w-[160px] rounded-2xl overflow-hidden shadow-md">
                                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                                        {t('logo_change')}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 py-4">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 group-hover:text-violet-500 transition-colors">
                                        <Upload size={24} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-500">{t('prod_upload_photo')}</span>
                                    <span className="text-[10px] text-slate-400">{t('prod_upload_hint')}</span>
                                </div>
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                                    <div className="animate-spin w-8 h-8 rounded-full border-4 border-violet-500 border-t-transparent"></div>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>{t('prod_name')}</label>
                            <input
                                type="text" required autoFocus
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t('prod_name_ph')}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-1.5">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                                    {t('sku_label') || 'Kode SKU'}
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, sku: generateSKU(formData.name) })}
                                    className="text-[10px] font-bold text-violet-600 hover:text-violet-700 transition-colors bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded"
                                >
                                    {t('generate_sku') || 'Generate Otomatis'}
                                </button>
                            </div>
                            <input
                                type="text"
                                value={formData.sku || ''}
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
                                    value={formData.price || ''}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>{formData.product_type === 'recipe' ? 'Stok (Informasi Only)' : t('prod_stock')}</label>
                                <input
                                    type="number" min="0"
                                    value={(formData.stock === 0 || formData.stock === '0') ? '' : (formData.stock ?? '')}
                                    onChange={e => { const val = e.target.value; setFormData({ ...formData, stock: val === '' ? '' : val }); }}
                                    placeholder="100"
                                    className={inputClass}
                                    disabled={formData.product_type === 'recipe'}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('prod_type')}</label>
                                <select
                                    value={formData.product_type || 'fixed'}
                                    disabled={isGudangView}
                                    onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                                    className={`w-full p-3 rounded-xl border bg-slate-50 transition-all focus:ring-2 focus:ring-violet-500 outline-none ${isGudangView ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isGudangView ? (
                                        <option value="ingredient">{t('prod_type_ingredient')} (Gudang)</option>
                                    ) : (
                                        <>
                                            <option value="fixed">{t('prod_type_fixed')} (Retail)</option>
                                            <option value="recipe">{t('prod_type_recipe')} / Bundle (BOM)</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('prod_column_unit')}</label>
                                <select
                                    value={formData.unit ?? ''}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    className="w-full p-3 rounded-xl border bg-slate-50 transition-all focus:ring-2 focus:ring-violet-500 outline-none"
                                >
                                    <option value="">{t('prod_select_unit')}</option>
                                    {unitOptions.map(u => (
                                        <option key={u} value={u}>{formatUnit(u, t)}</option>
                                    ))}

                                </select>
                            </div>
                        </div>

                        {formData.product_type === 'recipe' && (
                            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-violet-600 uppercase tracking-wide">{t('prod_recipe_items')}</label>
                                    <button
                                        type="button"
                                        onClick={addRecipeItem}
                                        className="text-[10px] bg-violet-600 text-white px-2 py-1 rounded-lg font-bold hover:bg-violet-700 transition-colors flex items-center gap-1"
                                    >
                                        <Plus size={12} /> {t('prod_add_ingredient')}
                                    </button>
                                </div>

                                {recipeItems.length === 0 && (
                                    <p className="text-[10px] text-slate-400 text-center py-2 italic">{t('prod_no_ingredients')}</p>
                                )}

                                {recipeItems.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-center animate-fade-in-up">
                                        <select
                                            required
                                            value={item.ingredient_id}
                                            onChange={e => {
                                                const val = e.target.value;
                                                const ing = availableIngredients.find(i => String(i.id) === String(val));
                                                const next = [...(recipeItems || [])];
                                                next[index].ingredient_id = val;
                                                if (ing?.unit) next[index].unit = ing.unit;
                                                setRecipeItems(next);
                                            }}
                                            className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-violet-500"
                                        >
                                            <option value="">{t('prod_select_ingredient')}</option>
                                            {availableIngredients.map(ing => (
                                                <option key={ing.id} value={ing.id}>{ing.name}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number" required min="0" step="any"
                                            value={item.quantity || 0}
                                            onChange={e => updateRecipeItem(index, 'quantity', parseFloat(e.target.value || 0))}
                                            placeholder="Qty"
                                            className="w-20 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-violet-500"
                                        />
                                        <select
                                            required
                                            value={item.unit || ''}
                                            onChange={e => updateRecipeItem(index, 'unit', e.target.value)}
                                            className="w-20 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-violet-500"
                                        >
                                            {isGudangView ? (
                                                ['Kg', 'Gram', 'Liter', 'ml', 'Ikat', 'Pcs', 'Karung', 'Box'].map(u => <option key={u} value={u}>{formatUnit(u, t)}</option>)
                                            ) : (
                                                ['Pcs', 'Porsi', 'Gelas', 'Botol', 'Bungkus', 'Piring', 'Set', 'Kg', 'Gram'].map(u => <option key={u} value={u}>{formatUnit(u, t)}</option>)
                                            )}

                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => removeRecipeItem(index)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                                required
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className={inputClass}
                            >
                                <option value="" disabled>{t('kasir_select_category')}</option>
                                {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>{t('prod_emoji')}</label>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                                    {EMOJIS.map(e => (
                                        <button
                                            key={e}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, emoji: e })}
                                            className={`text-2xl p-2 rounded-lg transition-transform ${formData.emoji === e
                                                ? 'bg-violet-100 scale-110 shadow-sm'
                                                : 'hover:bg-slate-200 opacity-60 hover:opacity-100'
                                                }`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('prod_min_stock')}</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.min_stock || '0'}
                                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                                    className="w-full p-3 rounded-xl border bg-slate-50 transition-all focus:ring-2 focus:ring-violet-500 outline-none"
                                    placeholder="5"
                                />
                            </div>
                            <div className="flex-1">
                                {/* Space for future fields */}
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-5 border-t border-slate-200 bg-slate-50 flex gap-3 shrink-0 max-md:pb-24">
                    {product && (
                        <button
                            type="button"
                            onClick={() => onDelete(product.id)}
                            className="py-3 px-4 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-bold transition-all flex items-center justify-center shrink-0"
                            title={t('prod_del_title')}
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700 transition-colors"
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
