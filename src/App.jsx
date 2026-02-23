import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
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
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/catatan-bisnis" element={<CatatanBisnis />} />
        <Route path="/klien" element={<Klien />} />
        <Route path="/invoice" element={<Invoice />} />
        <Route path="/kwitansi" element={<Kwitansi />} />
        <Route path="/tanda-terima" element={<TandaTerima />} />
        <Route path="/penawaran-harga" element={<PenawaranHarga />} />
        <Route path="/purchase-order" element={<PurchaseOrder />} />
        <Route path="/hitung-hpp" element={<HitungHPP />} />
        <Route path="/laporan" element={<Laporan />} />
        <Route path="/upgrade" element={<Upgrade />} />
      </Routes>
    </Layout>
  );
}
