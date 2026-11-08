import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

export default function OwnerPinGuard({ children }) {
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [activeStaff] = useState(() => {
    try {
      const stored = sessionStorage.getItem('active_kasir_employee') || localStorage.getItem('myinvoice_active_staff');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('owner_report_unlocked') === 'true';
  });

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [adminEmployees, setAdminEmployees] = useState([]);

  useEffect(() => {
    if (!user) return;
    const loadAdmins = async () => {
      const { data } = await supabase
        .from('kasir_employees')
        .select('id, name, role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('role', 'Admin');
      setAdminEmployees(data || []);
    };
    loadAdmins();
  }, [user]);

  // If no cashier shift active, or staff is not role 'Kasir', or already unlocked, render children
  const isCashierRole = activeStaff && (activeStaff.role === 'Kasir' || activeStaff.role?.toLowerCase() === 'cashier');
  if (!isCashierRole || isUnlocked) {
    return children;
  }

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    setError('');
    if (!pin || pin.length < 4) {
      setError(t('pin_min_digits') || 'Masukkan PIN minimal 4 angka');
      return;
    }

    setIsVerifying(true);
    try {
      if (adminEmployees.length === 0) {
        setError(t('owner_pin_no_admin') || 'Tidak ada akun Admin/Manager terdaftar di menu Karyawan. Akhiri shift kasir untuk mengakses laporan.');
        setIsVerifying(false);
        return;
      }

      let verified = false;
      for (const admin of adminEmployees) {
        const { data: isValid } = await supabase.rpc('verify_employee_pin', {
          p_employee_id: admin.id,
          p_entered_pin: pin
        });
        if (isValid) {
          verified = true;
          break;
        }
      }

      if (verified) {
        sessionStorage.setItem('owner_report_unlocked', 'true');
        setIsUnlocked(true);
      } else {
        setError(t('pin_wrong') || 'PIN Admin / Owner tidak tepat');
      }
    } catch (err) {
      console.error('Error verifying owner PIN:', err);
      setError('Gagal memverifikasi PIN');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNumpad = (num) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center mx-auto mb-3">
            <Lock size={26} />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Akses Khusus Pemilik & Manager
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Shift kasir aktif sebagai <strong className="text-slate-800">{activeStaff?.employeeName || 'Staff Kasir'}</strong>. Masukkan PIN Admin / Owner untuk membuka data omset dan laba toko.
          </p>
        </div>

        <form onSubmit={handleVerifyPin} className="space-y-4">
          <div className="flex justify-center gap-2 mb-4">
            {[0, 1, 2, 3, 4, 5].map(idx => (
              <div
                key={idx}
                className={`w-9 h-11 rounded-xl border-2 flex items-center justify-center text-lg font-black transition-all ${
                  pin.length > idx
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                {pin.length > idx ? '•' : ''}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 text-center">
              {error}
            </div>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumpad(num)}
                className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => handleNumpad('0')}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base transition-colors"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs transition-colors"
            >
              Hapus
            </button>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={isVerifying || pin.length < 4}
              className="w-full py-3 bg-slate-950 hover:bg-black text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isVerifying ? 'Memverifikasi...' : 'Buka Laporan'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/kasir')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={14} />
              Kembali ke Layar POS Kasir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
