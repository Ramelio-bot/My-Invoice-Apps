import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, Download, Printer, Copy, Check, ShieldCheck, 
  Clock, CheckCircle2, AlertCircle, Share2, ArrowLeft, QrCode
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatIDR } from '../utils/currency';
import { formatDateID } from '../utils/date';
import { generatePDF } from '../utils/pdf';

export default function PublicInvoiceView() {
  const { id } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function loadInvoice() {
      if (!id) {
        setError('ID Faktur tidak valid');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 1. Try querying by document UUID (strictly invoice type)
        let { data, error: dbError } = await supabase
          .from('documents')
          .select('id, type, doc_number, client_name, status, total_amount, data, created_at')
          .eq('id', id)
          .in('type', ['invoice', 'inv', 'faktur'])
          .maybeSingle();

        // 2. Fallback: try querying by doc_number (strictly invoice type)
        if (!data && !dbError) {
          const resByNum = await supabase
            .from('documents')
            .select('id, type, doc_number, client_name, status, total_amount, data, created_at')
            .eq('doc_number', id)
            .in('type', ['invoice', 'inv', 'faktur'])
            .maybeSingle();
          data = resByNum.data;
          dbError = resByNum.error;
        }

        if (dbError) {
          console.error('Database query error:', dbError);
          setError('Terjadi kendala saat memuat data faktur');
          return;
        }

        if (!data) {
          setError('Faktur tidak ditemukan atau tautan telah kedaluwarsa');
          return;
        }

        // Normalize invoice data (strictly whitelisted display fields, zero internal metadata leakage)
        const payload = data.data || {};
        const normalized = {
          id: data.id,
          number: data.doc_number || payload.number || 'INV-DRAFT',
          status: data.status || payload.status || 'unpaid',
          date: payload.date || data.created_at,
          dueDate: payload.dueDate || '',
          clientName: data.client_name || payload.clientName || '-',
          clientAddress: payload.clientAddress || '',
          clientPhone: payload.clientPhone || '',
          clientEmail: payload.clientEmail || '',
          companyName: payload.companyName || 'Usaha / Bisnis',
          companyAddress: payload.companyAddress || '',
          companyCity: payload.companyCity || '',
          companyPhone: payload.companyPhone || '',
          companyEmail: payload.companyEmail || '',
          companyLogo: payload.companyLogo || '',
          bank: payload.bank || payload.bankName || '',
          accountNumber: payload.accountNumber || '',
          accountName: payload.accountName || payload.accountHolder || '',
          paymentInstructions: payload.paymentInstructions || payload.notes || '',
          items: Array.isArray(payload.items) ? payload.items : [],
          subtotal: Number(payload.subtotal || data.total_amount || 0),
          discountAmt: Number(payload.discountAmt || 0),
          taxType: payload.taxType || 'none',
          ppnAmt: Number(payload.ppnAmt || 0),
          pphAmt: Number(payload.pphAmt || 0),
          grandTotal: Number(data.total_amount || payload.grandTotal || 0),
          qrisUrl: payload.qrisUrl || payload.qris_url || ''
        };

        setInvoice(normalized);
      } catch (err) {
        console.error('Load public invoice error:', err);
        setError('Gagal memuat faktur');
      } finally {
        setLoading(false);
      }
    }

    loadInvoice();
  }, [id]);

  const handleCopy = (text, field) => {
    if (!text) return;
    const clean = field === 'total' ? String(text) : String(text).replace(/[^\w-]/g, '');
    navigator.clipboard.writeText(clean);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedField('link');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadPDF = async () => {
    if (!invoice || isDownloading) return;
    setIsDownloading(true);
    try {
      await generatePDF('public-invoice-sheet', `Invoice-${invoice.number || 'Resmi'}.pdf`, true);
    } catch (err) {
      console.error('Download PDF error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-700 rounded-full animate-spin" />
          <p className="text-xs font-bold text-zinc-600 tracking-wider uppercase">Memuat Faktur Resmi...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-zinc-100 text-zinc-500 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-900">Faktur Tidak Ditemukan</h1>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              {error || 'Tautan ini mungkin salah ketik atau dokumen telah diarsipkan oleh penerbit.'}
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Beranda MyInvoice</span>
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid';

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 pb-20 antialiased selection:bg-violet-100">
      
      {/* Top Navbar Actions (Screen Only) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 py-3 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 text-zinc-900 font-black text-sm tracking-tight hover:opacity-80">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white">
              <FileText size={16} />
            </div>
            <span>MyInvoice</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareLink}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Salin Tautan Faktur"
            >
              {copiedField === 'link' ? <Check size={13} className="text-violet-600" /> : <Share2 size={13} />}
              <span className="hidden sm:inline">{copiedField === 'link' ? 'Tautan Tersalin' : 'Bagikan Link'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Cetak Faktur"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Cetak</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
            >
              <Download size={13} />
              <span>{isDownloading ? 'Menyiapkan...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Printable Document Sheet */}
      <main className="max-w-4xl mx-auto px-4 pt-6">
        <div
          id="public-invoice-sheet"
          className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 sm:p-12 space-y-8 print:border-none print:shadow-none print:p-0 print:rounded-none"
        >
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-zinc-200">
            <div className="flex items-start gap-4">
              {invoice.companyLogo ? (
                <img
                  src={invoice.companyLogo}
                  alt={invoice.companyName}
                  className="w-16 h-16 rounded-2xl object-cover border border-zinc-200 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-zinc-950 text-white flex items-center justify-center font-black text-xl shrink-0">
                  {(invoice.companyName || 'M').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-zinc-900 tracking-tight leading-tight">
                  {invoice.companyName}
                </h1>
                {invoice.companyAddress && (
                  <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                    {invoice.companyAddress}
                    {invoice.companyCity ? `, ${invoice.companyCity}` : ''}
                  </p>
                )}
                {(invoice.companyPhone || invoice.companyEmail) && (
                  <p className="text-xs text-zinc-400">
                    {[invoice.companyPhone, invoice.companyEmail].filter(Boolean).join(' • ')}
                  </p>
                )}
              </div>
            </div>

            {/* Document Number & Status */}
            <div className="text-left sm:text-right space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide border">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border-emerald-200">
                    <CheckCircle2 size={13} />
                    LUNAS
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border-amber-200">
                    <Clock size={13} />
                    MENUNGGU PEMBAYARAN
                  </span>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Nomor Faktur</p>
                <p className="text-lg font-black font-mono text-zinc-950">{invoice.number}</p>
              </div>
            </div>
          </div>

          {/* Client & Metadata Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Ditagihkan Kepada</p>
              <p className="text-sm font-bold text-zinc-900">{invoice.clientName}</p>
              {invoice.clientAddress && (
                <p className="text-zinc-600 leading-relaxed">{invoice.clientAddress}</p>
              )}
              {(invoice.clientPhone || invoice.clientEmail) && (
                <p className="text-zinc-400">
                  {[invoice.clientPhone, invoice.clientEmail].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex flex-col justify-center space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-medium">Tanggal Terbit:</span>
                <span className="font-bold text-zinc-900">{formatDateID(invoice.date)}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-medium">Jatuh Tempo:</span>
                  <span className="font-bold text-zinc-900">{formatDateID(invoice.dueDate)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-zinc-200/60">
                <span className="text-zinc-500 font-medium">Status Dokumen:</span>
                <span className={`font-bold ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isPaid ? 'Lunas / Paid' : 'Belum Lunas'}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-zinc-900 text-left font-bold uppercase text-zinc-900 tracking-wider text-[11px]">
                  <th className="py-3 px-1">Deskripsi Item / Layanan</th>
                  <th className="py-3 px-2 text-center w-16">Qty</th>
                  <th className="py-3 px-2 text-right w-32">Harga Satuan</th>
                  <th className="py-3 px-2 text-right w-32">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.filter(it => it.desc || it.qty || it.price).map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-zinc-50/50">
                      <td className="py-3.5 px-1 font-medium text-zinc-800">
                        {it.desc || '-'}
                      </td>
                      <td className="py-3.5 px-2 text-center text-zinc-600 font-mono">
                        {it.qty} {it.unit ? it.unit : ''}
                      </td>
                      <td className="py-3.5 px-2 text-right text-zinc-600 font-mono">
                        {formatIDR(it.price)}
                      </td>
                      <td className="py-3.5 px-2 text-right font-bold font-mono text-zinc-900">
                        {formatIDR(it.total || (Number(it.qty || 0) * Number(it.price || 0)))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-400 italic">
                      Tidak ada rincian item
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown & Grand Total */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pt-4 border-t border-zinc-200">
            {/* Left: Notes & Terms */}
            <div className="space-y-2 text-xs text-zinc-500 max-w-sm">
              {invoice.paymentInstructions && (
                <div>
                  <p className="font-bold text-zinc-700 uppercase tracking-wider text-[10px]">Catatan / Instruksi</p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-zinc-600">
                    {invoice.paymentInstructions}
                  </p>
                </div>
              )}
            </div>

            {/* Right: Calculations */}
            <div className="w-full sm:w-80 space-y-2 text-xs">
              <div className="flex justify-between py-1 text-zinc-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatIDR(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmt > 0 && (
                <div className="flex justify-between py-1 text-zinc-600">
                  <span>Diskon:</span>
                  <span className="font-mono text-red-600">- {formatIDR(invoice.discountAmt)}</span>
                </div>
              )}
              {invoice.ppnAmt > 0 && (
                <div className="flex justify-between py-1 text-zinc-600">
                  <span>PPN:</span>
                  <span className="font-mono">+ {formatIDR(invoice.ppnAmt)}</span>
                </div>
              )}
              {invoice.pphAmt > 0 && (
                <div className="flex justify-between py-1 text-zinc-600">
                  <span>Potongan PPh 23:</span>
                  <span className="font-mono text-amber-700">- {formatIDR(invoice.pphAmt)}</span>
                </div>
              )}
              
              <div className="pt-3 border-t-2 border-zinc-900 flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-tight text-zinc-900">Total Tagihan:</span>
                <div className="text-right flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(invoice.grandTotal, 'total')}
                    className="pdf-hide inline-flex items-center gap-1 text-[10px] font-bold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded transition-colors cursor-pointer"
                    title="Salin nominal total transfer"
                  >
                    {copiedField === 'total' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    <span>{copiedField === 'total' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                  <span className="text-xl font-black font-mono text-zinc-950">
                    {formatIDR(invoice.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Card (Bank Transfer & QRIS) */}
          {(invoice.accountNumber || invoice.bank || invoice.qrisUrl) && (
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-violet-600" />
                  <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Informasi Pembayaran Rekening Resmi
                  </span>
                </div>
                {invoice.accountNumber && (
                  <button
                    type="button"
                    onClick={() => handleCopy(invoice.accountNumber, 'bank')}
                    className="pdf-hide inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedField === 'bank' ? <Check size={13} className="text-violet-700" /> : <Copy size={13} />}
                    <span>{copiedField === 'bank' ? 'Nomor Rekening Tersalin' : 'Salin No. Rekening'}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  {invoice.bank && (
                    <p className="text-zinc-600">
                      Bank Tujuan: <strong className="text-zinc-900">{invoice.bank}</strong>
                    </p>
                  )}
                  {invoice.accountNumber && (
                    <p className="text-zinc-600 flex items-center gap-2 font-mono text-sm">
                      No. Rekening: <strong className="text-zinc-950 text-base">{invoice.accountNumber}</strong>
                    </p>
                  )}
                  {invoice.accountName && (
                    <p className="text-zinc-600">
                      Atas Nama: <strong className="text-zinc-900">{invoice.accountName}</strong>
                    </p>
                  )}
                </div>

                {invoice.qrisUrl && (
                  <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-white rounded-xl border border-zinc-200">
                    <img
                      src={invoice.qrisUrl}
                      alt="Barcode QRIS Pembayaran"
                      className="w-24 h-24 object-contain border border-zinc-100 rounded-lg p-1 bg-white"
                    />
                    <div className="text-left space-y-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded">
                        <QrCode size={11} /> QRIS Nasional
                      </span>
                      <p className="text-[11px] font-medium text-zinc-600">
                        Scan via BCA, Mandiri, GoPay, OVO, ShopeePay, Dana, atau LinkAja
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Official Verification Footer */}
          <div className="pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Dokumen faktur digital sah yang diterbitkan melalui sistem MyInvoice.space</span>
            </div>
            <span className="font-mono text-zinc-300">ID: {invoice.id}</span>
          </div>
        </div>
      </main>

      {/* Mobile Floating Action Pill Bar */}
      <div className="sm:hidden fixed bottom-4 left-4 right-4 z-40 print:hidden">
        <div className="bg-zinc-950 text-white rounded-2xl p-3 shadow-2xl border border-zinc-800 flex items-center justify-between gap-2">
          <div className="text-left pl-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Tagihan</span>
            <span className="text-sm font-black font-mono text-white">{formatIDR(invoice.grandTotal)}</span>
          </div>
          <div className="flex items-center gap-2">
            {invoice.accountNumber && (
              <button
                type="button"
                onClick={() => handleCopy(invoice.accountNumber, 'bank_mobile')}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                {copiedField === 'bank_mobile' ? 'Tersalin' : 'Salin Rek'}
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-xs font-bold text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Download size={13} />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
