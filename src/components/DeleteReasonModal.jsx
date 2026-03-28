import { useState } from 'react';
import Modal from './Modal';
import { useLang } from '../context/LanguageContext';
import { AlertCircle, Trash2 } from 'lucide-react';

/**
 * Enhanced Delete Modal that requires a reason (Royal Audit Log feature)
 * @param {boolean} isOpen - Modal state
 * @param {function} onClose - Close handler
 * @param {function} onConfirm - Confirm handler (receives reason string)
 * @param {string} itemName - Name of item being deleted
 * @param {boolean} loading - Loading state
 */
export default function DeleteReasonModal({ isOpen, onClose, onConfirm, itemName, loading }) {
    const { t } = useLang();
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (reason.trim().length < 5) {
            setError(t('audit_reason_error'));
            return;
        }
        setError('');
        onConfirm(reason);
        setReason(''); // Reset for next time
    };

    return (
        <Modal 
            open={isOpen} 
            onClose={onClose} 
            title={t('audit_reason_title')}
            maxWidth={450}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 text-red-600">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold leading-tight mb-1">
                            {t('confirm_delete')}
                        </p>
                        <p className="text-xs opacity-80 font-medium">
                            {itemName}
                        </p>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                        {t('audit_reason_label')}
                    </label>
                    <textarea
                        autoFocus
                        required
                        className={`w-full p-4 bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-200'} rounded-2xl text-sm focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500/20' : 'focus:ring-violet-500/20'} transition-all min-h-[120px] resize-none`}
                        placeholder={t('audit_reason_placeholder')}
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (e.target.value.trim().length >= 5) setError('');
                        }}
                    />
                    {error && (
                        <p className="text-red-500 text-[10px] font-bold mt-1.5 flex items-center gap-1 animate-shake">
                            <AlertCircle size={10} /> {error}
                        </p>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={loading || reason.trim().length < 5}
                        className="flex-[2] py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><Trash2 size={18} /> {t('delete')}</>
                        )}
                    </button>
                </div>
            </form>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
            `}</style>
        </Modal>
    );
}
