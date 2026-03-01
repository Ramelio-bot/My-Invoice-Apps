const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Membuat file Auth & Admin...\n');

function write(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('OK: ' + filePath);
}

write('src/lib/supabase.js', `import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`);

write('src/context/AuthContext.jsx', `import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) await fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase.from("users").select("*").eq("id", userId).single();
      setProfile(data);
    } catch (e) {
      console.error("fetchProfile error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email, password, name) {
    return await supabase.auth.signUp({ email, password, options: { data: { name } } });
  }

  async function signIn(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
  }

  async function signInWithGoogle() {
    return await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" }
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setSession(null);
  }

  const isAdmin = profile?.role === "admin";
  const trialActive = profile?.trial_ends_at ? new Date(profile.trial_ends_at) > new Date() : false;
  const trialDaysLeft = profile?.trial_ends_at
    ? Math.ceil((new Date(profile.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
  const effectivePlan = trialActive ? "pro" : (profile?.plan || "free");

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      signUp, signIn, signInWithGoogle, signOut,
      isAdmin, trialActive, trialDaysLeft, effectivePlan,
      refreshProfile: () => user && fetchProfile(user.id)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
`);

write('src/pages/Login.jsx', `import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await signIn(email, password);
    if (error) { setError("Email atau password salah."); setLoading(false); }
    else navigate("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">My Invoice</h1>
          <p className="text-gray-500 mt-1">Login ke akun kamu</p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="email@kamu.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? "Loading..." : "Login"}
          </button>
        </form>
        <div className="my-4 flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-gray-400 text-sm">atau</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>
        <button onClick={signInWithGoogle}
          className="w-full py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 dark:border-gray-600 dark:text-white">
          Login dengan Google
        </button>
        <p className="text-center text-sm text-gray-500 mt-6">
          Belum punya akun?{" "}
          <Link to="/register" className="text-blue-600 font-medium hover:underline">Daftar gratis</Link>
        </p>
      </div>
    </div>
  );
}
`);

write('src/pages/Register.jsx', `import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function handleSubmit(e) {
    e.preventDefault(); setError("");
    if (form.password.length < 8) return setError("Password minimal 8 karakter.");
    if (form.password !== form.confirm) return setError("Password tidak sama.");
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.name);
    if (error) { setError(error.message); setLoading(false); }
    else { setSuccess(true); setTimeout(() => navigate("/dashboard"), 2000); }
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold dark:text-white">Berhasil Daftar!</h2>
        <p className="text-gray-500 mt-2">PRO Trial 14 hari aktif! Diarahkan ke dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">My Invoice</h1>
          <p className="text-gray-500 mt-1">Daftar gratis — PRO Trial 14 hari!</p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Nama Lengkap", name: "name", type: "text", placeholder: "John Doe" },
            { label: "Email", name: "email", type: "email", placeholder: "email@kamu.com" },
            { label: "Password", name: "password", type: "password", placeholder: "Min. 8 karakter" },
            { label: "Konfirmasi Password", name: "confirm", type: "password", placeholder: "Ulangi password" },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
              <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange}
                placeholder={f.placeholder} required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? "Loading..." : "Daftar Sekarang"}
          </button>
        </form>
        <div className="my-4 flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-gray-400 text-sm">atau</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>
        <button onClick={signInWithGoogle}
          className="w-full py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700">
          Daftar dengan Google
        </button>
        <p className="text-center text-sm text-gray-500 mt-6">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
`);

write('src/pages/Profile.jsx', `import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BADGE = { free: "bg-gray-100 text-gray-700", pro: "bg-blue-100 text-blue-700", ultimate: "bg-purple-100 text-purple-700" };

export default function Profile() {
  const { user, profile, signOut, trialActive, trialDaysLeft, effectivePlan } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Profil Saya</h1>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {profile?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="font-semibold text-lg dark:text-white">{profile?.name || "User"}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={"px-3 py-1 rounded-full text-sm font-semibold " + (BADGE[effectivePlan] || BADGE.free)}>
            {effectivePlan.toUpperCase()}
          </span>
          {trialActive && <span className="text-sm text-orange-500 font-medium">Trial: {trialDaysLeft} hari lagi</span>}
        </div>
        {trialActive && trialDaysLeft <= 3 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
            Trial hampir habis! Upgrade sekarang.
          </div>
        )}
        {effectivePlan === "free" && !trialActive && (
          <button onClick={() => navigate("/upgrade")}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
            Upgrade ke PRO
          </button>
        )}
        <button onClick={handleLogout}
          className="w-full py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition">
          Logout
        </button>
      </div>
    </div>
  );
}
`);

write('src/components/AdminRoute.jsx', `import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}
`);

