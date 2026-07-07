import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AdminSimulation() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [isStressing, setIsStressing] = useState(false);
  const [isMegaStressing, setIsMegaStressing] = useState(false);
  
  // Stats
  const [totalHits, setTotalHits] = useState(0);
  const [successHits, setSuccessHits] = useState(0);
  const [blockedHits, setBlockedHits] = useState(0);

  const handleRunSimulation = async () => {
    if (!user) return;
    setIsSimulating(true);
    try {
      const { error } = await supabase.rpc('fn_execute_business_simulation');
      if (error) throw error;
      showToast('Simulasi Bisnis E2E Berhasil Di-deploy!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menjalankan simulasi: ' + err.message, 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleStressTest = async () => {
    if (!user) return;
    setIsStressing(true);
    setTotalHits(100);
    setSuccessHits(0);
    setBlockedHits(0);
    
    // Simulate concurrent hits
    const promises = [];
    const HITS = 100;
    
    // Create random mock transaction payload
    const mockPayload = () => ({
      p_user_id: user.id,
      p_outlet_id: '00000000-0000-0000-0000-000000000000', // Mock or placeholder outlet UUID
      p_customer_name: 'Stress Test Customer',
      p_subtotal: 10000,
      p_discount_amount: 0,
      p_tax_amount: 0,
      p_total: 10000,
      p_payment_method: 'CASH',
      p_amount_paid: 10000,
      p_change_amount: 0,
      p_notes: 'Stress Test Transaction',
      p_items: [] // Empty items to avoid foreign key failures if products don't exist
    });

    let successCount = 0;
    let blockedCount = 0;

    try {
      const BATCH_SIZE = 10;
      for (let i = 0; i < HITS; i += BATCH_SIZE) {
        const batchPromises = [];
        for (let j = 0; j < BATCH_SIZE && i + j < HITS; j++) {
          batchPromises.push(
            supabase.rpc('process_sale', mockPayload())
              .then(({ error }) => {
                if (error) {
                  blockedCount++;
                  setBlockedHits(blockedCount);
                } else {
                  successCount++;
                  setSuccessHits(successCount);
                }
              })
              .catch(() => {
                blockedCount++;
                setBlockedHits(blockedCount);
              })
          );
        }
        await Promise.all(batchPromises);
      }
      showToast('Stress Test Selesai!', 'success');
    } catch (err) {
      console.error(err);
    } finally {
      setIsStressing(false);
    }
  };

  const handleExecuteMegaStressTest = async () => {
    if (!user) return;
    setIsMegaStressing(true);
    showToast("Menyiapkan struktur beban data paralel untuk 3 toko...", "info");
    
    const targetOutlets = ['Outlet-A', 'Outlet-B', 'Outlet-C'];
    const baseAmount = 50000; // Dikunci Rp 50.000 per data untuk pembuktian penjumlahan sempurna
    const batchSize = 1000;
    const promises = [];

    // 1. Memicu Injeksi Fitur Kasir & Transaksi Utama (1000 Transaksi Paralel dalam 1 Menit)
    for (let i = 0; i < batchSize; i++) {
      const currentOutlet = targetOutlets[i % 3]; // Distribusi merata di 3 toko terpisah
      const transactionPayload = {
        user_id: user.id,
        outlet_name: currentOutlet,
        amount: baseAmount,
        is_simulated: true,
        created_at: new Date(Date.now() - Math.random() * 60000).toISOString() // Tersebar acak dalam rentang 1 menit terakhir
      };
      promises.push(supabase.from('kasir_transactions').insert([transactionPayload]));
    }

    // 2. Mengisi Fitur Multi-Modul (Masing-masing 20 Baris Data untuk Menjamin Batang Batas 10-30 Per Fitur)
    const modulesToFill = [
      'cashbook',          // Catatan Bisnis
      'documents',         // Invoice, Kwitansi, Tanda Terima, Penawaran, PO
      'debts_receivables'  // Hutang & Piutang
    ];

    modulesToFill.forEach((table) => {
      for (let j = 0; j < 20; j++) {
        promises.push(
          supabase.from(table).insert([{
            user_id: user.id,
            type: table === 'cashbook' ? 'income' : 'simulated_entry',
            amount: baseAmount,
            is_simulated: true,
            notes: `Data Uji Beban Fitur ${table} - Indeks #${j}`
          }])
        );
      }
    });

    try {
      showToast(`Mengeksekusi ${promises.length} kueri simultan ke serverless pipeline...`, "info");
      const startTime = performance.now();
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);
      
      showToast(`Mega-Stress Test Sukses! 1000+ Data Masuk Dalam ${durationSeconds} Detik.`, "success");
      showToast(`Ekspektasi Penjumlahan Sempurna Kasir: Rp ${(batchSize * baseAmount).toLocaleString('id-ID')}`, "success");
    } catch (err) {
      console.error(err);
      showToast("Saluran kueri kelebihan beban atau terputus: " + err.message, "error");
    } finally {
      setIsMegaStressing(false);
    }
  };

  // Handler pembersihan agar database live kembali steril setelah pengujian selesai
  const handlePurgeTestData = async () => {
    if (!user) return;
    showToast("Membersihkan seluruh sisa data uji simulasi...", "info");
    
    await Promise.all([
      supabase.from('kasir_transactions').delete().eq('user_id', user.id).eq('is_simulated', true),
      supabase.from('cashbook').delete().eq('user_id', user.id).eq('is_simulated', true),
      supabase.from('documents').delete().eq('user_id', user.id).eq('is_simulated', true),
      supabase.from('debts_receivables').delete().eq('user_id', user.id).eq('is_simulated', true)
    ]);
    
    showToast("Database kembali suci dan steril dari data uji beban!", "success");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Simulator E2E & Stress Test</h1>
        <p className="text-zinc-500 mt-2 font-medium">Control Panel khusus untuk memuat simulasi data multi-cabang dan uji beban database (Concurrency Test).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: E2E Simulation */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 text-xl">
              🏢
            </div>
            <h2 className="text-lg font-bold text-zinc-900 mb-2">Simulasi Multi-Cabang E2E</h2>
            <p className="text-sm text-zinc-600 mb-6">
              Mengosongkan data transaksi Anda dan menyuntikkan data master simulasi lengkap: 2 Outlet (Kabel & Material), Produk, Klien, PO, Invoice, dan Piutang secara instan.
            </p>
          </div>
          <button 
            onClick={handleRunSimulation} 
            disabled={isSimulating || isStressing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {isSimulating ? 'Memproses Simulasi...' : 'Jalankan Simulasi Multi-Cabang'}
          </button>
        </div>

        {/* Card 2: Concurrency Stress Tester */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4 text-xl">
              ⚡
            </div>
            <h2 className="text-lg font-bold text-zinc-900 mb-2">Concurrency Stress Tester</h2>
            <p className="text-sm text-zinc-600 mb-6">
              Menembakkan 100 request transaksi kasir (process_sale) secara paralel dalam waktu bersamaan untuk menguji pertahanan limitasi server dan idempotensi.
            </p>
            
            {/* Live Stats */}
            <div className="bg-zinc-900 rounded-xl p-4 mb-6 font-mono text-xs">
              <div className="text-zinc-400 mb-1">LIVE STATS SUMMARY</div>
              <div className="text-white flex justify-between border-b border-zinc-800 pb-2 mb-2">
                <span>Total Hits:</span>
                <span className="text-blue-400 font-bold">{totalHits}</span>
              </div>
              <div className="text-white flex justify-between border-b border-zinc-800 pb-2 mb-2">
                <span>Success Transactions:</span>
                <span className="text-green-400 font-bold">{successHits}</span>
              </div>
              <div className="text-white flex justify-between">
                <span>Blocked by Limits / Errors:</span>
                <span className="text-red-400 font-bold">{blockedHits}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleStressTest} 
            disabled={isSimulating || isStressing}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {isStressing ? 'Menembakkan API...' : 'Jalankan Concurrency Stress Test'}
          </button>
        </div>

      </div>

      {/* Card 3: Mega-Stress Test Simulator (V3) */}
      <div className="bg-white border border-indigo-200 rounded-2xl p-6 shadow-sm mt-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
              🚀
            </div>
            <h3 className="text-xl font-bold text-gray-800">Mega-Stress Test Simulator (V3)</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Memicu beban tinggi: 1.000 transaksi dalam 60 detik di 3 toko terpisah secara paralel. 
            Mengisi fitur Catatan Bisnis, Kasir, Invoice, Kwitansi, Tanda Terima, Penawaran, PO, serta Hutang & Piutang dengan 10-30 data tiruan.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleExecuteMegaStressTest}
            disabled={isSimulating || isStressing || isMegaStressing}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition disabled:opacity-50"
          >
            {isMegaStressing ? 'Menembakkan 1000 TX...' : '⚡ Jalankan 1.000 TX / Menit'}
          </button>
          <button 
            onClick={handlePurgeTestData}
            disabled={isMegaStressing}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-4 rounded-xl transition disabled:opacity-50"
          >
            🧹 Bersihkan Data Simulasi
          </button>
        </div>
      </div>
    </div>
  );
}
