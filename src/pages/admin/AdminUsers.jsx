import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useLang } from "../../context/LanguageContext";
import { ArrowLeft } from "lucide-react";

const PLANS = ["all", "free", "pro", "ultimate"];
const BADGE = {
  free: "bg-gray-100 text-gray-700",
  pro: "bg-blue-100 text-blue-700",
  ultimate: "bg-purple-100 text-purple-700"
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { t, lang } = useLang();
  const isEn = lang === 'EN';
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    let result = users;
    if (planFilter !== "all") result = result.filter(u => u.plan === planFilter);
    if (search) result = result.filter(u =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    );
    return result;
  }, [search, planFilter, users]);

  async function fetchUsers() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    let ignore = false;
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!ignore) {
          setUsers(data || []);
          setLoading(false);
        }
      });
    return () => { ignore = true; };
  }, []);

  async function updatePlan(id, plan) {
    await supabase.rpc('admin_manage_user', {
      p_target_user_id: id,
      p_action: 'updatePlan',
      p_payload: { plan }
    });
    fetchUsers();
  }

  async function setAdmin(id) {
    if (!confirm(isEn ? "Set this user as admin?" : "Set user ini sebagai admin?")) return;
    await supabase.rpc('admin_manage_user', {
      p_target_user_id: id,
      p_action: 'setAdmin'
    });
    fetchUsers();
  }

  async function removeAdmin(id) {
    if (!confirm(isEn ? "Revoke admin access for this user?" : "Hapus akses admin user ini?")) return;
    await supabase.rpc('admin_manage_user', {
      p_target_user_id: id,
      p_action: 'removeAdmin'
    });
    fetchUsers();
  }

  async function deleteUser(id) {
    if (!confirm(isEn ? "Delete this user? This action cannot be undone!" : "Hapus user ini? Data tidak bisa dikembalikan!")) return;
    await supabase.rpc('admin_manage_user', {
      p_target_user_id: id,
      p_action: 'deleteUser'
    });
    fetchUsers();
  }

  const headers = isEn
    ? ["Name", "Email", "Plan", "Trial Ends", "Joined", "Action"]
    : ["Nama", "Email", "Plan", "Trial Berakhir", "Daftar", "Aksi"];

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-slate-50 pb-20">
      <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/admin')} className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition shadow-sm" title={isEn ? "Back to Admin Dashboard" : "Kembali ke Dashboard Admin"}>
              <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{isEn ? "Manage Users" : "Kelola Pengguna"}</h1>
            <p className="text-slate-500 font-medium mt-1">{isEn ? "Manage MyInvoice user access and subscription plans" : "Manajemen akses dan paket pengguna My Invoice"}</p>
          </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={isEn ? "Search name / email..." : "Cari nama / email..."}
          className="px-4 py-2 border rounded-lg flex-1 min-w-[200px] outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-200 text-slate-900" />
        <div className="flex gap-2 flex-wrap">
          {PLANS.map(p => (
            <button key={p} onClick={() => setPlanFilter(p)}
              className={"px-3 py-2 rounded-lg text-sm font-medium border transition " +
                (planFilter === p ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-slate-600 hover:bg-gray-50")}>
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">{isEn ? "Loading users..." : "Memuat pengguna..."}</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {headers.map(h => (
                  <th key={h} className="px-4 py-3 text-left text-gray-600 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-slate-900 whitespace-nowrap">
                    {u.full_name || "-"}
                    {u.role === "admin" && (
                      <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">ADMIN</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={"px-2 py-0.5 rounded-full text-xs font-semibold " + (BADGE[u.plan] || BADGE.free)}>
                      {u.plan?.toUpperCase() || "FREE"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {u.trial_ends_at
                      ? new Date(u.trial_ends_at) > new Date()
                        ? new Date(u.trial_ends_at).toLocaleDateString(t('locale_code'))
                        : "No Trial"
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString(t('locale_code'))}
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
                            className="px-2 py-1 bg-orange-50 text-orange-600 rounded text-xs hover:bg-orange-100 font-medium">{isEn ? "Revoke Admin" : "Cabut Admin"}</button>
                      }
                      <button onClick={() => deleteUser(u.id)}
                        className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 font-medium">{isEn ? "Delete" : "Hapus"}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">{isEn ? "No users found" : "Tidak ada user ditemukan"}</div>
          )}
        </div>
      )}
    </div>
  );
}
