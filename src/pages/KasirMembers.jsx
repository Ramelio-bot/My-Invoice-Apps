import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Plus, Edit2, Trash2, Search, ArrowLeft, Star, Edit, Upload, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LimitModal from '../components/LimitModal';

export default function KasirMembers() {
    const { user, isAdmin } = useAuth();
    const { isPro, effectivePlan } = usePlan();
    const { t } = useLang();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ id: '', name: '', phone: '' });

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);
    const [showLimitModal, setShowLimitModal] = useState(false);

    // Filter members
    const filteredMembers = members.filter(m => 
        (m.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (m.phone || '').includes(searchTerm)
    );

    useEffect(() => {
        if (!isPro && !isAdmin) {
            setShowLimitModal(true);
            return;
        }
        if (user) {
            fetchMembers();
        }
    }, [user, isPro, isAdmin]);

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('kasir_members')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching members:', error);
            showToast('Gagal memuat data member', 'error');
        } finally {
            setIsLoading(false);
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
        
        // Basic val
        if (!formData.name.trim() || !formData.phone.trim()) {
            return showToast('Nama dan No. WhatsApp wajib diisi', 'error');
        }
        
        setIsLoading(true);
        try {
            if (formData.id) {
                // Update
                const { error } = await supabase
                    .from('kasir_members')
                    .update({ name: formData.name, phone: formData.phone })
                    .eq('id', formData.id)
                    .eq('user_id', user.id);

                if (error) throw error;
                showToast('Member berhasil diperbarui', 'success');
            } else {
                // Insert
                // Set default points
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
                         showToast('No. WhatsApp sudah terdaftar', 'error');
                         return;
                    }
                    throw error;
                }
                showToast('Member berhasil ditambahkan', 'success');
            }
            setIsFormOpen(false);
            fetchMembers();
        } catch (err) {
            console.error(err);
            showToast('Gagal menyimpan member', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = (member) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus member ${member.name}? Data histori poin juga akan terhapus.`)) {
            handleConfirmDelete(member.id);
        }
    };

    const handleConfirmDelete = async (memberId) => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('kasir_members')
                .delete()
                .eq('id', memberId)
                .eq('user_id', user.id);

            if (error) throw error;

            showToast('Member berhasil dihapus', 'success');
            fetchMembers();
        } catch (err) {
            console.error('Gagal menghapus member:', err);
            showToast('Gagal menghapus member', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isPro && !isAdmin) {
        return (
            <>
                <div className="h-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Star size={40} />
                        </div>
                        <h2 className="text-2xl font-black mb-2 dark:text-white">Fitur Terkunci</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">
                            Upload logo dan setting Loyalty Program Kasir adalah fitur ekslusif untuk paket PRO & ULTIMATE.
                        </p>
                        <button onClick={() => navigate('/upgrade')} className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold shadow-lg shadow-violet-500/30">
                            Upgrade ke PRO
                        </button>
                    </div>
                </div>
                {showLimitModal && <LimitModal plan="PRO" feature="Member Kasir" onClose={() => navigate('/kasir')} />}
            </>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto h-full flex flex-col min-h-[100dvh]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/kasir')} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors shadow-sm">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            {t('members_title')} <span className="bg-violet-100 text-violet-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">PRO</span>
                        </h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                            Kelola pelanggan setia dan points kasir
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => handleOpenForm()} 
                    className="w-full sm:w-auto px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> Tambah Member
                </button>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6 shrink-0 relative z-10">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama atau nomor WA..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col relative z-0">
                {isLoading && members.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 rounded-full border-4 border-violet-500 border-t-transparent"></div>
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
                        <UserX size={48} className="mb-4 opacity-50" />
                        <p className="font-medium">Tidak ada member ditemukan</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-x-auto min-h-0 relative z-0">
                        <table className="w-full text-left border-collapse min-w-[700px] relative z-0">
                            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider z-10 w-full shadow-sm">
                                <tr>
                                    <th className="px-6 py-4">Nama</th>
                                    <th className="px-6 py-4">No. WhatsApp</th>
                                    <th className="px-6 py-4">Total Poin</th>
                                    <th className="px-6 py-4">Total Belanja</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {filteredMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-slate-900 dark:text-white">{member.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-slate-500 dark:text-slate-400 font-mono text-sm">{member.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 rounded-md font-bold text-sm">
                                                <Star className="fill-current text-violet-500" size={14} />
                                                {member.total_points}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                Rp {(member.total_spent || 0).toLocaleString('id-ID')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenForm(member)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors tooltip"
                                                    data-tip="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(member)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors tooltip"
                                                    data-tip="Hapus"
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
                )}
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-zoom-in" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                            <h2 className="text-xl font-bold dark:text-white">{formData.id ? 'Edit Member' : 'Tambah Member'}</h2>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <UserX size={20} /> {/* Using UserX as X icon placeholder */}
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Pelanggan <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                    placeholder="Contoh: Budi Santoso"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">No. WhatsApp <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-violet-500 transition-all font-mono"
                                    placeholder="08123xxxxx"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 px-4 py-3 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors">
                                    Batal
                                </button>
                                <button type="submit" disabled={isLoading} className="flex-1 px-4 py-3 font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-xl shadow-lg shadow-violet-500/30 transition-all flex justify-center">
                                    {isLoading ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
