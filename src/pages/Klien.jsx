import { useState, useMemo, useEffect } from 'react';
import { Users, Search, Phone, Mail, MapPin, Trash2, Edit3, X, BarChart2, List, Info } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR } from '../utils/currency';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import UpgradeModal from '../components/UpgradeModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import LimitModal from '../components/LimitModal';
import { recordAudit } from '../utils/audit';
import DeleteReasonModal from '../components/DeleteReasonModal';

const AVATAR_COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6', '#8B5CF6'];

const emptyForm = { name: '', contact: '', email: '', phone: '', address: '', city: '', notes: '' };

export default function Klien() {
    const { dark } = useTheme();
    const { t } = useLang();
    const { showToast } = useToast();
    const { isPro, isPremium, checkClientLimit, refreshUsage, getClientCount, currentLimits } = usePlan();
    const { user, effectivePlan, isAdmin } = useAuth();

    const [clients, setClients] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [kwitansiList, setKwitansiList] = useState([]);
    const [sphList, setSphList] = useState([]);
    const [poList] = useState([]);
    const [ttrList] = useState([]);

    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editClient, setEditClient] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [upgradeFeatureType, setUpgradeFeatureType] = useState(null);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [detailClient, setDetailClient] = useState(null);
    const [detailTab, setDetailTab] = useState('info');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: cData, error: cErr } = await supabase.from('clients')
                .select('id, name, email, phone, city, address, notes, contact_person, created_at')
                .eq('user_id', user.id).order('created_at', { ascending: false });
            if (cErr) {
                console.error('Detail error fetch clients:', cErr.message, cErr.details, cErr.hint);
                throw cErr;
            }
            setClients(cData || []);

            const { data: dData, error: dErr } = await supabase.from('documents')
                .select('id, type, status, date, created_at, data')
                .eq('user_id', user.id);
            if (dErr) throw dErr;
            if (dData) {
                setInvoices(dData.filter(d => d.type === 'invoice').map(d => ({ ...d, clientName: d.data?.client_name || d.client_name, grandTotal: d.data?.grand_total || d.data?.total_amount || d.grand_total || d.total_amount })));
                setKwitansiList(dData.filter(d => d.type === 'kwitansi').map(d => ({ ...d, receivedFrom: d.data?.client_name || d.client_name, amount: d.data?.total_amount || d.data?.grand_total || d.total_amount || d.grand_total })));
                setSphList(dData.filter(d => d.type === 'sph').map(d => ({ ...d, toName: d.data?.client_name || d.client_name, grandTotal: d.data?.grand_total || d.data?.total_amount || d.grand_total || d.total_amount })));
            }

            refreshUsage();
        } catch (err) {
            console.error('Klien fetch error:', err);
            showToast(t('kl_toast_load_fail'), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const filtered = useMemo(() =>
        clients.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.phone || '').includes(search)
        ),
        [clients, search]
    );

    const handleAdd = async () => {
        const clientLimit = currentLimits?.clients || 50;
        if (!isPro && !isAdmin && getClientCount() >= clientLimit) {
            setShowLimitModal(true);
            return;
        }
        setEditClient(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const handleEdit = (client) => {
        setEditClient(client);
        setForm({ name: client.name, contact: client.contact_person || client.contact || '', email: client.email || '', phone: client.phone || '', address: client.address || '', city: client.city || '', notes: client.notes || '' });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { showToast(t('kl_toast_name_req'), 'error'); return; }

        const dbClient = {
            user_id: user.id,
            name: form.name,
            contact_person: form.contact,
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            notes: form.notes
        };

        setLoading(true);
        try {
            if (editClient) {
                const { error } = await supabase.from('clients').update(dbClient).eq('id', editClient.id);
                if (error) throw error;
                setClients(prev => prev.map(c => c.id === editClient.id ? { ...c, ...form } : c));
                showToast(t('kl_toast_updated'), 'success');
            } else {
                const { data: saved, error } = await supabase.from('clients').insert(dbClient).select().single();
                if (error) throw error;
                if (saved) {
                    setClients(prev => [...prev, saved]);
                    showToast(t('kl_toast_saved'), 'success');
                    refreshUsage();
                }
            }
            setShowModal(false);
        } catch (err) {
            console.error('Klien sync error:', err);
            showToast(t('toast_error_save'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (client) => {
        setClientToDelete(client);
        setShowDeleteModal(true);
    };

    const performDelete = async (id, reason) => {
        const client = clients.find(c => c.id === id);
        setLoading(true);
        try {
            const { error } = await supabase.from('clients').delete().eq('id', id);
            if (error) throw error;

            if (isPro) {
                await recordAudit(
                    'DELETE', 
                    'Klien', 
                    `Deleted Client: ${client.name} (${client.email || 'No Email'})`, 
                    reason, 
                    'warning'
                );
            }

            setClients(prev => prev.filter(c => c.id !== id));
            showToast(t('kl_toast_deleted'), 'info');
            refreshUsage();
        } catch (err) {
            console.error('Klien delete error:', err);
            showToast(t('toast_error_save'), 'error');
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
            setClientToDelete(null);
        }
    };

    const docsByClient = useMemo(() => {
        const map = {};
        const safePush = (name, doc) => {
            if (!name) return;
            if (!map[name]) map[name] = { invoices: [], kwitansiList: [], sphList: [], poList: [] };
            if (doc.t === 'inv') map[name].invoices.push(doc);
            if (doc.t === 'kwt') map[name].kwitansiList.push(doc);
            if (doc.t === 'sph') map[name].sphList.push(doc);
            if (doc.t === 'po') map[name].poList.push(doc);
        };
        (invoices || []).forEach(d => safePush(d.clientName, { ...d, t: 'inv' }));
        (kwitansiList || []).forEach(d => safePush(d.receivedFrom, { ...d, t: 'kwt' }));
        (sphList || []).forEach(d => safePush(d.toName, { ...d, t: 'sph' }));
        (poList || []).forEach(d => safePush(d.vendorName, { ...d, t: 'po' }));
        return map;
    }, [invoices, kwitansiList, sphList, poList]);

    const getClientDocs = (clientName) => {
        const docs = docsByClient[clientName] || { invoices: [], kwitansiList: [], sphList: [], poList: [] };
        const clientInvoices = docs.invoices;
        const clientKwitansi = docs.kwitansiList;
        const clientSPH = docs.sphList;
        const clientPO = docs.poList;

        const totalRevenue = clientInvoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
        const paidRevenue = clientInvoices.filter(i => i.status === 'paid').reduce((s, inv) => s + (inv.grandTotal || 0), 0);
        const allDocs = [
            ...clientInvoices.map(d => ({ ...d, docType: t('doc_type_inv'), amount: d.grandTotal })),
            ...clientKwitansi.map(d => ({ ...d, docType: t('doc_type_kwt'), clientName: d.receivedFrom, amount: d.amount })),
            ...clientSPH.map(d => ({ ...d, docType: t('doc_type_sph'), clientName: d.toName, amount: d.grandTotal })),
            ...clientPO.map(d => ({ ...d, docType: t('doc_type_po'), clientName: d.vendorName, amount: d.grandTotal })),
        ].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        const lastTransaction = allDocs[0]?.date || null;
        return {
            invoiceCount: clientInvoices.length,
            totalRevenue,
            paidRevenue,
            unpaidRevenue: totalRevenue - paidRevenue,
            allDocs,
            lastTransaction,
        };
    };

    const getAvatarColor = (name) => {
        const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
        return AVATAR_COLORS[idx];
    };

    const STATUS_MAP = {
        unpaid: { label: t('kl_unpaid'), color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
        paid: { label: t('kl_paid'), color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
        waiting: { label: t('kl_waiting'), color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    };

    const DOC_COLORS = { [t('doc_type_inv')]: '#7C3AED', [t('doc_type_kwt')]: '#10B981', [t('doc_type_sph')]: '#3B82F6', [t('doc_type_po')]: '#F59E0B' };


    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
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

            {effectivePlan === 'free' && (
                <div className="upgrade-banner" style={{ marginBottom: 20 }}>
                    <span style={{ color: '#5B21B6', fontSize: 13, fontWeight: 600 }}>
                        {t('client_limit_info').replace('{used}', clients.length).replace('{limit}', currentLimits?.clients || 50)}
                    </span>
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <div className="spinner"></div>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title={t('klien_empty_title')}
                    description={t('klien_empty_desc')}
                    action={<button onClick={handleAdd} className="btn btn-primary">{t('klien_add_btn')}</button>}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(client => {
                        const stats = getClientDocs(client.name);
                        const color = getAvatarColor(client.name);
                        return (
                            <div key={client.id} className="card" style={{ animation: 'none', position: 'relative' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
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
                                        {(client.contact_person || client.contact) && <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>{client.contact_person || client.contact}</p>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => handleEdit(client)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
                                            <Edit3 size={15} />
                                        </button>
                                        <button onClick={() => handleDelete(client)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}>
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
                                        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#3B82F6' }}>{stats.allDocs.length}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { setDetailClient(client); setDetailTab('info'); }}
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

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editClient ? t('kl_modal_edit_title') : t('kl_modal_add_title')}
            >
                <form onSubmit={handleSave}>
                    {[
                        { key: 'name', label: t('kl_modal_name'), required: true, placeholder: t('kl_modal_name_ph') },
                        { key: 'contact', label: t('kl_modal_contact'), placeholder: t('kl_modal_contact_ph') },
                        { key: 'email', label: t('kl_modal_email'), placeholder: t('kl_modal_email_ph'), type: 'email' },
                        { key: 'phone', label: t('kl_modal_phone'), placeholder: t('kl_modal_phone_ph'), type: 'tel' },
                        { key: 'address', label: t('kl_modal_address'), placeholder: t('kl_modal_address_ph') },
                        { key: 'city', label: t('kl_modal_city'), placeholder: t('kl_modal_city_ph') },
                        { key: 'notes', label: t('kl_modal_notes'), placeholder: t('kl_modal_notes_ph'), textarea: true },
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
                        <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">{t('cancel')}</button>
                        <button type="submit" className="btn btn-primary">{editClient ? t('update') : t('save')}</button>
                    </div>
                </form>
            </Modal>

            <UpgradeModal isOpen={!!upgradeFeatureType} onClose={() => setUpgradeFeatureType(null)} featureType={upgradeFeatureType} />

            {detailClient && (() => {
                const stats = getClientDocs(detailClient.name);
                const avatarColor = getAvatarColor(detailClient.name);
                const tabs = [
                    { key: 'info', label: t('kl_tab_info'), icon: Info },
                    { key: 'history', label: t('kl_tab_history'), icon: List },
                    { key: 'stats', label: t('kl_tab_stats'), icon: BarChart2 },
                ];
                return (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
                        onClick={e => { if (e.target === e.currentTarget) setDetailClient(null); }}>
                        <div style={{ background: dark ? '#1E293B' : 'white', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.25)', width: '100%', maxWidth: 580, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'scaleIn 200ms cubic-bezier(0.4,0,0.2,1) forwards' }}>
                            <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${dark ? '#334155' : '#E2E8F0'}`, paddingBottom: 16 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, color: 'white', flexShrink: 0 }}>
                                    {detailClient.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 800, color: dark ? '#F1F5F9' : '#1E293B' }}>{detailClient.name}</h2>
                                    {(detailClient.contact_person || detailClient.contact) && <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>{detailClient.contact_person || detailClient.contact}</p>}
                                </div>
                                <button onClick={() => setDetailClient(null)} style={{ background: dark ? '#334155' : '#F1F5F9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <X size={16} color={dark ? '#CBD5E1' : '#64748B'} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', borderBottom: `2px solid ${dark ? '#334155' : '#E2E8F0'}`, background: dark ? '#1E293B' : 'white' }}>
                                {tabs.map(tab => {
                                    const Icon = tab.icon;
                                    return (
                                        <button key={tab.key} onClick={() => setDetailTab(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '12px 20px', border: 'none', background: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: detailTab === tab.key ? '2px solid #7C3AED' : '2px solid transparent', color: detailTab === tab.key ? '#7C3AED' : (dark ? '#64748B' : '#94A3B8'), marginBottom: -2, transition: 'all 200ms', flex: 1, justifyContent: 'center' }}>
                                            <Icon size={13} />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                                {detailTab === 'info' && (
                                    <div>
                                        {[
                                            { icon: Mail, label: 'Email', value: detailClient.email },
                                            { icon: Phone, label: t('kl_modal_phone'), value: detailClient.phone },
                                            { icon: MapPin, label: t('kl_modal_city'), value: detailClient.city },
                                            { icon: MapPin, label: t('kl_modal_address'), value: detailClient.address },
                                        ].filter(f => f.value).map(f => {
                                            const Icon = f.icon;
                                            return (
                                                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${dark ? '#334155' : '#F1F5F9'}` }}>
                                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: dark ? '#0F172A' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Icon size={14} color="#7C3AED" />
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: '0 0 1px', fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>{f.label}</p>
                                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: dark ? '#E2E8F0' : '#1E293B' }}>{f.value}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {detailClient.notes && (
                                            <div style={{ marginTop: 16, padding: '12px', background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 10 }}>
                                                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>{t('kl_modal_notes')}</p>
                                                <p style={{ margin: 0, fontSize: 13, color: dark ? '#CBD5E1' : '#374151', lineHeight: 1.6 }}>{detailClient.notes}</p>
                                            </div>
                                        )}
                                        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                                            <button onClick={() => handleEdit(detailClient)} className="btn btn-outline-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                                <Edit3 size={14} /> {t('edit')}
                                            </button>
                                            <button onClick={() => { handleDelete(detailClient); setDetailClient(null); }} className="btn btn-outline-danger" style={{ justifyContent: 'center' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {detailTab === 'history' && (
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                                            {[
                                                { label: t('kl_total_value'), value: formatIDR(stats.totalRevenue), color: '#7C3AED' },
                                                { label: t('kl_paid'), value: formatIDR(stats.paidRevenue), color: '#10B981' },
                                                { label: t('col_document'), value: stats.allDocs.length, color: '#3B82F6' },
                                            ].map(s => (
                                                <div key={s.label} style={{ padding: '10px 12px', background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 10, textAlign: 'center' }}>
                                                    <p style={{ margin: '0 0 2px', fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</p>
                                                    <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {stats.allDocs.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94A3B8' }}>
                                                <List size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                                                <p style={{ fontWeight: 600 }}>{t('client_history_empty')}</p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {stats.allDocs.map((doc, idx) => {
                                                    const st = STATUS_MAP[doc.status];
                                                    const docColor = DOC_COLORS[doc.docType] || '#64748B';
                                                    return (
                                                        <div key={idx} style={{ padding: '12px 14px', background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 10, borderLeft: `3px solid ${docColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                                                            <div>
                                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                                                                    <span style={{ fontSize: 10, fontWeight: 800, color: docColor, background: `${docColor}15`, padding: '2px 7px', borderRadius: 100 }}>{doc.docType}</span>
                                                                    <span style={{ fontSize: 12, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>{doc.number}</span>
                                                                </div>
                                                                <span style={{ fontSize: 11, color: '#64748B' }}>{doc.date}</span>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 800, color: docColor }}>{formatIDR(doc.amount || 0)}</p>
                                                                {st && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: st.bg, color: st.color }}>{st.label}</span>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {detailTab === 'stats' && (
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                            {[
                                                { label: t('kl_total_tr'), value: formatIDR(stats.totalRevenue), color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
                                                { label: t('kl_paid'), value: formatIDR(stats.paidRevenue), color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
                                                { label: t('kl_unpaid'), value: formatIDR(stats.unpaidRevenue), color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
                                                { label: t('nav_invoice'), value: stats.invoiceCount, color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
                                            ].map(s => (
                                                <div key={s.label} style={{ padding: '14px 16px', background: s.bg, borderRadius: 12, border: `1px solid ${s.color}20` }}>
                                                    <p style={{ margin: '0 0 4px', fontSize: 11, color: '#64748B', fontWeight: 600 }}>{s.label}</p>
                                                    <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Payment breakdown bar */}
                                        {stats.totalRevenue > 0 && (
                                            <div style={{ marginBottom: 20, padding: '16px', background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 12 }}>
                                                <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: dark ? '#CBD5E1' : '#374151' }}>{t('kl_ratio')}</p>
                                                <div style={{ height: 12, borderRadius: 6, background: '#FEE2E2', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${(stats.paidRevenue / stats.totalRevenue) * 100}%`, background: 'linear-gradient(90deg, #10B981, #059669)', borderRadius: 6, transition: 'width 600ms' }} />
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                                    <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>{t('kl_paid')}: {Math.round((stats.paidRevenue / stats.totalRevenue) * 100)}%</span>
                                                    <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700 }}>{t('kl_unpaid')}: {Math.round((stats.unpaidRevenue / stats.totalRevenue) * 100)}%</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Doc type breakdown */}
                                        <div style={{ padding: '16px', background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 12 }}>
                                            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: dark ? '#CBD5E1' : '#374151' }}>{t('kl_doc_by_type')}</p>
                                            {Object.entries(DOC_COLORS).map(([docType, color]) => {
                                                const count = stats.allDocs.filter(d => d.docType === docType).length;
                                                return count > 0 ? (
                                                    <div key={docType} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                                                            <span style={{ fontSize: 13, color: dark ? '#CBD5E1' : '#374151' }}>{docType}</span>
                                                        </div>
                                                        <span style={{ fontSize: 13, fontWeight: 700, color }}>{count}</span>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                        {stats.lastTransaction && (
                                            <p style={{ marginTop: 12, fontSize: 12, color: '#64748B', textAlign: 'center' }}>{t('kl_last_tr')}: {stats.lastTransaction}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
            {showLimitModal && <LimitModal plan="PRO" feature="Klien" onClose={() => setShowLimitModal(false)} />}
            {/* Audit Log Deletion Modal */}
            <DeleteReasonModal 
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={(reason) => performDelete(clientToDelete?.id, reason)}
                itemName={clientToDelete?.name}
                loading={loading}
            />
        </div>
    );
}
