import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Plus, Edit2, Trash2, Search, ArrowLeft, Star, UserX, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LimitModal from '../components/LimitModal';

export default function KasirMembers() {
    const { user, isAdmin } = useAuth();
    const { isPro, isUltimate, effectivePlan } = usePlan();
    const { t } = useLang();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [members, setMembers] = useState([]);
    // FIX-09: pisahkan isFetching dan isSaving agar tidak saling block
    const [isFetching, setIsFetching] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ id: '', name: '', phone: '' });

    // FIX-08: gunakan state-based confirm modal, bukan window.confirm()
    const [deleteConfirm, setDeleteConfirm] = useState(null); // simpan {id, name} member yang akan dihapus

    const [showLimitModal, setShowLimitModal] = useState(false);

    const filteredMembers = members.filter(m =>
        (m.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (m.phone || '').includes(searchTerm)
    );

    useEffect(() => {
        if (!isUltimate && !isAdmin) {
            setShowLimitModal(true);
            return;
        }
        if (user) {
            fetchMembers();
        }
    }, [user, isUltimate, isAdmin]);

    const fetchMembers = async () => {
        setIsFetching(true); // FIX-09
        try {
            const { data, error } = await supabase
                .from('kasir_members')
                .select('id, user_id, name, phone, email, total_points, total_spent, total_transactions, joined_at')
                .eq('user_id', user.id)
                .order('joined_at', { ascending: false });

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching members:', error);
            showToast(t('members_load_fail'), 'error'); // FIX-10
        } finally {
            setIsFetching(false); // FIX-09
        }
    };

    const handleOpenForm = (member = null) => {
        if (member) {
            setFormData(member);
        } else {
            setFormData({ id: '', name: '', phone: '' });
        }
        setIsFormOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.phone.trim()) {
            return showToast(t('members_required'), 'error'); // FIX-10
        }

        setIsSaving(true); // FIX-09
        try {
            if (formData.id) {
                const { error } = await supabase
                    .from('kasir_members')
                    .update({ name: formData.name, phone: formData.phone })
                    .eq('id', formData.id)
                    .eq('user_id', user.id);

                if (error) throw error;
                showToast(t('members_updated_ok'), 'success'); // FIX-10
            } else {
                const { error } = await supabase
                    .from('kasir_members')
                    .insert({
                        user_id: user.id,
                        name: formData.name,
                        phone: formData.phone,
                        total_points: 0,
                        total_spent: 0
                    });

                if (error) {
                    if (error.code === '23505') {
                        showToast(t('members_phone_dup'), 'error'); // FIX-10
                        return;
                    }
                    throw error;
                }
                showToast(t('members_saved_ok'), 'success'); // FIX-10
            }
            setIsFormOpen(false);
            fetchMembers();
        } catch (err) {
            console.error(err);
            showToast(t('members_save_fail'), 'error'); // FIX-10
        } finally {
            setIsSaving(false); // FIX-09
        }
    };

    // FIX-08: tampilkan state confirm modal, bukan window.confirm()
    const handleDeleteClick = (member) => {
        setDeleteConfirm({ id: member.id, name: member.name });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirm) return;
        const memberId = deleteConfirm.id;
        setDeleteConfirm(null);

        setIsFetching(true); // FIX-09: gunakan isFetching untuk operasi list
        try {
            const { error } = await supabase
                .from('kasir_members')
                .delete()
                .eq('id', memberId)
                .eq('user_id', user.id);

            if (error) throw error;
            showToast(t('members_deleted_ok'), 'success'); // FIX-10
            fetchMembers();
        } catch (err) {
            console.error('Gagal menghapus member:', err);
            showToast(t('members_delete_fail'), 'error'); // FIX-10
        } finally {
            setIsFetching(false); // FIX-09
        }
    };

    if (!isUltimate && !isAdmin) {
        return (
            <>
                <div className="h-full flex items-center justify-center p-6 bg-slate-50">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Star size={40} />
                        </div>
                        <h2 className="text-2xl font-black mb-2">Fitur Eksklusif ULTIMATE</h2>
                        <p className="text-slate-500 mb-8">
                            Program Loyalitas &amp; Member Pelanggan tersedia eksklusif di paket <strong>ULTIMATE</strong>. Upgrade sekarang — hanya selisih Rp 20.000 dari PRO!
                        </p>
                        <button onClick={() => navigate('/upgrade')} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/30">
                            Upgrade ke ULTIMATE
                        </button>
                    </div>
                </div>
                {showLimitModal && <LimitModal plan="ULTIMATE" feature="Member & Loyalty" onClose={() => navigate('/kasir')} />}
            </>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto h-full flex flex-col min-h-[100dvh]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/kasir')} className="p-2 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors shadow-sm">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
                            {t('members_title')} <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">ULTIMATE</span>
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            {t('members_subtitle')} {/* FIX-10 */}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenForm()}
                    className="w-full sm:w-auto px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> {t('members_add')} {/* FIX-10 */}
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 mb-6 shrink-0 relative z-10">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('members_search_ph')} // FIX-10
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative z-0">
                {isFetching && members.length === 0 ? ( // FIX-09
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 rounded-full border-4 border-violet-500 border-t-transparent"></div>
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
                        <UserX size={48} className="mb-4 opacity-50" />
                        <p className="font-medium">{t('members_not_found')}</p> {/* FIX-10 */}
                    </div>
                ) : (
                    <div className="relative group flex-1">
                        <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="overflow-x-auto pb-4 scrollbar-thin h-full">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead className="sticky top-0 bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider z-20 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-4">{t('members_col_name')}</th> {/* FIX-10 */}
                                        <th className="px-6 py-4">{t('members_col_phone')}</th>
                                        <th className="px-6 py-4">{t('members_col_points')}</th>
                                        <th className="px-6 py-4">{t('members_col_spent')}</th>
                                        <th className="px-6 py-4 text-center">{t('members_col_action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-slate-900">{member.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-slate-500 font-mono text-sm">{member.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 rounded-md font-bold text-sm">
                                                    <Star className="fill-current text-violet-500" size={14} />
                                                    {member.total_points}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-slate-700">
                                                    Rp {(member.total_spent || 0).toLocaleString('id-ID')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenForm(member)}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(member)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-zoom-in" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold">
                                {formData.id ? t('members_edit_title') : t('members_add_title')} {/* FIX-10 */}
                            </h2>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    {t('members_field_name')} <span className="text-red-500">*</span> {/* FIX-10 */}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                    placeholder="Contoh: Budi Santoso"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    {t('members_field_phone')} <span className="text-red-500">*</span> {/* FIX-10 */}
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500 transition-all font-mono"
                                    placeholder="08123xxxxx"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 px-4 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                                    {t('cancel')} {/* FIX-10 */}
                                </button>
                                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-3 font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-xl shadow-lg shadow-violet-500/30 transition-all flex justify-center">
                                    {isSaving ? t('members_saving') : t('save')} {/* FIX-09 + FIX-10 */}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FIX-08: Delete Confirm Modal (state-based, bukan window.confirm) */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
                            <h3 className="font-bold text-lg mb-1">{t('members_delete_title')}</h3>
                            <p className="text-sm text-slate-500 mb-5">
                                <strong>{deleteConfirm.name}</strong> — {t('members_delete_desc')}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                                    {t('cancel')}
                                </button>
                                <button onClick={handleConfirmDelete} className="px-5 py-2 font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors">
                                    {t('delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
