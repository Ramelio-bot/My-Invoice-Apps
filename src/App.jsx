import React, { useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "./lib/supabase";
import Layout from "./components/Layout";
import { initLiveUpdates } from "./utils/updater";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import Landing from "./pages/Landing";
import ProSuccess from "./pages/ProSuccess";
import UltimateSuccess from "./pages/UltimateSuccess";
import Dashboard from "./pages/Dashboard";
import CatatanBisnis from "./pages/CatatanBisnis";
import Klien from "./pages/Klien";
import Invoice from "./pages/Invoice";
import Kwitansi from "./pages/Kwitansi";
import TandaTerima from "./pages/TandaTerima";
import PenawaranHarga from "./pages/PenawaranHarga";
import PurchaseOrder from "./pages/PurchaseOrder";
import HitungHPP from "./pages/HitungHPP";
import Laporan from "./pages/Laporan";
import LaporanKasir from "./pages/LaporanKasir";
import Upgrade from "./pages/Upgrade";
import HutangPiutang from "./pages/HutangPiutang";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import Kasir from "./pages/Kasir";
import KasirProduk from "./pages/kasir/Produk";
import KasirStok from "./pages/kasir/Stok";
import KasirLaporan from "./pages/kasir/Laporan";
import KasirKaryawan from "./pages/kasir/Karyawan";
import KasirPengeluaran from "./pages/kasir/Pengeluaran";
import KasirMembers from "./pages/KasirMembers";

// Public Pages
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Blog from "./pages/Blog";
import HelpCenter from "./pages/HelpCenter";
import VerifyEmail from "./pages/VerifyEmail";
import Affiliate from "./pages/Affiliate";
import Karir from "./pages/Karir";

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
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
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
            🔄 Refresh Halaman / Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AuthRedirector({ children }) {
  const { user, session, loading, isVerified } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && session) {
      // Pengecualian untuk route reset-password agar tidak auto-login dan ter-redirect
      const ignoreRoutes = ['/forgot-password', '/reset-password'];
      if (ignoreRoutes.includes(location.pathname)) return; // jangan redirect

      // Jika user sudah login dan mengakses login/register, arahkan ke dashboard
      if (location.pathname === '/login' || location.pathname === '/register') {
        navigate('/dashboard', { replace: true });
      }

      // Enforcement: Jika user sudah login tapi belum verifikasi email, arahkan ke /verify-email
      // Pengecualian route yang memperbolehkan user unverified (syarat & ketentuan, dll)
      const allowedUnverified = ['/verify-email', '/terms', '/logout', '/forgot-password', '/reset-password', '/contact', '/about', '/privacy'];
      if (!isVerified && !allowedUnverified.includes(location.pathname)) {
        navigate('/verify-email', { replace: true });
      }
      
      // Jika user sudah verifikasi tapi mengakses /verify-email, arahkan ke dashboard
      if (isVerified && location.pathname === '/verify-email') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, session, loading, location.pathname, navigate]);

  if (loading) {
    const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/about', '/contact', '/privacy', '/terms', '/affiliate', '/karir', '/bantuan'];
    const isPublic = publicRoutes.includes(location.pathname) || location.pathname.startsWith('/blog');
    
    if (!isPublic) {
      return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', color: '#1E293B' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 44, height: 44, border: '4px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, opacity: 0.8, letterSpacing: 1 }}>MY INVOICE</p>
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
      // Gunakan navigate() agar tidak trigger full page reload (hindari race condition dengan AuthRedirector)
      navigate('/reset-password' + hash, { replace: true });
    }
  }, [navigate]);

  return null;
}

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    initLiveUpdates();
    
    // Custom URL Scheme Listener for Google Login
    const setupAppListener = async () => {
      CapApp.addListener('appUrlOpen', async ({ url }) => {
        if (url.startsWith('com.ramelio.myinvoice://')) {
          const { data, error } = await supabase.auth.getSessionFromUrl({ url });
          if (data?.session) {
            navigate('/dashboard');
            await Browser.close();
          }
        }
      });
    };
    
    setupAppListener();
    
    return () => {
      CapApp.removeAllListeners();
    };
  }, [navigate]);

  return (
    <ErrorBoundary>
      <RecoveryRedirector />
      <AuthRedirector>
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
        <Route path="/kasir" element={<AppPage><Kasir /></AppPage>} />
        <Route path="/kasir/produk" element={<AppPage><KasirProduk viewType="sellable" /></AppPage>} />
        <Route path="/kasir/gudang" element={<AppPage><KasirProduk viewType="ingredient" /></AppPage>} />
        <Route path="/kasir/stok" element={<AppPage><KasirStok /></AppPage>} />
        <Route path="/kasir/laporan" element={<AppPage><KasirLaporan /></AppPage>} />
        <Route path="/kasir/karyawan" element={<AppPage><KasirKaryawan /></AppPage>} />
        <Route path="/kasir/pengeluaran" element={<AppPage><KasirPengeluaran /></AppPage>} />
        <Route path="/kasir-members" element={<AppPage><KasirMembers /></AppPage>} />
        <Route path="/bantuan" element={<AppPage><HelpCenter /></AppPage>} />
      </Routes>
      </AuthRedirector>
    </ErrorBoundary>
  );
}
