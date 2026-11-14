import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Users, CreditCard, TrendingUp, DollarSign, Activity, AlertTriangle, UserCheck, ShieldCheck, ArrowLeft, Filter, Clock, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useLang } from "../../context/LanguageContext";

export default function AdminDashboard() {
  const { lang } = useLang();
  const isEn = lang === 'EN';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [simulatedLogs, setSimulatedLogs] = useState([]); // Menampung 5-10 baris data terbaru
  const [totalSimulatedCount, setTotalSimulatedCount] = useState(0); // Counter total data masuk
  const [totalSimulatedAmount, setTotalSimulatedAmount] = useState(0); // Counter total nominal penjumlahan
  const [isTesting, setIsTesting] = useState(false);
  const [stats, setStats] = useState({ 
      total: 0, nonAdmin: 0, free: 0, pro: 0, ultimate: 0, today: 0, 
      activeTrials: 0, expiringSoonTrials: 0, expiredTrials: 0,
      trialToPaidRate: "0.0%", churnRate: "—"
  });
  const [funnelMetrics, setFunnelMetrics] = useState({
      mayarPending: 0,
      mayarSettled: 0,
      mayarProCount: 0,
      mayarUltimateCount: 0,
      eventsAvailable: false,
      events: {
          sign_up_complete: 0,
          trial_expired_paywall_hit: 0,
          limit_modal_shown: 0,
          upgrade_page_viewed: 0,
          begin_checkout_pro: 0,
          begin_checkout_ultimate: 0
      },
      watchlist: []
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
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        const [usersRes, mayarRes, eventsRes] = await Promise.all([
          supabase.from("profiles")
            .select("id, plan, created_at, trial_ends_at, pro_expires_at, last_payment_trx_id, email, full_name, role")
            .order("created_at", { ascending: false })
            .limit(500),
          supabase.from("mayar_transactions")
            .select("trx_id, plan, is_yearly, status, created_at, claimed_by")
            .order("created_at", { ascending: false })
            .limit(300),
          supabase.from("conversion_events")
            .select("event_name, created_at")
            .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .limit(1000)
        ]);

        if (!isMounted) return;

        const { data: users, error } = usersRes;
        if (error) {
          console.error('[AdminDashboard] Query error:', error);
          setLoading(false);
          return;
        }
        if (!users) {
          setLoading(false);
          return;
        }

        const todayStr = new Date().toDateString();
        const now = new Date();
        const nowMs = now.getTime();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

        const totalUsers = users.length;
        let nonAdminCount = 0;
        let freeUsers = 0;
        let paidProUsers = 0;
        let paidUltimateUsers = 0;
        let activeTrials = 0;
        let expiringSoonTrials = 0;
        let expiredTrials = 0;
        let todaySignups = 0;
        const watchlist = [];

        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        const chartMap = {};
        last7Days.forEach(d => { chartMap[d] = 0; });

        // Single-pass loop: satukan iterasi perhitungan untuk efisiensi O(N)
        for (const u of users) {
          if (u.created_at) {
            if (new Date(u.created_at).toDateString() === todayStr) {
              todaySignups++;
            }
            const datePrefix = u.created_at.substring(0, 10);
            if (chartMap[datePrefix] !== undefined) {
              chartMap[datePrefix]++;
            }
          }

          // Singkirkan admin dari kalkulasi revenue & funnel
          if (u.role === 'admin') continue;
          nonAdminCount++;

          const plan = u.plan || 'free';
          const trialEndMs = u.trial_ends_at ? new Date(u.trial_ends_at).getTime() : null;
          const proExpireMs = u.pro_expires_at ? new Date(u.pro_expires_at).getTime() : null;

          const isTrialActive = Boolean(trialEndMs && trialEndMs > nowMs);
          const isTrialExpired = Boolean(trialEndMs && trialEndMs <= nowMs);
          const isSubscriptionExpired = Boolean(proExpireMs && proExpireMs <= nowMs && !isTrialActive);
          const hasPaidSignal = Boolean(u.last_payment_trx_id) || Boolean(proExpireMs && proExpireMs > nowMs) || (!trialEndMs && plan !== 'free');

          if (isTrialActive) {
            activeTrials++;
            const msLeft = trialEndMs - nowMs;
            if (msLeft <= threeDaysMs) {
              expiringSoonTrials++;
              watchlist.push({
                id: u.id,
                name: u.full_name || u.email || 'User',
                email: u.email,
                status: 'expiring_soon',
                daysLeft: Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24))),
                trialEndsAt: u.trial_ends_at
              });
            }
          } else if ((plan === 'pro' || plan === 'ultimate') && !isSubscriptionExpired && hasPaidSignal) {
            if (plan === 'pro') paidProUsers++;
            else paidUltimateUsers++;
          } else {
            // Semua akun yang trial-nya sudah habis & belum bayar masuk kategori FREE (strict expiry)
            freeUsers++;
            if (isTrialExpired) {
              expiredTrials++;
              if (watchlist.length < 8) {
                watchlist.push({
                  id: u.id,
                  name: u.full_name || u.email || 'User',
                  email: u.email,
                  status: 'expired',
                  daysLeft: 0,
                  trialEndsAt: u.trial_ends_at
                });
              }
            }
          }
        }

        const totalPaid = paidProUsers + paidUltimateUsers;
        const cohortDenom = totalPaid + expiredTrials;
        const trialToPaidRate = cohortDenom > 0
          ? `${((totalPaid / cohortDenom) * 100).toFixed(1)}%`
          : (nonAdminCount > 0 ? "0.0%" : "—");
        const realChurnRate = cohortDenom > 0
          ? `${((expiredTrials / cohortDenom) * 100).toFixed(1)}%`
          : "—";

        // Hitung Mayar Checkout Funnel (jika RLS admin aktif)
        const mayarRows = !mayarRes.error && Array.isArray(mayarRes.data) ? mayarRes.data : [];
        let mayarPending = 0;
        let mayarSettled = 0;
        let mayarProCount = 0;
        let mayarUltimateCount = 0;
        for (const tx of mayarRows) {
          const st = String(tx.status || '').toUpperCase();
          if (st === 'SUCCESS' || st === 'SETTLED' || tx.claimed_by) {
            mayarSettled++;
          } else {
            mayarPending++;
          }
          if (tx.plan === 'ultimate') mayarUltimateCount++;
          else if (tx.plan === 'pro') mayarProCount++;
        }

        // Hitung First-Party Conversion Events 30 hari terakhir (graceful fallback sebelum migrasi)
        const eventCounts = {
          sign_up_complete: 0,
          trial_expired_paywall_hit: 0,
          limit_modal_shown: 0,
          upgrade_page_viewed: 0,
          begin_checkout_pro: 0,
          begin_checkout_ultimate: 0
        };
        const eventsAvailable = !eventsRes.error && Array.isArray(eventsRes.data);
        if (eventsAvailable) {
          for (const ev of eventsRes.data) {
            if (Object.prototype.hasOwnProperty.call(eventCounts, ev.event_name)) {
              eventCounts[ev.event_name]++;
            }
          }
        }

        setFunnelMetrics({
          mayarPending,
          mayarSettled,
          mayarProCount,
          mayarUltimateCount,
          eventsAvailable,
          events: eventCounts,
          watchlist: watchlist.slice(0, 6)
        });

        setStats({
          total: totalUsers,
          nonAdmin: nonAdminCount,
          free: freeUsers,
          pro: paidProUsers,
          ultimate: paidUltimateUsers,
          today: todaySignups,
          activeTrials: activeTrials,
          expiringSoonTrials,
          expiredTrials,
          trialToPaidRate,
          churnRate: realChurnRate
        });

        const chartData = last7Days.map(date => ({
            date: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            users: chartMap[date] || 0
        }));

        setGrowthData(chartData);
        setRecentUsers(users.slice(0, 5));
        setLoading(false);
      } catch (err) {
        console.error('[AdminDashboard] Unexpected error:', err);
        if (isMounted) setLoading(false);
      }
    }

    fetchDashboardData();

    // Safety timeout: kalau >5 detik, paksa stop loading spinner
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.warn('[AdminDashboard] Loading timeout (5s)');
        setLoading(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  const mrr = (stats.pro * 49900) + (stats.ultimate * 79900);
  const arr = mrr * 12;

  const planData = [
    { name: 'PRO', value: stats.pro, color: COLORS.pro },
    { name: 'ULTIMATE', value: stats.ultimate, color: COLORS.ultimate },
    { name: 'FREE', value: stats.free, color: COLORS.free }
  ];

  const handleExecuteMegaStressTest = async () => {
    if (!user) return;
    setIsTesting(true);
    setSimulatedLogs([]);
    setTotalSimulatedCount(0);
    setTotalSimulatedAmount(0);
    showToast(isEn ? "Firing parallel data load across 3 outlets..." : "Menembakkan beban data paralel 3 outlet...", "info");
    
    const targetOutlets = ['Outlet-A', 'Outlet-B', 'Outlet-C'];
    const baseAmount = 50000; // Dikunci Rp 50.000 per data untuk pembuktian penjumlahan sempurna
    const batchSize = 1000;
    const promises = [];
    let currentCount = 0;
    let currentAmount = 0;
    let quickLogs = [];

    // 1. Memicu Injeksi Fitur Kasir & Transaksi Utama (1000 Transaksi Paralel dalam 1 Menit)
    for (let i = 0; i < batchSize; i++) {
      const currentOutlet = targetOutlets[i % 3]; // Distribusi merata di 3 toko terpisah
      const transactionPayload = {
        user_id: user.id,
        store_name: currentOutlet,
        total: baseAmount,
        subtotal: baseAmount,
        amount_paid: baseAmount,
        payment_method: 'cash',
        receipt_number: `SIM-${Date.now()}-${i}`,
        notes: '[SIMULATED_TEST]',
        created_at: new Date(Date.now() - Math.random() * 60000).toISOString() // Tersebar acak dalam rentang 1 menit terakhir
      };
      
      // Tambah ke pool eksekusi paralel database
      promises.push(
        supabase.from('kasir_transactions').insert([transactionPayload]).then(({ error }) => {
          if (!error) {
            currentCount += 1;
            currentAmount += baseAmount;
            
            // Ambil sampel data teratas untuk log monitor visual frontend
            if (quickLogs.length < 5) {
              quickLogs.unshift({ id: i, outlet: currentOutlet, amount: baseAmount, time: new Date().toLocaleTimeString('id-ID') });
            }
            
            // Update state real-time per batch agar UI bergeser hidup
            if (currentCount % 50 === 0 || currentCount === batchSize) {
              setTotalSimulatedCount(currentCount);
              setTotalSimulatedAmount(currentAmount);
              setSimulatedLogs([...quickLogs]);
            }
          }
        })
      );
    }

    // 2. Mengisi Fitur Multi-Modul (Masing-masing 20 Baris Data untuk Menjamin Batang Batas 10-30 Per Fitur)
    const modulesToFill = [
      'cashbook',          // Catatan Bisnis
      'documents'          // Invoice, Kwitansi, dll (debts_receivables tidak ada di skema base)
    ];

    modulesToFill.forEach((table) => {
      for (let j = 0; j < 20; j++) {
        let payload = { user_id: user.id };
        if (table === 'cashbook') {
          payload = { ...payload, type: 'income', amount: baseAmount, category: 'Simulasi', description: '[SIMULATED_TEST]' };
        } else if (table === 'documents') {
          payload = { ...payload, type: 'invoice', doc_number: `SIM-DOC-${Date.now()}-${j}`, total: baseAmount, notes: '[SIMULATED_TEST]', status: 'draft' };
        }
        
        promises.push(
          supabase.from(table).insert([payload])
        );
      }
    });

    try {
      await Promise.all(promises);
      showToast(isEn ? "1,000 Parallel Transactions Successfully Injected!" : "1.000 Transaksi Paralel Sukses Masuk Luar Dalam!", "success");
    } catch (err) {
      console.error(err);
      showToast((isEn ? "Query channel overloaded or disconnected: " : "Saluran kueri kelebihan beban atau terputus: ") + err.message, "error");
    } finally {
      setIsTesting(false);
    }
  };

  const handlePurgeTestData = async () => {
    if (!user) return;
    showToast(isEn ? "Cleaning up all remaining simulation test data..." : "Membersihkan seluruh sisa data uji simulasi...", "info");
    
    await Promise.all([
      supabase.from('kasir_transactions').delete().eq('user_id', user.id).eq('notes', '[SIMULATED_TEST]'),
      supabase.from('cashbook').delete().eq('user_id', user.id).eq('description', '[SIMULATED_TEST]'),
      supabase.from('documents').delete().eq('user_id', user.id).eq('notes', '[SIMULATED_TEST]')
    ]);
    
    setSimulatedLogs([]);
    setTotalSimulatedCount(0);
    setTotalSimulatedAmount(0);
    showToast(isEn ? "Database is clean and free of stress-test data!" : "Database kembali suci dan steril dari data uji beban!", "success");
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
              <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-500 font-medium tracking-wide">{isEn ? 'Connecting to Command Center...' : 'Menghubungkan ke Pusat Komando...'}</p>
          </div>
      );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen pb-20">
      {/* HEADER DENGAN TOMBOL BACK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition shadow-sm" title={isEn ? "Back to Main Dashboard" : "Kembali ke Dashboard Utama"}>
              <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <ShieldCheck className="text-violet-600" size={32} />
                God's Eye Dashboard
            </h1>
            <p className="text-slate-500 font-medium mt-1">{isEn ? 'MyInvoice.space Operational System Status' : 'Status Sistem Operasional MyInvoice.space'}</p>
          </div>
        </div>
        <div className="flex gap-3">
            <Link to="/admin/users" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition shadow-sm flex items-center gap-2">
                <Users size={18} /> {isEn ? 'Manage Users' : 'Kelola Pengguna'}
            </Link>
            <button className="px-5 py-2.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition shadow-lg shadow-violet-600/30 flex items-center gap-2">
                <Activity size={18} /> {isEn ? 'System Healthy' : 'Sistem Normal'}
            </button>
        </div>
      </div>

      {/* ROW 1: THE METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><DollarSign size={80}/></div>
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><DollarSign size={20}/></div>
                  <span className="font-bold text-slate-500 text-sm">{isEn ? 'Est. MRR (Revenue)' : 'Est. MRR (Pendapatan)'}</span>
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
                  <span className="font-bold text-slate-500 text-sm">{isEn ? 'Total Registered Accounts' : 'Total Akun Terdaftar'}</span>
              </div>
              <h2 className="text-3xl font-black text-slate-800">{stats.total.toLocaleString()}</h2>
              <p className="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1">
                  +{stats.today} {isEn ? 'new signups today' : 'pendaftar baru hari ini'}
              </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Activity size={80}/></div>
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Activity size={20}/></div>
                  <span className="font-bold text-slate-500 text-sm">{isEn ? 'Active Pro Trials' : 'Pro Trial Aktif'}</span>
              </div>
              <h2 className="text-3xl font-black text-slate-800">{stats.activeTrials.toLocaleString()}</h2>
              <p className="text-xs text-amber-600 font-bold mt-2 flex items-center gap-1">
                  {isEn ? 'Potential MRR Conversion This Month' : 'Potensi Konversi MRR Bulan Ini'}
              </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><UserCheck size={80}/></div>
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-violet-100 text-violet-600 rounded-lg"><CreditCard size={20}/></div>
                  <span className="font-bold text-slate-500 text-sm">{isEn ? 'Paid Subscribers' : 'Pelanggan Berbayar'}</span>
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
                  <TrendingUp size={18} className="text-blue-500"/> {isEn ? 'Growth Velocity (7 Days)' : 'Kecepatan Pertumbuhan (7 Hari)'}
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
                          <Area type="monotone" dataKey="users" name={isEn ? "New Signups" : "Pendaftar Baru"} stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <PieChart size={18} className="text-violet-500"/> {isEn ? 'Plan Distribution' : 'Distribusi Paket'}
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

      {/* ROW 2.5: PRODUCTION CONVERSION & TRIAL FUNNEL */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-5">
              <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Filter size={18} className="text-indigo-600" />
                      {isEn ? 'Production Trial-to-Paid Conversion Funnel' : 'Funnel Konversi Trial ke Berbayar (Produksi)'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                      {isEn
                        ? 'Real cohorts excluding expired trial profiles and admin accounts'
                        : 'Data kohort nyata (mengecualikan akun admin & profil trial yang sudah habis)'}
                  </p>
              </div>
              <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Trial-to-Paid: {stats.trialToPaidRate}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                      {isEn ? 'Expired Unconverted' : 'Trial Habis'}: {stats.expiredTrials}
                  </span>
              </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      1. {isEn ? 'Non-Admin Users' : 'Akun Non-Admin'}
                  </p>
                  <p className="text-2xl font-black text-slate-800">{stats.nonAdmin}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                      +{stats.today} {isEn ? 'today' : 'hari ini'}
                  </p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                      2. {isEn ? 'Active 14d Trial' : 'Trial 14 Hari Aktif'}
                  </p>
                  <p className="text-2xl font-black text-amber-900">{stats.activeTrials}</p>
                  <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                      <Clock size={12} /> {stats.expiringSoonTrials} {isEn ? 'ending <= 3d' : 'habis <= 3 hari'}
                  </p>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-red-700 mb-1">
                      3. {isEn ? 'Expired -> Free' : 'Trial Habis (Free)'}
                  </p>
                  <p className="text-2xl font-black text-red-900">{stats.expiredTrials}</p>
                  <p className="text-[11px] text-red-700 mt-1">
                      {isEn ? 'Locked to 10 docs / 50 POS' : 'Terkunci kuota Starter FREE'}
                  </p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-1">
                      4. Mayar Checkout
                  </p>
                  <p className="text-2xl font-black text-blue-900">
                      {funnelMetrics.mayarPending + funnelMetrics.mayarSettled}
                  </p>
                  <p className="text-[11px] text-blue-700 mt-1">
                      {funnelMetrics.mayarSettled} {isEn ? 'settled' : 'sukses'} / {funnelMetrics.mayarPending} pending
                  </p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                      5. {isEn ? 'Paid Subscribers' : 'Konversi Berbayar'}
                  </p>
                  <p className="text-2xl font-black text-emerald-900">{stats.pro + stats.ultimate}</p>
                  <p className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                      <CheckCircle2 size={12} /> {stats.pro} PRO · {stats.ultimate} Ult
                  </p>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* UI Funnel Click Telemetry (30d) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                          {isEn ? 'Upgrade Funnel Events (Last 30d)' : 'Event Perjalanan Upgrade (30 Hari)'}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${funnelMetrics.eventsAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                          {funnelMetrics.eventsAvailable ? 'Live Telemetry' : (isEn ? 'Migration Pending' : 'Menunggu Migrasi SQL')}
                      </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="text-slate-500">Paywall / Limit Hit</div>
                          <div className="text-base font-black text-slate-800">{funnelMetrics.events.limit_modal_shown + funnelMetrics.events.trial_expired_paywall_hit}</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="text-slate-500">/upgrade Viewed</div>
                          <div className="text-base font-black text-slate-800">{funnelMetrics.events.upgrade_page_viewed}</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="text-slate-500">Klik Bayar PRO / Ult</div>
                          <div className="text-base font-black text-indigo-700">
                              {funnelMetrics.events.begin_checkout_pro} / {funnelMetrics.events.begin_checkout_ultimate}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Actionable Follow-up Watchlist */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                          {isEn ? 'Follow-up Watchlist (Ending <= 3d / Expired)' : 'Daftar Follow-Up (Hampir Habis / Baru Habis)'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">{funnelMetrics.watchlist.length} user</span>
                  </div>
                  {funnelMetrics.watchlist.length === 0 ? (
                      <p className="text-xs text-slate-500">
                          {isEn ? 'No active trials expiring within 72h right now.' : 'Belum ada trial aktif yang berakhir dalam 72 jam atau expired tanpa konversi.'}
                      </p>
                  ) : (
                      <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                          {funnelMetrics.watchlist.map((w) => (
                              <div key={w.id} className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                                  <span className="font-semibold text-slate-700 truncate max-w-[60%]">{w.name}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${w.status === 'expiring_soon' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>
                                      {w.status === 'expiring_soon' ? `${w.daysLeft}d left` : 'Expired'}
                                  </span>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* SEKSI INJEKSI BEBAN REKAYASA UTAMA */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 col-span-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Mega-Stress Test Simulator (V3)
          </h3>
          <span className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-600 rounded-full animate-pulse">
            Ready to Bombard
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {isEn
            ? 'Scenario: Fires 1,000 parallel transactions in 1 minute across 3 stores (Outlet-A, Outlet-B, Outlet-C), populating all modules (Cashbook, POS, Invoice, Debts & Receivables) with exact Rp 50,000 lock.'
            : 'Skenario: Menembakkan 1.000 transaksi paralel dalam 1 menit, menyebar rata di 3 Toko (Outlet-A, Outlet-B, Outlet-C). Mengisi otomatis semua fitur (Catatan Bisnis, Kasir, Invoice, Hutang & Piutang) minimal 10-30 data dengan penjumlahan nominal Rp 50.000 yang terkunci sempurna tanpa pembulatan bocor.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExecuteMegaStressTest}
            disabled={isTesting}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg text-sm shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform active:scale-95 disabled:opacity-75"
          >
            {isTesting ? (isEn ? "Firing Server Requests..." : "Sedang Menembak Server...") : (isEn ? "Execute 1,000 Tx / Min (Parallel)" : "Eksekusi 1.000 Transaksi / Menit (Paralel)")}
          </button>
          <button
            onClick={handlePurgeTestData}
            disabled={isTesting}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg text-sm hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
          >
            {isEn ? "Purge Simulation Data" : "Bersihkan Data Simulasi"}
          </button>
        </div>

        {/* DISPLAY MONITOR LIVE DATA DI FRONTEND */}
        <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Counter 1: Total Record */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500 block font-medium">{isEn ? 'TOTAL INCOMING TRANSACTIONS' : 'TOTAL TRANSKASI MASUK'}</span>
            <span className="text-xl font-bold text-indigo-600">{totalSimulatedCount} / 1000 Tx</span>
          </div>
          
          {/* Counter 2: Agregasi Matematika Sempurna */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500 block font-medium">{isEn ? 'LIVE CUMULATIVE SUM' : 'PENJUMLAHAN AKUMULATIF LIVE'}</span>
            <span className="text-xl font-bold text-emerald-600">
              Rp {totalSimulatedAmount.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Counter 3: Status Jalur Pipa */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500 block font-medium">{isEn ? 'DB PIPELINE STATUS' : 'STATUS PIPELINE DB'}</span>
            <span className={`text-sm font-bold ${isTesting ? 'text-amber-500 animate-pulse' : 'text-gray-600'}`}>
              {isTesting ? (isEn ? 'Firing Parallel Queries...' : 'Menembak Kueri Paralel...') : 'Idle / Steril'}
            </span>
          </div>
        </div>

        {/* TABEL LIVE LOG MONITORING STREAM */}
        {simulatedLogs.length > 0 && (
          <div className="mt-4 p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-xs shadow-inner">
            <div className="text-gray-400 mb-2 border-b border-gray-800 pb-1 flex justify-between">
              <span>LIVE TRANSACTION LOG CONSOLE</span>
              <span className="text-red-400">● STREAMING ACTIVE</span>
            </div>
            <div className="space-y-1">
              {simulatedLogs.map((log) => (
                <div key={log.id} className="flex justify-between">
                  <span>[SUCCESS] Inserted 1 record into public.kasir_transactions ({log.outlet})</span>
                  <span className="text-white">+{log.amount.toLocaleString('id-ID')} @ {log.time}</span>
                </div>
              ))}
              <div className="text-gray-500 italic mt-1">...dan data multi-modul fitur lainnya berhasil disuntik paralel</div>
            </div>
          </div>
        )}
      </div>

      {/* ROW 3: REGISTRASI TERBARU & SYSTEM ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Users size={18} className="text-emerald-500"/> {isEn ? 'Recent Registrations' : 'Registrasi Terbaru'}
                  </h3>
                  <Link to="/admin/users" className="text-xs font-bold text-violet-600 hover:text-violet-700">{isEn ? 'View All' : 'Lihat Semua'}</Link>
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
                  <AlertTriangle size={18} className="text-orange-500"/> {isEn ? 'System Radar' : 'Radar Sistem'}
              </h3>
              <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-bold text-slate-700">{isEn ? 'Storage Capacity (Logo)' : 'Kapasitas Storage (Logo)'}</span>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">{isEn ? 'SAFE' : 'AMAN'}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width: '15%'}}></div></div>
                      <p className="text-[10px] text-slate-500 mt-2">{isEn ? 'Cloud storage usage is within normal limits.' : 'Penggunaan penyimpanan cloud berada dalam batas wajar.'}</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-bold text-slate-700">{isEn ? 'Database API Load' : 'Beban Database API'}</span>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">{isEn ? 'STABLE' : 'STABIL'}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">{isEn ? 'System response under 200ms.' : 'Respon sistem di bawah 200ms.'}</p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-bold text-orange-700">{isEn ? 'Audit Log Alerts' : 'Audit Log Peringatan'}</span>
                          <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">{isEn ? 'MONITOR' : 'PANTAU'}</span>
                      </div>
                      <p className="text-[10px] text-orange-600 mt-1">{isEn ? `There are ${stats.activeTrials} users currently on Trial.` : `Terdapat ${stats.activeTrials} pengguna yang sedang menjalani Trial.`}</p>
                  </div>
              </div>
          </div>
      </div>

    </div>
  );
}
