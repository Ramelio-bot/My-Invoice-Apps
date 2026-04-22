import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, AlertCircle, HandCoins, Download } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePlan } from '../context/PlanContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR, formatCompactCurrency } from '../utils/currency';
import { formatDateID, todayStr } from '../utils/date';
import { supabase } from '../lib/supabase';
import { useOutlet } from '../context/OutletContext';
import LimitModal from '../components/LimitModal';
import { recordAudit } from '../utils/audit';



const emptyEntry = () => ({
    id: Date.now().toString(),
    name: '',
    amount: 0,
    dueDate: '',
    status: 'unpaid',
    notes: '',
    createdAt: todayStr(),
});



export default function HutangPiutang() {
    const {
        isPro, isPremium, checkDownloadLimit, incrementDownload,
        checkHutangPiutangLimit, incrementHutangPiutang, getHutangPiutangCount,
        refreshUsage, currentLimits
    } = usePlan();
    const { showToast } = useToast();
    const { effectivePlan, isAdmin, user } = useAuth();
    const { lang, t } = useLang();
    const { activeOutlet } = useOutlet();
    const [piutang, setPiutang] = useState([]);
    const [hutang, setHutang] = useState([]);
    const [activeTab, setActiveTab] = useState('piutang');
    const [form, setForm] = useState(emptyEntry());
    const [showForm, setShowForm] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showLimitModal, setShowLimitModal] = useState(false);

    // === BILINGUAL ===
    const fetchData = async () => {
        if (!user) return;
        let query = supabase
            .from('documents')
            .select('id, type, status, created_at, client_name, total_amount, data, outlet_id')
            .eq('user_id', user.id)
            .in('type', ['piutang', 'hutang']);
        
        if (activeOutlet?.id) {
            query = query.or(`outlet_id.eq.${activeOutlet.id},outlet_id.is.null`);
        }

        const { data, error } = await query;

        if (!error && data) {
            const p = data.filter(d => d.type === 'piutang').map(d => {
                const { id: _ignoredId, ...restData } = d.data || {};
                return {
                    name: d.client_name,
                    amount: d.total_amount || d.total || restData.amount,
                    status: d.status || restData.status || 'unpaid',
                    dueDate: restData.dueDate || restData.due_date || d.created_at,
                    date: d.created_at,
                    ...restData,
                    id: d.id, // Ensure id takes precedence over any id in d.data
                };
            });
            const h = data.filter(d => d.type === 'hutang').map(d => {
                const { id: _ignoredId, ...restData } = d.data || {};
                return {
                    name: d.client_name,
                    amount: d.total_amount || d.total || restData.amount,
                    status: d.status || restData.status || 'unpaid',
                    dueDate: restData.dueDate || restData.due_date || d.created_at,
                    date: d.created_at,
                    ...restData,
                    id: d.id, // Ensure id takes precedence over any id in d.data
                };
            });
            setPiutang(p);
            setHutang(h);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const data = activeTab === 'piutang' ? piutang : hutang;
    const setData = activeTab === 'piutang' ? setPiutang : setHutang;

    const text = '#1E293B';
    const sub = '#64748B';
    const card = 'white';
    const bg2 = '#F8FAFC';
    const border = '#E2E8F0';

    const totalPiutang = piutang.filter(e => e.status === 'unpaid').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalHutang = hutang.filter(e => e.status === 'unpaid').reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const overdueItems = data.filter(e => e.status === 'unpaid' && e.date && new Date(e.date) < now);
    const dueSoonItems = data.filter(e =>
        e.status === 'unpaid' &&
        e.date &&
        new Date(e.date) >= now &&
        new Date(e.date) <= threeDaysFromNow
    );

    const handleAdd = () => {
        if (!checkHutangPiutangLimit()) {
            showToast(t('hp_limit_reached'), 'warning');
            return;
        }
        setForm(emptyEntry());
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { showToast(t('kl_toast_name_req'), 'error'); return; }
        if (!form.amount || Number(form.amount) <= 0) { showToast(t('hp_col_amount') + ' > 0', 'error'); return; }
        const entry = { ...form, amount: Number(form.amount) };

        // Limit checking for FREE users
        if (!isPro && !isAdmin && !checkHutangPiutangLimit()) {
            setShowLimitModal(true);
            return;
        }

        // Persist to Supabase
        const { id: _formId, ...formData } = form;
        const dbEntry = {
            user_id: user.id,
            type: activeTab, // 'piutang' or 'hutang'
            client_name: form.name,
            total_amount: Number(form.amount),
            status: form.status || 'unpaid',
            outlet_id: activeOutlet?.id || null,
            data: { ...form, amount: Number(form.amount) }
        };

        try {
            const existing = data.find(d => d.id === entry.id);
            if (existing && existing.id.length > 15) { // UUID
                await supabase.from('documents').update(dbEntry).eq('id', existing.id).eq('user_id', user.id);
                setData(prev => prev.map(d => d.id === entry.id ? entry : d));
                showToast(t('hp_toast_status_updated'), 'success');
            } else {
                delete dbEntry.id;
                const { data: saved, error } = await supabase.from('documents').insert(dbEntry).select().single();
                if (error) throw error;
                if (saved) entry.id = saved.id;
                setData(prev => [...prev, entry]);
                incrementHutangPiutang(); // Increment limit for new entries
                showToast(t('hp_toast_saved'), 'success');
            }
            window.dispatchEvent(new Event('piutang-updated'));
            window.dispatchEvent(new Event('data-updated'));
        } catch (err) {
            console.error('HutangPiutang sync error:', err);
            showToast(t('kl_toast_save_fail'), 'error');
        }
        setShowForm(false);
    };

    const togglePaid = async (id) => {
        console.log("ID DOKUMEN YANG DIUPDATE:", id);
        const existing = data.find(d => d.id === id);
        if (!existing) return;

        const newStatus = existing.status === 'paid' ? 'unpaid' : 'paid';

        // 1. Optimistic UI Update
        setData(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
        showToast(t('hp_toast_status_updated'), 'success');

        // 2. Background Sync
        try {
            const { id: _id, ...rest } = existing;
            await supabase.from('documents').update({
                status: newStatus,
                data: { ...rest, status: newStatus }
            }).eq('id', id).eq('user_id', user.id);



            window.dispatchEvent(new Event('cashbook-updated')); // Triggers Dashboard to reload
            window.dispatchEvent(new Event('piutang-updated'));
            window.dispatchEvent(new Event('data-updated'));
        } catch (err) {
            console.error('HutangPiutang toggle sync error:', err);
        }
    };

    const handleDelete = async (id) => {
        const item = data.find(d => d.id === id);
        if (!item) return;

        // 1. Optimistic UI Update
        setData(prev => prev.filter(d => d.id !== id));
        setDeleteConfirm(null);
        showToast(t('hp_toast_deleted'), 'info');

        // 2. Background Sync
        try {
            await supabase.from('documents').delete().eq('id', id).eq('user_id', user.id);
            
            await recordAudit(
                'DELETE', 
                'HutangPiutang', 
                `Deleted ${activeTab} for ${item.name} (Amount: ${item.amount})`, 
                'User Deleted Entry', 
                'warning'
            );

            refreshUsage(); // Added refreshUsage call
            window.dispatchEvent(new Event('piutang-updated'));
            window.dispatchEvent(new Event('data-updated'));
        } catch (err) {
            console.error('HutangPiutang delete sync error:', err);
        }
    };

    const handleExportCSV = () => {
        const dataToExport = [
            ...piutang.map(i => ({ ...i, type: 'piutang' })),
            ...hutang.map(i => ({ ...i, type: 'hutang' }))
        ];

        const rows = [
            [t('lap_col_date'), t('lap_col_type'), t('hp_col_client'), t('hp_col_amount'), t('form_date'), t('form_valid_until'), t('hp_col_status'), t('hp_col_note')],
            ...dataToExport.map((item, i) => [
                i + 1,
                item.type === 'piutang' ? t('hp_filter_receivable') : t('hp_filter_debt'),
                item.name || '-',
                item.amount || 0,
                item.date ? new Date(item.date).toLocaleDateString(t('locale_code')) : '-',
                item.dueDate ? new Date(item.dueDate).toLocaleDateString(t('locale_code')) : '-',
                item.status === 'paid' ? t('hp_status_paid') : t('hp_status_unpaid'),
                (item.notes || '-').replace(/,/g, ';')
            ])
        ];

        // Summary
        rows.push([]);
        rows.push([t('csv_summary'), '', '', '', '', '', '', '']);
        rows.push([t('hp_summary_receivable') + ` (${t('hp_status_unpaid')})`, '', '', totalPiutang, '', '', '', '']);
        rows.push([t('hp_summary_debt') + ` (${t('hp_status_unpaid')})`, '', '', totalHutang, '', '', '', '']);

        const csvContent = rows.map(r => r.join(',')).join('\n');
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${t('hp_title')}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const unpaid = data.filter(e => e.status === 'unpaid');
    const paid = data.filter(e => e.status === 'paid');

    const TabBtn = ({ value, label, count, color }) => (
        <button
            onClick={() => { setActiveTab(value); setShowForm(false); }}
            style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: activeTab === value ? (value === 'piutang' ? '#ECFDF5' : '#FEF2F2') : bg2,
                color: activeTab === value ? color : sub,
                fontWeight: 700, fontSize: 14, transition: 'all 200ms',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
        >
            {label}
            <span style={{
                background: activeTab === value ? color : '#94A3B8', color: 'white',
                borderRadius: 100, padding: '1px 7px', fontSize: 11, fontWeight: 800,
            }}>{count}</span>
        </button>
    );


    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px', color: text }}>
                    {t('hp_title')}
                </h1>
                <p style={{ margin: 0, color: sub, fontSize: 14 }}>
                    {t('hp_subtitle')}
                </p>
            </div>

            {/* Banners */}
            {overdueItems.length > 0 && (
                <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600 }}>
                    <AlertCircle size={18} color="#EF4444" />
                    🚨 {overdueItems.length} {t('debt_overdue')}!
                </div>
            )}

            {dueSoonItems.length > 0 && (
                <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: '#FFFBEB', border: '1px solid #FCD34D', color: '#B45309', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600 }}>
                    <AlertCircle size={18} color="#F59E0B" />
                    ⏰ {dueSoonItems.length} {t('debt_due_soon')}.
                </div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div style={{ background: card, borderRadius: 14, padding: '16px 20px', border: `1px solid ${border}`, borderTop: '3px solid #10B981', minWidth: 0 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>{t('hp_summary_receivable')}</p>
                    <p 
                        title={formatIDR(totalPiutang)}
                        className="truncate"
                        style={{ margin: 0, fontSize: totalPiutang >= 1_000_000_000 ? 18 : 22, fontWeight: 900, color: '#10B981', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                        {formatCompactCurrency(totalPiutang)}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: sub }}>{piutang.filter(e => e.status === 'unpaid').length} {t('hp_status_unpaid').toLowerCase()}</p>
                </div>
                <div style={{ background: card, borderRadius: 14, padding: '16px 20px', border: `1px solid ${border}`, borderTop: '3px solid #EF4444', minWidth: 0 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase' }}>{t('hp_summary_debt')}</p>
                    <p 
                        title={formatIDR(totalHutang)}
                        className="truncate"
                        style={{ margin: 0, fontSize: totalHutang >= 1_000_000_000 ? 18 : 22, fontWeight: 900, color: '#EF4444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                        {formatCompactCurrency(totalHutang)}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: sub }}>{hutang.filter(e => e.status === 'unpaid').length} {t('hp_status_unpaid').toLowerCase()}</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, background: bg2, padding: 4, borderRadius: 12 }}>
                <TabBtn value="piutang" label={t('hp_filter_receivable')} count={piutang.length} color="#10B981" />
                <TabBtn value="hutang" label={t('hp_filter_debt')} count={hutang.length} color="#EF4444" />
            </div>

            {/* Action row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 13, color: sub }}>
                    {activeTab === 'piutang' ? t('hp_receivable_desc') : t('hp_payable_desc')}
                    {!isPro && !isAdmin && ` · ${data.length}/${currentLimits?.hutangPiutang || 30} FREE`}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={handleExportCSV}
                        disabled={piutang.length === 0 && hutang.length === 0}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 8,
                            border: '1.5px solid #F59E0B',
                            background: 'none', color: '#F59E0B',
                            fontSize: 13, fontWeight: 700,
                            cursor: (piutang.length === 0 && hutang.length === 0) ? 'not-allowed' : 'pointer',
                            opacity: (piutang.length === 0 && hutang.length === 0) ? 0.5 : 1
                        }}
                    >
                        <Download size={14} />
                        {t('export')}
                    </button>
                    <button onClick={handleAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}>
                        <Plus size={15} /> {t('add')}
                    </button>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div style={{ background: card, borderRadius: 14, padding: 20, marginBottom: 16, border: `1.5px solid ${activeTab === 'piutang' ? '#10B981' : '#EF4444'}` }}>
                    <h3 style={{ margin: '0 0 16px', color: text, fontSize: 15, fontWeight: 700 }}>
                        {t('hp_add_entry')}
                    </h3>
                    <form onSubmit={handleSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group" style={{ margin: 0, gridColumn: '1/-1' }}>
                                <label className="label">{t('hp_col_client')}</label>
                                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('hp_col_client')} required />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="label">{t('hp_col_amount')}</label>
                                <input type="number" min="0" className="input" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="label">{t('form_valid_until')}</label>
                                <input type="date" className="input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                            </div>
                            <div className="form-group" style={{ margin: 0, gridColumn: '1/-1' }}>
                                <label className="label">{t('hp_col_note')}</label>
                                <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t('hp_col_note')} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px' }}>{t('save')}</button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline" style={{ padding: '8px 20px' }}>{t('cancel')}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            {data.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: sub }}>
                    <HandCoins size={40} strokeWidth={1.5} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>{t('no_data')} ({activeTab === 'piutang' ? t('hp_filter_receivable') : t('hp_filter_debt')})</p>
                    <p style={{ margin: '4px 0 0', fontSize: 13 }}>{t('hp_add_entry')}</p>
                </div>
            ) : (
                <div className="relative group">
                    <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="overflow-x-auto pb-2 scrollbar-thin">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 'min-content' }}>
                            {/* Unpaid */}
                            {unpaid.length > 0 && (
                                <>
                                    <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('hp_status_unpaid')}</p>
                                    {unpaid.map(entry => (
                                        <EntryCard key={entry.id} entry={entry} tab={activeTab} text={text} sub={sub} bg2={bg2} border={border}
                                            onTogglePaid={() => togglePaid(entry.id)}
                                            onEdit={() => { setForm(entry); setShowForm(true); }}
                                            onDelete={() => setDeleteConfirm(entry.id)} />
                                    ))}
                                </>
                            )}
                            {/* Paid */}
                            {paid.length > 0 && (
                                <>
                                    <p style={{ margin: '12px 0 4px', fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('hp_status_paid')}</p>
                                    {paid.map(entry => (
                                        <EntryCard key={entry.id} entry={entry} tab={activeTab} text={text} sub={sub} bg2={bg2} border={border}
                                            onTogglePaid={() => togglePaid(entry.id)}
                                            onEdit={() => { setForm(entry); setShowForm(true); }}
                                            onDelete={() => setDeleteConfirm(entry.id)} />
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: card, borderRadius: 16, padding: 28, maxWidth: 360, width: 'calc(100% - 32px)', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}>
                        <AlertCircle size={32} color="#EF4444" style={{ marginBottom: 12 }} />
                        <h3 style={{ margin: '0 0 8px', color: text }}>{t('hp_delete_title')}</h3>
                        <p style={{ margin: '0 0 20px', color: sub }}>{t('hp_delete_body')}</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: '10px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>{t('delete')}</button>
                            <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '10px', background: bg2, color: text, border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>{t('cancel')}</button>
                        </div>
                    </div>
                </div>
            )}
            {showLimitModal && <LimitModal plan="PRO" feature="Hutang Piutang" onClose={() => setShowLimitModal(false)} />}
        </div>
    );
}

function EntryCard({ entry, tab, text, sub, bg2, border, onTogglePaid, onEdit, onDelete }) {
    const { t, lang } = useLang();
    const isPaid = entry.status === 'paid';
    const accentColor = tab === 'piutang' ? '#10B981' : '#EF4444';
    const isOverdue = entry.dueDate && !isPaid && new Date(entry.dueDate) < new Date();

    return (
        <div style={{
            background: 'white', borderRadius: 12, padding: '14px 16px',
            border: `1px solid ${isOverdue ? '#FCA5A5' : border}`,
            display: 'flex', alignItems: 'center', gap: 12,
            opacity: isPaid ? 0.75 : 1, transition: 'all 200ms',
        }}>
            {/* Check toggle */}
            <button onClick={onTogglePaid} style={{
                width: 28, height: 28, borderRadius: '50%', border: `2px solid ${isPaid ? '#10B981' : '#CBD5E1'}`,
                background: isPaid ? '#10B981' : 'transparent', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms',
            }}>
                {isPaid && <Check size={14} color="white" strokeWidth={3} />}
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: isPaid ? sub : text, textDecoration: isPaid ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.name}
                    </p>
                    {isOverdue && <span style={{ background: '#FEE2E2', color: '#EF4444', borderRadius: 100, padding: '1px 8px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{t('debt_status_overdue')}</span>}
                    {isPaid && <span style={{ background: '#ECFDF5', color: '#10B981', borderRadius: 100, padding: '1px 8px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{t('debt_status_paid')}</span>}
                    {!isPaid && !isOverdue && entry.dueDate && (new Date(entry.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) && (
                        <span style={{ background: '#FEF3C7', color: '#D97706', borderRadius: 100, padding: '1px 8px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{t('debt_status_soon')}</span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontSize: 11, color: sub }}>{entry.createdAt && formatDateID(entry.createdAt, lang)}</p>
                    {entry.dueDate && <p style={{ margin: 0, fontSize: 11, color: isOverdue ? '#EF4444' : sub }}>{t('hp_tempo_label')}: {formatDateID(entry.dueDate, lang)}</p>}
                    {entry.notes && <p style={{ margin: 0, fontSize: 11, color: sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{entry.notes}</p>}
                </div>
            </div>

            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: isPaid ? '#10B981' : accentColor, flexShrink: 0 }}>
                {formatIDR(entry.amount)}
            </p>

            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={onEdit} style={{ background: bg2, border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: sub }}>{t('edit')}</button>
                <button onClick={onDelete} style={{ background: '#FEF2F2', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#EF4444' }}>{t('delete')}</button>
            </div>
        </div>
    );
}
