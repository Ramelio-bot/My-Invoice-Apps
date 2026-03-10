import { useState, useEffect } from 'react';
import { Store, User, Lock, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

export default function KasirPinLogin({ onLogin, employees = [] }) {
    const { user } = useAuth();
    const { t } = useLang();

    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        if (!selectedEmployeeId) {
            setError(t('pin_select_employee') || 'Pilih karyawan');
            return;
        }

        const employee = employees.find(emp => emp.id === selectedEmployeeId);
        if (!employee) return;

        // If employee has a PIN, check it
        if (employee.pin && employee.pin !== pin) {
            setError(t('pin_wrong'));
            return;
        }

        // Login successful
        onLogin({
            employeeId: employee.id,
            employeeName: employee.name,
            role: employee.role,
            startTime: new Date()
        });
    };

    const handleNumpadClick = (num) => {
        if (pin.length < 6) {
            setPin(prev => prev + num);
        }
        setError('');
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
        setError('');
    };



    if (employees.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 text-center">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-5 rounded-full mb-6 text-amber-600 dark:text-amber-400">
                    <AlertCircle size={48} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
                    Oops!
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md text-lg">
                    {t('no_employees_msg')}
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up">
                <div className="bg-violet-600 text-white p-6 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                        <Store size={32} />
                    </div>
                    <h1 className="text-xl font-black tracking-wide">POS LOGIN</h1>
                    <p className="text-violet-200 text-sm mt-1">{t('pin_enter')}</p>
                </div>

                <form onSubmit={handleLogin} className="p-6 md:p-8 flex flex-col gap-5">

                    {/* Select Employee */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('pin_select_employee')}</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                value={selectedEmployeeId}
                                onChange={(e) => {
                                    setSelectedEmployeeId(e.target.value);
                                    setPin('');
                                    setError('');
                                }}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none appearance-none transition-all"
                            >
                                <option value="" disabled>-- {t('pin_select_employee')} --</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name} ({emp.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* PIN Input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">PIN</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={pin}
                                onChange={(e) => {
                                    setPin(e.target.value.replace(/\D/g, ''));
                                    setError('');
                                }}
                                placeholder="••••••"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono tracking-[0.5em] text-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                readOnly
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm font-bold mt-2 animate-shake">{error}</p>}
                    </div>

                    {/* Simple Numpad */}
                    <div className="grid grid-cols-3 gap-3 mt-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => handleNumpadClick(num.toString())}
                                className="aspect-square bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xl font-bold text-slate-700 dark:text-slate-200 transition-colors"
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={handleBackspace}
                            className="aspect-square bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl text-xl font-bold text-red-600 dark:text-red-400 transition-colors flex items-center justify-center"
                        >
                            <ArrowRight className="rotate-180" size={24} />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleNumpadClick('0')}
                            className="aspect-square bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xl font-bold text-slate-700 dark:text-slate-200 transition-colors"
                        >
                            0
                        </button>
                        <button
                            type="button"
                            onClick={() => setPin('')}
                            className="aspect-square bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors uppercase"
                        >
                            Clear
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black text-base shadow-lg shadow-violet-600/30 transition-all flex justify-center items-center gap-2 mt-2"
                    >
                        <KeyRound size={20} />
                        {t('pin_login_btn')}
                    </button>
                </form>
            </div>

            <p className="text-slate-400 dark:text-slate-500 text-sm mt-6 flex items-center gap-2">
                <Lock size={14} /> Tersertifikasi Aman
            </p>
        </div>
    );
}
