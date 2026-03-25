import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Star, AlertTriangle } from "lucide-react";

export default function ProSuccess() {
    const { user, refreshProfile, effectivePlan } = useAuth();
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

                if (effectivePlan === 'ultimate') {
                    if (refreshProfile) await refreshProfile(true);
                    navigate("/dashboard");
                    return;
                }

                const isYearly = searchParams.get("duration") === "yearly" || searchParams.get("type") === "yearly";
                const { error: rpcError } = await supabase.rpc('upgrade_to_pro', { 
                    p_trx_id: trxId,
                    p_is_yearly: isYearly
                });

                if (rpcError) throw rpcError;

                if (refreshProfile) await refreshProfile(true, { plan: 'pro' });
                navigate("/dashboard");

            } catch (e) {
                console.error("ProSuccess -> Error:", e);
                setErrorMsg(e.message || "Terjadi kesalahan saat memproses update profil.");
            } finally {
                setLoading(false);
            }
        };

        updatePlan();
    }, [user, navigate, refreshProfile, searchParams, effectivePlan]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
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
                        Hubungi <strong>support@myinvoice.space</strong> jika saldo Anda terpotong namun paket belum aktif.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-gray-100">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Selamat! Kamu sekarang PRO!</h1>
                <p className="text-gray-500 mb-6">Terima kasih telah berlangganan. Akun kamu berhasil di-upgrade.</p>
                <div className="mb-8">
                    <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-black text-lg shadow-sm border border-blue-200">
                        PRO <Star size={18} fill="currentColor" />
                    </span>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Fitur yang didapat:</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Invoice & dokumen: Unlimited</li>
                        <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Kasir POS: Unlimited transaksi</li>
                        <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Klien: Unlimited</li>
                        <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Laporan keuangan lengkap</li>
                        <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Tanpa watermark</li>
                    </ul>
                </div>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-1"
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
