import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
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
import Profile from "./pages/Profile";
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
            Terjadi Kesalahan
          </h2>
          <p style={{ color: '#64748B', marginBottom: 24, textAlign: 'center', maxWidth: 400 }}>
            Something went wrong. Please refresh the page to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#7C3AED', color: 'white', border: 'none',
              padding: '10px 24px', borderRadius: 10, fontWeight: 700,
              fontSize: 15, cursor: 'pointer'
            }}
          >
            🔄 Refresh Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pro-success" element={<ProSuccess />} />
        <Route path="/ultimate-success" element={<UltimateSuccess />} />

        {/* Additional Public Pages */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/blog" element={<Blog />} />

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
        <Route path="/kasir/produk" element={<AppPage><KasirProduk /></AppPage>} />
        <Route path="/kasir/stok" element={<AppPage><KasirStok /></AppPage>} />
        <Route path="/kasir/laporan" element={<AppPage><KasirLaporan /></AppPage>} />
        <Route path="/kasir/karyawan" element={<AppPage><KasirKaryawan /></AppPage>} />
        <Route path="/kasir/pengeluaran" element={<AppPage><KasirPengeluaran /></AppPage>} />
        <Route path="/kasir-members" element={<AppPage><KasirMembers /></AppPage>} />
        <Route path="/bantuan" element={<AppPage><HelpCenter /></AppPage>} />
      </Routes>
    </ErrorBoundary>
  );
}
