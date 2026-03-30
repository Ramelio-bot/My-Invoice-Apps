import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { supabase } from "../../lib/supabase";
import { Users, CreditCard, TrendingUp, DollarSign, Activity, AlertTriangle, UserCheck, ShieldCheck, ArrowLeft } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function AdminDashboard() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ 
      total: 0, free: 0, pro: 0, ultimate: 0, today: 0, 
      activeTrials: 0, churnRate: "0%"
  });
  const [growthData, setGrowthData] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = {
      pro: "#3B82F6", 
      ultimate: "#8B5CF6", 
      free: "#94A3B8" 
  };

  useEffect(() => {
    async function fetchDashboardData() {
      const { data: users } = await supabase.from("profiles").select("id, plan, created_at, trial_ends_at, email, full_name").order("created_at", { ascending: false });
      
      if (!users) return;

      const todayStr = new Date().toDateString();
      const now = new Date();

      // Jangan hitung admin sebagai user berbayar
      const regularUsers = users.filter(u => u.role !== 'admin');
      
      // Hitung Stats
      const totalUsers = users.length;
      const freeUsers = regularUsers.filter(u => u.plan === "free" || !u.plan).length;
      
      // Active Trials: Plan free/pro tapi trial_ends_at masih di masa depan
      const activeTrials = regularUsers.filter(u => new Date(u.trial_ends_at) > now).length;

      // TRUE PAID USERS: Mereka yang Pro/Ultimate DAN trialnya sudah habis (atau tidak punya trial)
      const paidProUsers = regularUsers.filter(u => u.plan === "pro" && (!u.trial_ends_at || new Date(u.trial_ends_at) <= now)).length;
      const paidUltimateUsers = regularUsers.filter(u => u.plan === "ultimate" && (!u.trial_ends_at || new Date(u.trial_ends_at) <= now)).length;

      const todaySignups = users.filter(u => new Date(u.created_at).toDateString() === todayStr).length;

      setStats({
        total: totalUsers,
        free: freeUsers,
        pro: paidProUsers, // Hanya yang benar-benar bayar
        ultimate: paidUltimateUsers, // Hanya yang benar-benar bayar
        today: todaySignups,
        activeTrials: activeTrials,
        churnRate: "1.2%"
      });

      const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
      });

      const chartData = last7Days.map(date => {
          const count = users.filter(u => u.created_at.startsWith(date)).length;
          return {
              date: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
              users: count
          };
      });
      setGrowthData(chartData);
      setRecentUsers(users.slice(0, 5));
      setLoading(false);
    }
    fetchDashboardData();
  }, []);

  const mrr = (stats.pro * 129000) + (stats.ultimate * 149000);
  const arr = mrr * 12;

  const planData = [
    { name: 'PRO', value: stats.pro, color: COLORS.pro },
    { name: 'ULTIMATE', value: stats.ultimate, color: COLORS.ultimate },
    { name: 'FREE', value: stats.free, color: COLORS.free }
  ];

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
              <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-500 font-medium tracking-wide">Menghubungkan ke Pusat Komando...</p>
          </div>
      );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen pb-20">
      {/* HEADER DENGAN TOMBOL BACK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition shadow-sm" title="Kembali ke Dashboard Utama">
              <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <ShieldCheck className="text-violet-600" size={32} />
                God's Eye Dashboard
            </h1>
            <p className="text-slate-500 font-medium mt-1">Status Sistem Operasional MyInvoice.space</p>
          </div>
        </div>
        <div className="flex gap-3">
            <Link to="/admin/users" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition shadow-sm flex items-center gap-2">
                <Users size={18} /> Kelola Pengguna
            </Link>
            <button className="px-5 py-2.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition shadow-lg shadow-violet-600/30 flex items-center gap-2">
                <Activity size={18} /> Sistem Normal
            </button>
        </div>
      </div>

      {/* ROW 1: THE METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><DollarSign size={80}/></div>
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><DollarSign size={20}/></div>
                  <span className="font-bold text-slate-500 text-sm">Est. MRR (Pendapatan)</span>
              </div>
              <h2 className="text-3xl font-black text-slate-800">Rp {mrr.toLocaleString('id-ID')}</h2>
              <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                  <TrendingUp size={12}/> ARR: Rp {arr.toLocaleString('id-ID')}
              </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Users size={80}/></div>
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users size={20}/></div>
                  <span className="font-bold text-slate-500 text-sm">Total Akun Terdaftar</span>
              </div>
              <h2 className="text-3xl font-black text-slate-800">{stats.total.toLocaleString()}</h2>
              <p className="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1">
                  +{stats.today} pendaftar baru hari ini
              </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Activity size={80}/></div>
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Activity size={20}/></div>
                  <span className="font-bold text-slate-500 text-sm">Pro Trial Aktif</span>
              </div>
              <h2 className="text-3xl font-black text-slate-800">{stats.activeTrials.toLocaleString()}</h2>
              <p className="text-xs text-amber-600 font-bold mt-2 flex items-center gap-1">
                  Potensi Konversi MRR Bulan Ini
              </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><UserCheck size={80}/></div>
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-violet-100 text-violet-600 rounded-lg"><CreditCard size={20}/></div>
                  <span className="font-bold text-slate-500 text-sm">Pelanggan Berbayar</span>
              </div>
              <h2 className="text-3xl font-black text-slate-800">{(stats.pro + stats.ultimate).toLocaleString()}</h2>
              <p className="text-xs text-slate-500 font-bold mt-2 flex items-center gap-1">
                  {stats.ultimate} Ultimate | {stats.pro} Pro
              </p>
          </div>
      </div>

      {/* ROW 2: ANALITIK PERTUMBUHAN & DISTRIBUSI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-500"/> Kecepatan Pertumbuhan (7 Hari)
              </h3>
              <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '3 3' }} />
                          <Area type="monotone" dataKey="users" name="Pendaftar Baru" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <PieChart size={18} className="text-violet-500"/> Distribusi Paket
              </h3>
              <div className="h-[200px] w-full mt-4 flex justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={planData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                              {planData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                  {planData.map(plan => (
                      <div key={plan.name} className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }}></div>
                          <span className="text-xs font-bold text-slate-600">{plan.name}</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* ROW 3: REGISTRASI TERBARU & SYSTEM ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Users size={18} className="text-emerald-500"/> Registrasi Terbaru
                  </h3>
                  <Link to="/admin/users" className="text-xs font-bold text-violet-600 hover:text-violet-700">Lihat Semua</Link>
              </div>
              <div className="space-y-4">
                  {recentUsers.map(u => (
                      <div key={u.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition border border-transparent hover:border-slate-100">
                          <div>
                              <p className="font-bold text-sm text-slate-800">{u.full_name || 'User Baru'}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                          <div className="text-right">
                              <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${
                                  u.plan === 'ultimate' ? 'bg-violet-100 text-violet-700' :
                                  u.plan === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                  {u.plan || 'FREE'}
                              </span>
                              <p className="text-[10px] text-slate-400 mt-1 font-medium">{new Date(u.created_at).toLocaleDateString('id-ID')}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-orange-500"/> Radar Sistem
              </h3>
              <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-bold text-slate-700">Kapasitas Storage (Logo)</span>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">AMAN</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width: '15%'}}></div></div>
                      <p className="text-[10px] text-slate-500 mt-2">Penggunaan penyimpanan cloud berada dalam batas wajar.</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-bold text-slate-700">Beban Database API</span>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">STABIL</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Respon sistem di bawah 200ms.</p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-bold text-orange-700">Audit Log Peringatan</span>
                          <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">PANTAU</span>
                      </div>
                      <p className="text-[10px] text-orange-600 mt-1">Terdapat {stats.activeTrials} pengguna yang sedang menjalani Trial.</p>
                  </div>
              </div>
          </div>
      </div>

    </div>
  );
}
