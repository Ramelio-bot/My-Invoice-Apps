import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LifeBuoy, FileText, Users, Store, ChevronDown, ChevronRight,
    CheckCircle, ArrowRight, Mail, MessageCircle, BookOpen, Zap,
    Award, CreditCard, BarChart2, Tag, Search, Layout
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

// ─── Guide data ─────────────────────────────────────────────────────────────────
const guides = {
    invoice: {
        icon: FileText,
        color: '#7C3AED',
        bg: '#EDE9FE',
        titleID: 'Membuat Invoice & Kwitansi',
        titleEN: 'Create Invoice & Receipt',
        descID: 'Panduan lengkap membuat dokumen tagihan dan kwitansi pembayaran secara profesional.',
        descEN: 'Complete guide to creating professional billing documents and payment receipts.',
        steps: [
            {
                titleID: 'Buka halaman Invoice',
                titleEN: 'Open Invoice page',
                descID: 'Klik menu "Invoice" di sidebar kiri. Jika belum login, Anda akan diarahkan ke halaman masuk terlebih dahulu.',
                descEN: 'Click "Invoice" in the left sidebar. If not logged in, you will be redirected to the login page first.',
            },
            {
                titleID: 'Isi data perusahaan',
                titleEN: 'Fill in company data',
                descID: 'Lengkapi nama perusahaan, alamat, dan nomor telepon pada bagian "Informasi Perusahaan". Data ini akan tampil di header invoice.',
                descEN: 'Complete your company name, address, and phone number in the "Company Information" section. This data appears in the invoice header.',
            },
            {
                titleID: 'Masukkan data klien',
                titleEN: 'Enter client details',
                descID: 'Ketik nama klien di kolom "Informasi Klien". Anda bisa memilih dari Database Klien atau memasukkan baru secara langsung.',
                descEN: 'Type the client name in the "Client Information" field. You can select from your Client Database or enter a new one directly.',
            },
            {
                titleID: 'Tambah item tagihan',
                titleEN: 'Add billing items',
                descID: 'Di bagian "Item", klik "+ Tambah Item". Isi nama layanan/produk, jumlah, dan harga satuan. Total akan dihitung otomatis.',
                descEN: 'In the "Items" section, click "+ Add Item". Enter service/product name, quantity, and unit price. Total is calculated automatically.',
            },
            {
                titleID: 'Atur jatuh tempo & metode bayar',
                titleEN: 'Set due date & payment method',
                descID: 'Tentukan tanggal jatuh tempo dan pilih metode pembayaran (Transfer Bank, Cash, dll.) agar klien tahu cara melunasinya.',
                descEN: 'Set the due date and select a payment method (Bank Transfer, Cash, etc.) so the client knows how to pay.',
            },
            {
                titleID: 'Preview & Download PDF',
                titleEN: 'Preview & Download PDF',
                descID: 'Klik tombol "Preview Invoice" untuk melihat tampilan akhir. Jika sudah benar, klik "Download PDF" untuk menyimpan atau kirim ke klien.',
                descEN: 'Click "Preview Invoice" to see the final layout. Once satisfied, click "Download PDF" to save or send to your client.',
            },
            {
                titleID: 'Tandai Lunas',
                titleEN: 'Mark as Paid',
                descID: 'Setelah klien membayar, klik tombol "Tandai Lunas" pada kartu invoice. Status berubah hijau dan kwitansi otomatis dibuat di halaman Kwitansi.',
                descEN: 'Once the client pays, click "Mark as Paid" on the invoice card. Status turns green and a receipt is automatically created on the Kwitansi page.',
            },
        ]
    },
    klien: {
        icon: Users,
        color: '#10B981',
        bg: '#D1FAE5',
        titleID: 'Menambah & Mengelola Klien',
        titleEN: 'Add & Manage Clients',
        descID: 'Kelola database klien bisnis Anda — simpan kontak, pantau riwayat transaksi, dan percepat pengisian dokumen.',
        descEN: 'Manage your business client database — save contacts, track transaction history, and speed up document filling.',
        steps: [
            {
                titleID: 'Buka halaman Klien',
                titleEN: 'Open Clients page',
                descID: 'Klik menu "Klien" di sidebar. Anda akan melihat daftar semua klien yang sudah tersimpan (atau kosong jika baru pertama kali).',
                descEN: 'Click "Klien" (Clients) in the sidebar. You\'ll see a list of all saved clients (or empty if it\'s your first time).',
            },
            {
                titleID: 'Tambah klien baru',
                titleEN: 'Add a new client',
                descID: 'Klik tombol "+ Tambah Klien" di pojok kanan atas. Form input akan muncul. Isi minimal Nama Klien (wajib) dan data lainnya seperti email, telepon, dan alamat.',
                descEN: 'Click the "+ Add Client" button at the top right. An input form will appear. Fill in at least the Client Name (required) and other details like email, phone, and address.',
            },
            {
                titleID: 'Simpan dan lihat profil klien',
                titleEN: 'Save and view client profile',
                descID: 'Klik "Simpan". Klien akan muncul sebagai kartu di grid. Klik "Lihat Detail" pada kartu untuk melihat profil lengkap beserta riwayat semua transaksi terkait klien tersebut.',
                descEN: 'Click "Save". The client appears as a card in the grid. Click "View Detail" on the card to see the full profile along with a history of all transactions related to that client.',
            },
            {
                titleID: 'Edit atau hapus klien',
                titleEN: 'Edit or delete a client',
                descID: 'Pada kartu klien, klik ikon pensil untuk mengedit data, atau ikon tempat sampah untuk menghapus. Data yang dihapus tidak dapat dikembalikan.',
                descEN: 'On the client card, click the pencil icon to edit data, or the trash icon to delete. Deleted data cannot be recovered.',
            },
            {
                titleID: 'Gunakan klien di dokumen',
                titleEN: 'Use client in documents',
                descID: 'Saat membuat Invoice, Kwitansi, atau Penawaran Harga, ketik nama klien di kolom yang tersedia — sistem akan menyarankan dari daftar klien Anda secara otomatis.',
                descEN: 'When creating an Invoice, Receipt, or Price Quote, type the client name in the available field — the system will auto-suggest from your client list.',
            },
        ]
    },
    kasir: {
        icon: Store,
        color: '#F59E0B',
        bg: '#FEF3C7',
        titleID: 'Menggunakan Kasir POS',
        titleEN: 'Using the POS Cashier',
        descID: 'Panduan lengkap mengoperasikan sistem Point of Sale — dari pengaturan produk hingga mencetak struk transaksi.',
        descEN: 'Complete guide to operating the Point of Sale system — from product setup to printing transaction receipts.',
        steps: [
            {
                titleID: 'Tambah produk terlebih dahulu',
                titleEN: 'Add products first',
                descID: 'Sebelum bertransaksi, tambahkan produk melalui menu Kasir → "Manajemen Produk". Isi nama produk, harga jual, dan stok awal.',
                descEN: 'Before transacting, add products via Kasir → "Product Management". Fill in product name, selling price, and initial stock.',
            },
            {
                titleID: 'Buka sesi Transaksi POS',
                titleEN: 'Open POS Transaction session',
                descID: 'Klik menu Kasir → "Transaksi POS". Halaman kasir akan tampil dengan daftar produk di kiri dan keranjang belanja di kanan.',
                descEN: 'Click Kasir → "POS Transaction". The cashier page displays with product list on the left and shopping cart on the right.',
            },
            {
                titleID: 'Tambah produk ke keranjang',
                titleEN: 'Add products to cart',
                descID: 'Klik produk atau ketik di kolom pencarian untuk menemukannya. Produk langsung masuk ke keranjang. Atur jumlahnya dengan tombol + dan − di keranjang.',
                descEN: 'Click a product or type in the search bar to find it. Products go directly into the cart. Adjust quantity with the + and − buttons in the cart.',
            },
            {
                titleID: 'Pilih metode bayar & proses',
                titleEN: 'Choose payment method & process',
                descID: 'Pilih metode pembayaran (Cash, Transfer, QRIS). Untuk Cash, masukkan nominal yang diterima dan sistem akan menghitung kembaliannya.',
                descEN: 'Select a payment method (Cash, Transfer, QRIS). For Cash, enter the amount received and the system calculates the change.',
            },
            {
                titleID: 'Cetak atau kirim struk',
                titleEN: 'Print or send receipt',
                descID: 'Setelah transaksi selesai, struk digital akan tampil. Anda bisa mencetak atau menutupnya untuk langsung lanjut ke transaksi berikutnya.',
                descEN: 'After the transaction completes, a digital receipt appears. You can print it or close it to proceed to the next transaction.',
            },
            {
                titleID: 'Pantau laporan penjualan',
                titleEN: 'Monitor sales reports',
                descID: 'Buka menu Kasir → "Laporan Kasir" untuk melihat total penjualan harian, mingguan, dan produk terlaris. Tersedia expor ke Excel.',
                descEN: 'Open Kasir → "POS Reports" to view daily, weekly sales totals, and best-selling products. Excel export is available.',
            },
        ]
    },
    loyalty: {
        icon: Award,
        color: '#EC4899',
        bg: '#FCE7F3',
        titleID: 'Program Loyalitas & Member',
        titleEN: 'Loyalty Program & Members',
        descID: 'Kelola program poin pelanggan — tambah member, pantau poin, dan berikan reward untuk pelanggan setia.',
        descEN: 'Manage customer loyalty points — add members, track points, and reward loyal customers.',
        steps: [
            {
                titleID: 'Aktifkan program loyalitas',
                titleEN: 'Enable loyalty program',
                descID: 'Buka Settings → scroll ke bagian Loyalty Program. Aktifkan toggle, lalu atur kelipatan belanja dan nilai poin sesuai kebijakan toko Anda.',
                descEN: 'Go to Settings → scroll to Loyalty Program section. Enable the toggle, then set spending multiplier and point value according to your store policy.',
            },
            {
                titleID: 'Tambah member baru',
                titleEN: 'Add a new member',
                descID: 'Buka menu Kasir → Members. Klik "+ Tambah Member", isi nama dan nomor HP pelanggan. Nomor HP digunakan sebagai identitas unik member.',
                descEN: 'Go to Cashier → Members. Click "+ Add Member", fill in customer name and phone number. Phone number is used as the unique member identifier.',
            },
            {
                titleID: 'Transaksi dengan member',
                titleEN: 'Transact with a member',
                descID: 'Saat checkout di kasir, masukkan nomor HP pelanggan di kolom pencarian member, lalu klik "Cari". Jika ditemukan, poin akan otomatis bertambah setelah transaksi selesai.',
                descEN: 'At checkout, enter the customer phone number in the member search field, then click "Search". If found, points will automatically accumulate after the transaction.',
            },
            {
                titleID: 'Redeem poin pelanggan',
                titleEN: 'Redeem customer points',
                descID: 'Setelah member ditemukan saat checkout, masukkan jumlah poin yang ingin diredeem. Poin akan otomatis dikonversi menjadi diskon tambahan pada total transaksi.',
                descEN: 'After finding the member at checkout, enter the number of points to redeem. Points are automatically converted into additional discount on the total transaction.',
            },
            {
                titleID: 'Pantau riwayat poin',
                titleEN: 'Monitor point history',
                descID: 'Di halaman Members, klik nama member untuk melihat total poin, total belanja, dan jumlah transaksi yang pernah dilakukan.',
                descEN: 'On the Members page, click a member name to see total points, total spending, and number of transactions.',
            },
        ]
    },
    hutang: {
        icon: CreditCard,
        color: '#EF4444',
        bg: '#FEE2E2',
        titleID: 'Hutang & Piutang',
        titleEN: 'Accounts Receivable & Payable',
        descID: 'Catat dan pantau semua hutang bisnis — siapa yang berutang kepada Anda dan kepada siapa Anda berutang.',
        descEN: 'Record and monitor all business debts — who owes you money and who you owe.',
        steps: [
            {
                titleID: 'Buka halaman Hutang Piutang',
                titleEN: 'Open Accounts page',
                descID: 'Klik menu "Accounts Receivable" di sidebar. Anda akan melihat dua tab: Receivable (piutang — orang yang berutang kepada Anda) dan Payable (hutang — Anda yang berutang).',
                descEN: 'Click "Accounts Receivable" in the sidebar. You will see two tabs: Receivable (people who owe you) and Payable (debts you need to pay).',
            },
            {
                titleID: 'Tambah entri baru',
                titleEN: 'Add a new entry',
                descID: 'Pilih tab yang sesuai (Receivable atau Payable), lalu klik "+ Add". Isi nama pihak terkait, jumlah, tanggal jatuh tempo, dan catatan jika perlu.',
                descEN: 'Select the appropriate tab (Receivable or Payable), then click "+ Add". Fill in the party name, amount, due date, and notes if needed.',
            },
            {
                titleID: 'Pantau status pembayaran',
                titleEN: 'Monitor payment status',
                descID: 'Setiap entri menampilkan badge status: Normal (belum jatuh tempo), Segera (jatuh tempo dalam 3 hari), atau Terlambat (sudah lewat jatuh tempo).',
                descEN: 'Each entry shows a status badge: Normal (not yet due), Due Soon (due within 3 days), or Overdue (past due date).',
            },
            {
                titleID: 'Tandai sebagai lunas',
                titleEN: 'Mark as paid',
                descID: 'Klik tombol "Tandai Lunas" pada entri yang sudah dibayar. Status berubah menjadi Lunas dan tidak akan memicu notifikasi jatuh tempo lagi.',
                descEN: 'Click "Mark as Paid" on a settled entry. Status changes to Paid and will no longer trigger due date notifications.',
            },
            {
                titleID: 'Notifikasi jatuh tempo',
                titleEN: 'Due date notifications',
                descID: 'Bell notifikasi di header akan menampilkan peringatan jika ada hutang/piutang yang jatuh tempo dalam 3 hari atau sudah melewati jatuh tempo.',
                descEN: 'The notification bell in the header will alert you if any debt is due within 3 days or already overdue.',
            },
        ]
    },
    laporan: {
        icon: BarChart2,
        color: '#3B82F6',
        bg: '#DBEAFE',
        titleID: 'Laporan Penjualan Kasir',
        titleEN: 'Sales Report',
        descID: 'Analisis performa penjualan kasir — omzet harian, produk terlaris, jam ramai, dan metode pembayaran.',
        descEN: 'Analyze cashier sales performance — daily revenue, top products, peak hours, and payment methods.',
        steps: [
            {
                titleID: 'Buka halaman Sales Report',
                titleEN: 'Open Sales Report page',
                descID: 'Klik menu "Sales Report" di sidebar (tersedia untuk plan PRO dan ULTIMATE). Halaman menampilkan ringkasan lengkap performa kasir.',
                descEN: 'Click "Sales Report" in the sidebar (available for PRO and ULTIMATE plans). The page shows a complete cashier performance summary.',
            },
            {
                titleID: 'Pilih periode laporan',
                titleEN: 'Select report period',
                descID: 'Gunakan filter di bagian atas: Today (hari ini), This Week (minggu ini), This Month (bulan ini), atau Custom untuk memilih rentang tanggal sendiri.',
                descEN: 'Use the filter at the top: Today, This Week, This Month, or Custom to select your own date range.',
            },
            {
                titleID: 'Baca ringkasan kartu',
                titleEN: 'Read summary cards',
                descID: '4 kartu ringkasan menampilkan: Total Revenue (omzet), Total Transactions (jumlah transaksi), Average per Transaction (rata-rata per transaksi), dan Items Sold (total item terjual).',
                descEN: '4 summary cards show: Total Revenue, Total Transactions, Average per Transaction, and Items Sold.',
            },
            {
                titleID: 'Analisis grafik harian',
                titleEN: 'Analyze daily chart',
                descID: 'Grafik batang menampilkan omzet per hari dalam periode yang dipilih. Arahkan kursor ke batang untuk melihat detail angka.',
                descEN: 'The bar chart shows daily revenue for the selected period. Hover over bars to see detailed numbers.',
            },
            {
                titleID: 'Kirim rekap ke WhatsApp',
                titleEN: 'Send recap via WhatsApp',
                descID: 'Klik tombol "Kirim Rekap WA" untuk mengirimkan ringkasan penjualan harian ke WhatsApp Anda atau tim. Pesan terformat otomatis dan siap dikirim.',
                descEN: 'Click "Send WA Recap" to send a daily sales summary to your WhatsApp or team. The message is auto-formatted and ready to send.',
            },
        ]
    },
    karyawan: {
        icon: Users,
        color: '#8B5CF6',
        bg: '#EDE9FE',
        titleID: 'Shift & Karyawan',
        titleEN: 'Shifts & Employees',
        descID: 'Kelola karyawan kasir — atur PIN login, pantau shift, dan analisis performa penjualan per karyawan.',
        descEN: 'Manage cashier employees — set login PINs, monitor shifts, and analyze sales performance per employee.',
        steps: [
            {
                titleID: 'Tambah karyawan kasir',
                titleEN: 'Add a cashier employee',
                descID: 'Buka menu Karyawan & Shift. Klik "+ Tambah Karyawan", isi nama, jabatan, dan PIN 4-6 digit. PIN digunakan untuk login ke mode kasir.',
                descEN: 'Open Employees & Shifts menu. Click "+ Add Employee", fill in name, role, and 4-6 digit PIN. The PIN is used to log into cashier mode.',
            },
            {
                titleID: 'Login kasir dengan PIN',
                titleEN: 'Log into cashier with PIN',
                descID: 'Buka halaman Kasir. Jika ada karyawan terdaftar, layar PIN login akan muncul. Pilih nama karyawan, masukkan PIN, lalu tekan Masuk untuk memulai shift.',
                descEN: 'Open the Cashier page. If employees are registered, the PIN login screen will appear. Select the employee name, enter PIN, then press Login to start the shift.',
            },
            {
                titleID: 'Akhiri shift',
                titleEN: 'End shift',
                descID: 'Klik tombol "End Shift" di header kasir untuk mengakhiri shift. Ringkasan otomatis muncul: total transaksi dan total omzet selama shift berlangsung.',
                descEN: 'Click "End Shift" in the cashier header to end the shift. A summary automatically appears: total transactions and total revenue during the shift.',
            },
            {
                titleID: 'Lihat laporan performa',
                titleEN: 'View performance report',
                descID: 'Di halaman Karyawan, buka tab "Report". Pilih periode (Today/Week/Month) untuk melihat perbandingan performa antar karyawan: jumlah shift, transaksi, dan omzet.',
                descEN: 'On the Employees page, open the "Report" tab. Select a period (Today/Week/Month) to compare employee performance: shifts, transactions, and revenue.',
            },
        ]
    },
    voucher: {
        icon: Tag,
        color: '#F59E0B',
        bg: '#FEF3C7',
        titleID: 'Diskon & Voucher',
        titleEN: 'Discounts & Vouchers',
        descID: 'Berikan diskon langsung atau buat kode voucher untuk promosi — fleksibel untuk semua jenis transaksi kasir.',
        descEN: 'Apply direct discounts or create voucher codes for promotions — flexible for all cashier transactions.',
        steps: [
            {
                titleID: 'Diskon langsung saat transaksi',
                titleEN: 'Direct discount during transaction',
                descID: 'Di halaman kasir, setelah menambahkan produk ke keranjang, scroll ke bagian bawah keranjang. Ada pilihan diskon dalam persen (%) atau nominal (Rp). Masukkan nilai diskon yang diinginkan.',
                descEN: 'On the cashier page, after adding products to cart, scroll to the bottom of the cart. There are discount options in percent (%) or nominal (Rp). Enter the desired discount value.',
            },
            {
                titleID: 'Buat kode voucher',
                titleEN: 'Create a voucher code',
                descID: 'Buka Settings → Voucher Management (PRO/ULTIMATE). Klik "+ Tambah Voucher". Isi kode unik, tipe diskon, nilai diskon, minimum pembelian, batas penggunaan, dan tanggal kedaluwarsa.',
                descEN: 'Go to Settings → Voucher Management (PRO/ULTIMATE). Click "+ Add Voucher". Fill in unique code, discount type, discount value, minimum purchase, usage limit, and expiry date.',
            },
            {
                titleID: 'Gunakan kode voucher di kasir',
                titleEN: 'Use voucher code at cashier',
                descID: 'Saat checkout, masukkan kode voucher di kolom yang tersedia lalu klik "Terapkan". Sistem akan memvalidasi kode dan langsung mengurangi total transaksi.',
                descEN: 'At checkout, enter the voucher code in the available field then click "Apply". The system will validate the code and immediately reduce the transaction total.',
            },
            {
                titleID: 'Pantau penggunaan voucher',
                titleEN: 'Monitor voucher usage',
                descID: 'Di Settings → Voucher Management, setiap voucher menampilkan berapa kali sudah digunakan (used_count) vs batas maksimum. Voucher yang sudah habis batas penggunaan otomatis tidak aktif.',
                descEN: 'In Settings → Voucher Management, each voucher shows how many times it has been used (used_count) vs maximum limit. Vouchers that reach the usage limit are automatically deactivated.',
            },
        ]
    },
    multi_outlet: {
        icon: Layout,
        color: '#8B5CF6',
        bg: '#EDE9FE',
        titleID: 'Multi Outlet',
        titleEN: 'Multi Outlet',
        descID: 'Kelola lebih dari satu cabang bisnis dari satu akun dengan mudah.',
        descEN: 'Manage more than one business branch from a single account easily.',
        steps: [
            {
                titleID: 'Apa itu fitur Multi Outlet?',
                titleEN: 'What is the Multi Outlet feature?',
                descID: 'Multi Outlet memungkinkan kamu mengelola lebih dari satu cabang bisnis dari satu akun. Setiap outlet memiliki transaksi dan produk yang terpisah.',
                descEN: 'Multi Outlet allows you to manage more than one business branch from a single account. Each outlet has separate transactions and products.',
            },
            {
                titleID: 'Siapa yang bisa menggunakan Multi Outlet?',
                titleEN: 'Who can use Multi Outlet?',
                descID: 'Fitur Multi Outlet hanya tersedia untuk pengguna paket ULTIMATE. Upgrade ke ULTIMATE untuk mengaktifkan fitur ini.',
                descEN: 'The Multi Outlet feature is only available for ULTIMATE plan users. Upgrade to ULTIMATE to activate this feature.',
            },
            {
                titleID: 'Bagaimana cara menambah outlet baru?',
                titleEN: 'How do I add a new outlet?',
                descID: 'Buka Kasir → klik dropdown nama outlet di pojok kanan atas → pilih "Kelola Outlet" → klik "+ Tambah Outlet" → isi nama, alamat, dan nomor telepon → klik Tambah.',
                descEN: 'Open Cashier → click the outlet name dropdown in the top right → select "Manage Outlets" → click "+ Add Outlet" → fill in name, address, and phone number → click Add.',
            },
            {
                titleID: 'Bagaimana cara berpindah antar outlet?',
                titleEN: 'How do I switch between outlets?',
                descID: 'Di halaman Kasir, klik dropdown nama outlet di header → pilih outlet yang ingin diaktifkan. Semua transaksi berikutnya akan tercatat di outlet tersebut.',
                descEN: 'On the Cashier page, click the outlet name dropdown in the header → select the outlet you want to activate. All subsequent transactions will be recorded under that outlet.',
            },
            {
                titleID: 'Apakah data member/loyalty berbagi antar outlet?',
                titleEN: 'Is member/loyalty data shared across outlets?',
                descID: 'Ya, data member loyalty bersifat shared — pelanggan yang sama bisa bertransaksi di semua outlet dan poin mereka tetap terhitung dalam satu akun.',
                descEN: 'Yes, loyalty member data is shared — the same customer can transact at all outlets and their points are counted across a single account.',
            },
            {
                titleID: 'Bisakah saya menghapus outlet?',
                titleEN: 'Can I delete an outlet?',
                descID: 'Ya, outlet bisa dihapus selama bukan outlet utama dan masih ada minimal 1 outlet aktif. Data transaksi yang sudah ada tidak akan terhapus.',
                descEN: 'Yes, outlets can be deleted as long as they are not the main outlet and at least 1 active outlet remains. Existing transaction data will not be deleted.',
            },
        ]
    }
};

