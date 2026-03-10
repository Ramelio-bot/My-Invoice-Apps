import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, ArrowLeft, X, Save, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLang } from '../../context/LanguageContext';
import UpgradePrompt from '../../components/UpgradePrompt';

export default function KasirKaryawan() {
    const { user, canAccessKaryawan, isAdmin, effectivePlan } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { t, lang } = useLang();

    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState({ name: '', role: 'Kasir', pin: '' });

    const isPlanProOrUltimate = ['pro', 'ultimate'].includes(effectivePlan) || isAdmin;

    if (!isPlanProOrUltimate) {
        return (
            <UpgradePrompt
                plan="PRO"
                feature="Manajemen Karyawan"
                message={t('limit_reached_msg')}
            />
        );
    }

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('kasir_employees')
                .select('id, user_id, name, role, pin, is_active')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            setEmployees(data || []);

            // Load shifts
            const { data: shiftData, error: shiftError } = await supabase
                .from('kasir_shifts')
                .select('*')
                .eq('user_id', user.id)
                .order('started_at', { ascending: false })
                .limit(20);

            if (!shiftError) setShifts(shiftData || []);
        } catch (err) {
            console.error('Error loading employees and shifts:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (emp = null) => {
        if (emp) {
            setEditingEmployee(emp);
            setFormData({ name: emp.name, role: emp.role, pin: emp.pin || '' });
        } else {
            setEditingEmployee(null);
            setFormData({ name: '', role: 'Kasir', pin: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                role: formData.role,
                pin: formData.pin || null
            };

            if (editingEmployee) {
                const { error } = await supabase
                    .from('kasir_employees')
                    .update(payload)
                    .eq('id', editingEmployee.id)
                    .eq('user_id', user.id);
                if (error) {
                    console.error('Error updating employee:', JSON.stringify(error));
                    throw error;
                }
            } else {
                const { error } = await supabase
                    .from('kasir_employees')
                    .insert({
                        user_id: user.id,
                        ...payload
                    });
                if (error) {
                    console.error('Error inserting employee:', JSON.stringify(error));
                    throw error;
                }
            }

            setIsModalOpen(false);
            loadData();
        } catch (err) {
            console.error('Error saving employee:', err);
            showToast(t('kar_toast_save_fail'), 'error', 5000);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
        try {
            // Soft delete
            const { error } = await supabase
                .from('kasir_employees')
                .update({ is_active: false })
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
            loadData();
        } catch (err) {
            console.error('Error deleting employee:', err);
            showToast(t('kar_toast_del_fail'), 'error', 5000);
        }
    };



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
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <Users className="text-indigo-500" size={28} />
                        {t('kasir_employee_title')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{t('kasir_employee_desc')}</p>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> {t('kasir_add_employee')}
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white">
                    {t('kasir_employee_list')}
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-3 font-medium">{t('kar_col_name')}</th>
                                <th className="px-5 py-3 font-medium">{t('kar_col_role')}</th>
                                <th className="px-5 py-3 font-medium">{t('kar_col_pin')}</th>
                                <th className="px-5 py-3 font-medium text-right">{t('kar_col_action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {isLoading ? (
                                <tr><td colSpan="4" className="text-center py-10"><div className="animate-spin w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div></td></tr>
                            ) : employees.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-10 text-slate-400">{t('kasir_no_employees')}</td></tr>
                            ) : (
                                employees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-200">
                                            {emp.name}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${emp.role === 'Admin'
                                                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400'
                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                }`}>
                                                {emp.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400 font-mono tracking-widest text-lg">
                                            {emp.pin ? '••••' : t('kar_no_pin')}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <button
                                                onClick={() => handleOpenModal(emp)}
                                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors mr-1"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(emp.id)}
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

            <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white flex items-center justify-between">
                    <span>{t('shift_history_title')}</span>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-3 font-medium">{t('shift_col_employee')}</th>
                                <th className="px-5 py-3 font-medium">{t('shift_col_start')}</th>
                                <th className="px-5 py-3 font-medium">{t('shift_col_end')}</th>
                                <th className="px-5 py-3 font-medium text-right">{t('shift_col_trx')}</th>
                                <th className="px-5 py-3 font-medium text-right">{t('shift_col_revenue')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {isLoading ? (
                                <tr><td colSpan="5" className="text-center py-6 text-slate-400">{t('loading')}</td></tr>
                            ) : shifts.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-slate-400">{t('shift_no_history')}</td></tr>
                            ) : (
                                shifts.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-200">{s.employee_name}</td>
                                        <td className="px-5 py-3 text-slate-500">{new Date(s.started_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                        <td className="px-5 py-3 text-slate-500">{s.ended_at ? new Date(s.ended_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : t('shift_active')}</td>
                                        <td className="px-5 py-3 text-right font-medium">{s.total_transactions}</td>
                                        <td className="px-5 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400 cursor-help" title={`Total Omzet: Rp ${s.total_revenue.toLocaleString('id-ID')}`}>{s.total_revenue.toLocaleString('id-ID')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                            <h2 className="text-lg font-bold dark:text-white">{editingEmployee ? t('kar_modal_edit') : t('kar_modal_add')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-200 p-1 rounded-lg transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('kar_field_fullname')}</label>
                                <input
                                    type="text" required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('kar_field_role')}</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="Kasir">Kasir</option>
                                    <option value="Admin">Admin / Manajer Toko</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('kar_field_pin')}</label>
                                <input
                                    type="password" pattern="[0-9]*" maxLength="6"
                                    value={formData.pin}
                                    onChange={e => setFormData({ ...formData, pin: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                                <button type="submit" className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all">
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
