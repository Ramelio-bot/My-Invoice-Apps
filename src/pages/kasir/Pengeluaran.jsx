import { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, ArrowLeft, X, Save, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function KasirPengeluaran() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        category: 'Operasional',
        notes: '',
        expense_date: new Date().toISOString().split('T')[0]
    });

    const categories = ['Operasional', 'Listrik & Air', 'Gaji Kasir', 'Bahan Baku Tambahan', 'Lainnya'];

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('kasir_expenses')
                .select('*')
                .eq('user_id', user.id)
                .order('expense_date', { ascending: false })
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
            category: 'Operasional',
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
                notes: formData.notes,
                expense_date: formData.expense_date
            };

            // 1. Insert into kasir_expenses
            const { data: expData, error: expErr } = await supabase
                .from('kasir_expenses')
                .insert(payload)
                .select()
                .single();

            if (expErr) throw expErr;

            // 2. Insert into cashbook
            const { error: cbErr } = await supabase
                .from('cashbook')
                .insert({
                    user_id: user.id,
                    type: 'expense',
                    category: `Kasir: ${formData.category}`,
                    description: formData.notes || `Pengeluaran Kasir - ${formData.category}`,
                    amount: parseInt(formData.amount, 10),
                    date: formData.expense_date,
                    reference_id: expData.id,
                    reference_type: 'kasir_expense'
                });

            if (cbErr) console.error('Failed to sync to cashbook:', cbErr);

            setIsModalOpen(false);
            loadData();
        } catch (err) {
            console.error('Error saving expense:', err);
            alert('Gagal mencatat pengeluaran.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus catatan pengeluaran ini? Data di Buku Kas juga akan dihapus.')) return;
        try {
            // 1. Delete from kasir_expenses
            const { error: expErr } = await supabase
                .from('kasir_expenses')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (expErr) throw expErr;

            // 2. Delete from cashbook (Triggered cascade or manual depending on setup)
            await supabase
                .from('cashbook')
                .delete()
                .eq('reference_id', id)
                .eq('reference_type', 'kasir_expense')
                .eq('user_id', user.id);

            loadData();
        } catch (err) {
            console.error('Error deleting expense:', err);
            alert('Gagal menghapus pengeluaran.');
        }
    };

    // Calculate totals
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto h-full flex flex-col animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <button
                        onClick={() => navigate('/kasir')}
                        className="text-slate-500 hover:text-violet-600 mb-2 flex items-center gap-1 text-sm font-bold transition-colors"
                    >
                        <ArrowLeft size={16} /> Kembali ke Kasir
                    </button>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <Wallet className="text-pink-500" size={28} />
                        Pengeluaran Kasir
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Catat pengeluaran toko yang otomatis tersinkronisasi ke Buku Kas Global.</p>
                </div>

                <button
                    onClick={handleOpenModal}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-pink-600/30 transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> Catat Pengeluaran
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">

                {/* Total Summary */}
                <div className="lg:col-span-1 border border-pink-200 dark:border-pink-900/50 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm h-fit">
                    <div className="flex items-center gap-3 mb-4 text-pink-600 dark:text-pink-400 font-bold">
                        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-xl"><Calculator size={20} /></div>
                        Total Pengeluaran
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-white mb-2">
                        Rp {totalExpense.toLocaleString('id-ID')}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total akumulasi semua pengeluaran kasir yang dicatat.</p>

                    <div className="mt-6 text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        <strong className="block text-slate-700 dark:text-slate-300 mb-1">Terhubung ke Cashbook!</strong>
                        <span className="text-xs text-slate-500 shrink-0">Semua data yang masuk ke sini otomatis tampil di Laporan Global Buku Kas.</span>
                    </div>
                </div>

                {/* Expenses List */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white">
                        Riwayat Pengeluaran
                    </div>
                    <div className="overflow-auto custom-scrollbar flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 sticky top-0">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Tanggal</th>
                                    <th className="px-5 py-3 font-medium">Kategori & Catatan</th>
                                    <th className="px-5 py-3 font-medium">Nominal</th>
                                    <th className="px-5 py-3 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {isLoading ? (
                                    <tr><td colSpan="4" className="text-center py-10"><div className="animate-spin w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent mx-auto"></div></td></tr>
                                ) : expenses.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-10 text-slate-400">Belum ada catatan pengeluaran.</td></tr>
                                ) : (
                                    expenses.map(exp => (
                                        <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-5 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                {new Date(exp.expense_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="font-bold text-slate-800 dark:text-slate-200">{exp.category}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{exp.notes || '-'}</div>
                                            </td>
                                            <td className="px-5 py-3 font-black text-pink-600 dark:text-pink-400">
                                                Rp {exp.amount.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() => handleDelete(exp.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Hapus"
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

            {/* Modal Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                            <h2 className="text-lg font-bold dark:text-white">Catat Pengeluaran</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-200 p-1 rounded-lg transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal</label>
                                <input
                                    type="date" required
                                    value={formData.expense_date}
                                    onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nominal (Rp)</label>
                                <input
                                    type="number" required min="100" step="100"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="25000"
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Catatan Tambahan (Opsional)</label>
                                <textarea
                                    rows="2"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Misal: Beli gas elpiji..."
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none hover:resize-none"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                                <button type="submit" className="flex-[2] py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 transition-all">
                                    <Save size={18} /> Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
