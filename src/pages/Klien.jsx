import { useState, useMemo } from 'react';
import { Users, Search, Phone, Mail, MapPin, Trash2, Edit3 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR } from '../utils/currency';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const AVATAR_COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6', '#8B5CF6'];

const emptyForm = { name: '', contact: '', email: '', phone: '', address: '', city: '', notes: '' };

export default function Klien() {
    const { dark } = useTheme();
    const { t } = useLang();
    const { showToast } = useToast();
    const { isPro, checkClientLimit } = usePlan();

    const [clients, setClients] = useLocalStorage('clients_data', []);
    const [invoices] = useLocalStorage('invoice_data', []);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editClient, setEditClient] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [detailClient, setDetailClient] = useState(null);

    const filtered = useMemo(() =>
        clients.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.phone || '').includes(search)
        ),
        [clients, search]
    );

    const handleAdd = () => {
        if (!isPro && !checkClientLimit(clients.length)) {
            setShowLimitModal(true);
            return;
        }
        setEditClient(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const handleEdit = (client) => {
        setEditClient(client);
        setForm({ name: client.name, contact: client.contact || '', email: client.email || '', phone: client.phone || '', address: client.address || '', city: client.city || '', notes: client.notes || '' });
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!form.name.trim()) { showToast('Nama klien wajib diisi', 'error'); return; }
        if (editClient) {
            setClients(prev => prev.map(c => c.id === editClient.id ? { ...c, ...form } : c));
            showToast('Data klien diperbarui', 'success');
        } else {
            const newClient = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() };
            setClients(prev => [...prev, newClient]);
            showToast('Klien berhasil ditambahkan', 'success');
        }
        setShowModal(false);
    };

    const handleDelete = (id) => {
        setClients(prev => prev.filter(c => c.id !== id));
        showToast('Klien dihapus', 'info');
    };

    const getClientStats = (clientName) => {
        const clientInvoices = (invoices || []).filter(inv => inv.clientName === clientName);
        const totalRevenue = clientInvoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
        return { invoiceCount: clientInvoices.length, totalRevenue };
    };

    const getAvatarColor = (name) => {
        const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
        return AVATAR_COLORS[idx];
    };

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>
                    {t('kl_title')}
                </h1>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                            className="input"
                            placeholder={t('search')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: 36, width: 220 }}
                        />
                    </div>
                    <button onClick={handleAdd} className="btn btn-primary">
                        {t('kl_add')}
                    </button>
                </div>
            </div>

            {/* Limit Banner */}
            {!isPro && (
                <div className="upgrade-banner" style={{ marginBottom: 20 }}>
                    <span style={{ color: '#5B21B6', fontSize: 13, fontWeight: 600 }}>
                        {clients.length}/3 klien (gratis). Upgrade PRO untuk unlimited klien.
                    </span>
                </div>
            )}

            {/* Client Grid */}
            {filtered.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Belum ada klien"
                    description="Tambahkan klien pertama Anda untuk mulai"
                    action={<button onClick={handleAdd} className="btn btn-primary">Tambah Klien</button>}
                />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {filtered.map(client => {
                        const stats = getClientStats(client.name);
                        const color = getAvatarColor(client.name);
                        return (
                            <div key={client.id} className="card" style={{ animation: 'none', position: 'relative' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                                    {/* Avatar */}
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                                        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, fontSize: 20, color: 'white',
                                    }}>
                                        {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {client.name}
                                        </h3>
                                        {client.contact && <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>{client.contact}</p>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => handleEdit(client)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
                                            <Edit3 size={15} />
                                        </button>
                                        <button onClick={() => handleDelete(client.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}>
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                                    {client.email && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Mail size={13} color="#94A3B8" />
                                            <span style={{ fontSize: 13, color: '#64748B' }}>{client.email}</span>
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Phone size={13} color="#94A3B8" />
                                            <span style={{ fontSize: 13, color: '#64748B' }}>{client.phone}</span>
                                        </div>
                                    )}
                                    {client.city && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <MapPin size={13} color="#94A3B8" />
                                            <span style={{ fontSize: 13, color: '#64748B' }}>{client.city}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="divider" style={{ margin: '12px 0' }} />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                                    <div style={{ textAlign: 'center', padding: '8px', background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 8 }}>
                                        <p style={{ margin: 0, fontSize: 11, color: '#64748B', fontWeight: 600 }}>{t('kl_total_tr')}</p>
                                        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#7C3AED' }}>{formatIDR(stats.totalRevenue)}</p>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '8px', background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 8 }}>
                                        <p style={{ margin: 0, fontSize: 11, color: '#64748B', fontWeight: 600 }}>{t('kl_total_doc')}</p>
                                        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#3B82F6' }}>{stats.invoiceCount}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setDetailClient(client)}
                                    className="btn btn-outline-primary"
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    {t('kl_detail')}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editClient ? 'Edit Klien' : 'Tambah Klien Baru'}
            >
                <form onSubmit={handleSave}>
                    {[
                        { key: 'name', label: 'Nama Klien', required: true, placeholder: 'Nama lengkap / nama perusahaan' },
                        { key: 'contact', label: 'Kontak Person', placeholder: 'Nama PIC' },
                        { key: 'email', label: 'Email', placeholder: 'email@contoh.com', type: 'email' },
                        { key: 'phone', label: 'Telepon', placeholder: '08xx-xxxx-xxxx', type: 'tel' },
                        { key: 'address', label: 'Alamat', placeholder: 'Jl. ...' },
                        { key: 'city', label: 'Kota', placeholder: 'Jakarta' },
                        { key: 'notes', label: 'Catatan', placeholder: 'Catatan tambahan', textarea: true },
                    ].map(field => (
                        <div key={field.key} className="form-group">
                            <label className="label">{field.label}{field.required && <span style={{ color: '#EF4444' }}> *</span>}</label>
                            {field.textarea ? (
                                <textarea
                                    className="textarea"
                                    value={form[field.key]}
                                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                                    placeholder={field.placeholder}
                                />
                            ) : (
                                <input
                                    className="input"
                                    type={field.type || 'text'}
                                    value={form[field.key]}
                                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                />
                            )}
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                        <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                            Batal
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editClient ? 'Perbarui' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Limit Modal */}
            <Modal open={showLimitModal} onClose={() => setShowLimitModal(false)} title="Batas Gratis Tercapai">
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Users size={28} color="#F59E0B" />
                    </div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>Batas 3 klien tercapai</h3>
                    <p style={{ margin: '0 0 20px', color: '#64748B', fontSize: 14 }}>
                        Upgrade ke PRO untuk menambahkan klien tanpa batas dan menikmati fitur lengkap.
                    </p>
                    <button onClick={() => { setShowLimitModal(false); window.location.hash = '/upgrade'; }} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                        Upgrade PRO - Rp 99.000/bulan
                    </button>
                </div>
            </Modal>
        </div>
    );
}
