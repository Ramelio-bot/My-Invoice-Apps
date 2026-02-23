import { createContext, useContext, useState } from 'react';

const translations = {
    ID: {
        // Nav
        nav_home: 'Beranda',
        nav_cashbook: 'Catatan Bisnis',
        nav_clients: 'Klien',
        nav_invoice: 'Invoice',
        nav_receipt: 'Kwitansi',
        nav_delivery: 'Tanda Terima',
        nav_quote: 'Penawaran Harga',
        nav_po: 'Purchase Order',
        nav_hpp: 'Hitung HPP',
        nav_report: 'Laporan',
        // Common
        save: 'Simpan',
        cancel: 'Batal',
        delete: 'Hapus',
        edit: 'Edit',
        search: 'Cari...',
        add: 'Tambah',
        saved: 'Tersimpan',
        loading: 'Memuat...',
        no_data: 'Belum ada data',
        // Dashboard
        dash_income: 'Total Pemasukan Bulan Ini',
        dash_expense: 'Total Pengeluaran Bulan Ini',
        dash_profit: 'Laba Bersih Bulan Ini',
        dash_unpaid: 'Invoice Belum Dibayar',
        dash_quick_income: 'Catat Pemasukan',
        dash_quick_expense: 'Catat Pengeluaran',
        dash_quick_invoice: 'Buat Invoice',
        dash_quick_report: 'Lihat Laporan',
        dash_recent: 'Aktivitas Terbaru',
        dash_chart: 'Grafik 6 Bulan Terakhir',
        dash_unpaid_list: 'Invoice Belum Dibayar',
        // Catatan Bisnis
        cb_income: 'Pemasukan',
        cb_expense: 'Pengeluaran',
        cb_balance: 'Saldo Bersih',
        cb_amount: 'Nominal',
        cb_category: 'Kategori',
        cb_note: 'Keterangan',
        cb_date: 'Tanggal',
        cb_filter_today: 'Hari Ini',
        cb_filter_week: 'Minggu',
        cb_filter_month: 'Bulan',
        cb_filter_all: 'Semua',
        cb_daily_total: 'Total Hari Ini',
        cb_limit: 'transaksi hari ini. Upgrade PRO untuk unlimited.',
        // Klien
        kl_title: 'Database Klien',
        kl_add: '+ Tambah Klien',
        kl_detail: 'Lihat Detail',
        kl_total_tr: 'Total Transaksi',
        kl_total_doc: 'Jumlah Dokumen',
        kl_limit: 'Batas gratis 3 klien.',
        // Invoice
        inv_company: 'Informasi Perusahaan',
        inv_client: 'Informasi Klien',
        inv_detail: 'Detail Invoice',
        inv_items: 'Item',
        inv_payment: 'Informasi Pembayaran',
        inv_notes: 'Catatan',
        inv_preview: 'Preview Invoice',
        inv_download: 'Download PDF',
        inv_reset: 'Reset Form',
        inv_mark_paid: 'Tandai Lunas',
        inv_paid_toast: 'Invoice lunas! Kwitansi dibuat.',
        inv_status_unpaid: 'Belum Bayar',
        inv_status_paid: 'Lunas',
        inv_status_waiting: 'Menunggu',
        inv_status_cancelled: 'Dibatalkan',
        // Upgrade
        up_title: 'Batas Penggunaan Tercapai',
        up_cta: 'Upgrade PRO - Rp 99.000/bulan',
        // Footer
        footer: '© 2026 MyInvoice.space',
    },
    EN: {
        // Nav
        nav_home: 'Home',
        nav_cashbook: 'Business Notes',
        nav_clients: 'Clients',
        nav_invoice: 'Invoice',
        nav_receipt: 'Receipt',
        nav_delivery: 'Delivery Note',
        nav_quote: 'Price Quote',
        nav_po: 'Purchase Order',
        nav_hpp: 'Cost Calculator',
        nav_report: 'Reports',
        // Common
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        search: 'Search...',
        add: 'Add',
        saved: 'Saved',
        loading: 'Loading...',
        no_data: 'No data yet',
        // Dashboard
        dash_income: 'Total Income This Month',
        dash_expense: 'Total Expenses This Month',
        dash_profit: 'Net Profit This Month',
        dash_unpaid: 'Unpaid Invoices',
        dash_quick_income: 'Record Income',
        dash_quick_expense: 'Record Expense',
        dash_quick_invoice: 'Create Invoice',
        dash_quick_report: 'View Reports',
        dash_recent: 'Recent Activity',
        dash_chart: 'Last 6 Months Chart',
        dash_unpaid_list: 'Unpaid Invoices',
        // Catatan Bisnis
        cb_income: 'Income',
        cb_expense: 'Expense',
        cb_balance: 'Net Balance',
        cb_amount: 'Amount',
        cb_category: 'Category',
        cb_note: 'Notes',
        cb_date: 'Date',
        cb_filter_today: 'Today',
        cb_filter_week: 'Week',
        cb_filter_month: 'Month',
        cb_filter_all: 'All',
        cb_daily_total: "Today's Total",
        cb_limit: 'transactions today. Upgrade PRO for unlimited.',
        // Klien
        kl_title: 'Client Database',
        kl_add: '+ Add Client',
        kl_detail: 'View Detail',
        kl_total_tr: 'Total Transactions',
        kl_total_doc: 'Document Count',
        kl_limit: 'Free plan: max 3 clients.',
        // Invoice
        inv_company: 'Company Information',
        inv_client: 'Client Information',
        inv_detail: 'Invoice Details',
        inv_items: 'Items',
        inv_payment: 'Payment Information',
        inv_notes: 'Notes',
        inv_preview: 'Invoice Preview',
        inv_download: 'Download PDF',
        inv_reset: 'Reset Form',
        inv_mark_paid: 'Mark as Paid',
        inv_paid_toast: 'Invoice paid! Receipt created.',
        inv_status_unpaid: 'Unpaid',
        inv_status_paid: 'Paid',
        inv_status_waiting: 'Pending',
        inv_status_cancelled: 'Cancelled',
        // Upgrade
        up_title: 'Usage Limit Reached',
        up_cta: 'Upgrade PRO - Rp 99,000/month',
        // Footer
        footer: '© 2026 MyInvoice.space',
    }
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ID');

    const toggleLang = () => {
        const next = lang === 'ID' ? 'EN' : 'ID';
        setLang(next);
        localStorage.setItem('lang', next);
    };

    const t = (key) => translations[lang][key] || translations['ID'][key] || key;

    return (
        <LanguageContext.Provider value={{ lang, toggleLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLang() {
    return useContext(LanguageContext);
}
