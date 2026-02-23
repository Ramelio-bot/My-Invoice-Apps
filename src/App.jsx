import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CatatanBisnis from './pages/CatatanBisnis';
import Klien from './pages/Klien';
import Invoice from './pages/Invoice';
import Kwitansi from './pages/Kwitansi';
import TandaTerima from './pages/TandaTerima';
import PenawaranHarga from './pages/PenawaranHarga';
import PurchaseOrder from './pages/PurchaseOrder';
import HitungHPP from './pages/HitungHPP';
import Laporan from './pages/Laporan';
import Upgrade from './pages/Upgrade';

// Helper to wrap an app page in both Layout and PrivateRoute
const AppPage = ({ children }) => (
  <PrivateRoute>
    <Layout>{children}</Layout>
  </PrivateRoute>
);

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />

      {/* Protected app pages */}
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
      <Route path="/upgrade" element={<AppPage><Upgrade /></AppPage>} />
    </Routes>
  );
}
