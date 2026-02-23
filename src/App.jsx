import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
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

export default function App() {
  return (
    <Routes>
      {/* Landing page — no app layout */}
      <Route path="/" element={<Landing />} />

      {/* App pages — wrapped in Layout (sidebar + navbar) */}
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/catatan-bisnis" element={<Layout><CatatanBisnis /></Layout>} />
      <Route path="/klien" element={<Layout><Klien /></Layout>} />
      <Route path="/invoice" element={<Layout><Invoice /></Layout>} />
      <Route path="/kwitansi" element={<Layout><Kwitansi /></Layout>} />
      <Route path="/tanda-terima" element={<Layout><TandaTerima /></Layout>} />
      <Route path="/penawaran-harga" element={<Layout><PenawaranHarga /></Layout>} />
      <Route path="/purchase-order" element={<Layout><PurchaseOrder /></Layout>} />
      <Route path="/hitung-hpp" element={<Layout><HitungHPP /></Layout>} />
      <Route path="/laporan" element={<Layout><Laporan /></Layout>} />
      <Route path="/upgrade" element={<Layout><Upgrade /></Layout>} />
    </Routes>
  );
}