// ─── Step item ───────────────────────────────────────────────────────────────
function StepItem({ num, title, desc, color }) {
    const [expanded, setExpanded] = useState(false);
    const border = '#E2E8F0';
    const bg = 'white';
    const text = '#0F172A';
    const sub = '#64748B';

    return (
        <div
            style={{
                border: `1px solid ${expanded ? color : border}`,
                borderRadius: 12,
                marginBottom: 10,
                background: expanded ? `${color}0d` : bg,
                transition: 'all 200ms',
                overflow: 'hidden',
            }}
        >
            <button
                onClick={() => setExpanded(v => !v)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 14, padding: '14px 16px',
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                }}
            >
                {/* Step number */}
                <span style={{
                    minWidth: 28, height: 28, borderRadius: '50%',
                    background: expanded ? color : '#F1F5F9',
                    color: expanded ? 'white' : '#64748B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, flexShrink: 0,
                    transition: 'all 200ms',
                }}>
                    {expanded ? <CheckCircle size={16} /> : num}
                </span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: text }}>{title}</span>
                {expanded
                    ? <ChevronDown size={16} style={{ color, flexShrink: 0 }} />
                    : <ChevronRight size={16} style={{ color: sub, flexShrink: 0 }} />
                }
            </button>
            {expanded && (
                <div style={{ padding: '0 16px 16px 58px' }}>
                    <p style={{ margin: 0, fontSize: 14, color: sub, lineHeight: 1.7 }}>{desc}</p>
                </div>
            )}
        </div>
    );
}

