import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { AlertTriangle, Users } from "lucide-react";

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
                const trxId = searchParams.get("trx_id") ||
                    searchParams.get("order_id") ||
                    searchParams.get("payment_id") ||
                    searchParams.get("id");

                if (!trxId) {
                    setErrorMsg("Pembayaran tidak dapat diverifikasi. Tidak ada ID transaksi yang diterima dari payment gateway. Jika kamu sudah membayar, hubungi support kami.");
                    setLoading(false);
                    return;
                }

                const { data: existing } = await supabase
                    .from("profiles")
                    .select("last_payment_trx_id")
                    .eq("id", user.id)
                    .maybeSingle();

                if (existing?.last_payment_trx_id === trxId) {
                    navigate("/dashboard");
                    return;
                }

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
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                <p className="text-gray-500 font-medium animate-pulse">Memverifikasi pembayaran...</p>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Verifikasi Gagal</h1>
                    <p className="text-gray-500 mb-6 text-sm">{errorMsg}</p>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="w-full py-3.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-all"
                    >
                        Kembali ke Dashboard
                    </button>
                    <p className="text-xs text-gray-400 mt-4 font-medium">
                        Hubungi <strong>hello.myinvoice@gmail.com</strong> jika saldo Anda terpotong namun paket belum aktif.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-gray-100 relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
                <div className="text-7xl mb-4 animate-pulse pt-2 flex justify-center"><Users size={64} className="text-violet-600" /></div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Selamat! Kamu sekarang ULTIMATE!</h1>
                <p className="text-gray-500 mb-6">Versi paling sempurna. Bisnismu sekarang di level berikutnya.</p>
                <div className="mb-8">
                    <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-5 py-2.5 rounded-full font-black text-lg shadow-sm border border-purple-200 backdrop-blur-sm">
                        ULTIMATE
                    </span>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 mb-8 text-left border border-purple-100">
                    <h3 className="font-bold text-purple-900 mb-3 text-sm uppercase tracking-wider">Fitur unggulan:</h3>
                    <ul className="space-y-2 text-sm text-gray-700 font-medium">
                        <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span> Semua fitur PRO</li>
                        <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span> Fitur Kasir (Point of Sale)</li>
                        <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span> Manajemen stok barang</li>
                        <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span> Struk & nota kasir</li>
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
