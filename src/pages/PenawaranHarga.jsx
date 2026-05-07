import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../lib/supabase';
import { 
  Download, RotateCcw, Eye, Pencil, Trash2, 
  Clock, Plus, Trash, CheckCircle, FileText,
  Calendar, User, CreditCard, ChevronDown, Check,
  AlertCircle, Move, Search, UserCheck, Copy
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { recordAudit } from '../utils/audit';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR, formatInputNumber } from '../utils/currency';
import { formatDateID, todayStr } from '../utils/date';
import { peekDocNumber } from '../utils/docNumber';
import { generatePDF } from '../utils/pdf';
import LogoUpload from '../components/LogoUpload';
import { useCompanyLogo } from '../hooks/useCompanyLogo';
import { runNative } from '../utils/platform';

const defaultItem = { name: '', qty: 1, price: 0 };
const defaultForm = () => ({
  number: peekDocNumber('sph'),
  date: todayStr(),
  validUntil: '',
  toName: '',
  toCompany: '',
  toAddress: '',
  toEmail: '',
  items: [{ ...defaultItem }],
  notes: '',
  terms: '',
  status: 'draft',
});

// Helper for draggable TTD
function DraggableTTD({ src, pos, onPosChange, containerRef, accent }) {
  const isDragging = useRef(false);
  const startOffset = useRef({ x: 0, y: 0 });

  const onPointerDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    startOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const x = e.clientX - container.left - startOffset.current.x;
    const y = e.clientY - container.top - startOffset.current.y;
    onPosChange({ x, y });
  };

  if (!src) return null;
  return (
    <img
      src={src}
      alt="Signature"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => (isDragging.current = false)}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: 140,
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        border: `1.5px dashed ${accent}44`,
        borderRadius: 4,
        zIndex: 50
      }}
    />
  );
}