// ─── Guide tab panel ─────────────────────────────────────────────────────────
function GuidePanel({ guide, lang, finalActiveTab }) {
    const steps = guide.steps;
    return (
        <div>
            <p style={{
                margin: '0 0 20px',
                fontSize: 14, lineHeight: 1.7,
                color: '#64748B',
            }}>
                {guide['desc' + t('locale_suffix')]}
            </p>
            {steps.map((step, i) => (
                <StepItem
                    key={`${finalActiveTab}-${i}`}
                    num={i + 1}
                    title={step['title' + t('locale_suffix')]}
                    desc={step['desc' + t('locale_suffix')]}
                    color={guide.color}
                />
            ))}
        </div>
    );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function HelpCenter() {
    const { lang } = useLang();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('invoice');
    const [searchQuery, setSearchQuery] = useState('');

    const bg = '#F8FAFC';
    const card = 'white';
    const border = '#E2E8F0';
    const text = '#0F172A';
    const sub = '#64748B';

    const filteredGuides = Object.entries(guides).filter(([key, guide]) => {
        const query = searchQuery.toLowerCase();
        return (
            guide.titleID.toLowerCase().includes(query) ||
            guide.titleEN.toLowerCase().includes(query) ||
            guide.descID.toLowerCase().includes(query) ||
            guide.descEN.toLowerCase().includes(query)
        );
    });

    // Ensure activeTab is valid after filtering
    const finalActiveTab = filteredGuides.some(([key]) => key === activeTab)
        ? activeTab
        : (filteredGuides[0]?.[0] || 'invoice');

    const activeGuide = guides[finalActiveTab];

    return (
        <div className="page-enter" style={{
            minHeight: '100vh',
            background: bg,
            padding: '0 0 48px',
        }}>
            <LandingNavbar />
            <div style={{ maxWidth: 900, margin: '0 auto', paddingTop: '120px', paddingLeft: '16px', paddingRight: '16px' }}>

                {/* ── Header ── */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: '#EDE9FE',
                        color: '#7C3AED', borderRadius: 20,
                        padding: '6px 14px', fontSize: 12, fontWeight: 700,
                        marginBottom: 16, letterSpacing: 0.5,
                    }}>
                        <LifeBuoy size={14} />
                        {t('help_badge')}
                    </div>
                    <h1 style={{
                        margin: 0, fontSize: 'clamp(24px, 5vw, 36px)',
                        fontWeight: 900, color: text, lineHeight: 1.2,
                    }}>
                        {t('help_title')}
                    </h1>
                    <p style={{ margin: '10px 0 0', fontSize: 15, color: sub, maxWidth: 560 }}>
                        {t('help_desc')}
                    </p>
                </div>

                {/* ── Search Bar ── */}
                <div style={{ marginBottom: 24, position: 'relative' }}>
                    <div style={{
                        position: 'absolute', left: 14, top: '1/2', transform: 'translateY(11px)',
                        color: sub, pointerEvents: 'none'
                    }}>
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder={t('help_search_placeholder')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 14px 12px 42px',
                            borderRadius: 14,
                            background: card,
                            border: `1px solid ${border}`,
                            color: text,
                            fontSize: 14,
                            fontWeight: 600,
                            outline: 'none',
                            transition: 'all 200ms',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }}
                    />
                </div>

                {/* ── Tab selector ── */}
                <div style={{
                    display: 'flex', gap: 8,
                    flexWrap: 'wrap', marginBottom: 24,
                }}>
                    {filteredGuides.map(([key, g]) => {
                        const isActive = finalActiveTab === key;
                        const Icon = g.icon;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '10px 18px', borderRadius: 12,
                                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                    transition: 'all 200ms', border: 'none',
                                    background: isActive ? g.color : 'white',
                                    color: isActive ? 'white' : sub,
                                    boxShadow: isActive ? `0 4px 16px ${g.color}44` : '0 1px 4px rgba(0,0,0,0.08)',
                                }}
                            >
                                <Icon size={16} strokeWidth={2.5} />
                                {g['label' + t('locale_suffix')] || g['title' + t('locale_suffix')]}
                            </button>
                        );
                    })}
                    {filteredGuides.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', width: '100%', color: sub }}>
                            {t('help_no_results')}
                        </div>
                    )}
                </div>

                {/* ── Main guide card ── */}
                {activeGuide && (
                    <div style={{
                        background: card,
                        borderRadius: 20,
                        border: `1px solid ${border}`,
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                        overflow: 'hidden',
                        marginBottom: 32,
                    }}>
                        {/* Card header */}
                        <div style={{
                            padding: '24px 28px',
                            borderBottom: `1px solid ${border}`,
                            display: 'flex', alignItems: 'center', gap: 16,
                            background: `${activeGuide.color}0a`,
                        }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 14,
                                background: activeGuide.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: `0 6px 20px ${activeGuide.color}44`,
                            }}>
                                <activeGuide.icon size={24} color="white" strokeWidth={2} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: text }}>
                                    {activeGuide['title' + t('locale_suffix')]}
                                </h2>
                                <p style={{ margin: '3px 0 0', fontSize: 13, color: sub }}>
                                    {activeGuide.steps.length} {t('help_step_label')}
                                </p>
                            </div>
                        </div>

                        {/* Steps content */}
                        <div style={{ padding: '24px 24px 28px' }}>
                            <GuidePanel guide={activeGuide} lang={lang} finalActiveTab={finalActiveTab} />
                        </div>
                    </div>
                )}

                {/* ── Quick tips banner ── */}
                <div style={{
                    background: '#EDE9FE',
                    border: '1px solid #C4B5FD',
                    borderRadius: 16, padding: '20px 24px',
                    display: 'flex', gap: 16, alignItems: 'flex-start',
                    marginBottom: 32,
                }}>
                    <Zap size={20} color="#7C3AED" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#7C3AED', fontSize: 14 }}>
                            {t('help_pro_tip')}
                        </p>
                        <p style={{ margin: 0, fontSize: 13, color: '#5B21B6', lineHeight: 1.6 }}>
                            {t('help_pro_tip_desc')}
                        </p>
                    </div>
                </div>

                {/* ── Contact support card ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                    borderRadius: 20,
                    padding: '32px 28px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 24,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 'none',
                    boxShadow: '0 12px 40px rgba(124,58,237,0.35)',
                }}>
                    <div style={{ flex: '1 1 280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <MessageCircle size={24} color="white" />
                            <h3 style={{
                                margin: 0, fontSize: 20, fontWeight: 800,
                                color: 'white',
                            }}>
                                {t('help_footer_q')}
                            </h3>
                        </div>
                        <p style={{
                            margin: 0, fontSize: 14, lineHeight: 1.6,
                            color: 'rgba(255,255,255,0.85)',
                        }}>
                            {t('help_footer_desc')}
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
                        <a
                            href="mailto:support@myinvoice.space"
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '12px 20px', borderRadius: 12,
                                background: 'white',
                                color: '#7C3AED',
                                fontWeight: 700, fontSize: 14, textDecoration: 'none',
                                transition: 'all 200ms',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                            }}
                        >
                            <Mail size={16} />
                            support@myinvoice.space
                        </a>
                        <button
                            onClick={() => navigate('/contact')}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '12px 20px', borderRadius: 12,
                                background: 'transparent',
                                color: 'rgba(255,255,255,0.85)',
                                fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                border: '1px solid rgba(255,255,255,0.35)',
                                transition: 'all 200ms',
                            }}
                        >
                            {t('help_contact_page')}
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
            <LandingFooter />
        </div>
    );
}