write('src/pages/admin/AdminDashboard.jsx', `import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, free: 0, pro: 0, ultimate: 0, today: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase.from("users").select("plan, created_at");
      if (!data) return;
      const today = new Date().toDateString();
      setStats({
        total: data.length,
        free: data.filter(u => u.plan === "free").length,
        pro: data.filter(u => u.plan === "pro").length,
        ultimate: data.filter(u => u.plan === "ultimate").length,
        today: data.filter(u => new Date(u.created_at).toDateString() === today).length,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const revenue = (stats.pro * 99000) + (stats.ultimate * 149000);
  const cards = [
    { label: "Total Users", value: stats.total },
    { label: "FREE", value: stats.free },
    { label: "PRO", value: stats.pro },
    { label: "ULTIMATE", value: stats.ultimate },
    { label: "Daftar Hari Ini", value: stats.today },
    { label: "Est. Revenue/bln", value: "Rp " + revenue.toLocaleString("id-ID") },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Admin Dashboard</h1>
        <Link to="/admin/users" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Kelola Users</Link>
      </div>
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map(c => (
            <div key={c.label} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-2xl font-bold mt-1 dark:text-white">{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`);

write('src/pages/admin/AdminUsers.jsx', `import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const PLANS = ["all", "free", "pro", "ultimate"];
const BADGE = { free: "bg-gray-100 text-gray-700", pro: "bg-blue-100 text-blue-700", ultimate: "bg-purple-100 text-purple-700" };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let result = users;
    if (planFilter !== "all") result = result.filter(u => u.plan === planFilter);
    if (search) result = result.filter(u =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, planFilter, users]);

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    setUsers(data || []); setFiltered(data || []); setLoading(false);
  }

  async function updatePlan(id, plan) {
    await supabase.from("users").update({ plan }).eq("id", id);
    fetchUsers();
  }

  async function setAdmin(id) {
    if (!confirm("Set user ini sebagai admin?")) return;
    await supabase.from("users").update({ role: "admin" }).eq("id", id);
    fetchUsers();
  }

  async function deleteUser(id) {
    if (!confirm("Hapus user ini?")) return;
    await supabase.from("users").delete().eq("id", id);
    fetchUsers();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Kelola Users</h1>
      <div className="flex flex-wrap gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama / email..."
          className="px-4 py-2 border rounded-lg flex-1 min-w-[200px] dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        <div className="flex gap-2">
          {PLANS.map(p => (
            <button key={p} onClick={() => setPlanFilter(p)}
              className={"px-3 py-2 rounded-lg text-sm font-medium border transition " + (planFilter === p ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 dark:border-gray-600 dark:text-white")}>
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>{["Nama","Email","Plan","Daftar","Aksi"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 dark:text-white">
                    {u.name || "-"}
                    {u.role === "admin" && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">ADMIN</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={"px-2 py-0.5 rounded-full text-xs font-semibold " + (BADGE[u.plan] || BADGE.free)}>
                      {u.plan?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(u.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => updatePlan(u.id,"pro")} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100">PRO</button>
                      <button onClick={() => updatePlan(u.id,"ultimate")} className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs hover:bg-purple-100">ULTIMATE</button>
                      <button onClick={() => updatePlan(u.id,"free")} className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs hover:bg-gray-100">FREE</button>
                      {u.role !== "admin" && <button onClick={() => setAdmin(u.id)} className="px-2 py-1 bg-yellow-50 text-yellow-600 rounded text-xs hover:bg-yellow-100">Set Admin</button>}
                      <button onClick={() => deleteUser(u.id)} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-gray-400">Tidak ada user</div>}
        </div>
      )}
    </div>
  );
}
`);

write('src/components/PrivateRoute.jsx', `import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const isGuest = localStorage.getItem("guest_mode") === "true";
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );
  if (!user && !isGuest) return <Navigate to="/" replace />;
  return children;
}
`);

write('src/App.jsx', `import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import Landing from "./pages/Landing";
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

const AppPage = ({ children }) => (
  <PrivateRoute><Layout>{children}</Layout></PrivateRoute>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
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
    </Routes>
  );
}
`);

write('src/main.jsx', `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { PlanProvider } from "./context/PlanContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <PlanProvider>
            <ToastProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </ToastProvider>
          </PlanProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
`);

console.log('\n📦 Install @supabase/supabase-js...');
try {
  execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
} catch (e) {
  console.log('Jalankan manual: npm install @supabase/supabase-js');
}

console.log('\n========================================');
console.log('SEMUA FILE BERHASIL DIBUAT!');
console.log('========================================');
console.log('Langkah selanjutnya:');
console.log('1. Jalankan SQL di Supabase (SUPABASE_SQL.sql)');
console.log('2. npm run build');
console.log('3. Kalau sukses -> git push!');
console.log('');
console.log('Set admin setelah register:');
console.log("UPDATE public.users SET role = 'admin' WHERE email = 'admin@myinvoice.space';");
