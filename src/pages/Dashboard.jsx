import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, DollarSign, FileText, Plus, BarChart2,
    ArrowRight, HandCoins, Users, ShoppingCart, AlertCircle,
    CheckCircle2, Sparkles, ChevronDown, ChevronUp, X, Building, Package,
    Copy, Check, Share2, Gift
} from 'lucide-react';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';

import { formatIDR, formatCompactCurrency } from '../utils/currency';
import { formatDateID, getLast6Months, normalizeDateYMD, todayStr } from '../utils/date';
import { isMirrorCashbookRow, isPaidStatus, isUnpaidStatus } from '../utils/accounting';
import { useLang } from '../context/LanguageContext';

import { useAuth } from '../context/AuthContext';
import { useOutlet } from '../context/OutletContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { usePlan } from '../context/PlanContext';

export default function Dashboard() {
    const navigate = useNavigate();
    const { t, lang, setLang } = useLang();
    const {
        user, profile, loading,
    } = useAuth();
    const { showToast } = useToast() || {};
    const { activeOutlet } = useOutlet() || {};
    const { 
        getInvoiceCount, getKasirTransactionCount, getClientCount, 
        getHutangPiutangCount, getProductCount,
        currentLimits, isUltimate, 
    } = usePlan();

    const [copiedRef, setCopiedRef] = useState(false);
    const referralCode = profile?.referral_code || user?.id?.slice(0, 8).toUpperCase() || 'INVITE';
    const referralUrl = `https://myinvoice.space/register?ref=${referralCode}`;

    const handleCopyReferral = () => {
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(referralUrl);
            setCopiedRef(true);
            if (showToast) showToast('Link referral berhasil disalin ke clipboard!', 'success');
            setTimeout(() => setCopiedRef(false), 2500);
        }
    };

    const handleShareWhatsAppReferral = () => {
        const text = `Halo! Saya pakai MyInvoice untuk buat invoice otomatis, kwitansi resmi, dan aplikasi kasir gratis tanpa ribet. Cocok banget untuk bisnis dan operasional toko.\n\nCoba gratis di sini: ${referralUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

//     const isFree = effectivePlan === 'free';

    const [cashbook, setCashbook] = useState([]); // Removed useLocalStorage
    const [invoices, setInvoices] = useState([]); // Removed useLocalStorage
    const [piutang, setPiutang] = useState([]);
    const [hutang, setHutang] = useState([]);
    const [freshUnpaidInvoices, setFreshUnpaidInvoices] = useState([]); // Fresh from DB for card sync

    // Supabase state
    const [kasirData, setKasirData] = useState([]);
    const [kasirExpenses, setKasirExpenses] = useState([]);
    const [kasirToday, setKasirToday] = useState({ sales: 0, count: 0 });
    const [, setRecentNotes] = useState([]); // Shift notes and cashbook notes
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);
    const [posIncome, setPosIncome] = useState(0);
    const [invoiceIncome, setInvoiceIncome] = useState(0);
    const [cbVolume, setCbVolume] = useState(0);
    const [txCounts, setTxCounts] = useState({ income: 0, expense: 0 });
    const [shifts, setShifts] = useState([]);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    // Kunci bahasa dashboard ke Bahasa Indonesia
    useEffect(() => {
        if (lang !== 'ID') {
            if (setLang) setLang('ID');
            try {
                localStorage.setItem('lang', 'ID');
            } catch (err) { void err; }
        }
    }, [lang, setLang]);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login', { replace: true });
        } else if (user) {
            fetchDashboardData(true);
        }

        let debounceTimer;
        let lastSyncTime = 0;
        const handleSync = () => {
            if (!user) return;
            const now = Date.now();
            // Cegah query berulang dalam 5 detik saat switch window/tab
            if (now - lastSyncTime < 5000) return;
            lastSyncTime = now;

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchDashboardData(false);
            }, 300);
        };

        window.addEventListener('data-updated', handleSync);
        window.addEventListener('external-sync', handleSync);
        window.addEventListener('cashbook-updated', handleSync);
        window.addEventListener('invoice-updated', handleSync);
        window.addEventListener('kasir-updated', handleSync);
        window.addEventListener('piutang-updated', handleSync);
        window.addEventListener('hutang-updated', handleSync);
        window.addEventListener('focus', handleSync);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') handleSync();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('data-updated', handleSync);
            window.removeEventListener('external-sync', handleSync);
            window.removeEventListener('cashbook-updated', handleSync);
            window.removeEventListener('invoice-updated', handleSync);
            window.removeEventListener('kasir-updated', handleSync);
            window.removeEventListener('piutang-updated', handleSync);
            window.removeEventListener('hutang-updated', handleSync);
            window.removeEventListener('focus', handleSync);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearTimeout(debounceTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, loading, navigate, activeOutlet?.id]);

    const fetchDashboardData = async (isInitial = false) => {
        if (!user) return;
        // Hanya tampilkan skeleton pada initial load pertama kali agar UI tidak berkedip (zero flicker)
        if (isInitial && !hasLoadedOnce) {
            setIsFetching(true);
        }

        let docData = [];
        const outletId = activeOutlet?.id || null;
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const currentMonthStr = `${year}-${month}`;

        const sixMonthsStart = new Date(year, now.getMonth() - 5, 1, 0, 0, 0, 0);
        const sixMonthsStartIso = sixMonthsStart.toISOString();
        const sixMonthsStartYMD = `${sixMonthsStart.getFullYear()}-${String(sixMonthsStart.getMonth() + 1).padStart(2, '0')}-01`;

        try {
            // 1. Prepare Queries (6-month window for chart + current month deduplicated)
            let cbAllQuery = supabase.from('cashbook')
                .select('id, type, amount, date, category, description, outlet_id, created_at, receipt_url, document_id, reference_type, reference_id, is_automated')
                .eq('user_id', user.id)
                .gte('date', sixMonthsStartYMD)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(2000);
            if (outletId) cbAllQuery = cbAllQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let docAllQuery = supabase.from('documents')
                .select('id, type, doc_number, client_name, total_amount, status, created_at, data, outlet_id')
                .eq('user_id', user.id)
                .in('type', ['invoice', 'inv', 'piutang', 'hutang'])
                .order('created_at', { ascending: false })
                .limit(500);
            if (outletId) docAllQuery = docAllQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let shiftQuery = supabase.from('kasir_shifts')
                .select('id, employee_name, ended_at, shift_notes, actual_cash, shift_number')
                .eq('user_id', user.id)
                .order('ended_at', { ascending: false }).limit(5);
            if (outletId) shiftQuery = shiftQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let txAllQuery = supabase.from('kasir_transactions')
                .select('id, total, created_at, receipt_number, outlet_id')
                .eq('user_id', user.id)
                .eq('status', 'paid')
                .gte('created_at', sixMonthsStartIso)
                .order('created_at', { ascending: false });
            if (outletId) txAllQuery = txAllQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let expMonthQuery = supabase.from('kasir_expenses')
                .select('amount, date, created_at, category, description')
                .eq('user_id', user.id)
                .gte('date', `${currentMonthStr}-01`)
                .order('date', { ascending: false });
            if (outletId) expMonthQuery = expMonthQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let cbMonthQuery = supabase.from('cashbook')
                .select('id, type, amount, date, category, description, outlet_id, created_at, receipt_url, document_id, reference_type, reference_id, is_automated')
                .eq('user_id', user.id)
                .gte('date', `${currentMonthStr}-01`)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });
            if (outletId) cbMonthQuery = cbMonthQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let expAllQuery = supabase.from('kasir_expenses')
                .select('id, amount, date, created_at, category, description, outlet_id')
                .eq('user_id', user.id)
                .gte('date', sixMonthsStartYMD)
                .order('date', { ascending: false });
            if (outletId) expAllQuery = expAllQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            // 2. Parallel Burst Fetch
            const [
                { data: allCb },
                { data: rawDocs },
                { data: shiftsData },
                { data: allKasirTx },
                { data: monthExps },
                { data: monthCb },
                { data: allKExps }
            ] = await Promise.all([
                cbAllQuery, docAllQuery, shiftQuery, txAllQuery, expMonthQuery, cbMonthQuery, expAllQuery
            ]);

            docData = rawDocs || [];

            // 3. Process States with Bulletproof Month Deduplication
            const cbMap = new Map();
            (allCb || []).forEach(item => cbMap.set(item.id, item));
            (monthCb || []).forEach(item => cbMap.set(item.id, item));
            const mergedCb = Array.from(cbMap.values());

            setCashbook(mergedCb);
            if (shiftsData) setShifts(shiftsData);
            if (allKExps) setKasirExpenses(allKExps);
            if (allKasirTx) setKasirData(allKasirTx);

            // 4. Detailed Calculations (Invoices only — never auto-kwitansi)
            const combinedInvoices = docData.filter(d => ['invoice', 'inv'].includes(d.type)).map(d => ({
                ...(d.data || {}),
                id: d.id,
                type: d.type,
                number: d.doc_number || d.data?.doc_number || (d.data || {}).number,
                clientName: d.client_name || d.data?.client_name || d.data?.clientName,
                grandTotal: Number(d.total_amount ?? d.data?.grandTotal ?? d.data?.amount ?? 0),
                status: d.status,
                date: normalizeDateYMD(d.data?.date, d.created_at)
            }));
            setInvoices(combinedInvoices);

            const unpaidInvoices = combinedInvoices.filter(i => isUnpaidStatus(i.status));
            setFreshUnpaidInvoices(unpaidInvoices);

            const piutangList = docData.filter(d => d.type === 'piutang').map(d => ({
                ...(d.data || {}),
                id: d.id,
                name: d.client_name || d.data?.client_name || d.data?.name,
                amount: Number(d.total_amount ?? d.data?.grandTotal ?? d.data?.amount ?? 0),
                status: d.status || d.data?.status || 'unpaid',
                dueDate: d.data?.dueDate || d.data?.due_date || (d.data || {}).dueDate || (d.data || {}).due_date || '',
                date: normalizeDateYMD(d.data?.date, d.created_at)
            }));
            setPiutang(piutangList);

            const hutangList = docData.filter(d => d.type === 'hutang').map(d => ({
                ...(d.data || {}),
                id: d.id,
                name: d.client_name || d.data?.client_name || d.data?.name,
                amount: Number(d.total_amount ?? d.data?.grandTotal ?? d.data?.amount ?? 0),
                status: d.status || d.data?.status || 'unpaid',
                dueDate: d.data?.dueDate || d.data?.due_date || (d.data || {}).dueDate || (d.data || {}).due_date || '',
                date: normalizeDateYMD(d.data?.date, d.created_at)
            }));
            setHutang(hutangList);

            // 5. UNIFIED 4-SOURCE ACCOUNTING ENGINE (100% Parity with Laporan.jsx)
            const unifiedEntries = [
                // 1. POS Sales (paid)
                ...(allKasirTx || []).map(tx => ({
                    date: normalizeDateYMD(null, tx.created_at),
                    type: 'income',
                    amount: Number(tx.total || 0),
                    category: t('laporan_pos_category')
                })),
                // 2. Paid Invoices (invoice / inv only)
                ...combinedInvoices.filter(inv => isPaidStatus(inv.status)).map(inv => ({
                    date: inv.date,
                    type: 'income',
                    amount: Number(inv.grandTotal || 0),
                    category: t('laporan_inv_category')
                })),
                // 3. POS Expenses
                ...(allKExps || []).map(ex => ({
                    date: normalizeDateYMD(ex.date, ex.created_at),
                    type: 'expense',
                    amount: Number(ex.amount || 0),
                    category: ex.category || 'Pengeluaran Kasir'
                })),
                // 4. Direct Cashbook (Business Notes + Standalone Kwitansi + Settled Hutang/Piutang)
                ...mergedCb.filter(c => !isMirrorCashbookRow(c)).map(c => ({
                    date: normalizeDateYMD(c.date, c.created_at),
                    type: c.type,
                    amount: Number(c.amount || 0),
                    category: c.category || (c.type === 'income' ? t('laporan_income') : t('laporan_expense'))
                }))
            ];

            // 6. Monthly Totals & Receivable KPI
            const monthEntries = unifiedEntries.filter(e => e.date && e.date.startsWith(currentMonthStr));
            const monthIncomeEntries = monthEntries.filter(e => e.type === 'income');
            const monthExpenseEntries = monthEntries.filter(e => e.type === 'expense');

            const totalMonthlyIncomeValue = monthIncomeEntries.reduce((s, e) => s + e.amount, 0);
            const totalMonthlyExpenseValue = monthExpenseEntries.reduce((s, e) => s + e.amount, 0);

            const docPiutangValue = piutangList.filter(d => isUnpaidStatus(d.status)).reduce((s, d) => s + (Number(d.amount) || 0), 0);
            const unpaidInvoicesTotalValue = (unpaidInvoices || []).reduce((s, i) => s + (Number(i.grandTotal) || 0), 0);
            const totalReceivables = docPiutangValue + unpaidInvoicesTotalValue;

            setTotalIncome(totalMonthlyIncomeValue);
            setTotalExpense(totalMonthlyExpenseValue);
            setTotalProfit(totalMonthlyIncomeValue - totalMonthlyExpenseValue);
            setTxCounts({ income: monthIncomeEntries.length, expense: monthExpenseEntries.length });
            setPosIncome((allKasirTx || []).filter(trx => normalizeDateYMD(null, trx.created_at).startsWith(currentMonthStr)).reduce((s, trx) => s + Number(trx.total || 0), 0));
            setInvoiceIncome(combinedInvoices.filter(i => isPaidStatus(i.status) && i.date && i.date.startsWith(currentMonthStr)).reduce((s, i) => s + Number(i.grandTotal || 0), 0));
            setCbVolume(totalReceivables); 

            // 7. Today POS Activity (Local Timezone Accurate)
            const todayISO = todayStr();
            const todayTxs = (allKasirTx || []).filter(trx => normalizeDateYMD(null, trx.created_at) === todayISO);
            setKasirToday({
                sales: todayTxs.reduce((s, trx) => s + Number(trx.total || 0), 0),
                count: todayTxs.length
            });

            // Update Recent Notes UI (Show most recent from month, not just today)
            const combinedNotes = [
                // 1. Shift Notes
                ...(shiftsData || []).filter(s => s.shift_notes).map(s => ({
                    text: s.shift_notes,
                    source: `Shift: ${s.employee_name}`,
                    date: s.ended_at,
                    type: 'shift'
                })),
                // 2. Manual Cashbook
                ...(monthCb || []).filter(c => c.description).map(c => ({
                    text: c.description,
                    source: c.category || (c.type === 'income' ? t('dash_income') : t('dash_expense')),
                    date: c.date || c.created_at,
                    type: 'cashbook'
                })),
                // 3. POS Expenses (Previously Missing)
                ...(monthExps || []).filter(e => e.description).map(e => ({
                    text: e.description,
                    source: e.category || t('dash_expense'),
                    date: e.date || e.created_at,
                    type: 'pos_expense'
                }))
            ].sort((a, b) => new Date(b.date || b.ended_at) - new Date(a.date || a.ended_at));
            
            // Limit to most recent 5 for processing, UI will slice again
            setRecentNotes(combinedNotes.slice(0, 5));

        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setIsFetching(false);
            setHasLoadedOnce(true);
        }
    };

    const monthlyIncomeValue = totalIncome;
    const monthlyExpenseValue = totalExpense;
    const netProfitValue = totalProfit;

    // FIX VARIABEL HANTU UNTUK UI 
    const posSalesIncome = posIncome || 0;
    const invoicesIncome = invoiceIncome || 0;

    const unpaidInvoices = freshUnpaidInvoices;
    const unpaidPiutangList = (piutang || []).filter(p => isUnpaidStatus(p.status));
    const unpaidPiutangCount = unpaidPiutangList.length;
    const totalUnpaidReceivableCount = unpaidInvoices.length + unpaidPiutangCount;

    const unpaidHutangList = (hutang || []).filter(h => isUnpaidStatus(h.status));
    const totalHutangValue = unpaidHutangList.reduce((s, h) => s + (Number(h.amount) || 0), 0);
    const unpaidHutangCount = unpaidHutangList.length;

    // Smart Due Date Alert Engine
    const parseDueDate = (val) => {
        if (!val) return null;
        const str = String(val).trim();
        const d = new Date(str.includes('T') ? str : `${str}T00:00:00`);
        return Number.isNaN(d.getTime()) ? null : d;
    };

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    const overdueHutang = unpaidHutangList.filter(h => {
        const due = parseDueDate(h.dueDate);
        return due && due < now;
    });
    const dueSoonHutang = unpaidHutangList.filter(h => {
        const due = parseDueDate(h.dueDate);
        return due && due >= now && due <= threeDaysFromNow;
    });

    const overduePiutang = unpaidPiutangList.filter(p => {
        const due = parseDueDate(p.dueDate);
        return due && due < now;
    });
    const dueSoonPiutang = unpaidPiutangList.filter(p => {
        const due = parseDueDate(p.dueDate);
        return due && due >= now && due <= threeDaysFromNow;
    });

    const overdueDebtsCount = overdueHutang.length + overduePiutang.length;
    const dueSoonDebtsCount = dueSoonHutang.length + dueSoonPiutang.length;
    const hasDueAlert = overdueDebtsCount > 0 || dueSoonDebtsCount > 0;

    // Recent activity: last 10 items from direct cashbook + invoices + POS merged & sorted
    const allActivity = [
        ...(cashbook || []).filter(e => !isMirrorCashbookRow(e)).map(e => ({
            id: e.id,
            label: e.category,
            sub: e.description && e.description.length > 30 ? e.description.substring(0, 30) + '...' : e.description || e.notes,
            amount: e.amount,
            type: e.type,
            date: normalizeDateYMD(e.date, e.created_at),
            kind: 'cashbook',
        })),
        ...(invoices || []).map(inv => ({
            id: inv.id,
            label: `Invoice ${inv.number}`,
            sub: inv.clientName,
            amount: inv.grandTotal,
            type: 'invoice',
            date: inv.date,
            kind: 'invoice',
            status: inv.status,
        })),
        ...(kasirData || []).map(tx => ({
            id: tx.id,
            label: `${t('nav_kasir')}: ${tx.receipt_number}`,
            sub: t('dash_pos_sale'),
            amount: tx.total,
            type: 'income',
            date: normalizeDateYMD(null, tx.created_at),
            kind: 'kasir',
        })),
        ...(kasirExpenses || []).map(ex => ({
            id: ex.id,
            label: ex.category || t('nav_kasir_expenses'),
            sub: ex.description,
            amount: ex.amount,
            type: 'expense',
            date: normalizeDateYMD(ex.date, ex.created_at),
            kind: 'kasir_expense',
        }))
    ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

    // Bar chart data: last 6 months realized income vs expense (100% consistent with KPIs)
    const months = getLast6Months(lang);

    const getDocumentMonthInc = (m, y) => {
        const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
        return invoices
            .filter(inv => isPaidStatus(inv.status) && inv.date && inv.date.startsWith(monthStr))
            .reduce((s, i) => s + Number(i.grandTotal || 0), 0);
    };

    const getKasirMonthInc = (m, y) => {
        const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
        return kasirData
            .filter(trx => normalizeDateYMD(null, trx.created_at).startsWith(monthStr))
            .reduce((s, trx) => s + Number(trx.total || 0), 0);
    };

    const getKasirMonthExp = (m, y) => {
        const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
        return kasirExpenses
            .filter(e => normalizeDateYMD(e.date, e.created_at).startsWith(monthStr))
            .reduce((s, e) => s + Number(e.amount || 0), 0);
    };

    const getCashbookMonthSum = (type, m, y) => {
        const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
        return cashbook
            .filter(e => e.type === type && !isMirrorCashbookRow(e) && normalizeDateYMD(e.date, e.created_at).startsWith(monthStr))
            .reduce((s, e) => s + Number(e.amount || 0), 0);
    };

    const chartMax = Math.max(
        ...months.map(m => {
            const incManual = getCashbookMonthSum('income', m.month, m.year);
            const incDoc = getDocumentMonthInc(m.month, m.year);
            const incKasir = getKasirMonthInc(m.month, m.year);
            const totalInc = incManual + incDoc + incKasir;
            
            const expManual = getCashbookMonthSum('expense', m.month, m.year);
            const expKasir = getKasirMonthExp(m.month, m.year);
            const totalExp = expManual + expKasir;
            
            return Math.max(totalInc, totalExp);
        }), 1
    );

    const chartData = months.map(m => {
        const incManual = getCashbookMonthSum('income', m.month, m.year);
        const incDoc = getDocumentMonthInc(m.month, m.year);
        const incKasir = getKasirMonthInc(m.month, m.year);
        const totalInc = incManual + incDoc + incKasir;

        const expManual = getCashbookMonthSum('expense', m.month, m.year);
        const expKasir = getKasirMonthExp(m.month, m.year);
        const totalExp = expManual + expKasir;

        return {
            ...m,
            incInv: incManual + incDoc,
            incKasir,
            totalInc,
            exp: totalExp,
            incInvPct: ((incManual + incDoc) / chartMax) * 100,
            incKasirPct: (incKasir / chartMax) * 100,
            expPct: (totalExp / chartMax) * 100
        };
    });

    // --- ONBOARDING CHECKLIST LOGIC ---
    const [isChecklistDismissed, setIsChecklistDismissed] = useState(() => {
        try {
            return localStorage.getItem('myinvoice_hide_onboarding_checklist') === 'true';
        } catch {
            return false;
        }
    });
    const [isChecklistCollapsed, setIsChecklistCollapsed] = useState(() => {
        try {
            return localStorage.getItem('myinvoice_collapse_onboarding_checklist') === 'true';
        } catch {
            return false;
        }
    });

    const hasStoredLogo = Boolean(
        typeof window !== 'undefined' && 
        (localStorage.getItem('company_logo') || localStorage.getItem('company_profile'))
    );
    const hasProfileConfigured = Boolean(
        profile?.company_name || profile?.logo_url || hasStoredLogo
    );
    const productCountVal = (typeof getProductCount === 'function' ? getProductCount() : 0) || 0;
    const hasProducts = productCountVal > 0;
    const invoiceCountVal = (typeof getInvoiceCount === 'function' ? getInvoiceCount() : 0) || 0;
    const kasirTxCountVal = (typeof getKasirTransactionCount === 'function' ? getKasirTransactionCount() : 0) || 0;
    const hasTransactions = invoiceCountVal > 0 || kasirTxCountVal > 0 || (invoices && invoices.length > 0) || (kasirData && kasirData.length > 0);

    const onboardingSteps = [
        {
            id: 'account',
            title: 'Akun Bisnis Aktif',
            desc: 'Akun cloud Anda berhasil didaftarkan dan terhubung dengan aman.',
            done: true,
            actionLabel: 'Selesai',
            onAction: null,
            icon: Users
        },
        {
            id: 'profile',
            title: 'Lengkapi Profil & Logo Usaha',
            desc: 'Pasang nama usaha dan logo agar faktur tagihan dan struk terlihat profesional.',
            done: hasProfileConfigured,
            actionLabel: 'Atur Profil',
            onAction: () => navigate('/profile'),
            icon: Building
        },
        {
            id: 'product',
            title: 'Tambahkan 1 Produk / Menu Kasir',
            desc: 'Masukkan item barang atau jasa untuk mempercepat input invoice dan transaksi kasir.',
            done: hasProducts,
            actionLabel: 'Tambah Produk',
            onAction: () => navigate('/kasir/produk'),
            icon: Package
        },
        {
            id: 'transaction',
            title: 'Buat Transaksi atau Invoice Pertama',
            desc: 'Coba terbitkan invoice resmi atau catat transaksi pertama di kasir POS.',
            done: hasTransactions,
            actionLabel: 'Mulai Transaksi',
            onAction: () => navigate('/invoice'),
            icon: FileText
        }
    ];

    const completedStepsCount = onboardingSteps.filter(s => s.done).length;
    const onboardingProgress = Math.round((completedStepsCount / onboardingSteps.length) * 100);
    const isAllOnboardingDone = completedStepsCount === onboardingSteps.length;

    const handleDismissChecklist = () => {
        try {
            localStorage.setItem('myinvoice_hide_onboarding_checklist', 'true');
        } catch { void 0; }
        setIsChecklistDismissed(true);
    };

    const handleToggleCollapse = () => {
        const next = !isChecklistCollapsed;
        try {
            localStorage.setItem('myinvoice_collapse_onboarding_checklist', String(next));
        } catch { void 0; }
        setIsChecklistCollapsed(next);
    };

    if (loading || (!hasLoadedOnce && isFetching)) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="page-enter" style={{ padding: '24px 16px', maxWidth: 1200, margin: '0 auto', paddingBottom: 'calc(env(safe-area-inset-bottom, 1rem) + 1.5rem)' }}>
            {/* Menara Pengawas Styles */}
            <style>{`
                @keyframes pulse-red-soft {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    50% { transform: scale(1.01); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                .pulse-alert {
                    animation: pulse-red-soft 2s infinite;
                    border: 1.5px solid #EF4444 !important;
                }
            `}</style>

            {/* Header with Sleek Modern Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-200/80">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                            {t('nav_home')}
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                            {t('period_month')}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        {t('dash_welcome')}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        onClick={() => navigate('/catatan-bisnis')}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <Plus size={14} className="text-slate-500" />
                        <span>{t('dash_quick_income') || 'Catat Kas'}</span>
                    </button>
                    <button
                        onClick={() => navigate('/invoice')}
                        className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <FileText size={14} />
                        <span>{t('dash_quick_invoice') || '+ Buat Invoice'}</span>
                    </button>
                </div>
            </div>

            {/* ONBOARDING SETUP CHECKLIST WIDGET */}
            {!isChecklistDismissed && (
                <div className="mb-8 bg-gradient-to-br from-white via-violet-50/25 to-white rounded-3xl border border-violet-200/70 p-5 sm:p-7 shadow-xs transition-all">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-violet-600/30">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight m-0">
                                        Panduan Memulai Bisnis
                                    </h2>
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-violet-100 text-violet-800 border border-violet-200">
                                        {onboardingProgress}% Selesai
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 m-0 mt-0.5">
                                    {isAllOnboardingDone 
                                        ? 'Hebat! Semua langkah awal operasional bisnis Anda sudah selesai 100%.'
                                        : `${completedStepsCount} dari ${onboardingSteps.length} langkah awal telah diselesaikan.`
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Controls: Minimize / Close */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                                type="button"
                                onClick={handleToggleCollapse}
                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title={isChecklistCollapsed ? 'Buka panduan' : 'Ciutkan panduan'}
                            >
                                <span>{isChecklistCollapsed ? 'Tampilkan' : 'Ciutkan'}</span>
                                {isChecklistCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </button>
                            <button
                                type="button"
                                onClick={handleDismissChecklist}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                title="Sembunyikan panduan"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2.5 mb-5 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${Math.max(onboardingProgress, 8)}%` }}
                        />
                    </div>

                    {/* Checklist Steps Body (collapsible) */}
                    {!isChecklistCollapsed && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                            {onboardingSteps.map((step) => {
                                const StepIcon = step.icon;
                                return (
                                    <div
                                        key={step.id}
                                        className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                                            step.done
                                                ? 'bg-emerald-50/40 border-emerald-200/80'
                                                : 'bg-white border-slate-200 hover:border-violet-300 shadow-2xs'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2.5">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                    step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-50 text-violet-600'
                                                }`}>
                                                    <StepIcon size={16} />
                                                </div>
                                                {step.done ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                                        <CheckCircle2 size={12} />
                                                        Selesai
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                                                        Perlu
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className={`text-xs sm:text-sm font-black mb-1 ${step.done ? 'text-slate-800 line-through opacity-75' : 'text-slate-900'}`}>
                                                {step.title}
                                            </h3>
                                            <p className="text-[11px] text-slate-500 leading-relaxed m-0">
                                                {step.desc}
                                            </p>
                                        </div>

                                        {!step.done && step.onAction && (
                                            <div className="mt-3.5 pt-2 border-t border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={step.onAction}
                                                    className="w-full py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                                                >
                                                    <span>{step.actionLabel}</span>
                                                    <ArrowRight size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Menara Pengawas (Usage Monitor) - Hidden for Ultimate for "Clean" Look */}
            {!isUltimate && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { 
                            label: t('nav_invoice'), 
                            count: getInvoiceCount(), 
                            limit: currentLimits?.invoices || 0, 
                            icon: FileText,
                            color: '#0F172A'
                        },
                        { 
                            label: t('nav_kasir'), 
                            count: getKasirTransactionCount(), 
                            limit: currentLimits?.kasir || 0, 
                            icon: ShoppingCart,
                            color: '#0F172A'
                        },
                        { 
                            label: t('nav_clients'), 
                            count: getClientCount(), 
                            limit: currentLimits?.clients || 0, 
                            icon: Users,
                            color: '#0F172A'
                        },
                        { 
                            label: t('nav_piutang'), 
                            count: getHutangPiutangCount(), 
                            limit: currentLimits?.hutangPiutang || 0, 
                            icon: HandCoins,
                            color: '#0F172A'
                        }
                    ].map((item, idx) => {
                        const limitVal = item.limit || 1; // Prevent division by zero
                        const percentage = Math.min((item.count / limitVal) * 100, 100);
                        const isHigh = percentage >= 80;
                        const accentColor = isHigh ? '#EF4444' : '#0F172A';
                        
                        return (
                            <div 
                                key={idx} 
                                className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all ${isHigh ? 'pulse-alert' : ''}`}
                                style={{ position: 'relative', overflow: 'hidden' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ padding: 8, background: `${accentColor}15`, color: accentColor, borderRadius: 10 }}>
                                            <item.icon size={18} />
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{item.label}</span>
                                    </div>
                                    <span style={{ fontSize: 14, fontWeight: 900, color: accentColor }}>
                                        {isUltimate ? item.count : `${item.count} / ${item.limit}`}
                                    </span>
                                </div>

                                {/* Progress Bar Container */}
                                <div style={{ height: 8, background: '#F1F5F9', borderRadius: 10, width: '100%', marginBottom: 10 }}>
                                    <div style={{ 
                                        height: '100%', 
                                        width: `${percentage}%`, 
                                        background: accentColor, 
                                        borderRadius: 10,
                                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' 
                                    }} />
                                </div>

                                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: isHigh ? '#EF4444' : '#94A3B8' }}>
                                    {isUltimate 
                                        ? t('unlimited')
                                        : isHigh 
                                            ? t('limit_alert_msg')
                                            : `${t('remaining_quota_msg')} ${item.limit - item.count}`
                                    }
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Smart Due Alert Banner (Overdue or Due within 3 Days) */}
            {hasDueAlert && (
                <div 
                    className={`mb-6 p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        overdueDebtsCount > 0 
                            ? 'bg-rose-50/90 border-rose-200/90 text-rose-950' 
                            : 'bg-amber-50/90 border-amber-200/90 text-amber-950'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${
                            overdueDebtsCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                            <AlertCircle size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold tracking-tight">
                                    {overdueDebtsCount > 0 
                                        ? t('dash_due_alert_overdue_title') 
                                        : t('dash_due_alert_soon_title')}
                                </h3>
                                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                                    overdueDebtsCount > 0 
                                        ? 'bg-rose-100 text-rose-800 border-rose-300' 
                                        : 'bg-amber-100 text-amber-800 border-amber-300'
                                }`}>
                                    {overdueDebtsCount > 0 
                                        ? `${overdueDebtsCount} Melewati Tempo` 
                                        : `${dueSoonDebtsCount} Jatuh Tempo Segera`}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                                {overdueDebtsCount > 0 
                                    ? t('dash_due_alert_overdue_desc') 
                                    : t('dash_due_alert_soon_desc')}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                                {overdueHutang.length > 0 && (
                                    <span className="font-semibold text-rose-700 bg-white/80 px-2 py-0.5 rounded-md border border-rose-200">
                                        {overdueHutang.length} Hutang Terlewat: {formatCompactCurrency(overdueHutang.reduce((s, h) => s + (Number(h.amount) || 0), 0))}
                                    </span>
                                )}
                                {dueSoonHutang.length > 0 && (
                                    <span className="font-semibold text-amber-800 bg-white/80 px-2 py-0.5 rounded-md border border-amber-200">
                                        {dueSoonHutang.length} Hutang Segera: {formatCompactCurrency(dueSoonHutang.reduce((s, h) => s + (Number(h.amount) || 0), 0))}
                                    </span>
                                )}
                                {overduePiutang.length > 0 && (
                                    <span className="font-semibold text-rose-700 bg-white/80 px-2 py-0.5 rounded-md border border-rose-200">
                                        {overduePiutang.length} Piutang Terlewat: {formatCompactCurrency(overduePiutang.reduce((s, p) => s + (Number(p.amount) || 0), 0))}
                                    </span>
                                )}
                                {dueSoonPiutang.length > 0 && (
                                    <span className="font-semibold text-emerald-800 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
                                        {dueSoonPiutang.length} Piutang Segera: {formatCompactCurrency(dueSoonPiutang.reduce((s, p) => s + (Number(p.amount) || 0), 0))}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/hutang-piutang')}
                        className="self-start md:self-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
                    >
                        <span>{t('dash_action_manage_hp')}</span>
                        <ArrowRight size={13} />
                    </button>
                </div>
            )}

            {/* 5 Clean Minimalist KPI Cards (Income, Expense, Profit, Piutang, Hutang) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4 mb-6">
                <StatCard 
                    title={t('dash_income')} 
                    value={monthlyIncomeValue} 
                    badge={t('period_month') || 'Bulan Ini'}
                    badgeColor="emerald"
                    color="slate"
                    subtitle={t('dash_income_source') || 'Kasir POS + Invoice + Catatan'}
                    subValue={`${txCounts.income} ${t('transaksi') || 'Transaksi'}`}
                    className="col-span-1"
                />
                <StatCard 
                    title={t('dash_expense')} 
                    value={monthlyExpenseValue} 
                    badge={t('dash_expense_badge') || 'Beban Usaha'}
                    badgeColor="slate"
                    color="slate"
                    subtitle={t('dash_expense_sub') || 'Operasional & Kasir'}
                    subValue={`${txCounts.expense} ${t('catatan') || 'Catatan'}`}
                    className="col-span-1"
                />
                <StatCard 
                    title={t('dash_profit') || t('dash_net_profit')} 
                    value={netProfitValue} 
                    badge={monthlyIncomeValue > 0 ? `Margin ${Math.round((netProfitValue / monthlyIncomeValue) * 100)}%` : (t('period_month') || 'Bulan Ini')}
                    badgeColor="violet"
                    color="violet"
                    subtitle={t('dash_profit_sub') || 'Pendapatan - Beban'}
                    subValue={netProfitValue >= 0 ? (t('healthy_status') || 'Surplus') : (t('deficit_status') || 'Defisit')}
                    className="col-span-1"
                />
                <StatCard 
                    title={t('dash_piutang') || t('report_cat_receivable')} 
                    value={cbVolume} 
                    badge={totalUnpaidReceivableCount > 0 ? `${totalUnpaidReceivableCount} ${t('dash_unpaid_badge') || 'Belum Lunas'}` : (t('no_unpaid_badge') || 'Semua Lunas')}
                    badgeColor={totalUnpaidReceivableCount > 0 ? 'amber' : 'slate'}
                    color="slate"
                    subtitle={`${t('lap_summary_for')} ${t('inv_status_unpaid')}`}
                    subValue={totalUnpaidReceivableCount > 0 ? (t('need_followup') || 'Perlu Ditagih') : (t('all_paid') || 'Lunas')}
                    onClick={() => navigate(unpaidInvoices.length === 0 && unpaidPiutangCount > 0 ? '/hutang-piutang' : '/invoice')}
                    className="col-span-1"
                />
                <StatCard 
                    title={t('dash_hutang') || 'Total Hutang'} 
                    value={totalHutangValue} 
                    badge={unpaidHutangCount > 0 ? `${unpaidHutangCount} ${t('dash_unpaid_badge') || 'Belum Lunas'}` : (t('no_unpaid_badge') || 'Semua Lunas')}
                    badgeColor={unpaidHutangCount > 0 ? 'rose' : 'slate'}
                    color="slate"
                    subtitle={t('dash_hutang_sub') || 'Kewajiban Usaha'}
                    subValue={unpaidHutangCount > 0 ? (t('dash_must_pay') || 'Harus Dibayar') : (t('all_paid') || 'Lunas')}
                    onClick={() => navigate('/hutang-piutang')}
                    className="col-span-2 lg:col-span-1"
                />
            </div>

            {/* Modern Clean 2-Col Layout: 6-Month Chart & Cashier POS/Mix Module */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
                {/* 6-Month Chart (8 Cols) */}
                <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">
                                {t('dash_chart')}
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">{t('dash_new_income_desc') || 'Perbandingan arus kas masuk vs arus kas keluar bulanan'}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-violet-600"></span> {t('dash_legend_invoice')}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span> {t('dash_legend_kasir')}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-slate-300"></span> {t('dash_legend_expense')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-end gap-4 sm:gap-6 h-44 pt-4 px-2">
                        {chartData.map((m, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                                    {/* Stacked Income (Kasir + Invoice) */}
                                    <div className="w-4 sm:w-6 flex flex-col justify-end h-full">
                                        <div
                                            style={{ height: `${Math.max(m.incKasirPct, 0)}%` }}
                                            className="w-full bg-amber-400 rounded-t-sm transition-all group-hover:bg-amber-500"
                                            title={`${t('dash_legend_kasir')}: ${formatIDR(m.incKasir)}`}
                                        />
                                        <div
                                            style={{ height: `${Math.max(m.incInvPct, 2)}%` }}
                                            className="w-full bg-violet-600 rounded-t-sm transition-all group-hover:bg-violet-700"
                                            title={`${t('dash_legend_invoice')}: ${formatIDR(m.incInv)}`}
                                        />
                                    </div>
                                    {/* Expense Bar */}
                                    <div className="w-4 sm:w-6 flex items-end h-full">
                                        <div
                                            style={{ height: `${Math.max(m.expPct, 2)}%` }}
                                            className="w-full bg-slate-200 rounded-t-sm transition-all group-hover:bg-slate-300"
                                            title={`${t('dash_legend_expense')}: ${formatIDR(m.exp)}`}
                                        />
                                    </div>
                                </div>
                                <span className={`text-[11px] font-semibold ${i === chartData.length - 1 ? 'font-bold text-violet-700' : 'text-slate-400'}`}>
                                    {m.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Module: Live POS Cashier & Revenue Mix (4 Cols) */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Kasir Today Clean Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    {t('dash_kasir_sales')}
                                </span>
                            </div>
                            <button
                                onClick={() => navigate('/kasir')}
                                className="text-xs font-bold text-violet-600 hover:text-violet-800 bg-transparent border-none cursor-pointer"
                            >
                                {t('nav_kasir')} →
                            </button>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-slate-950 font-mono">
                            {formatIDR(kasirToday.sales)}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {kasirToday.count || 0} {t('transaksi_hari_ini') || 'transaksi kasir hari ini'}
                        </p>
                    </div>

                    {/* Revenue Composition Mix */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                            {t('revenue_mix') || 'Komposisi Pendapatan'}
                        </span>
                        
                        <div className="space-y-2.5">
                            <div className="flex justify-between text-xs">
                                <span className="font-medium text-slate-600">{t('dash_pos_sales_label') || 'Penjualan POS'}</span>
                                <span className="font-bold text-slate-900 font-mono">{formatIDR(posSalesIncome)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="font-medium text-slate-600">{t('dash_invoices_paid_label') || 'Invoice (Lunas)'}</span>
                                <span className="font-bold text-slate-900 font-mono">{formatIDR(invoicesIncome)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="font-medium text-slate-600">{t('dash_manual_income_label') || 'Catatan Kas & Lainnya'}</span>
                                <span className="font-bold text-slate-900 font-mono">{formatIDR(Math.max(0, monthlyIncomeValue - posSalesIncome - invoicesIncome))}</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                                <div className="bg-amber-400 h-full transition-all" style={{ width: `${(posSalesIncome / (monthlyIncomeValue || 1)) * 100}%` }} title={`POS: ${formatIDR(posSalesIncome)}`} />
                                <div className="bg-violet-600 h-full transition-all" style={{ width: `${(invoicesIncome / (monthlyIncomeValue || 1)) * 100}%` }} title={`Invoice: ${formatIDR(invoicesIncome)}`} />
                                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(Math.max(0, monthlyIncomeValue - posSalesIncome - invoicesIncome) / (monthlyIncomeValue || 1)) * 100}%` }} title={`Catatan: ${formatIDR(Math.max(0, monthlyIncomeValue - posSalesIncome - invoicesIncome))}`} />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic pt-1">{t('revenue_mix_desc')}</p>
                    </div>
                </div>
            </div>

            {/* Unpaid Invoices Table (Clean Minimalist List) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden mb-6">
                <div className="p-5 flex items-center justify-between border-b border-slate-100">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">{t('dash_unpaid_list')}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{t('lap_summary_for')} {t('inv_status_unpaid')}</p>
                    </div>
                    <button
                        onClick={() => navigate('/invoice')}
                        className="text-xs font-bold text-slate-700 hover:text-black bg-transparent border-none cursor-pointer"
                    >
                        {t('view_all')} →
                    </button>
                </div>

                {unpaidInvoices.length === 0 ? (
                    <div className="py-8">
                        <EmptyState title={t('dash_no_unpaid')} description={t('dash_no_unpaid_desc')} />
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {unpaidInvoices.slice(0, 5).map(inv => (
                            <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition gap-4">
                                <div className="space-y-0.5 min-w-0">
                                    <div className="text-xs font-bold text-slate-900 truncate">{inv.clientName || 'Klien'}</div>
                                    <div className="text-[11px] text-slate-400 font-mono">
                                        {inv.number || 'INV-XXX'} {inv.dueDate ? `• Jatuh tempo ${inv.dueDate}` : ''}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
                                        {formatIDR(inv.grandTotal)}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                                        {t('dash_unpaid_badge') || 'Belum Lunas'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            <div className={`card ${isFetching ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`} style={{ marginTop: 20, animation: 'none' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#1E293B' }}>
                    {t('dash_recent')}
                </h2>
                {allActivity.length === 0 ? (
                    <EmptyState title={t('dash_no_activity')} description={t('dash_no_activity_desc')} />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {allActivity.map((item, i) => (
                            <div key={item.id || i} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px',
                                borderRadius: 8, transition: 'background 200ms',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                    background: item.type === 'income' ? '#10B981'
                                        : item.type === 'expense' ? '#EF4444' : '#7C3AED',
                                }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.label}
                                    </p>
                                    {item.sub && <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>{item.sub}</p>}
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p style={{
                                        margin: 0, fontSize: 13, fontWeight: 700,
                                        color: item.type === 'income' ? '#10B981' : item.type === 'expense' ? '#EF4444' : '#7C3AED',
                                    }} title={formatIDR(item.amount || 0)}>
                                        {item.type === 'income' ? '+' : item.type === 'expense' ? '-' : ''}{formatCompactCurrency(item.amount || 0)}
                                    </p>
                                    <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>{formatDateID(item.date, lang)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Professional Business Notes Section */}
            <div className="mt-8 bg-white  rounded-2xl border border-slate-200  shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200  flex items-center justify-between bg-slate-50 /50">
                    <h3 className="text-lg font-bold text-slate-800  flex items-center gap-2">
                        <FileText size={20} className="text-violet-600" />
                        {t('dash_ops_log')}
                    </h3>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {shifts && shifts.length > 0 ? shifts.map((shift, idx) => (
                            <div key={idx} className="flex gap-4 p-4 rounded-xl border border-slate-100  bg-white  hover:border-violet-300  transition-colors shadow-sm">
                                <div className="flex-none">
                                    <div className="w-12 h-12 rounded-full bg-violet-100  flex items-center justify-center text-violet-600 font-black text-lg shadow-inner">
                                        {shift.employee_name?.charAt(0)?.toUpperCase() || 'K'}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                                        <div>
                                            <h4 className="font-bold text-slate-800  text-base">{shift.employee_name || t('kasir_staff_fallback')}</h4>
                                            <p className="text-xs text-slate-500  font-medium">{new Date(shift.ended_at).toLocaleDateString(t('locale_code') || (lang === 'ID' ? 'id-ID' : 'en-US'))} • Shift {shift.shift_number || '1'}</p>
                                        </div>
                                        <div className="px-3 py-1 bg-emerald-50  text-emerald-600  text-xs font-bold rounded-lg border border-emerald-100 ">
                                            {t('dash_cash_label')} {new Intl.NumberFormat(lang === 'ID' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(shift.actual_cash || 0).replace('IDR', 'Rp')}
                                        </div>
                                    </div>
                                    <div className="p-3.5 bg-slate-50  rounded-lg border border-slate-100  text-sm text-slate-600  relative">
                                        <span className="absolute -top-2 left-3 bg-slate-50  px-1 text-[10px] font-bold text-slate-400">{t('dash_notes_label')}</span>
                                        <p className="leading-relaxed italic">"{shift.shift_notes || t('dash_no_ops_notes')}"</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-slate-100  rounded-full flex items-center justify-center mb-3">
                                    <FileText size={24} className="text-slate-400" />
                                </div>
                                <p className="text-slate-500  font-medium">{t('dash_no_ops_yet')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* REFERRAL & VIRAL GROWTH SECTION */}
            <div className="mt-8 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-bold uppercase tracking-wider mb-3">
                            <Gift size={13} className="text-violet-400" />
                            <span>Program Rekan Bisnis</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            Ajak Rekan Bisnis & Raih Diskon Perpanjangan
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                            Bagikan link referral Anda ke sesama pemilik toko, desainer, atau pelaku UMKM. Rekan Anda langsung mendapatkan akun gratis selamanya, dan Anda berdua berhak memperoleh diskon khusus upgrade PRO.
                        </p>
                    </div>

                    <div className="flex-1 max-w-lg bg-slate-800/80 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-slate-700/80">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Link Referral Eksklusif Anda:
                        </span>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex-1 bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 truncate select-all">
                                {referralUrl}
                            </div>
                            <button
                                type="button"
                                onClick={handleCopyReferral}
                                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm active:scale-95"
                            >
                                {copiedRef ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                <span>{copiedRef ? 'Tersalin!' : 'Salin'}</span>
                            </button>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-700/60">
                            <button
                                type="button"
                                onClick={handleShareWhatsAppReferral}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                            >
                                <Share2 size={13} />
                                <span>Kirim Undangan via WhatsApp</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/affiliate')}
                                className="text-xs text-violet-400 hover:text-violet-300 font-bold transition-colors inline-flex items-center gap-1"
                            >
                                <span>Program Afiliasi</span>
                                <ArrowRight size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="p-6 max-w-[1200px] mx-auto animate-pulse">
            {/* Header Skeleton */}
            <div className="mb-8">
                <div className="h-8 w-48 bg-slate-200 rounded-lg mb-2" />
                <div className="h-4 w-64 bg-slate-100 rounded-lg" />
            </div>

            {/* Stat Cards Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4 mb-6">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`h-32 bg-slate-200/60 rounded-2xl border border-slate-200 ${i === 5 ? 'col-span-2 lg:col-span-1' : 'col-span-1'}`} />
                ))}
            </div>

            {/* Evaluation & Revenue Mix Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="h-48 bg-slate-200/50 rounded-xl border border-slate-200" />
                <div className="h-48 bg-slate-100 rounded-xl border border-slate-200" />
            </div>

            {/* Quick Actions Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 bg-slate-200/40 rounded-2xl border border-slate-200" />
                ))}
            </div>

            {/* Chart & Unpaid Invoices Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="h-80 bg-slate-100/80 rounded-xl border border-slate-100" />
                <div className="h-80 bg-slate-100/80 rounded-xl border border-slate-100" />
            </div>

            {/* Recent Activity Skeleton */}
            <div className="mt-5 h-64 bg-slate-50 rounded-xl border border-slate-100" />
        </div>
    );
}
// Pancingan untuk Vercel 1 April
