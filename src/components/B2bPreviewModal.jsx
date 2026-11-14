import { useState } from 'react';
import { X, FileText, ExternalLink, MessageCircle, Copy, Check, QrCode, Building2 } from 'lucide-react';

/**
 * Interactive B2B specimen modal on Landing.jsx allowing prospective corporate/agency buyers
 * to inspect a realistic custom-letterhead tax PDF (PPN 11% + PPh 23 -2%), the public /inv/:id
 * client payment page, and the official WhatsApp link preview before signing up.
 */
export default function B2bPreviewModal({ isOpen, onClose, isEn, onStartTrial }) {
    const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' | 'public' | 'wa'
    const [copiedDemo, setCopiedDemo] = useState(null);

    if (!isOpen) return null;

    const triggerCopy = (key) => {
        setCopiedDemo(key);
        setTimeout(() => setCopiedDemo(null), 1500);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between gap-4 bg-zinc-50/80">
                    <div>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            {isEn ? 'CORPORATE B2B SPECIMEN' : 'CONTOH NYATA DOKUMEN B2B'}
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-zinc-900">
                            {isEn ? 'Tax Invoice PDF, Public /inv/:id Link & WA Preview' : 'Contoh PDF Kop Perusahaan, Link /inv/:id & Preview WA'}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 transition cursor-pointer"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tab Selector */}
                <div className="px-6 pt-4 pb-2 border-b border-zinc-100 flex flex-wrap gap-2 bg-white">
                    {[
                        { id: 'pdf', icon: FileText, label: isEn ? 'A4 Corporate PDF' : 'PDF A4 Kop Perusahaan' },
                        { id: 'public', icon: ExternalLink, label: isEn ? 'Public Link (/inv/:id)' : 'Link Publik (/inv/:id)' },
                        { id: 'wa', icon: MessageCircle, label: isEn ? 'WhatsApp Link Preview' : 'Preview Link WhatsApp' },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    active
                                        ? 'bg-zinc-900 text-white shadow-xs'
                                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
                                }`}
                            >
                                <Icon size={13} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-4 bg-zinc-50/50">
                    {activeTab === 'pdf' && (
                        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs text-xs text-zinc-800 space-y-5">
                            {/* Corporate Letterhead */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b-2 border-zinc-900">
                                <div className="flex items-start gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <div className="font-black text-sm text-zinc-950">PT KARSA KARYA TEKNOLOGI</div>
                                        <div className="text-[11px] text-zinc-500">Jl. Jend. Sudirman Kav. 52, Jakarta Selatan</div>
                                        <div className="text-[10px] font-mono text-zinc-500 mt-0.5">NPWP: 01.234.567.8-412.000 • Telp: (021) 5091-8820</div>
                                    </div>
                                </div>
                                <div className="sm:text-right">
                                    <div className="font-black text-base tracking-tight text-zinc-950">COMMERCIAL INVOICE</div>
                                    <div className="font-mono text-[11px] font-bold text-zinc-700">No: INV/2026/XI/0042</div>
                                    <div className="text-[10px] text-zinc-500 mt-0.5">Ref: SPH-2026-019 • Termin 1 (DP 50%)</div>
                                </div>
                            </div>

                            {/* Client Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/70">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Kepada / Bill To</div>
                                    <div className="font-bold text-zinc-900 mt-0.5">PT Nusantara Cipta Manufaktur</div>
                                    <div className="text-[11px] text-zinc-500">Up. Bagian Finance & Procurement • NPWP Terdaftar</div>
                                </div>
                                <div className="sm:text-right space-y-0.5">
                                    <div><span className="text-zinc-500">Tgl Terbit:</span> <strong>14 Nov 2026</strong></div>
                                    <div><span className="text-zinc-500">Jatuh Tempo:</span> <strong>21 Nov 2026 (NET 7)</strong></div>
                                    <div><span className="text-zinc-500">Status:</span> <strong className="text-amber-700">MENUNGGU PEMBAYARAN</strong></div>
                                </div>
                            </div>

                            {/* Line Items */}
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-300 text-[10px] font-bold uppercase text-zinc-500">
                                        <th className="py-2">Deskripsi Jasa / Pekerjaan</th>
                                        <th className="py-2 text-center">Qty</th>
                                        <th className="py-2 text-right">Harga</th>
                                        <th className="py-2 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 text-[11px]">
                                    <tr>
                                        <td className="py-2.5 font-medium">Termin 1 (DP 50%) — Pengembangan Sistem Inventory & Audit</td>
                                        <td className="py-2.5 text-center font-mono">1 pkt</td>
                                        <td className="py-2.5 text-right font-mono">Rp 6.000.000</td>
                                        <td className="py-2.5 text-right font-mono font-bold">Rp 6.000.000</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Tax Totals */}
                            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-3 border-t border-zinc-200">
                                <div className="text-[11px] text-zinc-500 max-w-xs space-y-1">
                                    <div className="font-bold text-zinc-700">Transfer Bank Perusahaan:</div>
                                    <div className="font-mono">BCA 873-0918-291 a.n PT Karsa Karya Teknologi</div>
                                    <div className="italic text-[10px] text-zinc-400">Terbilang: Enam Juta Lima Ratus Empat Puluh Ribu Rupiah</div>
                                </div>
                                <div className="w-full sm:w-64 space-y-1.5 text-[11px]">
                                    <div className="flex justify-between"><span className="text-zinc-500">Dasar Pengenaan (DPP)</span><span className="font-mono">Rp 6.000.000</span></div>
                                    <div className="flex justify-between text-zinc-700"><span>PPN 11% (VAT)</span><span className="font-mono font-semibold">+ Rp 660.000</span></div>
                                    <div className="flex justify-between text-violet-700 font-semibold"><span>Potongan PPh 23 Jasa (-2%)</span><span className="font-mono">- Rp 120.000</span></div>
                                    <div className="flex justify-between pt-2 border-t-2 border-zinc-900 font-black text-sm text-zinc-950">
                                        <span>Netto Dibayarkan</span>
                                        <span className="font-mono">Rp 6.540.000</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'public' && (
                        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-5 text-xs">
                            <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                                <div className="font-mono text-[11px] bg-zinc-100 px-3 py-1 rounded-lg text-zinc-600 truncate">
                                    https://myinvoice.space/inv/INV-2026-XI-0042
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[10px] shrink-0">
                                    {isEn ? 'CLIENT BROWSER VIEW' : 'TAMPILAN DI BROWSER KLIEN'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-zinc-950 text-white space-y-2">
                                    <div className="text-[10px] uppercase tracking-wider text-zinc-400">
                                        {isEn ? 'Net Amount After PPN & PPh 23' : 'Nominal Netto Transfer (Net PPN - PPh 23)'}
                                    </div>
                                    <div className="text-2xl font-black font-mono">Rp 6.540.000</div>
                                    <button
                                        type="button"
                                        onClick={() => triggerCopy('amt')}
                                        className="w-full py-2 rounded-lg bg-white text-zinc-950 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-100 transition"
                                    >
                                        {copiedDemo === 'amt' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                                        <span>{copiedDemo === 'amt' ? (isEn ? 'Copied Netto!' : 'Nominal Netto Tersalin!') : (isEn ? 'Copy Exact Amount' : 'Salin Nominal Netto 1-Klik')}</span>
                                    </button>
                                </div>

                                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 flex flex-col justify-between">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase text-zinc-400">BCA • PT Karsa Karya Teknologi</div>
                                        <div className="font-mono font-black text-base text-zinc-900 mt-0.5">8730918291</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => triggerCopy('rek')}
                                            className="flex-1 py-2 px-3 rounded-lg bg-white border border-zinc-300 font-bold text-[11px] text-zinc-800 flex items-center justify-center gap-1 cursor-pointer hover:bg-zinc-100"
                                        >
                                            {copiedDemo === 'rek' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                            <span>{copiedDemo === 'rek' ? 'Tersalin' : 'Salin No. Rek'}</span>
                                        </button>
                                        <div className="px-3 py-2 rounded-lg bg-white border border-zinc-300 text-zinc-700 font-bold text-[11px] inline-flex items-center gap-1">
                                            <QrCode size={13} /> QRIS Siap
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[11px] text-zinc-500 leading-relaxed">
                                {isEn
                                    ? 'No client login required. Finance teams can inspect invoice items, PPN/PPh 23 deduction, download official PDF, or pay via bank transfer / QRIS immediately.'
                                    : 'Tim finance klien tidak perlu login atau unduh aplikasi. Mereka langsung melihat rincian PPN 11%, potongan PPh 23 (-2%), menyalin nominal/rekening 1-klik, dan mengunduh PDF resmi.'}
                            </p>
                        </div>
                    )}

                    {activeTab === 'wa' && (
                        <div className="bg-[#EFEAE2] rounded-2xl p-5 border border-zinc-200 space-y-3 text-xs">
                            <div className="ml-auto max-w-md bg-[#D9FDD3] border border-emerald-200/60 rounded-2xl rounded-tr-xs p-3.5 shadow-xs space-y-2 text-zinc-900">
                                {/* Link Rich Card Preview */}
                                <div className="bg-black/5 rounded-xl p-2.5 border-l-4 border-zinc-900 space-y-0.5">
                                    <div className="font-bold text-[11px] text-zinc-900">
                                        Faktur #INV/2026/XI/0042 — PT Karsa Karya Teknologi (Rp 6.540.000) • MyInvoice
                                    </div>
                                    <div className="text-[10px] text-zinc-600 line-clamp-2">
                                        Rincian tagihan resmi Termin 1 (DP 50%) beserta PPN 11% dan potongan PPh 23. Buka link untuk salin rekening & unduh PDF.
                                    </div>
                                    <div className="text-[10px] font-mono text-zinc-500">myinvoice.space</div>
                                </div>
                                <p className="leading-relaxed whitespace-pre-line text-[11px]">
                                    {`Yth. Tim Finance PT Nusantara Cipta Manufaktur,\n\nBerikut kami sampaikan tautan faktur resmi INV/2026/XI/0042 (Termin 1 — DP 50%, Ref. SPH-2026-019) senilai netto Rp 6.540.000 (sudah termasuk PPN 11% dan dikurangi PPh 23 2%):\nhttps://myinvoice.space/inv/INV-2026-XI-0042\n\nTerima kasih atas kerja samanya.\nHormat kami, PT Karsa Karya Teknologi`}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Honest Termin DP & Tax/e-Faktur Clarification Bar */}
                    <div className="p-3.5 rounded-xl bg-white border border-zinc-200 text-[11px] text-zinc-600 leading-relaxed">
                        <strong className="text-zinc-900">
                            {isEn ? 'B2B Workflow Scope (Transparent): ' : 'Cakupan Fitur B2B (Transparan): '}
                        </strong>
                        {isEn
                            ? 'Supports stage-based DP/Final billing via SPH 1-Click -> Invoice -> Receipt and automatic calculations for PPN 11%/12%, PPh 23 (-2%/-4%), PPh 21, plus PP 55/2022 & Excel/CSV export. Note: commercial invoices only (does not connect directly to DJP e-Faktur / Coretax API).'
                            : 'Mendukung tagihan Termin DP & Pelunasan bertahap (SPH 1-Klik -> Invoice DP -> Kwitansi Pelunasan) serta hitung otomatis PPN 11%/12%, PPh 23 (-2%/-4%), PPh 21, Rekap PP 55/2022 & ekspor Excel/CSV. Catatan jujur: ini adalah invoice komersial siap akuntan, belum terhubung langsung ke API e-Faktur / Coretax DJP.'}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="px-6 py-4 border-t border-zinc-200 bg-white flex items-center justify-between gap-3">
                    <span className="text-[11px] text-zinc-500">
                        {isEn ? 'Try creating your own company-letterhead invoice free for 14 days.' : 'Coba buat invoice ber-kop perusahaan Anda gratis selama 14 hari penuh.'}
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onStartTrial();
                        }}
                        className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-bold cursor-pointer shrink-0 transition"
                    >
                        {isEn ? 'Start 14-Day Free Trial →' : 'Coba Trial 14 Hari Gratis →'}
                    </button>
                </div>
            </div>
        </div>
    );
}
