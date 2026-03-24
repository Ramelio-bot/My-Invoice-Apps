import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { AlertTriangle } from "lucide-react";

export default function UltimateSuccess() {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        if (!user) return;

        const updatePlan = async () => {
            try {
                // Verifikasi: harus ada transaction ID dari Mayar payment gateway
                const trxId = searchParams.get("trx_id") ||
                    searchParams.get("order_id") ||
                    searchParams.get("payment_id") ||
                    searchParams.get("id");

                if (!trxId) {
                    setErrorMsg("Pembayaran tidak dapat diverifikasi. Tidak ada ID transaksi yang diterima dari payment gateway. Jika kamu sudah membayar, hubungi support kami.");
                    setLoading(false);
                    return;
                }

                // Cek apakah trx_id ini sudah pernah diproses sebelumnya (mencegah replay)
                const { data: existing } = await supabase
                    .from("profiles")
                    .select("last_payment_trx_id")
                    .eq("id", user.id)
                    .maybeSingle();

                if (existing?.last_payment_trx_id === trxId) {
                    navigate("/dashboard");
                    return;
                }

                // Gunakan RPC yang aman (SECURITY DEFINER) untuk upgrade plan
                const isYearly = searchParams.get("duration") === "yearly" || searchParams.get("type") === "yearly";
                const { error: rpcError } = await supabase.rpc('upgrade_to_ultimate', { 
                    p_trx_id: trxId,
                    p_is_yearly: isYearly
                });

                if (rpcError) throw rpcError;

                if (refreshProfile) await refreshProfile(true, { plan: 'ultimate' });
                navigate("/dashboard");

            } catch (e) {
                console.error("UltimateSuccess -> Error:", e);
                setErrorMsg(e.message || "Terjadi kesalahan saat memproses update profil.");
            } finally {
                setLoading(false);
            }
        };

        updatePlan();
    }, [user, navigate, refreshProfile, searchParams]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                <p className="text-gray-500 font-medium animate-pulse">Memverifikasi pembayaran...</p>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-red-100 dark:border-red-900/30">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Verifikasi Gagal</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">{errorMsg}</p>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="w-full py-3.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-all"
                    >
                        Kembali ke Dashboard
                    </button>
                    <p className="text-xs text-gray-400 mt-4 font-medium">
                        Hubungi <strong>support@myinvoice.space</strong> jika saldo Anda terpotong namun paket belum aktif.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-gray-100 dark:border-gray-700 relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
                <div className="text-7xl mb-4 animate-pulse pt-2">👑</div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Selamat! Kamu sekarang ULTIMATE!</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Versi paling sempurna. Bisnismu sekarang di level berikutnya.</p>
                <div className="mb-8">
                    <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 px-5 py-2.5 rounded-full font-black text-lg shadow-sm border border-purple-200 dark:border-purple-800 backdrop-blur-sm">
                        ULTIMATE 👑
                    </span>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-2xl p-5 mb-8 text-left border border-purple-100 dark:border-purple-800/30">
                    <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-3 text-sm uppercase tracking-wider">Fitur unggulan:</h3>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                        <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span> Semua fitur PRO</li>
                        <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span> Fitur Kasir (Point of Sale)</li>
                        <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span> Manajemen stok barang</li>
                        <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span> Struk &amp; nota kasir</li>
                        <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span> Laporan keuangan lengkap</li>
                        <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span> Prioritas support</li>
                    </ul>
                </div>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-purple-600/30 transition-all transform hover:-translate-y-1"
                >
                    Mulai Gunakan →
                </button>
                <p className="text-xs text-gray-400 mt-6 font-medium">
                    Konfirmasi pembayaran dan invoice dikirim ke email kamu.
                </p>
            </div>
        </div>
    );
}
