import React, { useEffect, lazy, Suspense } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { supabase } from "./lib/supabase";
import { initLiveUpdates } from "./utils/updater";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import Landing from "./pages/Landing";
import ReloadPrompt from "./components/ReloadPrompt";
import { getOfflineQueue, removeFromOfflineQueue } from "./utils/offlineQueue";

// Core Auth & Layout (Code-Split for Fast Initial Public/SEO Load)
const Layout = lazy(() => import("./components/Layout"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

// Core Dashboard & POS Modules (Pre-cached by Service Worker + Background Pre-Warmed)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Kasir = lazy(() => import("./pages/Kasir"));
const KasirProduk = lazy(() => import("./pages/kasir/Produk"));
const KasirStok = lazy(() => import("./pages/kasir/Stok"));
const KasirLaporan = lazy(() => import("./pages/kasir/Laporan"));
const KasirKaryawan = lazy(() => import("./pages/kasir/Karyawan"));
const KasirPengeluaran = lazy(() => import("./pages/kasir/Pengeluaran"));
const KasirMembers = lazy(() => import("./pages/KasirMembers"));

// Online Lazy Loaded Modules
const ProSuccess = lazy(() => import("./pages/ProSuccess"));
const UltimateSuccess = lazy(() => import("./pages/UltimateSuccess"));
const CatatanBisnis = lazy(() => import("./pages/CatatanBisnis"));
const Klien = lazy(() => import("./pages/Klien"));
const Invoice = lazy(() => import("./pages/Invoice"));
const Kwitansi = lazy(() => import("./pages/Kwitansi"));
const TandaTerima = lazy(() => import("./pages/TandaTerima"));
const PenawaranHarga = lazy(() => import("./pages/PenawaranHarga"));
const PurchaseOrder = lazy(() => import("./pages/PurchaseOrder"));
const HitungHPP = lazy(() => import("./pages/HitungHPP"));
const Laporan = lazy(() => import("./pages/Laporan"));
const LaporanKasir = lazy(() => import("./pages/LaporanKasir"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const HutangPiutang = lazy(() => import("./pages/HutangPiutang"));
const Settings = lazy(() => import("./pages/Settings"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const Terms = lazy(() => import("./pages/Terms"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSimulation = lazy(() => import("./pages/admin/AdminSimulation"));
const AuditLog = lazy(() => import("./pages/AuditLog"));

// Public Lazy Pages & Free SEO Tools
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Blog = lazy(() => import("./pages/Blog"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Affiliate = lazy(() => import("./pages/Affiliate"));
const Karir = lazy(() => import("./pages/Karir"));
const AplikasiKasirOffline = lazy(() => import("./pages/AplikasiKasirOffline"));
const BuatInvoiceGratis = lazy(() => import("./pages/BuatInvoiceGratis"));
const AplikasiKasirKafe = lazy(() => import("./pages/AplikasiKasirKafe"));
const SoftwareInvoiceFreelance = lazy(() => import("./pages/SoftwareInvoiceFreelance"));
const KalkulatorHppGratis = lazy(() => import("./pages/KalkulatorHppGratis"));
const BuatKwitansiGratis = lazy(() => import("./pages/BuatKwitansiGratis"));
const BuatPenawaranGratis = lazy(() => import("./pages/BuatPenawaranGratis"));
const IndustryLanding = lazy(() => import("./pages/IndustryLanding"));

const PageFallback = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
    <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-3" />
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{localStorage.getItem('lang') === 'EN' ? 'Loading Page...' : 'Memuat Halaman...'}</p>
  </div>
);

const AppPage = ({ children }) => (
  <PrivateRoute><Layout>{children}</Layout></PrivateRoute>
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#F8FAFC', fontFamily: 'system-ui, sans-serif', padding: 24
        }}>
          <div style={{ marginBottom: 16 }}><AlertTriangle size={48} color="#F59E0B" /></div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#1E293B' }}>
            Terjadi Kesalahan / Something Went Wrong
          </h2>
          <p style={{ color: '#64748B', marginBottom: 24, textAlign: 'center', maxWidth: 400 }}>
            Maaf, terjadi kesalahan teknis. Silakan muat ulang halaman. <br/>
            <span style={{ fontSize: 13, opacity: 0.8 }}>We're sorry, a technical error occurred. Please refresh the page to continue.</span>
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#7C3AED', color: 'white', border: 'none',
              padding: '10px 24px', borderRadius: 10, fontWeight: 700,
              fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <RefreshCw size={16} /> Refresh Halaman / Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AuthRedirector({ children, isHandshaking }) {
  const { user, session, loading, isVerified } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isHandshaking) return;
    if (!loading && user && session) {
      // Background pre-warm critical POS & Dashboard chunks once authenticated
      import("./components/Layout").catch(() => {});
      import("./pages/Dashboard").catch(() => {});
      import("./pages/Kasir").catch(() => {});

      const ignoreRoutes = ['/forgot-password', '/reset-password'];
      if (ignoreRoutes.includes(location.pathname)) return;

      if (location.pathname === '/login' || location.pathname === '/register') {
        navigate('/dashboard', { replace: true });
      }

      const allowedUnverified = ['/verify-email', '/terms', '/logout', '/forgot-password', '/reset-password', '/contact', '/about', '/privacy'];
      if (!isVerified && !allowedUnverified.includes(location.pathname)) {
        navigate('/verify-email', { replace: true });
      }
      
      if (isVerified && location.pathname === '/verify-email') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, session, loading, location.pathname, navigate, isVerified, isHandshaking]);

  if (loading || isHandshaking) {
    const publicRoutes = [
      '/', '/login', '/register', '/forgot-password', '/reset-password', 
      '/verify-email', '/about', '/contact', '/privacy', '/terms', 
      '/affiliate', '/karir', '/bantuan', '/aplikasi-kasir-offline', 
      '/buat-invoice-gratis', '/buat-kwitansi-gratis', '/buat-penawaran-harga-gratis',
      '/aplikasi-kasir-kafe', '/software-invoice-freelance', '/kalkulator-hpp-gratis'
    ];
    const isPublic = publicRoutes.includes(location.pathname) || 
      location.pathname.startsWith('/blog') || 
      location.pathname.startsWith('/invoice-untuk-') || 
      location.pathname.startsWith('/aplikasi-kasir-') || 
      location.pathname.startsWith('/buat-penawaran-harga-') || 
      location.pathname.startsWith('/solusi/');
    
    if (!isPublic || isHandshaking) {
      return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', color: '#1E293B' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 44, height: 44, border: '4px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, opacity: 0.8, letterSpacing: 1 }}>
              {isHandshaking ? "SYNCING SESSION..." : "MY INVOICE"}
            </p>
            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </div>
        </div>
      );
    }
  }

  return children;
}

function RecoveryRedirector() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      navigate('/reset-password' + hash, { replace: true });
    }
  }, [navigate]);

  return null;
}

export default function App() {
  const navigate = useNavigate();
  const [isHandshaking] = React.useState(false);

  useEffect(() => {
    initLiveUpdates();
    return () => {
      import("@capacitor/app")
        .then(({ App: CapApp }) => CapApp.removeAllListeners())
        .catch(() => {});
    };
  }, [navigate]);

  const isSyncingRef = React.useRef(false);

  // [MISSION F4] SINYAL ABADI: Auto-Sync Offline Sales
  useEffect(() => {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const syncOfflineSales = async () => {
      if (!navigator.onLine || isSyncingRef.current) return;
      isSyncingRef.current = true;
      try {
        const queueData = await getOfflineQueue();
        const queue = [...queueData];
        if (queue.length === 0) {
            isSyncingRef.current = false;
            return;
        }
        
        let failCount = 0;

        for (const entry of queue) {
          try {
            const { error } = await supabase.rpc('process_sale', entry.data);
            if (!error) {
              await removeFromOfflineQueue(entry.offline_id);
            } else {
              failCount++;
              console.error(`[SYNC] Gagal sinkronisasi ${entry.offline_id}:`, error);
            }
          } catch (err) {
            failCount++;
            console.error(`[SYNC] Fatal error during sync for ${entry.offline_id}:`, err);
          }
          
          await delay(500);
        }
        
        if (failCount > 0) {
            alert(localStorage.getItem('lang') === 'EN' ? `Failed to sync ${failCount} offline transactions, will retry later.` : `Gagal sync ${failCount} transaksi offline, akan dicoba lagi nanti.`);
        }
        
        window.dispatchEvent(new Event('kasir-updated'));
        window.dispatchEvent(new Event('data-updated'));
      } finally {
        isSyncingRef.current = false;
      }
    };

    window.addEventListener('online', syncOfflineSales);
    syncOfflineSales();
    
    return () => window.removeEventListener('online', syncOfflineSales);
  }, []);

  return (
    <ErrorBoundary>
      <RecoveryRedirector />
      <ReloadPrompt />
      <AuthRedirector isHandshaking={isHandshaking}>
        <Suspense fallback={<PageFallback />}>
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/pro-success" element={<ProSuccess />} />
        <Route path="/ultimate-success" element={<UltimateSuccess />} />

        {/* Additional Public Pages */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/affiliate" element={<Affiliate />} />
        <Route path="/karir" element={<Karir />} />
        <Route path="/aplikasi-kasir-offline" element={<AplikasiKasirOffline />} />
        <Route path="/buat-invoice-gratis" element={<BuatInvoiceGratis />} />
        <Route path="/aplikasi-kasir-kafe" element={<AplikasiKasirKafe />} />
        <Route path="/software-invoice-freelance" element={<SoftwareInvoiceFreelance />} />
        <Route path="/kalkulator-hpp-gratis" element={<KalkulatorHppGratis />} />
        <Route path="/buat-kwitansi-gratis" element={<BuatKwitansiGratis />} />
        <Route path="/buat-penawaran-harga-gratis" element={<BuatPenawaranGratis />} />

        {/* Programmatic SEO Industry Pages — Batch 1 */}
        <Route path="/invoice-untuk-desainer" element={<IndustryLanding explicitSlug="invoice-untuk-desainer" />} />
        <Route path="/invoice-untuk-kontraktor" element={<IndustryLanding explicitSlug="invoice-untuk-kontraktor" />} />
        <Route path="/invoice-untuk-fotografer" element={<IndustryLanding explicitSlug="invoice-untuk-fotografer" />} />
        <Route path="/aplikasi-kasir-laundry" element={<IndustryLanding explicitSlug="aplikasi-kasir-laundry" />} />
        <Route path="/aplikasi-kasir-barbershop" element={<IndustryLanding explicitSlug="aplikasi-kasir-barbershop" />} />

        {/* Programmatic SEO Industry Pages — Batch 2 */}
        <Route path="/invoice-untuk-catering" element={<IndustryLanding explicitSlug="invoice-untuk-catering" />} />
        <Route path="/invoice-untuk-rental-mobil" element={<IndustryLanding explicitSlug="invoice-untuk-rental-mobil" />} />
        <Route path="/invoice-untuk-konsultan" element={<IndustryLanding explicitSlug="invoice-untuk-konsultan" />} />
        <Route path="/aplikasi-kasir-bengkel" element={<IndustryLanding explicitSlug="aplikasi-kasir-bengkel" />} />
        <Route path="/aplikasi-kasir-vape" element={<IndustryLanding explicitSlug="aplikasi-kasir-vape" />} />

        {/* Programmatic SEO Industry Pages — Batch 3 */}
        <Route path="/aplikasi-kasir-petshop" element={<IndustryLanding explicitSlug="aplikasi-kasir-petshop" />} />
        <Route path="/aplikasi-kasir-toko-baju" element={<IndustryLanding explicitSlug="aplikasi-kasir-toko-baju" />} />
        <Route path="/aplikasi-kasir-toko-kelontong" element={<IndustryLanding explicitSlug="aplikasi-kasir-toko-kelontong" />} />
        <Route path="/invoice-untuk-percetakan" element={<IndustryLanding explicitSlug="invoice-untuk-percetakan" />} />
        <Route path="/invoice-untuk-event-organizer" element={<IndustryLanding explicitSlug="invoice-untuk-event-organizer" />} />

        {/* Programmatic SEO Industry Pages — Batch 4 */}
        <Route path="/buat-penawaran-harga-kontraktor" element={<IndustryLanding explicitSlug="buat-penawaran-harga-kontraktor" />} />
        <Route path="/buat-penawaran-harga-catering" element={<IndustryLanding explicitSlug="buat-penawaran-harga-catering" />} />
        <Route path="/buat-penawaran-harga-pengadaan-it" element={<IndustryLanding explicitSlug="buat-penawaran-harga-pengadaan-it" />} />
        <Route path="/buat-penawaran-harga-interior" element={<IndustryLanding explicitSlug="buat-penawaran-harga-interior" />} />
        <Route path="/aplikasi-kasir-cuci-motor" element={<IndustryLanding explicitSlug="aplikasi-kasir-cuci-motor" />} />
        <Route path="/solusi/:slug" element={<IndustryLanding />} />

        <Route path="/dashboard" element={<AppPage><Dashboard /></AppPage>} />
        <Route path="/catatan-bisnis" element={<AppPage><CatatanBisnis /></AppPage>} />
        <Route path="/klien" element={<AppPage><Klien /></AppPage>} />
        <Route path="/invoice" element={<AppPage><Invoice /></AppPage>} />
        <Route path="/kwitansi" element={<AppPage><Kwitansi /></AppPage>} />
        <Route path="/tanda-terima" element={<AppPage><TandaTerima /></AppPage>} />
        <Route path="/penawaran-harga" element={<AppPage><PenawaranHarga /></AppPage>} />
        <Route path="/purchase-order" element={<AppPage><PurchaseOrder /></AppPage>} />
        <Route path="/hitung-hpp" element={<AppPage><HitungHPP /></AppPage>} />
        <Route path="/laporan" element={<AppPage><Laporan /></AppPage>} />
        <Route path="/laporan-kasir" element={<AppPage><LaporanKasir /></AppPage>} />
        <Route path="/hutang-piutang" element={<AppPage><HutangPiutang /></AppPage>} />
        <Route path="/settings" element={<AppPage><Settings /></AppPage>} />
        <Route path="/upgrade" element={<AppPage><Upgrade /></AppPage>} />
        <Route path="/profile" element={<AppPage><Profile /></AppPage>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/simulation" element={<AdminRoute><AdminSimulation /></AdminRoute>} />
        <Route path="/kasir" element={<AppPage><Kasir /></AppPage>} />
        <Route path="/kasir/produk" element={<AppPage><KasirProduk viewType="sellable" /></AppPage>} />
        <Route path="/kasir/gudang" element={<AppPage><KasirProduk viewType="ingredient" /></AppPage>} />
        <Route path="/kasir/stok" element={<AppPage><KasirStok /></AppPage>} />
        <Route path="/kasir/laporan" element={<AppPage><KasirLaporan /></AppPage>} />
        <Route path="/kasir/karyawan" element={<AppPage><KasirKaryawan /></AppPage>} />
        <Route path="/kasir/pengeluaran" element={<AppPage><KasirPengeluaran /></AppPage>} />
        <Route path="/kasir-members" element={<AppPage><KasirMembers /></AppPage>} />
        <Route path="/audit-log" element={<AppPage><AuditLog /></AppPage>} />
        <Route path="/bantuan" element={<AppPage><HelpCenter /></AppPage>} />
      </Routes>
        </Suspense>
      </AuthRedirector>
    </ErrorBoundary>
  );
}
