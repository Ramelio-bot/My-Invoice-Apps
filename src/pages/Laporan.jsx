import { useState } from 'react';

import { useTheme } from '../context/ThemeContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatIDR } from '../utils/currency';
import { isThisMonth } from '../utils/date';

export default function Laporan() {
    const { dark } = useTheme();
    const [cashbook] = useLocalStorage('cashbook_data', []);
    const [invoices] = useLocalStorage('invoice_data', []);

    const now = new Date();
    const [selMonth, setSelMonth] = useState(now.getMonth());
    const [selYear, setSelYear] = useState(now.getFullYear());

    const monthEntries = cashbook.filter(e => {
        const d = new Date(e.date + 'T00:00:00');
        return d.getMonth() === selMonth && d.getFullYear() === selYear;
    });

    const totalIncome = monthEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const totalExpense = monthEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const netProfit = totalIncome - totalExpense;
    const txCount = monthEntries.length;

    // Group by category
    const incomeByCategory = {};
    const expenseByCategory = {};
    monthEntries.forEach(e => {
        if (e.type === 'income') {
            incomeByCategory[e.category] = (incomeByCategory[e.category] || 0) + e.amount;
        } else {
            expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
        }
    });

    // Invoice status summary
    const allInvoices = invoices || [];
    const invUnpaid = allInvoices.filter(i => i.status === 'unpaid').length;
    const invPaid = allInvoices.filter(i => i.status === 'paid').length;
    const invWaiting = allInvoices.filter(i => i.status === 'waiting').length;

    const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>Laporan</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    <select className="select" style={{ width: 120 }} value={selMonth} onChange={e => setSelMonth(parseInt(e.target.value))}>
                        {MONTHS_ID.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                    <select className="select" style={{ width: 90 }} value={selYear} onChange={e => setSelYear(parseInt(e.target.value))}>
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Report content */}
            <div>
                {/* Metric cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                    {[
                        { label: 'Pemasukan', value: formatIDR(totalIncome), color: '#10B981', bg: '#ECFDF5' },
                        { label: 'Pengeluaran', value: formatIDR(totalExpense), color: '#EF4444', bg: '#FEF2F2' },
                        { label: 'Laba Bersih', value: formatIDR(netProfit), color: '#7C3AED', bg: '#EDE9FE' },
                        { label: 'Jumlah Transaksi', value: txCount, color: '#F59E0B', bg: '#FEF3C7' },
                    ].map(card => (
                        <div key={card.label} className="card" style={{ animation: 'none', borderTop: `3px solid ${card.color}`, background: card.bg }}>
                            <p style={{ margin: '0 0 6px', fontSize: 12, color: '#64748B', fontWeight: 600 }}>{card.label}</p>
                            <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: card.color }}>{card.value}</p>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                    {/* Income by category */}
                    <div className="card" style={{ animation: 'none' }}>
                        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>Pemasukan per Kategori</h3>
                        {Object.entries(incomeByCategory).length === 0 ? (
                            <p style={{ color: '#94A3B8', fontSize: 13 }}>Tidak ada data pemasukan bulan ini</p>
                        ) : (
                            Object.entries(incomeByCategory)
                                .sort(([, a], [, b]) => b - a)
                                .map(([cat, val]) => (
                                    <div key={cat} style={{ marginBottom: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{cat}</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>{formatIDR(val)}</span>
                                        </div>
                                        <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3 }}>
                                            <div style={{ height: '100%', width: `${totalIncome > 0 ? (val / totalIncome) * 100 : 0}%`, background: '#10B981', borderRadius: 3, transition: 'width 600ms' }} />
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>

                    {/* Expense by category */}
                    <div className="card" style={{ animation: 'none' }}>
                        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>Pengeluaran per Kategori</h3>
                        {Object.entries(expenseByCategory).length === 0 ? (
                            <p style={{ color: '#94A3B8', fontSize: 13 }}>Tidak ada data pengeluaran bulan ini</p>
                        ) : (
                            Object.entries(expenseByCategory)
                                .sort(([, a], [, b]) => b - a)
                                .map(([cat, val]) => (
                                    <div key={cat} style={{ marginBottom: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{cat}</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>{formatIDR(val)}</span>
                                        </div>
                                        <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3 }}>
                                            <div style={{ height: '100%', width: `${totalExpense > 0 ? (val / totalExpense) * 100 : 0}%`, background: '#EF4444', borderRadius: 3, transition: 'width 600ms' }} />
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>

                {/* Invoice Status Summary */}
                <div className="card" style={{ animation: 'none' }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>Ringkasan Status Invoice</h3>
                    <div style={{ display: 'flex', gap: 20 }}>
                        {[
                            { label: 'Belum Bayar', val: invUnpaid, color: '#EF4444' },
                            { label: 'Lunas', val: invPaid, color: '#10B981' },
                            { label: 'Menunggu', val: invWaiting, color: '#F59E0B' },
                            { label: 'Total', val: allInvoices.length, color: '#7C3AED' },
                        ].map(s => (
                            <div key={s.label} style={{ textAlign: 'center', padding: '12px 20px', borderRadius: 10, background: dark ? '#0F172A' : '#F8FAFC' }}>
                                <p style={{ margin: '0 0 4px', fontSize: 11, color: '#64748B', fontWeight: 600 }}>{s.label}</p>
                                <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: s.color }}>{s.val}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


        </div>
    );
}
