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
import Upgrade from "./pages/Upgrade";
import HutangPiutang from "./pages/HutangPiutang";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import Kasir from "./pages/Kasir";

// Public Pages
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Blog from "./pages/Blog";

const AppPage = ({ children }) => (
  <PrivateRoute><Layout>{children}</Layout></PrivateRoute>
);

export default function App() {
  return (
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
      <Route path="/hutang-piutang" element={<AppPage><HutangPiutang /></AppPage>} />
      <Route path="/settings" element={<AppPage><Settings /></AppPage>} />
      <Route path="/upgrade" element={<AppPage><Upgrade /></AppPage>} />
      <Route path="/profile" element={<AppPage><Profile /></AppPage>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/kasir" element={<AppPage><Kasir /></AppPage>} />
    </Routes>
  );
}
