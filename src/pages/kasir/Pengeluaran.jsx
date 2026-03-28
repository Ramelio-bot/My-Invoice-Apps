import { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, ArrowLeft, X, Save, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLang } from '../../context/LanguageContext';

export default function KasirPengeluaran() {
    const { user, canAccessAdvancedKasir, isAdmin, effectivePlan } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { t, lang } = useLang();

    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        category: t('kasir_cat_operational'),
        notes: '',
        expense_date: new Date().toISOString().split('T')[0]
    });

    const categories = [
        t('kasir_cat_operational'),
        t('kasir_cat_utility'),
        t('kasir_cat_salary'),
        t('kasir_cat_materials'),
        t('kasir_cat_others')
    ];

    const isPlanPro = ['pro', 'ultimate'].includes(effectivePlan) || isAdmin;

    if (!isPlanPro) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8">
                <span className="text-6xl mb-4">💸</span>
                <h2 className="text-xl font-bold mb-2">{t('kasir_expense_pro_limit_title')}</h2>
                <p className="text-slate-500 mb-6">{t('kasir_expense_pro_limit_desc')}</p>
                <button onClick={() => navigate('/upgrade')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors">
                    {t('upgrade_pro_btn')}
                </button>
            </div>
        );
    }

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('kasir_expenses')
                .select('id, user_id, amount, category, description, date, created_at')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setExpenses(data || []);
        } catch (err) {
            console.error('Error loading expenses:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({
            amount: '',
            category: t('kasir_cat_operational'),
            notes: '',
            expense_date: new Date().toISOString().split('T')[0]
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.amount || formData.amount <= 0) return;

        try {
            const payload = {
                user_id: user.id,
                amount: parseInt(formData.amount, 10),
                category: formData.category,
                description: formData.notes || '',
                date: formData.expense_date
            };

            // 1. Insert into kasir_expenses
            const { data: expData, error: expErr } = await supabase
                .from('kasir_expenses')
                .insert(payload)
                .select()
                .single();

            if (expErr) {
                console.error('Error inserting expense:', JSON.stringify(expErr));
                throw expErr;
            }

            // 2. Insert into cashbook
            try {
                const { error: cbErr } = await supabase
                    .from('cashbook')
                    .insert({
                        user_id: user.id,
                        type: 'expense',
                        category: t('kasir_expense_title'),
                        description: formData.notes || '',
                        amount: parseInt(formData.amount.toString().replace(/\D/g, ''), 10),
                        date: formData.expense_date
                    });

                if (cbErr) throw cbErr;
            } catch (err) {
                console.error('Kasir Expense to Cashbook sync error details:', err);
            }

            setIsModalOpen(false);
            loadData();
        } catch (err) {
            console.error('Error saving expense:', err);
            showToast(t('kasir_toast_expense_fail'), 'error', 5000);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('kasir_confirm_delete'))) return;
        try {
            // Get the expense data to delete from cashbook safely
            const { data: expToDelete } = await supabase.from('kasir_expenses').select('*').eq('id', id).single();

            // 1. Delete from kasir_expenses
            const { error: expErr } = await supabase
                .from('kasir_expenses')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (expErr) throw expErr;

            // 2. Delete from cashbook
            if (expToDelete) {
                await supabase
                    .from('cashbook')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('category', t('kasir_expense_title'))
                    .eq('amount', expToDelete.amount)
                    .eq('date', expToDelete.date)
                    .eq('description', expToDelete.description || '');
            }

            loadData();
        } catch (err) {
            console.error('Error deleting expense:', err);
            showToast(t('kasir_toast_expense_del_fail'), 'error', 5000);
        }
    };

    // Calculate totals
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    // === PLAN GUARD === PRO/ULTIMATE only
    if (!canAccessAdvancedKasir() && !isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="text-6xl mb-4">💸</div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">{t('kasir_expense_pro_limit_title')}</h2>
                <p className="text-slate-500 max-w-md mb-6 whitespace-pre-line">
                    {t('kasir_expense_pro_limit_desc')}
                </p>
                <button
                    onClick={() => navigate('/upgrade')}
                    className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                    {t('upgrade_pro_btn')}
                </button>
                <button onClick={() => navigate('/kasir')} className="mt-3 text-slate-400 hover:text-violet-600 text-sm font-bold transition-colors">
                    ← {t('kasir_back')}
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto h-full flex flex-col animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <button
                        onClick={() => navigate('/kasir')}
                        className="text-slate-500 hover:text-violet-600 mb-2 flex items-center gap-1 text-sm font-bold transition-colors"
                    >
                        <ArrowLeft size={16} /> {t('kasir_back')}
                    </button>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <Wallet className="text-pink-500" size={28} />
                        {t('kasir_expense_title')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('kasir_expense_desc')}</p>
                </div>

                <button
                    onClick={handleOpenModal}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-pink-600/30 transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> {t('kasir_add_expense')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">

                {/* Total Summary */}
                <div className="lg:col-span-1 border border-pink-200 bg-white rounded-2xl p-5 shadow-sm h-fit">
                    <div className="flex items-center gap-3 mb-4 text-pink-600 font-bold">
                        <div className="p-2 bg-pink-100 rounded-xl"><Calculator size={20} /></div>
                        {t('kasir_total_expense')}
                    </div>
                    <div className="text-3xl font-black text-slate-900 mb-2">
                        Rp {totalExpense.toLocaleString(t('locale_code'))}
                    </div>
                    <p className="text-xs text-slate-500">{t('kasir_total_expense_desc')}</p>

                    <div className="mt-6 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <strong className="block text-slate-700 mb-1">{t('kasir_expense_to_cashbook')}</strong>
                        <span className="text-xs text-slate-500 shrink-0">{t('kasir_expense_to_cashbook_desc')}</span>
                    </div>
                </div>

                {/* Expenses List */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 font-bold text-slate-800">
                        {t('kasir_expense_history')}
                    </div>
                    <div className="relative group flex-1">
                        <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="overflow-x-auto pb-4 scrollbar-thin h-full">
                            <table className="w-full text-left text-sm" style={{ minWidth: 600 }}>
                                <thead className="bg-slate-50 text-slate-500 sticky top-0 z-20">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">{t('kasir_col_date')}</th>
                                        <th className="px-5 py-3 font-medium">{t('kasir_col_category_notes')}</th>
                                        <th className="px-5 py-3 font-medium">{t('kasir_col_amount_label')}</th>
                                        <th className="px-5 py-3 font-medium text-right">{t('kasir_col_action_label')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {isLoading ? (
                                        <tr><td colSpan="4" className="text-center py-10"><div className="animate-spin w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent mx-auto"></div></td></tr>
                                    ) : expenses.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-10 text-slate-400">{t('kasir_no_sales')}</td></tr>
                                    ) : (
                                        expenses.map(exp => (
                                            <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                                                    {new Date(exp.date).toLocaleDateString(t('locale_code'), { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="font-bold text-slate-800">{exp.category}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{exp.description || '-'}</div>
                                                </td>
                                                <td className="px-5 py-3 font-black text-pink-600">
                                                    Rp {exp.amount.toLocaleString(t('locale_code'))}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <button
                                                        onClick={() => handleDelete(exp.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title={t('delete')}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>

            {/* Modal Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold">{t('kasir_add_expense_title')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-200 p-1 rounded-lg transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('kasir_col_date')}</label>
                                <input
                                    type="date" required
                                    value={formData.expense_date}
                                    onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('kasir_field_category')}</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                                >
                                    {categories.map((c, idx) => (
                                        <option key={idx} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('kasir_col_amount_label')} (Rp)</label>
                                <input
                                    type="number" required min="100" step="100"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="25000"
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('kasir_field_notes_label')}</label>
                                <textarea
                                    rows="2"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder={t('kasir_field_notes_ph')}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none hover:resize-none"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">{t('cancel')}</button>
                                <button type="submit" className="flex-[2] py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 transition-all">
                                    <Save size={18} /> {t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