export default function PenawaranHarga() {
  const { lang, t } = useLang();
  const { showToast } = useToast();
  const { user, effectivePlan, isAdmin } = useAuth();
  const logoHook = useCompanyLogo();
  const logo = logoHook?.logo ?? null;
  const planContext = usePlan();
  const isPro = planContext?.isPro ?? false;
  const isPremium = planContext?.isPremium ?? false;
  const checkDownloadLimit = planContext?.checkDownloadLimit ?? (() => true);
  const incrementDownload = planContext?.incrementDownload ?? (() => {});
//   const checkSPHLimit = planContext?.checkSPHLimit ?? planContext?.checkDocumentLimit ?? (() => true);
  const incrementSPH = planContext?.incrementSPH ?? planContext?.incrementDocument ?? (() => {});
  const getSPHCount = planContext?.getSPHCount ?? planContext?.getDocumentCount ?? (() => 0);
  const refreshUsage = planContext?.refreshUsage ?? (() => {});
  const currentLimits = planContext?.currentLimits;

  const [activeTab, setActiveTab] = useState('form');
  const [list, setList] = useState([]);
  const [form, setForm] = useLocalStorage('sph_draft', defaultForm());
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(null);
  const [sigPos, ] = useLocalStorage('sph_sig_pos', { x: 20, y: 10 });
  const previewRef = useRef(null);

  const sphCount = getSPHCount();
  const sphLimit = currentLimits?.quotation || 20;
  const isLimited = !isPro && !isAdmin && sphCount >= sphLimit;

  const fetchSPH = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'sph')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setList(data.map(d => ({
        ...d.data,
        status: d.status || 'draft',
        number: d.doc_number || d.number,
        toName: d.client_name || d.data?.toName,
        total: d.total_amount || 0,
        createdAt: d.created_at,
        id: d.id // <- WAJIB PALING BAWAH
      })));
    }
  };

  useEffect(() => { if (user) fetchSPH(); }, [user, fetchSPH]);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...defaultItem }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const handleEditHistory = (item) => {
    setForm({ ...item, id: item.id });
    setActiveTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicate = () => {
    setForm(prev => {
      const newForm = { ...prev };
      delete newForm.id;
      delete newForm.created_at;
      newForm.number = peekDocNumber('sph');
      newForm.status = 'draft';
      return newForm;
    });
    showToast(t('toast_duplicate_mode') || 'Mode Duplikat aktif — ID di-reset. Sesuaikan data lalu klik Simpan.', 'success');
  };
  const updateItem = (idx, key, val) => {
    const items = [...form.items];
    if (key === 'price') {
      const cleaned = String(val).replace(/\./g, '').replace(/[^\d]/g, '');
      items[idx][key] = parseInt(cleaned, 10) || 0;
    } else if (key === 'qty') {
      items[idx][key] = parseFloat(String(val).replace(',', '.')) || 0;
    } else {
      items[idx][key] = val;
    }
    setForm(f => ({ ...f, items }));
  };

  const calculateSubtotal = () => form.items.reduce((acc, it) => acc + (it.qty * it.price), 0);

  const handleSave = async () => {
    if (!form.toName || !form.items[0].name) {
      showToast(t('ph_toast_required'), 'error');
      return;
    }
    if (isSaving) return;
    setIsSaving(true);

    const subtotal = calculateSubtotal();
    const num = form.number || peekDocNumber('sph');
    const existing = list.find(i => i.id === form.id);

    try {
      const dbData = {
        user_id: user.id,
        type: 'sph',
        doc_number: num,
        client_name: form.toName,
        total_amount: subtotal,
        status: form.status || 'draft',
        data: { ...form, sigPos, subtotal, lang }
      };

      if (existing) {
        await supabase.from('documents').update(dbData).eq('id', form.id);
      } else {
        // [OPERASI PENGECEKAN GANDA SPH]
        const { data: dup } = await supabase.from('documents')
          .select('id')
          .eq('user_id', user.id)
          .eq('doc_number', num)
          .in('type', ['sph', 'sph_inv'])
          .maybeSingle();

        if (dup) {
          await supabase.from('documents').update(dbData).eq('id', dup.id);
          setForm(f => ({ ...f, id: dup.id }));
        } else {
          if (isLimited) {
            showToast(t('sph_limit_reached').replace('{limit}', sphLimit), 'warning');
            setIsSaving(false);
            return;
          }
          delete dbData.id;
          const { data: saved } = await supabase.from('documents').insert(dbData).select().single();
          if (saved) {
            incrementSPH();
            setForm(f => ({ ...f, id: saved.id }));
          }
        }
      }

      showToast(t('sph_saved'), 'success');
      fetchSPH();
      window.dispatchEvent(new Event('data-updated'));
    } catch (err) {
      console.error(err);
      showToast(t('toast_error_save'), 'error');
    } finally { setIsSaving(false); }
  };

  const handleDownloadPDF = async () => {
    if (!isPro && !checkDownloadLimit()) { showToast(t('limit_download_reached'), 'warning'); return; }
    setIsDownloading(true);
    try {
      await generatePDF('sph-preview', `SPH-${form.number}.pdf`, isPremium);
      
      runNative(() => {
        console.log('Native Print/Save initiated for Penawaran Harga');
      });

      incrementDownload('sph', form.number, calculateSubtotal(), form.toName);
      showToast(t('doc_pdf_success'), 'success');
    } catch { showToast(t('doc_pdf_fail'), 'error'); } finally { setIsDownloading(false); }
  };

  const handleDelete = async (id) => {
    // TUGAS 2: HAPUS OPTIMISTIC UI FILTERING
    const item = list.find(i => i.id === id);
    if (!item) return;

    try {
      await supabase.from('documents').delete().eq('id', id);

      await recordAudit(
          'DELETE', 
          'Quotation', 
          `Deleted Quotation #${item?.number || 'N/A'} for ${item?.clientName || 'N/A'} (Amount: ${item?.grandTotal || 0})`, 
          'User Deleted Document', 
          'warning'
      );

      setList(prev => prev.filter(i => i.id !== id));
      showToast(t('doc_deleted'), 'info');
      setDeleteConfirm(null);

      refreshUsage();
      window.dispatchEvent(new Event('data-updated'));
    } catch { 
      showToast(t('toast_error_save'), 'error'); 
    }
  };

  const updateStatus = async (id, newStatus) => {
    console.log("ID DOKUMEN YANG DIUPDATE:", id);
    try {
      await supabase.from('documents').update({ status: newStatus }).eq('id', id);
      setList(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
      showToast(t('inv_status_updated'), 'success');
      window.dispatchEvent(new Event('data-updated'));
    } catch { showToast(t('toast_error_save'), 'error'); } finally { setStatusMenuOpen(null); }
  };

  return (
    <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#1E293B' }}>
          {t('sph_title')}
          {!isPro && !isAdmin && (
            <span style={{ 
              fontSize: 12, fontWeight: 700, marginLeft: 10, 
              color: sphCount >= sphLimit ? '#EF4444' : '#7C3AED', 
              background: sphCount >= sphLimit ? '#FEE2E2' : '#F5F3FF', 
              padding: '2px 8px', borderRadius: 6 
            }}>
              {sphCount}/{sphLimit} {t('sph_limit_label')}
            </span>
          )}
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setForm(defaultForm())} className="btn btn-outline-danger"><RotateCcw size={15} /> {t('doc_reset')}</button>
          {form.id && (
            <button
              onClick={handleDuplicate}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, background: '#EEF2FF', border: 'none', color: '#4F46E5', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              <Copy size={15} /> {t('btn_duplicate')}
            </button>
          )}
          <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">{isSaving ? '...' : (form.id ? t('doc_update') : t('doc_save'))}</button>
          <button onClick={handleDownloadPDF} disabled={isDownloading} className="btn btn-primary"><Download size={15} /> {t('doc_download')}</button>
        </div>
      </header>

      <nav style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #E2E8F0' }}>
        <button onClick={() => setActiveTab('form')} style={{ padding: '10px 20px', border: 'none', background: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: activeTab === 'form' ? '#7C3AED' : '#64748B', borderBottom: activeTab === 'form' ? '2px solid #7C3AED' : '2px solid transparent', marginBottom: -2 }}>{t('sph_tab_form')}</button>
        <button onClick={() => setActiveTab('history')} style={{ padding: '10px 20px', border: 'none', background: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: activeTab === 'history' ? '#7C3AED' : '#64748B', borderBottom: activeTab === 'history' ? '2px solid #7C3AED' : '2px solid transparent', marginBottom: -2 }}>
          {t('sph_tab_history')} {list.length > 0 && <span style={{ marginLeft: 6, background: '#7C3AED', color: 'white', padding: '1px 6px', borderRadius: 10, fontSize: 11 }}>{list.length}</span>}
        </button>
      </nav>

      {activeTab === 'history' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <tr>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, color: '#64748B' }}>{t('sph_th_number')}</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, color: '#64748B' }}>{t('sph_th_client')}</th>
                <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 12, color: '#64748B' }}>{t('sph_th_total')}</th>
                <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: 12, color: '#64748B' }}>{t('sph_th_status')}</th>
                <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 12, color: '#64748B' }}>{t('sph_th_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700 }}>{item.number}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14 }}>{item.toName}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#7C3AED', textAlign: 'right' }}>{formatIDR(item.total)}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                      <button onClick={() => setStatusMenuOpen(statusMenuOpen === item.id ? null : item.id)} className="badge" style={{ cursor: 'pointer', background: item.status === 'sent' ? '#D1FAE5' : (item.status === 'accepted' ? '#DBEAFE' : '#F3F4F6'), color: item.status === 'sent' ? '#059669' : (item.status === 'accepted' ? '#2563EB' : '#4B5563'), textTransform: 'uppercase' }}>
                        {item.status} <ChevronDown size={12} />
                      </button>
                      {statusMenuOpen === item.id && (
                        <div style={{ position: 'absolute', top: 30, zIndex: 100, background: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: 8, padding: 4, width: 140 }}>
                          {['draft', 'sent', 'accepted', 'rejected'].map(s => (
                            <button key={s} onClick={() => updateStatus(item.id, s)} style={{ display: 'flex', width: '100%', padding: '8px 12px', border: 'none', background: 'none', color: item.status === s ? '#7C3AED' : '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 6 }}>{s}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        <button 
                            onClick={() => setPreviewItem(item)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #3B82F6', background: 'none', color: '#3B82F6', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                            <Eye size={13} /> {t('doc_see')}
                        </button>
                        <button 
                            onClick={() => handleEditHistory(item)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #F59E0B', background: 'none', color: '#F59E0B', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                            <Pencil size={13} /> {t('edit')}
                        </button>
                        <button 
                            onClick={() => setDeleteConfirm(item.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #EF4444', background: 'none', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                            <Trash2 size={13} /> {t('delete')}
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: 400, textAlign: 'center', padding: 32 }}>
            <Trash2 size={48} color="#EF4444" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px' }}>{t('sph_delete_title')}</h3>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24 }}>{t('sph_delete_msg')}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">{t('doc_cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn btn-danger">{t('doc_delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal — centered, full detail */}
      {previewItem && ReactDOM.createPortal(
        <div onClick={() => setPreviewItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box'
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 16,
              width: '100%',
              maxWidth: 860,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              animation: 'scaleIn 200ms cubic-bezier(0.4,0,0.2,1) forwards'
            }}
          >
            {/* Fixed Header */}
            <div style={{ 
              padding: '18px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
              background: 'white',
              zIndex: 10
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{t('sph_title')}</h2>
                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>
                  No: {previewItem.number} &middot; {formatDateID(previewItem.date)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPreviewItem(null)} className="btn btn-outline" style={{ padding: '8px 16px' }}>{t('doc_close')}</button>
                <button onClick={handleDownloadPDF} disabled={isDownloading} className="btn btn-primary" style={{ padding: '8px 20px' }}>
                  <Download size={16} /> Download PDF
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
              <div id="sph-preview" style={{ padding: '48px', background: 'white', color: '#000', minHeight: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, borderBottom: '2px solid #F1F5F9', paddingBottom: 30 }}>
                  <div>
                    {logo ? <img src={logo} alt="Logo" style={{ maxHeight: 60, maxWidth: 180, objectFit: 'contain', marginBottom: 16 }} /> : <div style={{ height: 40, width: 40, background: '#7C3AED', borderRadius: 8, marginBottom: 12 }} />}
                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: -1, color: '#111827' }}>{(t('sph_title').split(' ')[0]).toUpperCase()}</h1>
                    <p style={{ margin: 0, color: '#64748B', fontWeight: 600 }}>{t('hpp_supplier')}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, color: '#64748B', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>{t('sph_th_number')}</p>
                    <p style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800 }}>{previewItem.number}</p>
                    <p style={{ margin: 0, color: '#64748B', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>{t('sph_form_date')}</p>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{formatDateID(previewItem.date)}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, marginBottom: 40 }}>
                  <div>
                    <p style={{ margin: '0 0 10px', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('sph_form_to').toUpperCase()}</p>
                    <p style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>{previewItem.toName}</p>
                    <p style={{ margin: '0 0 2px', fontWeight: 600 }}>{previewItem.toCompany}</p>
                    <p style={{ margin: 0, color: '#4B5563', fontSize: 13, lineHeight: 1.5 }}>{previewItem.toAddress}</p>
                    {previewItem.toEmail && <p style={{ margin: '4px 0 0', color: '#7C3AED', fontSize: 13, fontWeight: 500 }}>{previewItem.toEmail}</p>}
                  </div>
                  <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: 16, border: '1px solid #E2E8F0' }}>
                    <p style={{ margin: '0 0 8px', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{t('common_total_order')}</p>
                    <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#7C3AED' }}>{formatIDR(previewItem.subtotal || 0)}</p>
                    {previewItem.validUntil && (
                      <p style={{ margin: '12px 0 0', fontSize: 12, color: '#64748B' }}>
                        {t('sph_valid_label')}: <strong style={{ color: '#111827' }}>{formatDateID(previewItem.validUntil)}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #111827' }}>
                      <th style={{ padding: '12px 0', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', color: '#111827' }}>{t('sph_item_name')}</th>
                      <th style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, textTransform: 'uppercase', width: 60, color: '#111827' }}>Qty</th>
                      <th style={{ padding: '12px 0', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', width: 140, color: '#111827' }}>{t('sph_item_price')}</th>
                      <th style={{ padding: '12px 0', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', width: 140, color: '#111827' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewItem.items?.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '16px 0', fontSize: 14, fontWeight: 600 }}>{it.name}</td>
                        <td style={{ padding: '16px 0', fontSize: 14, textAlign: 'center' }}>{it.qty}</td>
                        <td style={{ padding: '16px 0', fontSize: 14, textAlign: 'right' }}>{formatIDR(it.price)}</td>
                        <td style={{ padding: '16px 0', fontSize: 14, textAlign: 'right', fontWeight: 800 }}>{formatIDR(it.qty * it.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} style={{ padding: '24px 0 8px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#64748B' }}>SUBTOTAL</td>
                      <td style={{ padding: '24px 0 8px', textAlign: 'right', fontSize: 14, fontWeight: 800 }}>{formatIDR(previewItem.subtotal || 0)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} style={{ padding: '8px 0', textAlign: 'right', fontSize: 18, fontWeight: 900 }}>TOTAL</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontSize: 24, fontWeight: 900, color: '#7C3AED' }}>{formatIDR(previewItem.subtotal || 0)}</td>
                    </tr>
                  </tfoot>
                </table>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 60, alignItems: 'flex-start' }}>
                  <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: 16 }}>
                    <p style={{ margin: '0 0 10px', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('po_notes_terms')}</p>
                    <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{previewItem.notes || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 800px', fontSize: 14, fontWeight: 600 }}>{t('po_sign_delivered')}</p>
                    <div style={{ borderTop: '2px solid #111827', paddingTop: 12 }}>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{user?.email?.split('@')[0] || 'Provider'}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Authorized Signatory</p>
                    </div>
                  </div>
                </div>
                {(effectivePlan === 'free' && !isAdmin) && <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.5)', fontSize: 10, marginTop: 20 }}>Generated by MyInvoice.space</p>}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {activeTab === 'form' && (
        <div className="split-layout">
          <div>
            <div className="card" style={{ animation: 'none', marginBottom: 16 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">{t('sph_form_no')}</label>
                  <input className="input" value={form.number} onChange={e => setField('number', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">{t('sph_form_date')}</label>
                  <input type="date" className="input" value={form.date} onChange={e => setField('date', e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="label">{t('sph_form_to')}</label>
                <input className="input" value={form.toName} placeholder="E.g. Jhon Doe" onChange={e => setField('toName', e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div className="form-group">
                  <label className="label">{t('sph_form_company')}</label>
                  <input className="input" value={form.toCompany} onChange={e => setField('toCompany', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">{t('sph_form_valid')}</label>
                  <input type="date" className="input" value={form.validUntil} onChange={e => setField('validUntil', e.target.value)} />
                </div>
              </div>

              <div className="form-group mt-3">
                <label className="label">{t('sph_form_addr')}</label>
                <textarea className="textarea" value={form.toAddress} onChange={e => setField('toAddress', e.target.value)} />
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <h3 style={{ padding: '16px 20px', margin: 0, fontSize: 16, borderBottom: '1px solid #E2E8F0' }}>{t('sph_form_items')}</h3>
              <div style={{ padding: 20 }}>
                {form.items.map((it, idx) => (
                  <div key={idx} style={{ 
                    marginBottom: 12, padding: '12px 14px', 
                    background: '#F8FAFC', 
                    borderRadius: 10, 
                    border: '1px solid #E2E8F0' 
                  }}>
                    {/* Baris 1: Nama + Qty + Harga */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 2 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>
                          {t('sph_item_name')}
                        </label>
                        <input 
                          className="input" 
                          placeholder={t('sph_item_name_placeholder')} 
                          value={it.name} 
                          onChange={e => updateItem(idx, 'name', e.target.value)} 
                        />
                      </div>
                      <div style={{ width: 70 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>
                          {t('sph_item_qty')}
                        </label>
                        <input 
                          className="input" 
                          type="number" 
                          min="1" 
                          value={it.qty} 
                          onChange={e => updateItem(idx, 'qty', e.target.value)} 
                          style={{ textAlign: 'center' }}
                        />
                      </div>
                      <div style={{ width: 150 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>
                          {t('sph_item_price')}
                        </label>
                        <input 
                          className="input" 
                          type="text"
                          inputMode="numeric"
                          value={formatInputNumber(it.price)} 
                          onChange={e => updateItem(idx, 'price', e.target.value)} 
                          placeholder="0"
                          style={{ textAlign: 'right' }}
                        />
                      </div>
                      {form.items.length > 1 && (
                        <div style={{ paddingTop: 22 }}>
                          <button onClick={() => removeItem(idx)} className="btn-icon danger">
                            <Trash size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Baris 2: Keterangan/Spesifikasi */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>
                        {t('sph_item_spec')}
                      </label>
                      <input 
                        className="input" 
                        placeholder={t('sph_item_spec_placeholder')} 
                        value={it.spec || ''} 
                        onChange={e => updateItem(idx, 'spec', e.target.value)} 
                        style={{ fontSize: 13 }}
                      />
                    </div>
                  </div>
                ))}
                <button onClick={addItem} className="btn btn-outline" style={{ width: '100%', marginTop: 8 }}><Plus size={15} /> {t('sph_add_item')}</button>
              </div>
            </div>
          </div>

          <div style={{ position: 'sticky', top: 80 }}>
            <div id="sph-preview" ref={previewRef} style={{ background: 'white', color: '#000', padding: 40, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minHeight: 600 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30, borderBottom: '1px solid #eee', paddingBottom: 20 }}>
                <div>
                  {logo && <img src={logo} alt="Logo" style={{ maxHeight: 40, marginBottom: 10 }} />}
                  <h2 style={{ margin: 0, color: '#111' }}>QUOTATION</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#666' }}>No: {form.number}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Date: {formatDateID(form.date)}</p>
                </div>
              </div>

              <div style={{ marginBottom: 30 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#777' }}>TO:</p>
                <p style={{ margin: 0, fontWeight: 800 }}>{form.toName || '...'}</p>
                <p style={{ margin: 0 }}>{form.toCompany}</p>
                <p style={{ margin: 0, fontSize: 12 }}>{form.toAddress}</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: 8, textAlign: 'left', fontSize: 12 }}>Item</th>
                    <th style={{ padding: 8, textAlign: 'center', fontSize: 12, width: 40 }}>Qty</th>
                    <th style={{ padding: 8, textAlign: 'right', fontSize: 12, width: 100 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 8, fontSize: 12 }}>{it.name || '...'}</td>
                      <td style={{ padding: 8, fontSize: 12, textAlign: 'center' }}>{it.qty}</td>
                      <td style={{ padding: 8, fontSize: 12, textAlign: 'right' }}>{formatIDR(it.qty * it.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <div style={{ width: 180, borderTop: '2px solid #000', paddingTop: 10 }}>
                   <p style={{ margin: '0 0 2px', fontSize: 11, color: '#777' }}>{t('common_total_order')}</p>
                   <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#7C3AED' }}>{formatIDR(calculateSubtotal())}</p>
                </div>
              </div>
              {(effectivePlan === 'free' && !isAdmin) && <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.5)', fontSize: 10, marginTop: 20 }}>Generated by MyInvoice.space</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
