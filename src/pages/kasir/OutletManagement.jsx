import { useState } from 'react';
import { Store, Plus, Pencil, Trash2, Check, X, ArrowLeft } from 'lucide-react';
import { useOutlet } from '../../context/OutletContext';
import { useTheme } from '../../context/ThemeContext';
import { useLang } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

export default function OutletManagement({ onBack }) {
    const { outlets, activeOutlet, setActiveOutlet, createOutlet, updateOutlet, deleteOutlet, canUseMultiOutlet } = useOutlet();
    const { dark } = useTheme();
    const { t } = useLang();
    const { showToast } = useToast();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: '', address: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const cardBg = dark ? '#1E293B' : 'white';
    const border = dark ? '#334155' : '#E2E8F0';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setLoading(true);

        if (editingId) {
            const { error } = await updateOutlet(editingId, form);
            if (error) showToast(error, 'error');
            else { showToast(t('outlet_updated'), 'success'); resetForm(); }
        } else {
            const { error } = await createOutlet(form);
            if (error) showToast(error.message || t('outlet_min_error'), 'error');
            else { showToast(t('outlet_added'), 'success'); resetForm(); }
        }
        setLoading(false);
    };

    const resetForm = () => {
        setForm({ name: '', address: '', phone: '' });
        setShowForm(false);
        setEditingId(null);
    };

    const startEdit = (outlet) => {
        setEditingId(outlet.id);
        setForm({ name: outlet.name, address: outlet.address || '', phone: outlet.phone || '' });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        const { error } = await deleteOutlet(id);
        if (error) showToast(typeof error === 'string' ? error : error.message, 'error');
        else showToast(t('outlet_deleted'), 'success');
        setDeleteConfirm(null);
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', color: dark ? '#F8FAFC' : '#0F172A' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid', borderColor: border }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={onBack} 
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: dark ? '#334155' : '#F1F5F9', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: dark ? '#F8FAFC' : '#0F172A' }}>
                        <ArrowLeft size={16} />
                        {t('back')}
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Store size={20} color="#7C3AED" />
                            {t('kasir_manage_outlets')}
                        </h1>
                        <p style={{ margin: '2px 0 0 0', fontSize: 12, color: dark ? '#94A3B8' : '#64748B' }}>
                            {outlets.length} {t('outlet_registered')}
                        </p>
                    </div>
                </div>

                {canUseMultiOutlet && (
                    <button onClick={() => { resetForm(); setShowForm(true); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#7C3AED', color: 'white', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}>
                        <Plus size={18} />
                        {t('outlet_add')}
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div style={{ padding: '16px 24px', background: dark ? 'rgba(124,58,237,0.05)' : 'rgba(124,58,237,0.02)', borderBottom: '1px solid', borderColor: border }}>
                    <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
                        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 15, fontWeight: 700 }}>
                            {editingId ? t('outlet_edit') : t('outlet_add_new')}
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            {[
                                { key: 'name', label: t('outlet_name_label'), required: true },
                                { key: 'address', label: t('outlet_address_label') },
                                { key: 'phone', label: t('outlet_phone_label') },
                            ].map(f => (
                                <div key={f.key} style={{ gridColumn: f.key === 'address' ? 'span 2' : 'span 1' }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: dark ? '#94A3B8' : '#64748B' }}>{f.label}</label>
                                    <input value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} required={f.required}
                                        style={{ width: '100%', padding: '12px 14px', background: dark ? '#0F172A' : '#F8FAFC', border: '1px solid', borderColor: border, borderRadius: 10, fontSize: 14, color: dark ? '#F8FAFC' : '#0F172A', fontFamily: 'inherit', outline: 'none' }} />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button type="button" onClick={resetForm}
                                style={{ padding: '10px 20px', background: 'transparent', border: '1px solid', borderColor: border, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: dark ? '#94A3B8' : '#64748B' }}>
                                {t('cancel')}
                            </button>
                            <button type="submit" disabled={loading}
                                style={{ padding: '10px 24px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>
                                {loading ? '...' : (editingId ? t('save') : t('add'))}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Outlet list */}
            <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20, alignContent: 'start' }}>
                {outlets.map(outlet => (
                    <div key={outlet.id} style={{ background: cardBg, border: '1px solid', borderColor: activeOutlet?.id === outlet.id ? '#7C3AED' : border, borderRadius: 16, padding: 20, position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>

                        <div style={{ position: 'absolute', top: 20, right: 20 }}>
                            <Store size={24} color={activeOutlet?.id === outlet.id ? '#7C3AED' : (dark ? '#334155' : '#E2E8F0')} />
                        </div>

                        <div style={{ paddingRight: 30 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{outlet.name}</h3>
                                {outlet.is_default && (
                                    <span style={{ padding: '2px 8px', background: 'rgba(124,58,237,0.1)', color: '#7C3AED', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                                        {t('outlet_main')}
                                    </span>
                                )}
                                {activeOutlet?.id === outlet.id && (
                                    <span style={{ padding: '2px 8px', background: 'rgba(16,185,129,0.1)', color: '#10B981', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                                        {t('outlet_active')}
                                    </span>
                                )}
                            </div>
                            {outlet.address && <p style={{ margin: 0, fontSize: 12, color: dark ? '#94A3B8' : '#64748B', lineHeight: 1.5 }}>{outlet.address}</p>}
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 10 }}>
                            <button onClick={() => setActiveOutlet(outlet)} disabled={activeOutlet?.id === outlet.id}
                                style={{ padding: '8px 14px', background: activeOutlet?.id === outlet.id ? 'rgba(16,185,129,0.1)' : 'transparent', border: '1px solid', borderColor: activeOutlet?.id === outlet.id ? '#10B981' : border, borderRadius: 8, cursor: activeOutlet?.id === outlet.id ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: activeOutlet?.id === outlet.id ? '#10B981' : (dark ? '#94A3B8' : '#64748B'), display: 'flex', alignItems: 'center', gap: 4 }}>
                                {activeOutlet?.id === outlet.id ? <Check size={14} /> : null}
                                {activeOutlet?.id === outlet.id ? t('outlet_selected') : t('outlet_select')}
                            </button>
                            <button onClick={() => startEdit(outlet)}
                                style={{ padding: '8px 10px', background: 'transparent', border: '1px solid', borderColor: border, borderRadius: 8, cursor: 'pointer', color: dark ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center' }}>
                                <Pencil size={14} />
                            </button>
                            {!outlet.is_default && outlets.length > 1 && (
                                <button onClick={() => setDeleteConfirm(outlet.id)}
                                    style={{ padding: '8px 10px', background: 'transparent', border: '1px solid', borderColor: border, borderRadius: 8, cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center' }}>
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>

                    </div>
                ))}
            </div>


            {/* Delete confirm */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: cardBg, border: '1px solid', borderColor: border, borderRadius: 20, padding: 30, maxWidth: 400, width: '100%', textAlign: 'center' }}>
                        <Trash2 size={48} color="#EF4444" style={{ marginBottom: 20 }} />
                        <h2 style={{ margin: '0 0 10px 0', fontSize: 20 }}>{t('outlet_delete_title')}</h2>
                        <p style={{ margin: '0 0 24px 0', fontSize: 14, color: dark ? '#94A3B8' : '#64748B', lineHeight: 1.6 }}>
                            {t('outlet_delete_desc')}
                        </p>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setDeleteConfirm(null)} style={{ padding: '10px 20px', background: 'none', border: '1px solid', borderColor: border, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: dark ? '#94A3B8' : '#64748B', flex: 1 }}>
                                {t('cancel')}
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '10px 20px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, flex: 1 }}>
                                {t('delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
