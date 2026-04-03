import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, ArrowLeft, X, Save, ShieldAlert, Calendar as CalendarIcon, DollarSign, Clock, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLang } from '../../context/LanguageContext';
import { useOutlet } from '../../context/OutletContext';
import UpgradePrompt from '../../components/UpgradePrompt';

export default function KasirKaryawan() {
    const { user, canAccessKaryawan, isAdmin, effectivePlan } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { t, lang } = useLang();
    const { activeOutlet } = useOutlet();

    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState({ name: '', role: 'Kasir', pin: '' });

    // Report states
    const [activeTab, setActiveTab] = useState('list');
    const [reportPeriod, setReportPeriod] = useState('month');
    const [expandedEmployee, setExpandedEmployee] = useState(null);
    const [employeeStats, setEmployeeStats] = useState([]);
    const [reportTotals, setReportTotals] = useState({ employees: 0, shifts: 0, revenue: 0 });

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
    }, [user, activeOutlet?.id]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            let empQuery = supabase
                .from('kasir_employees')
                .select('id, user_id, name, role, pin, is_active')
                .eq('user_id', user.id)
                .eq('is_active', true);

            const { data, error } = await empQuery.order('name');

            if (error) throw error;
            setEmployees(data || []);

            // Helper for period dates
            const getPeriodDates = () => {
                const now = new Date();
                const start = new Date(now);
                start.setHours(0, 0, 0, 0);

                if (reportPeriod === 'today') {
                    // Start of today is already set
                } else if (reportPeriod === 'week') {
                    const day = start.getDay();
                    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
                    start.setDate(diff);
                } else if (reportPeriod === 'month') {
                    start.setDate(1);
                }

                // End of today
                const end = new Date();
                end.setHours(23, 59, 59, 999);
                return { start, end };
            };

            const dates = getPeriodDates();

            // Load shifts (All for the period, to build reports, up to 1000 to be safe for now)
            let shiftQuery = supabase
                .from('kasir_shifts')
                .select('id, employee_name, started_at, ended_at, total_transactions, total_revenue')
                .eq('user_id', user.id)
                .gte('started_at', dates.start.toISOString())
                .lte('started_at', dates.end.toISOString())
                .order('started_at', { ascending: false })
                .limit(1000);

            const { data: shiftData, error: shiftError } = await shiftQuery;

            if (!shiftError && shiftData) {
                setShifts(shiftData);

                // Process for Report
                const statsMap = shiftData.reduce((acc, shift) => {
                    const key = shift.employee_name;
                    if (!acc[key]) {
                        acc[key] = {
                            name: key,
                            totalShifts: 0,
                            totalTransactions: 0,
                            totalRevenue: 0,
                            shifts: []
                        };
                    }
                    acc[key].totalShifts += 1;
                    acc[key].totalTransactions += shift.total_transactions || 0;
                    acc[key].totalRevenue += shift.total_revenue || 0;
                    acc[key].shifts.push(shift);
                    return acc;
                }, {});

                const statsArr = Object.values(statsMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
                setEmployeeStats(statsArr);

                // Totals for cards
                const totalRevs = statsArr.reduce((sum, e) => sum + e.totalRevenue, 0);
                setReportTotals({
                    employees: statsArr.length,
                    shifts: shiftData.length,
                    revenue: totalRevs
                });
            }
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
        if (!window.confirm(t('confirm_delete'))) return;
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

    // Reload when period changes
    useEffect(() => {
        if (user) loadData();
    }, [reportPeriod, activeOutlet?.id]);

    const handleExportCSV = () => {
        if (employeeStats.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Karyawan,Total Shift,Total Transaksi,Total Omzet,Rata-rata per Shift\n";

        employeeStats.forEach(stat => {
            const avg = stat.totalShifts > 0 ? Math.floor(stat.totalRevenue / stat.totalShifts) : 0;
            const row = `${stat.name},${stat.totalShifts},${stat.totalTransactions},${stat.totalRevenue},${avg}`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Laporan_Performa_Karyawan_${reportPeriod}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };



    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto h-full flex flex-col animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <button
                        onClick={() => navigate('/kasir')}
                        className="text-slate-500 hover:text-violet-600 mb-2 flex items-center gap-1 text-sm font-bold transition-colors"
                    >
                        <ArrowLeft size={16} /> {t('kasir_back')}
                    </button>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <Users className="text-indigo-500" size={28} />
                        {t('kasir_employee_title')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('kasir_employee_desc')}</p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> {t('kasir_add_employee')}
                    </button>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex bg-slate-200/50 p-1.5 rounded-xl mb-6 w-full sm:w-fit">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'list'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    {t('tab_employee_list')}
                </button>
                <button
                    onClick={() => setActiveTab('report')}
                    className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'report'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    {t('tab_employee_report')}
                </button>
            </div>

            {/* TAB CONTENT: LIST */}
            {activeTab === 'list' && (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-y-auto max-h-[calc(100vh-250px)] scrollbar-thin">
                        <div className="px-5 py-4 border-b border-slate-200 font-bold text-slate-800">
                            {t('kasir_employee_list')}
                        </div>
                        <div className="relative group">
                            <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="overflow-x-auto pb-20 scrollbar-thin">
                                <table className="w-full text-left text-sm" style={{ minWidth: 600 }}>
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">{t('kar_col_name')}</th>
                                            <th className="px-5 py-3 font-medium">{t('kar_col_role')}</th>
                                            <th className="px-5 py-3 font-medium">{t('kar_col_pin')}</th>
                                            <th className="px-5 py-3 font-medium text-right">{t('kar_col_action')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {isLoading ? (
                                            <tr><td colSpan="4" className="text-center py-10"><div className="animate-spin w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div></td></tr>
                                        ) : employees.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-10 text-slate-400">{t('kasir_no_employees')}</td></tr>
                                        ) : (
                                            employees.map(emp => (
                                                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-5 py-3 font-bold text-slate-800">
                                                        {emp.name}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${emp.role === 'Admin'
                                                            ? 'bg-violet-100 text-violet-700'
                                                            : 'bg-emerald-100 text-emerald-700'
                                                            }`}>
                                                            {emp.role === 'Admin' ? (t('role_admin') || 'Admin') : (t('role_cashier') || 'Kasir')}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-500 font-mono tracking-widest text-lg">
                                                        {emp.pin ? '••••' : t('kar_no_pin')}
                                                    </td>
                                                    <td className="px-5 py-3 text-right">
                                                        <button
                                                            onClick={() => handleOpenModal(emp)}
                                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors mr-1"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(emp.id)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

                    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between">
                            <span>{t('shift_history_title')}</span>
                        </div>
                        <div className="relative group">
                            <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="overflow-x-auto pb-2 scrollbar-thin">
                                <table className="w-full text-left text-sm" style={{ minWidth: 700 }}>
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">{t('shift_col_employee')}</th>
                                            <th className="px-5 py-3 font-medium">{t('shift_col_start')}</th>
                                            <th className="px-5 py-3 font-medium">{t('shift_col_end')}</th>
                                            <th className="px-5 py-3 font-medium text-right">{t('shift_col_trx')}</th>
                                            <th className="px-5 py-3 font-medium text-right">{t('shift_col_revenue')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {isLoading ? (
                                            <tr><td colSpan="5" className="text-center py-6 text-slate-400">{t('loading')}</td></tr>
                                        ) : shifts.length === 0 ? (
                                            <tr><td colSpan="5" className="text-center py-8 text-slate-400">{t('shift_no_history')}</td></tr>
                                        ) : (
                                            shifts.map(s => (
                                                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-5 py-3 font-bold text-slate-800 whitespace-nowrap">{s.employee_name}</td>
                                                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{new Date(s.started_at).toLocaleString(t('locale_code'), { dateStyle: 'short', timeStyle: 'short' })}</td>
                                                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{s.ended_at ? new Date(s.ended_at).toLocaleString(t('locale_code'), { dateStyle: 'short', timeStyle: 'short' }) : t('shift_active')}</td>
                                                    <td className="px-5 py-3 text-right font-medium">{s.total_transactions}</td>
                                                    <td className="px-5 py-3 text-right font-medium text-emerald-600 cursor-help" title={`Total Omzet: Rp ${s.total_revenue.toLocaleString(t('locale_code'))}`}>{s.total_revenue.toLocaleString(t('locale_code'))}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* TAB CONTENT: REPORT */}
            {activeTab === 'report' && (
                <div className="flex flex-col gap-6 animate-fade-in-up">
                    {/* Period Filters */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex gap-2">
                            {['today', 'week', 'month'].map(period => (
                                <button
                                    key={period}
                                    onClick={() => setReportPeriod(period)}
                                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${reportPeriod === period
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {t(`period_${period}`)}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleExportCSV}
                            disabled={employeeStats.length === 0}
                            className="flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download size={16} /> {t('btn_export_csv')}
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded-xl shrink-0"><Users size={24} /></div>
                            <div>
                                <div className="text-xl font-black text-slate-800">{reportTotals.employees}</div>
                                <div className="text-sm font-medium text-slate-500">{t('active_cashiers')}</div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 text-amber-600 flex items-center justify-center rounded-xl shrink-0"><CalendarIcon size={24} /></div>
                            <div>
                                <div className="text-xl font-black text-slate-800">{reportTotals.shifts}</div>
                                <div className="text-sm font-medium text-slate-500">{t('col_total_shifts')}</div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-xl shrink-0"><DollarSign size={24} /></div>
                            <div>
                                <div className="text-xls sm:text-lg lg:text-xl font-black text-slate-800 truncate" title={`Rp ${reportTotals.revenue.toLocaleString(t('locale_code'))}`}>Rp {reportTotals.revenue.toLocaleString(t('locale_code'))}</div>
                                <div className="text-sm font-medium text-slate-500">{t('col_total_revenue')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Report Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-y-auto max-h-[calc(100vh-250px)] scrollbar-thin">
                        <div className="px-5 py-4 border-b border-slate-200 font-bold text-slate-800">
                            {t('employee_report_title')}
                        </div>
                        <div className="relative group">
                            <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="overflow-x-auto pb-20 scrollbar-thin">
                                <table className="w-full text-left text-sm" style={{ minWidth: 850 }}>
                                    <thead className="bg-slate-50 text-slate-500 whitespace-nowrap">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">{t('kar_col_name')}</th>
                                            <th className="px-5 py-3 font-medium text-center">{t('col_total_shifts')}</th>
                                            <th className="px-5 py-3 font-medium text-center">{t('col_total_trx')}</th>
                                            <th className="px-5 py-3 font-medium text-right">{t('col_total_revenue')}</th>
                                            <th className="px-5 py-3 font-medium text-right">{t('col_avg_per_shift')}</th>
                                            <th className="px-5 py-3 font-medium text-center">{t('kar_col_action')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {isLoading ? (
                                            <tr><td colSpan="6" className="text-center py-10"><div className="animate-spin w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div></td></tr>
                                        ) : employeeStats.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center py-10 text-slate-400">{t('no_shift_data')}</td></tr>
                                        ) : (
                                            employeeStats.map(stat => (
                                                <React.Fragment key={stat.name}>
                                                    <tr className={`hover:bg-slate-50 transition-colors ${expandedEmployee === stat.name ? 'bg-indigo-50/50' : ''}`}>
                                                        <td className="px-5 py-4 font-bold text-slate-800 whitespace-nowrap">{stat.name}</td>
                                                        <td className="px-5 py-4 text-center font-medium text-slate-600 tracking-tight">{stat.totalShifts}</td>
                                                        <td className="px-5 py-4 text-center font-medium text-slate-600 tracking-tight">{stat.totalTransactions}</td>
                                                        <td className="px-5 py-4 text-right font-black text-emerald-600 whitespace-nowrap">Rp {stat.totalRevenue.toLocaleString(t('locale_code'))}</td>
                                                        <td className="px-5 py-4 text-right font-medium text-slate-500 whitespace-nowrap">
                                                            Rp {(stat.totalShifts > 0 ? Math.floor(stat.totalRevenue / stat.totalShifts) : 0).toLocaleString(t('locale_code'))}
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <button
                                                                 onClick={() => setExpandedEmployee(expandedEmployee === stat.name ? null : stat.name)}
                                                                 className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 mx-auto"
                                                            >
                                                                {t('btn_detail')} {expandedEmployee === stat.name ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {/* Expanded Shift details */}
                                                    {expandedEmployee === stat.name && (
                                                        <tr className="bg-slate-50/50">
                                                            <td colSpan="6" className="p-0">
                                                                <div className="px-5 py-4">
                                                                    <h4 className="text-xs font-black text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2"><Clock size={14} /> Riwayat Shift: {stat.name}</h4>
                                                                    <div className="relative group/expanded">
                                                                        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent z-10 opacity-0 group-hover/expanded:opacity-100 transition-opacity" />
                                                                        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto opacity-90 scrollbar-thin">
                                                                            <table className="w-full text-xs text-left min-w-[500px]">
                                                                                <thead className="bg-slate-100 text-slate-500 whitespace-nowrap">
                                                                                    <tr>
                                                                                        <th className="px-4 py-2">{t('date')}</th>
                                                                                        <th className="px-4 py-2">{t('time')}</th>
                                                                                        <th className="px-4 py-2 text-center">{t('shift_col_trx')}</th>
                                                                                        <th className="px-4 py-2 text-right">{t('shift_col_revenue')}</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-slate-100">
                                                                                    {stat.shifts.map(s => (
                                                                                        <tr key={s.id} className="hover:bg-slate-50">
                                                                                            <td className="px-4 py-2 font-medium whitespace-nowrap">{new Date(s.started_at).toLocaleDateString(t('locale_code'), { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                                                            <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                                                                                                {new Date(s.started_at).toLocaleTimeString(t('locale_code'), { hour: '2-digit', minute: '2-digit' })}
                                                                                                {' - '}
                                                                                                {s.ended_at ? new Date(s.ended_at).toLocaleTimeString(t('locale_code'), { hour: '2-digit', minute: '2-digit' }) : t('shift_active')}
                                                                                            </td>
                                                                                            <td className="px-4 py-2 text-center font-medium">{s.total_transactions}</td>
                                                                                            <td className="px-4 py-2 text-right font-medium text-emerald-600 whitespace-nowrap">Rp {s.total_revenue.toLocaleString(t('locale_code'))}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold">{editingEmployee ? t('kar_modal_edit') : t('kar_modal_add')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-200 p-1 rounded-lg transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('kar_field_fullname')}</label>
                                <input
                                    type="text" required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('kar_field_role')}</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="Kasir">{t('role_cashier') || 'Cashier'}</option>
                                    <option value="Admin">{t('role_admin') || 'Admin / Manager'}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('kar_field_pin')}</label>
                                <input
                                    type="password" pattern="[0-9]*" maxLength="6"
                                    value={formData.pin}
                                    onChange={e => setFormData({ ...formData, pin: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">{t('cancel')}</button>
                                <button type="submit" className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all">
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
