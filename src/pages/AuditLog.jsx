import { useState, useEffect } from 'react';
import { 
    Activity, Clock, Filter, AlertCircle, Trash2, 
    RefreshCcw, AlertTriangle, Info, Shield, Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR } from '../utils/currency';

export default function AuditLog() {
    const { user, isAdmin, effectivePlan } = useAuth();
    const { t, lang } = useLang();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterModule, setFilterModule] = useState('all');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const isPro = effectivePlan !== 'free' || isAdmin;

    useEffect(() => {
        if (user && isPro) {
            fetchLogs();
        }
    }, [user, isPro]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error('[AUDIT] Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityStyle = (severity) => {
        switch (severity) {
            case 'critical': return { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-50', border: 'border-red-100', icon: AlertCircle };
            case 'warning': return { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50', border: 'border-orange-100', icon: AlertTriangle };
            default: return { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-50', border: 'border-blue-100', icon: Info };
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchModule = filterModule === 'all' || log.module === filterModule;
        const matchSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
        const matchSearch = searchTerm === '' || 
            log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.reason?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchModule && matchSeverity && matchSearch;
    });

    if (!isPro) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
                <div className="w-20 h-20 bg-violet-100 rounded-3xl flex items-center justify-center mb-6 text-violet-600 shadow-xl shadow-violet-100/50">
                    <Shield size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">{t('audit_log_title')}</h2>
                <p className="text-slate-500 max-w-md mb-8">
                    {t('audit_log_pro_only') || 'Fitur Audit Aktivitas tersedia untuk pengguna paket PRO atau Ultimate.'}
                </p>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 max-w-lg">
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">
                        🚀 Upgrade sekarang untuk mendapatkan visibilitas penuh atas setiap penghapusan data dan perubahan stok manual di bisnis Anda.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Activity className="text-violet-600" size={32} />
                        {t('audit_log_title')}
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">{t('audit_log_desc')}</p>
                </div>
                
                <button 
                    onClick={fetchLogs}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                    {t('refresh') || 'Muat Ulang'}
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 mb-8 flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        placeholder={t('search') || 'Cari aktivitas...'}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-3 w-full lg:w-auto">
                    <select 
                        className="flex-1 lg:w-40 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none"
                        value={filterModule}
                        onChange={(e) => setFilterModule(e.target.value)}
                    >
                        <option value="all">{t('cb_filter_all') || 'Semua Modul'}</option>
                        <option value="Kasir">Kasir</option>
                        <option value="Invoice">Invoice</option>
                        <option value="Klien">Klien</option>
                        <option value="CatatanBisnis">Catatan Bisnis</option>
                    </select>

                    <select 
                        className="flex-1 lg:w-40 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none"
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                    >
                        <option value="all">{t('audit_col_severity')}</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-slate-100" />

                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-6 animate-pulse pl-4 md:pl-0">
                                <div className="w-8 h-8 md:w-16 md:h-16 bg-slate-100 rounded-full shrink-0 z-10" />
                                <div className="flex-1 h-32 bg-slate-50 rounded-3xl" />
                            </div>
                        ))}
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="bg-slate-50 rounded-3xl p-12 text-center ml-12 md:ml-20">
                        <Activity size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500 font-bold">{t('no_data')}</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {filteredLogs.map((log, index) => {
                            const style = getSeverityStyle(log.severity);
                            const Icon = style.icon;
                            const date = new Date(log.created_at);
                            
                            return (
                                <div key={log.id} className="flex gap-6 md:gap-10 items-start group pl-4 md:pl-0">
                                    {/* Icon Column */}
                                    <div className={`w-8 h-8 md:w-16 md:h-16 rounded-full ${style.bg} text-white flex items-center justify-center shrink-0 z-20 shadow-xl shadow-${log.severity === 'critical' ? 'red' : 'blue'}-500/20 group-hover:scale-110 transition-transform`}>
                                        <Icon size={24} className="md:w-8 md:h-8" />
                                    </div>

                                    {/* Content Column */}
                                    <div className={`flex-1 ${style.light} border ${style.border} rounded-3xl p-6 md:p-8 shadow-sm group-hover:shadow-md transition-shadow`}>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${style.bg} text-white`}>
                                                    {log.module}
                                                </span>
                                                <span className={`text-xs font-bold ${style.text}`}>
                                                    {log.action}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold bg-white/50 px-3 py-1 rounded-full">
                                                <Clock size={14} />
                                                {date.toLocaleDateString(t('locale_code'), { day: 'numeric', month: 'short', year: 'numeric' })} • {date.toLocaleTimeString(t('locale_code'), { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 leading-tight">
                                            {log.description}
                                        </h3>

                                        {log.reason && (
                                            <div className="mt-4 bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('audit_col_reason')}</p>
                                                <p className="text-sm font-bold text-slate-600 italic">" {log.reason} "</p>
                                            </div>
                                        )}

                                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                            <Shield size={12} />
                                            Admin ID: {log.user_id.substring(0, 8)}...
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <style>{`
                .animate-fade-in-up {
                    animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
