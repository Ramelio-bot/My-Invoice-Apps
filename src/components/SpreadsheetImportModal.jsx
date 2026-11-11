import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { parseSpreadsheetFile, downloadSpreadsheetTemplate } from '../utils/spreadsheetImport';

/**
 * Reusable 1-click Excel/CSV import modal shared across Clients and Products.
 */
export default function SpreadsheetImportModal({
    isOpen,
    onClose,
    title,
    subtitle,
    templateFilename,
    templateSheetName,
    templateRows,
    fieldAliases,
    requiredField,
    previewColumns,
    remainingQuota,
    onImportRows,
    isEn = false
}) {
    const fileInputRef = useRef(null);
    const [parsedRows, setParsedRows] = useState([]);
    const [fileName, setFileName] = useState('');
    const [parseError, setParseError] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    if (!isOpen) return null;

    const resetState = () => {
        setParsedRows([]);
        setFileName('');
        setParseError('');
    };

    const handleClose = () => {
        if (isImporting) return;
        resetState();
        onClose();
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        setParseError('');
        setFileName(file.name);

        try {
            const { rows } = await parseSpreadsheetFile(file, fieldAliases);
            const validRows = rows.filter(r => String(r[requiredField] || '').trim().length > 0);
            if (validRows.length === 0) {
                setParsedRows([]);
                setParseError(
                    isEn
                        ? 'No valid rows found. Please check column headers or use the Excel template.'
                        : 'Tidak ada baris valid yang terbaca. Pastikan nama kolom sesuai template Excel.'
                );
                return;
            }
            setParsedRows(validRows);
        } catch (err) {
            console.error('Spreadsheet parse error:', err);
            setParsedRows([]);
            setParseError(
                isEn
                    ? 'Failed to read file. Ensure it is a valid .xlsx, .xls, or .csv file.'
                    : 'Gagal membaca file. Pastikan formatnya .xlsx, .xls, atau .csv yang valid.'
            );
        }
    };

    const overQuota = Number.isFinite(remainingQuota) && parsedRows.length > remainingQuota;
    const allowedCount = Number.isFinite(remainingQuota)
        ? Math.max(0, Math.min(parsedRows.length, remainingQuota))
        : parsedRows.length;

    const handleConfirmImport = async () => {
        if (allowedCount === 0 || isImporting) return;
        setIsImporting(true);
        try {
            await onImportRows(parsedRows.slice(0, allowedCount));
            resetState();
            onClose();
        } catch (err) {
            console.error('Import callback error:', err);
            setParseError(err?.message || (isEn ? 'Import failed.' : 'Gagal menyimpan data impor.'));
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div
            onClick={handleClose}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                            <FileSpreadsheet size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 m-0">{title}</h3>
                            <p className="text-xs text-slate-500 m-0 mt-0.5">{subtitle}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Step 1: Download Template */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-extrabold text-slate-800 m-0">
                                {isEn ? '1. Need a clean starting format?' : '1. Butuh format Excel yang langsung rapi?'}
                            </p>
                            <p className="text-[11px] text-slate-500 m-0 mt-0.5">
                                {isEn
                                    ? 'Download our ready-to-fill Excel template, or upload your existing Excel/CSV.'
                                    : 'Unduh template siap isi, atau langsung unggah file Excel/CSV lama Anda.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => downloadSpreadsheetTemplate(templateFilename, templateSheetName, templateRows)}
                            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                        >
                            <Download size={14} />
                            <span>{isEn ? 'Download Template' : 'Unduh Template (.xlsx)'}</span>
                        </button>
                    </div>

                    {/* Step 2: Upload Drop Zone */}
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-7 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-violet-500 hover:bg-violet-50/40 transition flex flex-col items-center justify-center gap-2 cursor-pointer"
                        >
                            <Upload size={24} className="text-violet-600" />
                            <span className="text-sm font-bold text-slate-800">
                                {fileName || (isEn ? 'Click to select .xlsx, .xls, or .csv file' : 'Klik untuk pilih file .xlsx, .xls, atau .csv')}
                            </span>
                            <span className="text-[11px] text-slate-400">
                                {isEn ? 'Auto-detects Indonesian & English headers' : 'Deteksi otomatis kolom Indonesia & Inggris'}
                            </span>
                        </button>
                    </div>

                    {parseError && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>{parseError}</span>
                        </div>
                    )}

                    {/* Quota Warning */}
                    {overQuota && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-start gap-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>
                                {isEn
                                    ? `File has ${parsedRows.length} rows, but your current plan has ${remainingQuota} slots remaining. Only the first ${allowedCount} rows will be imported (upgrade to PRO for Unlimited).`
                                    : `File berisi ${parsedRows.length} baris, namun sisa kuota paket Anda ${remainingQuota} data. Hanya ${allowedCount} baris pertama yang akan diimpor (upgrade PRO untuk Unlimited).`}
                            </span>
                        </div>
                    )}

                    {/* Preview Table */}
                    {parsedRows.length > 0 && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-800">
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 size={15} />
                                    {isEn
                                        ? `${parsedRows.length} valid rows detected (showing first ${Math.min(5, parsedRows.length)})`
                                        : `${parsedRows.length} data valid terbaca (menampilkan ${Math.min(5, parsedRows.length)} baris pertama)`}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            {previewColumns.map(col => (
                                                <th key={col.key} className="px-3 py-2 font-bold text-slate-600">
                                                    {col.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {parsedRows.slice(0, 5).map((row, idx) => (
                                            <tr key={idx}>
                                                {previewColumns.map(col => (
                                                    <td key={col.key} className="px-3 py-2 text-slate-700 truncate max-w-[160px]">
                                                        {col.format ? col.format(row[col.key]) : (row[col.key] || '-')}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isImporting}
                        className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                    >
                        {isEn ? 'Cancel' : 'Batal'}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmImport}
                        disabled={allowedCount === 0 || isImporting}
                        className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:cursor-not-allowed"
                    >
                        {isImporting
                            ? (isEn ? 'Importing...' : 'Mengimpor...')
                            : (isEn ? `Import ${allowedCount} Rows` : `Impor ${allowedCount} Data Sekarang`)}
                    </button>
                </div>
            </div>
        </div>
    );
}
