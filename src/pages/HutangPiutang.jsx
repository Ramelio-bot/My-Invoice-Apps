import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, AlertCircle, HandCoins } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTheme } from '../context/ThemeContext';
import { usePlan } from '../context/PlanContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR } from '../utils/currency';
import { formatDateID } from '../utils/date';

const emptyEntry = () => ({
    id: Date.now().toString(),
    name: '',
    amount: 0,
    dueDate: '',
    status: 'unpaid',
    notes: '',
    createdAt: new Date().toISOString().slice(0, 10),
});



export default function HutangPiutang() {
    const { dark } = useTheme();
    const {
        isPro, isPremium, checkDownloadLimit, incrementDownload,
        checkHutangPiutangLimit, incrementHutangPiutang, getHutangPiutangCount,
        refreshUsage
    } = usePlan();
    const { showToast } = useToast();
    const { effectivePlan, isAdmin, user, supabase } = useAuth(); // Kept supabase here as it's used
    const { lang } = useLang();

    // === BILINGUAL ===
    const T = {
        title: lang === 'EN' ? 'Accounts Receivable & Payable' : 'Hutang & Piutang',
        subtitle: lang === 'EN' ? 'Track who owes you money and who you owe.' : 'Pantau tagihan yang harus diterima dan harus dibayar.',
        tabReceivable: lang === 'EN' ? 'Receivable' : 'Piutang',
        tabPayable: lang === 'EN' ? 'Payable' : 'Hutang',
        totalReceivable: lang === 'EN' ? 'Total Receivable' : 'Total Piutang',
        totalPayable: lang === 'EN' ? 'Total Payable' : 'Total Hutang',
        unpaid: lang === 'EN' ? 'unpaid' : 'belum dibayar',
        receivableDesc: lang === 'EN' ? 'People who owe you money' : 'Orang yang berhutang kepada Anda',
        payableDesc: lang === 'EN' ? 'Debts you need to pay' : 'Hutang yang harus Anda bayar',
        add: lang === 'EN' ? 'Add' : 'Tambah',
        addReceivable: lang === 'EN' ? 'Add Receivable' : 'Tambah Piutang',
        addPayable: lang === 'EN' ? 'Add Payable' : 'Tambah Hutang',
        borrowerName: lang === 'EN' ? 'Borrower Name' : 'Nama Peminjam',
        lenderName: lang === 'EN' ? 'Lender Name' : 'Nama Pemberi Hutang',
        amount: lang === 'EN' ? 'Amount (Rp)' : 'Jumlah (Rp)',
        dueDate: lang === 'EN' ? 'Due Date' : 'Jatuh Tempo',
        notes: lang === 'EN' ? 'Notes' : 'Catatan',
        notesPlaceholder: lang === 'EN' ? 'Additional notes' : 'Keterangan tambahan',
        save: lang === 'EN' ? 'Save' : 'Simpan',
        cancel: lang === 'EN' ? 'Cancel' : 'Batal',
        edit: lang === 'EN' ? 'Edit' : 'Edit',
        delete: lang === 'EN' ? 'Delete' : 'Hapus',
        notPaid: lang === 'EN' ? 'Unpaid' : 'Belum Lunas',
        paid: lang === 'EN' ? 'Paid' : 'Lunas',
        overdue: lang === 'EN' ? 'Overdue' : 'Terlambat',
        due: lang === 'EN' ? 'Due' : 'Tempo',
        emptyTitle: lang === 'EN' ? 'No entries yet' : 'Belum ada entri',
        emptyDesc: lang === 'EN' ? 'Click "Add" to add an entry' : 'Klik "Tambah" untuk menambahkan',
        deleteConfirmTitle: lang === 'EN' ? 'Delete Entry?' : 'Hapus Entri?',
        deleteConfirmDesc: lang === 'EN' ? 'This data cannot be restored after deletion.' : 'Data ini tidak bisa dikembalikan setelah dihapus.',
        savedToast: lang === 'EN' ? 'Entry saved' : 'Entri ditambahkan',
        updatedToast: lang === 'EN' ? 'Entry updated' : 'Entri diperbarui',
        deletedToast: lang === 'EN' ? 'Entry deleted' : 'Entri dihapus',
        nameRequired: lang === 'EN' ? 'Name is required' : 'Nama wajib diisi',
        amountRequired: lang === 'EN' ? 'Amount must be greater than 0' : 'Jumlah harus lebih dari 0',
        freeLimit: lang === 'EN' ? `Free limit: max 5 entries. Upgrade to PRO for unlimited.` : `Batas FREE: maks 5 entri. Upgrade ke PRO untuk unlimited.`,
    };

    const [piutang, setPiutang] = useState([]); // Removed useLocalStorage
    const [hutang, setHutang] = useState([]); // Removed useLocalStorage
    const [cashbook, setCashbook] = useState([]); // Removed useLocalStorage

    const [tab, setTab] = useState('piutang');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyEntry());
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchData = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', user.id)
            .in('type', ['piutang', 'hutang']);

        if (!error && data) {
            const p = data.filter(d => d.type === 'piutang').map(d => ({
                id: d.id,
                name: d.client_name,
                amount: d.total,
                status: d.status,
                date: d.date,
                ...(d.data || {})
            }));
            const h = data.filter(d => d.type === 'hutang').map(d => ({
                id: d.id,
                name: d.client_name,
                amount: d.total,
                status: d.status,
                date: d.date,
                ...(d.data || {})
            }));
            setPiutang(p);
            setHutang(h);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const data = tab === 'piutang' ? piutang : hutang;
    const setData = tab === 'piutang' ? setPiutang : setHutang;

    const text = dark ? '#F1F5F9' : '#1E293B';
    const sub = dark ? '#94A3B8' : '#64748B';
    const card = dark ? '#1E293B' : 'white';
    const bg2 = dark ? '#0F172A' : '#F8FAFC';
    const border = dark ? '#334155' : '#E2E8F0';

    const totalPiutang = piutang.filter(e => e.status === 'unpaid').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalHutang = hutang.filter(e => e.status === 'unpaid').reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const handleAdd = () => {
        if (!checkHutangPiutangLimit()) {
            showToast('Batas bulanan tercapai (10 catatan). Upgrade ke PRO untuk tanpa batas!', 'warning');
            return;
        }
        setForm(emptyEntry());
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { showToast(T.nameRequired, 'error'); return; }
        if (!form.amount || Number(form.amount) <= 0) { showToast(T.amountRequired, 'error'); return; }
        const entry = { ...form, amount: Number(form.amount) };

        // Limit checking for FREE users
        if (!isPro && !checkHutangPiutangLimit()) {
            showToast('Batas bulanan tercapai (10 catatan). Upgrade ke PRO untuk tanpa batas!', 'warning');
            return;
        }

        // Persist to Supabase
        const dbEntry = {
            user_id: user.id,
            type: tab, // 'piutang' or 'hutang'
            client_name: form.name,
            total: Number(form.amount),
            status: form.status,
            date: form.dueDate || new Date().toISOString().slice(0, 10), // Use dueDate for date
            data: { ...form, amount: Number(form.amount) }
        };

        try {
            const existing = data.find(d => d.id === entry.id);
            if (existing && existing.id.length > 15) { // UUID
                await supabase.from('documents').update(dbEntry).eq('id', existing.id);
                setData(prev => prev.map(d => d.id === entry.id ? entry : d));
                showToast(T.updatedToast, 'success');
            } else {
                const { data: saved, error } = await supabase.from('documents').insert(dbEntry).select().single();
                if (error) throw error;
                if (saved) entry.id = saved.id;
                setData(prev => [...prev, entry]);
                incrementHutangPiutang(); // Increment limit for new entries
                showToast(T.savedToast, 'success');
            }
        } catch (err) {
            console.error('HutangPiutang sync error:', err);
            showToast('Gagal menyimpan data', 'error');
        }
        setShowForm(false);
    };

    const togglePaid = async (id) => {
        const existing = data.find(d => d.id === id);
        if (!existing) return;

        const newStatus = existing.status === 'paid' ? 'unpaid' : 'paid';

        // 1. Optimistic UI Update
        setData(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
        showToast(`Status diperbarui ke ${newStatus === 'paid' ? 'Lunas' : 'Belum Bayar'}`, 'success');

        // 2. Background Sync
        try {
            await supabase.from('documents').update({ status: newStatus }).eq('id', id);

            if (newStatus === 'paid') {
                const type = tab === 'piutang' ? 'income' : 'expense';
                const category = tab === 'piutang' ? 'Invoice Lunas' : 'Peralatan';
                const note = `${tab === 'piutang' ? 'Piutang' : 'Hutang'} - ${existing.name} - Lunas`;

                const cashEntry = {
                    id: existing.id + '_hp',
                    user_id: user.id,
                    type: type,
                    amount: existing.amount,
                    category: category,
                    note: note,
                    date: new Date().toISOString().slice(0, 10),
                    source: 'auto',
                    sourceLabel: `Auto dari ${tab === 'piutang' ? 'Piutang' : 'Hutang'}`,
                    reference_type: tab,
                    createdAt: new Date().toISOString(),
                };
                setCashbook(prev => [cashEntry, ...prev]);

                await supabase.from('cashbook').insert({
                    user_id: user.id,
                    type: type,
                    amount: existing.amount,
                    category: category,
                    description: note,
                    date: new Date().toISOString().slice(0, 10),
                    reference_type: tab,
                });
            } else {
                // Remove from cashbook
                await supabase.from('cashbook').delete().eq('user_id', user.id).eq('reference_type', tab).ilike('description', `%${existing.name}%`);
                setCashbook(prev => prev.filter(c => !c.note.includes(existing.name)));
            }
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
        showToast('Entri dihapus', 'info');

        // 2. Background Sync
        try {
            await supabase.from('documents').delete().eq('id', id);
            refreshUsage(); // Added refreshUsage call
            if (item.status === 'paid') {
                await supabase.from('cashbook').delete().eq('user_id', user.id).eq('reference_type', tab).ilike('description', `%${item.name}%`);
                setCashbook(prev => prev.filter(c => !c.note.includes(item.name)));
            }
        } catch (err) {
            console.error('HutangPiutang delete sync error:', err);
        }
    };

    const unpaid = data.filter(e => e.status === 'unpaid');
    const paid = data.filter(e => e.status === 'paid');

    const TabBtn = ({ value, label, count, color }) => (
        <button
            onClick={() => { setTab(value); setShowForm(false); }}
            style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: tab === value ? (value === 'piutang' ? '#ECFDF5' : '#FEF2F2') : bg2,
                color: tab === value ? color : sub,
                fontWeight: 700, fontSize: 14, transition: 'all 200ms',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
        >
            {label}
            <span style={{
                background: tab === value ? color : '#94A3B8', color: 'white',
                borderRadius: 100, padding: '1px 7px', fontSize: 11, fontWeight: 800,
            }}>{count}</span>
        </button>
    );

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px', color: text }}>
                    {T.title}
                </h1>
                <p style={{ margin: 0, color: sub, fontSize: 14 }}>
                    {T.subtitle}
                </p>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div style={{ background: card, borderRadius: 14, padding: '16px 20px', border: `1px solid ${border}`, borderTop: '3px solid #10B981' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>{T.totalReceivable}</p>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#10B981' }}>{formatIDR(totalPiutang)}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: sub }}>{piutang.filter(e => e.status === 'unpaid').length} {T.unpaid}</p>
                </div>
                <div style={{ background: card, borderRadius: 14, padding: '16px 20px', border: `1px solid ${border}`, borderTop: '3px solid #EF4444' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase' }}>{T.totalPayable}</p>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#EF4444' }}>{formatIDR(totalHutang)}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: sub }}>{hutang.filter(e => e.status === 'unpaid').length} {T.unpaid}</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, background: bg2, padding: 4, borderRadius: 12 }}>
                <TabBtn value="piutang" label={T.tabReceivable} count={piutang.length} color="#10B981" />
                <TabBtn value="hutang" label={T.tabPayable} count={hutang.length} color="#EF4444" />
            </div>

            {/* Action row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 13, color: sub }}>
                    {tab === 'piutang' ? T.receivableDesc : T.payableDesc}
                    {!isPro && ` · ${data.length}/${FREE_LIMIT} (FREE)`}
                </p>
                <button onClick={handleAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}>
                    <Plus size={15} /> {T.add}
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div style={{ background: card, borderRadius: 14, padding: 20, marginBottom: 16, border: `1.5px solid ${tab === 'piutang' ? '#10B981' : '#EF4444'}` }}>
                    <h3 style={{ margin: '0 0 16px', color: text, fontSize: 15, fontWeight: 700 }}>
                        {tab === 'piutang' ? T.addReceivable : T.addPayable}
                    </h3>
                    <form onSubmit={handleSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group" style={{ margin: 0, gridColumn: '1/-1' }}>
                                <label className="label">{tab === 'piutang' ? T.borrowerName : T.lenderName}</label>
                                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={tab === 'piutang' ? T.borrowerName : T.lenderName} required />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="label">{T.amount}</label>
                                <input type="number" min="0" className="input" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="label">{T.dueDate}</label>
                                <input type="date" className="input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                            </div>
                            <div className="form-group" style={{ margin: 0, gridColumn: '1/-1' }}>
                                <label className="label">{T.notes}</label>
                                <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={T.notesPlaceholder} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px' }}>{T.save}</button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline" style={{ padding: '8px 20px' }}>{T.cancel}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            {data.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: sub }}>
                    <HandCoins size={40} strokeWidth={1.5} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>Belum ada entri {tab}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 13 }}>Klik "Tambah" untuk menambahkan</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Unpaid */}
                    {unpaid.length > 0 && (
                        <>
                            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: 0.5 }}>Belum Lunas</p>
                            {unpaid.map(entry => (
                                <EntryCard key={entry.id} entry={entry} tab={tab} dark={dark} text={text} sub={sub} bg2={bg2} border={border}
                                    onTogglePaid={() => togglePaid(entry.id)}
                                    onEdit={() => { setForm(entry); setShowForm(true); }}
                                    onDelete={() => setDeleteConfirm(entry.id)} />
                            ))}
                        </>
                    )}
                    {/* Paid */}
                    {paid.length > 0 && (
                        <>
                            <p style={{ margin: '12px 0 4px', fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sudah Lunas</p>
                            {paid.map(entry => (
                                <EntryCard key={entry.id} entry={entry} tab={tab} dark={dark} text={text} sub={sub} bg2={bg2} border={border}
                                    onTogglePaid={() => togglePaid(entry.id)}
                                    onEdit={() => { setForm(entry); setShowForm(true); }}
                                    onDelete={() => setDeleteConfirm(entry.id)} />
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* Delete confirm */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: card, borderRadius: 16, padding: 28, maxWidth: 360, width: 'calc(100% - 32px)', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}>
                        <AlertCircle size={32} color="#EF4444" style={{ marginBottom: 12 }} />
                        <h3 style={{ margin: '0 0 8px', color: text }}>Hapus Entri?</h3>
                        <p style={{ margin: '0 0 20px', color: sub }}>Data ini tidak bisa dikembalikan setelah dihapus.</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: '10px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Hapus</button>
                            <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '10px', background: bg2, color: text, border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Batal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function EntryCard({ entry, tab, dark, text, sub, bg2, border, onTogglePaid, onEdit, onDelete }) {
    const isPaid = entry.status === 'paid';
    const accentColor = tab === 'piutang' ? '#10B981' : '#EF4444';
    const isOverdue = entry.dueDate && !isPaid && new Date(entry.dueDate) < new Date();

    return (
        <div style={{
            background: dark ? '#1E293B' : 'white', borderRadius: 12, padding: '14px 16px',
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
                    {isOverdue && <span style={{ background: '#FEE2E2', color: '#EF4444', borderRadius: 100, padding: '1px 8px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>Terlambat</span>}
                    {isPaid && <span style={{ background: '#ECFDF5', color: '#10B981', borderRadius: 100, padding: '1px 8px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>Lunas</span>}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontSize: 11, color: sub }}>{entry.createdAt && formatDateID(entry.createdAt)}</p>
                    {entry.dueDate && <p style={{ margin: 0, fontSize: 11, color: isOverdue ? '#EF4444' : sub }}>Tempo: {formatDateID(entry.dueDate)}</p>}
                    {entry.notes && <p style={{ margin: 0, fontSize: 11, color: sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{entry.notes}</p>}
                </div>
            </div>

            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: isPaid ? '#10B981' : accentColor, flexShrink: 0 }}>
                {formatIDR(entry.amount)}
            </p>

            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={onEdit} style={{ background: bg2, border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: sub }}>Edit</button>
                <button onClick={onDelete} style={{ background: '#FEF2F2', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#EF4444' }}>Hapus</button>
            </div>
        </div>
    );
}
