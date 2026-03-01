const fs = require('fs');
const path = require('path');

console.log('Update file Auth ke tabel profiles...\n');

function write(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('OK: ' + filePath);
}

// ============================================================
// AuthContext.jsx - pakai tabel profiles
// ============================================================
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
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      setProfile(data);
    } catch (e) {
      console.error("fetchProfile error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email, password, name) {
    return await supabase.auth.signUp({
      email, password,
      options: { data: { name } }
    });
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

  const trialActive = profile?.trial_ends_at
    ? new Date(profile.trial_ends_at) > new Date()
    : false;

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.ceil((new Date(profile.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

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

// ============================================================
// Profile.jsx - pakai full_name (sesuai kolom di profiles)
// ============================================================
write('src/pages/Profile.jsx', `import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BADGE = {
  free: "bg-gray-100 text-gray-700",
  pro: "bg-blue-100 text-blue-700",
  ultimate: "bg-purple-100 text-purple-700"
};

export default function Profile() {
  const { user, profile, signOut, trialActive, trialDaysLeft, effectivePlan } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/");
  }

  const nama = profile?.full_name || profile?.email || "User";

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Profil Saya</h1>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-5">

        {/* Avatar & Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {nama.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-lg dark:text-white">{nama}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Plan Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={"px-3 py-1 rounded-full text-sm font-semibold " + (BADGE[effectivePlan] || BADGE.free)}>
            {effectivePlan.toUpperCase()}
          </span>
          {trialActive && (
            <span className="text-sm text-orange-500 font-medium">
              Trial berakhir {trialDaysLeft} hari lagi
            </span>
          )}
          {profile?.role === "admin" && (
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
              ADMIN
            </span>
          )}
        </div>

        {/* Trial warning */}
        {trialActive && trialDaysLeft <= 3 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
            ⚠️ Trial hampir habis! Upgrade sekarang agar tidak kehilangan akses PRO.
          </div>
        )}

        {/* Admin link */}
        {profile?.role === "admin" && (
          <button onClick={() => navigate("/admin")}
            className="w-full py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition">
            Buka Admin Panel
          </button>
        )}

        {/* Upgrade */}
        {effectivePlan === "free" && !trialActive && (
          <button onClick={() => navigate("/upgrade")}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
            Upgrade ke PRO
          </button>
        )}

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition">
          Logout
        </button>
      </div>
    </div>
  );
}
`);

// ============================================================
// AdminDashboard.jsx - pakai tabel profiles
// ============================================================
write('src/pages/admin/AdminDashboard.jsx', `import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, free: 0, pro: 0, ultimate: 0, today: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase.from("profiles").select("plan, created_at");
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
    { label: "Total Users", value: stats.total, icon: "👥" },
    { label: "FREE", value: stats.free, icon: "🆓" },
    { label: "PRO", value: stats.pro, icon: "⭐" },
    { label: "ULTIMATE", value: stats.ultimate, icon: "👑" },
    { label: "Daftar Hari Ini", value: stats.today, icon: "🆕" },
    { label: "Est. Revenue/bln", value: "Rp " + revenue.toLocaleString("id-ID"), icon: "💰" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">My Invoice Control Panel</p>
        </div>
        <Link to="/admin/users"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
          Kelola Users →
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading statistik...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map(c => (
            <div key={c.label} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
              <div className="text-2xl mb-2">{c.icon}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{c.label}</p>
              <p className="text-2xl font-bold mt-1 dark:text-white">{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`);

// ============================================================
// AdminUsers.jsx - pakai tabel profiles & full_name
// ============================================================
write('src/pages/admin/AdminUsers.jsx', `import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const PLANS = ["all", "free", "pro", "ultimate"];
const BADGE = {
  free: "bg-gray-100 text-gray-700",
  pro: "bg-blue-100 text-blue-700",
  ultimate: "bg-purple-100 text-purple-700"
};

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
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, planFilter, users]);

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers(data || []);
    setFiltered(data || []);
    setLoading(false);
  }

  async function updatePlan(id, plan) {
    await supabase.from("profiles").update({ plan }).eq("id", id);
    fetchUsers();
  }

  async function setAdmin(id) {
    if (!confirm("Set user ini sebagai admin?")) return;
    await supabase.from("profiles").update({ role: "admin" }).eq("id", id);
    fetchUsers();
  }

  async function removeAdmin(id) {
    if (!confirm("Hapus akses admin user ini?")) return;
    await supabase.from("profiles").update({ role: "user" }).eq("id", id);
    fetchUsers();
  }

  async function deleteUser(id) {
    if (!confirm("Hapus user ini? Data tidak bisa dikembalikan!")) return;
    await supabase.from("profiles").delete().eq("id", id);
    fetchUsers();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Kelola Users</h1>
          <p className="text-gray-500 text-sm">{users.length} total users</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama / email..."
          className="px-4 py-2 border rounded-lg flex-1 min-w-[200px] outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        <div className="flex gap-2 flex-wrap">
          {PLANS.map(p => (
            <button key={p} onClick={() => setPlanFilter(p)}
              className={"px-3 py-2 rounded-lg text-sm font-medium border transition " +
                (planFilter === p ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700")}>
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading users...</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {["Nama", "Email", "Plan", "Trial Berakhir", "Daftar", "Aksi"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 dark:text-white whitespace-nowrap">
                    {u.full_name || "-"}
                    {u.role === "admin" && (
                      <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">ADMIN</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={"px-2 py-0.5 rounded-full text-xs font-semibold " + (BADGE[u.plan] || BADGE.free)}>
                      {u.plan?.toUpperCase() || "FREE"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {u.trial_ends_at
                      ? new Date(u.trial_ends_at) > new Date()
                        ? new Date(u.trial_ends_at).toLocaleDateString("id-ID") + " ✅"
                        : "Habis ❌"
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => updatePlan(u.id, "pro")}
                        className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 font-medium">PRO</button>
                      <button onClick={() => updatePlan(u.id, "ultimate")}
                        className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs hover:bg-purple-100 font-medium">ULTIMATE</button>
                      <button onClick={() => updatePlan(u.id, "free")}
                        className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs hover:bg-gray-100 font-medium">FREE</button>
                      {u.role !== "admin"
                        ? <button onClick={() => setAdmin(u.id)}
                            className="px-2 py-1 bg-yellow-50 text-yellow-600 rounded text-xs hover:bg-yellow-100 font-medium">Set Admin</button>
                        : <button onClick={() => removeAdmin(u.id)}
                            className="px-2 py-1 bg-orange-50 text-orange-600 rounded text-xs hover:bg-orange-100 font-medium">Cabut Admin</button>
                      }
                      <button onClick={() => deleteUser(u.id)}
                        className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 font-medium">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">Tidak ada user ditemukan</div>
          )}
        </div>
      )}
    </div>
  );
}
`);

console.log('\n========================================');
console.log('SEMUA FILE BERHASIL DIUPDATE!');
console.log('========================================');
console.log('');
console.log('Sekarang:');
console.log('1. Jalankan SUPABASE_SQL_FINAL.sql di Supabase');
console.log('2. npm run build');
console.log('3. Kalau sukses -> git push!');
