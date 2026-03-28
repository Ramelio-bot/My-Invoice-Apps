import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const { t } = useLang();
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

  const revenue = (stats.pro * 129000) + (stats.ultimate * 149000);

  const cards = [
    { label: "Total Users", value: stats.total, icon: "Users" },
    { label: "FREE", value: stats.free, icon: "Circle" },
    { label: "PRO", value: stats.pro, icon: "Star" },
    { label: "ULTIMATE", value: stats.ultimate, icon: "Store" },
    { label: "Daftar Hari Ini", value: stats.today, icon: "Calendar" },
    { label: t("admin_revenue_est"), value: "Rp " + revenue.toLocaleString(t("locale_code")), icon: "DollarSign" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("admin_dashboard_title")}</h1>
          <p className="text-gray-500 text-sm">My Invoice Control Panel</p>
        </div>
        <Link to="/admin/users"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
          {t("admin_manage_users")} →
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">{t("admin_loading_stats")}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map(c => (
            <div key={c.label} className="bg-white rounded-xl shadow p-5">
              <div className="text-2xl mb-2">{c.icon}</div>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-2xl font-bold mt-1">{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
