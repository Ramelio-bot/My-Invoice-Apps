import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const baseHtmlPath = path.join(distDir, 'index.html');

const SEO_ROUTES = [
  {
    slug: 'buat-invoice-gratis',
    breadcrumbName: 'Buat Invoice Gratis',
    title: 'Buat Invoice Online Gratis & Profesional Tanpa Login | MyInvoice',
    description: 'Buat invoice, faktur tagihan, dan PDF resmi langsung di browser tanpa login. Hitung PPN otomatis, stempel LUNAS, dan kirim tagihan via WhatsApp 100% gratis.',
    image: 'https://myinvoice.space/images/hero-invoice-showcase.png',
    faqs: [
      {
        q: 'Apakah membuat invoice di MyInvoice benar-benar gratis?',
        a: 'Ya, Anda bisa membuat invoice tagihan, memasukkan logo usaha, stempel lunas, dan mengunduh PDF secara 100% gratis tanpa perlu registrasi atau login.'
      },
      {
        q: 'Apakah invoice bisa langsung dikirim ke WhatsApp klien?',
        a: 'Bisa, MyInvoice menyediakan fitur kirim ringkasan tagihan beserta link dokumen langsung ke WhatsApp klien hanya dalam satu klik.'
      },
      {
        q: 'Apakah ada watermark pada invoice gratis?',
        a: 'Tidak ada watermark yang mengganggu. Dokumen invoice berformat A4 profesional dengan identitas bisnis Anda sendiri.'
      }
    ]
  },
  {
    slug: 'buat-kwitansi-gratis',
    breadcrumbName: 'Buat Kwitansi Gratis',
    title: 'Buat Kwitansi Pembayaran Online Gratis & Terbilang Otomatis | MyInvoice',
    description: 'Generator kwitansi pembayaran digital resmi dengan kalimat Terbilang Rupiah otomatis, stempel LUNAS, unduh PDF instan, dan kirim ke WhatsApp tanpa daftar.',
    image: 'https://myinvoice.space/images/hero-invoice-showcase.png',
    faqs: [
      {
        q: 'Bagaimana cara menghasilkan kalimat terbilang rupiah otomatis?',
        a: 'Sistem MyInvoice secara otomatis mengonversi angka nominal pembayaran menjadi kalimat ejaan rupiah resmi bahasa Indonesia tanpa perlu diketik manual.'
      },
      {
        q: 'Apakah kwitansi online ini sah untuk bukti pembayaran?',
        a: 'Ya, kwitansi dilengkapi nomor dokumen unik, tanggal transaksi, kolom tanda tangan, stempel digital lunas, dan rincian transaksi yang sah untuk pencatatan keuangan.'
      },
      {
        q: 'Apakah kwitansi bisa diunduh dalam format PDF?',
        a: 'Bisa, Anda dapat mengunduh kwitansi dalam format PDF berstandar cetak atau langsung mencetaknya ke printer.'
      }
    ]
  },
  {
    slug: 'buat-penawaran-harga-gratis',
    breadcrumbName: 'Surat Penawaran Harga',
    title: 'Buat Surat Penawaran Harga (SPH / Quotation) Gratis Online PDF | MyInvoice',
    description: 'Buat Surat Penawaran Harga (SPH / Quotation) resmi online secara gratis tanpa login. Download PDF A4, kirim ke WhatsApp klien, dan ubah jadi Invoice dalam 1 klik.',
    image: 'https://myinvoice.space/images/hero-freelance-showcase.png',
    faqs: [
      {
        q: 'Apa itu Surat Penawaran Harga (SPH)?',
        a: 'SPH atau Quotation adalah dokumen resmi yang diajukan kepada calon pelanggan untuk merinci estimasi biaya, spesifikasi barang/jasa, dan syarat pembayaran sebelum proyek dimulai.'
      },
      {
        q: 'Apakah penawaran harga bisa diubah otomatis menjadi invoice?',
        a: 'Bisa, saat penawaran harga disetujui klien, Anda dapat mengonversinya menjadi invoice resmi secara langsung.'
      }
    ]
  },
  {
    slug: 'kalkulator-hpp-gratis',
    breadcrumbName: 'Kalkulator HPP',
    title: 'Kalkulator HPP Makanan & Harga Jual GoFood Gratis | MyInvoice',
    description: 'Hitung Harga Pokok Penjualan (HPP) resep makanan & minuman per porsi, margin profit, serta simulasi komisi GoFood, GrabFood, dan ShopeeFood secara gratis.',
    image: 'https://myinvoice.space/images/hero-kafe-showcase.png',
    faqs: [
      {
        q: 'Bagaimana cara kerja Kalkulator HPP MyInvoice?',
        a: 'Anda memasukkan daftar bahan baku, jumlah beli, harga beli, dan porsi resep. Sistem otomatis menghitung biaya modal per porsi, rekomendasi harga jual, dan margin laba.'
      },
      {
        q: 'Mengapa harus menghitung komisi aplikasi pesan antar makanan?',
        a: 'Aplikasi ojek online biasanya mengenakan komisi 20%. Tanpa penyesuaian markup harga, keuntungan bersih Anda bisa berkurang drastis atau bahkan nombok.'
      }
    ]
  },
  {
    slug: 'aplikasi-kasir-offline',
    breadcrumbName: 'Aplikasi Kasir Offline',
    title: 'Aplikasi Kasir Offline Gratis (Tanpa Kuota Internet) & Cetak Struk Bluetooth | MyInvoice',
    description: 'Aplikasi kasir POS toko dan warung yang tetap jalan 100% tanpa internet. Cetak struk thermal Bluetooth 58mm/80mm di HP Android & Laptop, sinkron otomatis saat online.',
    image: 'https://myinvoice.space/images/hero-kasir-showcase.png',
    faqs: [
      {
        q: 'Apakah kasir POS MyInvoice tetap bisa digunakan tanpa internet?',
        a: 'Ya, kasir POS MyInvoice berteknologi offline-first. Anda tetap bisa memproses transaksi, mencari produk, dan mencetak struk thermal walau sinyal internet mati total.'
      },
      {
        q: 'Printer apa saja yang didukung?',
        a: 'Mendukung printer thermal Bluetooth dan USB ukuran 58mm dan 80mm yang umum digunakan di toko retail, kafe, dan warung makan.'
      }
    ]
  },
  {
    slug: 'aplikasi-kasir-kafe',
    breadcrumbName: 'Aplikasi Kasir Kafe',
    title: 'Aplikasi Kasir Kafe, Coffee Shop & Warung Makan Gratis | MyInvoice',
    description: 'Sistem POS kasir F&B modern untuk coffee shop, kedai, dan resto mini. Cetak struk dapur/barista, potong stok bahan baku resep otomatis, dan dukung pembayaran QRIS.',
    image: 'https://myinvoice.space/images/hero-kafe-showcase.png',
    faqs: [
      {
        q: 'Apakah Kasir Kafe MyInvoice mendukung tiket pesanan dapur?',
        a: 'Ya, pesanan pelanggan dapat langsung dipisahkan untuk struk kasir dan tiket pesanan dapur/barista.'
      },
      {
        q: 'Apakah stok bahan baku otomatis terpotong saat pesanan dibuat?',
        a: 'Ya, dengan menghubungkan menu ke resep HPP, stok bahan baku otomatis terpotong setiap kali kasir menyelesaikan transaksi.'
      }
    ]
  },
  {
    slug: 'software-invoice-freelance',
    breadcrumbName: 'Invoice Freelance',
    title: 'Aplikasi Invoice Freelance, Agensi & Jasa Profesional | MyInvoice',
    description: 'Kelola tagihan proyek bertahap (DP / Termin), Surat Penawaran Harga (SPH), Kwitansi, dan pengingat tagihan WhatsApp otomatis untuk freelancer dan agensi kreatif.',
    image: 'https://myinvoice.space/images/hero-freelance-showcase.png',
    faqs: [
      {
        q: 'Bagaimana cara menagih pembayaran proyek bertahap (DP dan Pelunasan)?',
        a: 'MyInvoice mendukung pembuatan invoice termin proyek (misal DP 50%, Pelunasan 50%) dengan pelacakan status pembayaran yang transparan.'
      },
      {
        q: 'Apakah cocok untuk freelancer desain dan agensi digital?',
        a: 'Sangat cocok. Dilengkapi identitas brand profesional, kalkulasi PPN/PPh otomatis, dan tautan ringkasan instan via WhatsApp.'
      }
    ]
  },
  {
    slug: 'blog',
    breadcrumbName: 'Blog & Panduan',
    title: 'Blog & Panduan Bisnis UMKM Indonesia | MyInvoice',
    description: 'Kumpulan tips manajemen keuangan, cara menghitung HPP kuliner, strategi menagih piutang klien, dan panduan kasir digital untuk UMKM Indonesia.',
    image: 'https://myinvoice.space/images/dashboard_redesign_mockup.jpg',
    faqs: [
      {
        q: 'Topik apa saja yang dibahas di Blog MyInvoice?',
        a: 'Kami membahas manajemen cash flow usaha, strategi penagihan piutang tanpa merusak relasi, cara menghitung HPP kuliner, dan tips efisiensi kasir retail.'
      }
    ]
  },
  {
    slug: 'about',
    breadcrumbName: 'Tentang Kami',
    title: 'Tentang MyInvoice — Platform Kasir POS & Dokumen Bisnis UMKM Indonesia',
    description: 'Kenali visi MyInvoice dalam membantu jutaan UMKM, kafe, dan freelancer Indonesia mendigitalisasi kasir POS, faktur tagihan, dan pembukuan usaha.',
    image: 'https://myinvoice.space/images/hero-homepage-showcase.png',
    faqs: [
      {
        q: 'Apa misi utama MyInvoice?',
        a: 'Menyediakan perangkat lunak kasir POS dan manajemen faktur bisnis yang mudah, cepat, dan terjangkau tanpa biaya langganan yang memberatkan pengusaha UMKM.'
      }
    ]
  },
  {
    slug: 'contact',
    breadcrumbName: 'Hubungi Kami',
    title: 'Hubungi Kami — Layanan Bantuan & Kemitraan MyInvoice',
    description: 'Butuh bantuan teknis atau konsultasi paket bisnis MyInvoice? Hubungi tim support kami melalui WhatsApp, email, atau formulir kontak resmi.',
    image: 'https://myinvoice.space/images/hero-homepage-showcase.png',
    faqs: [
      {
        q: 'Bagaimana cara menghubungi customer support MyInvoice?',
        a: 'Anda dapat menghubungi tim customer service resmi kami melalui WhatsApp atau email resmi yang tercantum di halaman kontak.'
      }
    ]
  },
  {
    slug: 'affiliate',
    breadcrumbName: 'Program Afiliasi',
    title: 'Program Afiliasi MyInvoice — Komisi Menarik untuk Kreator & Partner UMKM',
    description: 'Gabung program afiliasi resmi MyInvoice. Dapatkan komisi berulang dengan merekomendasikan aplikasi kasir POS dan invoice terbaik untuk UMKM Indonesia.',
    image: 'https://myinvoice.space/images/dashboard_redesign_mockup.jpg',
    faqs: [
      {
        q: 'Bagaimana cara bergabung dengan program afiliasi MyInvoice?',
        a: 'Daftar akun MyInvoice, buka menu program afiliasi, dan bagikan tautan referral unik Anda kepada rekan bisnis atau audiens media sosial Anda.'
      }
    ]
  },
  {
    slug: 'karir',
    breadcrumbName: 'Karir & Peluang',
    title: 'Karir di MyInvoice — Bergabung Membangun Teknologi POS & Invoice UMKM',
    description: 'Temukan peluang karir dan magang di MyInvoice. Mari bersama mendigitalisasi jutaan bisnis UMKM Indonesia.',
    image: 'https://myinvoice.space/images/hero-homepage-showcase.png',
    faqs: [
      {
        q: 'Apakah MyInvoice membuka peluang kerja dan magang?',
        a: 'Ya, kami membuka kesempatan bagi talenta teknologi, desain, dan pemasaran untuk bergabung memajukan ekosistem UMKM Indonesia.'
      }
    ]
  },
  {
    slug: 'invoice-untuk-desainer',
    breadcrumbName: 'Invoice Desainer',
    title: 'Software Invoice Desainer Grafis & Agensi Kreatif Gratis | MyInvoice',
    description: 'Aplikasi pembuat invoice dan faktur tagihan gratis untuk freelancer desainer grafis, UI/UX, dan agensi kreatif. Kelola DP 50%, revisi, dan kirim tagihan via WhatsApp.',
    image: 'https://myinvoice.space/images/hero-freelance-showcase.png',
    faqs: [
      {
        q: 'Kapan waktu terbaik mengirimkan invoice bagi desainer freelance?',
        a: 'Kirim invoice DP 50% sebelum pengerjaan proyek. Setelah preview disetujui, kirim invoice pelunasan sebelum menyerahkan link Figma atau file vector master AI.'
      },
      {
        q: 'Apakah bisa mencantumkan rekening bank dan instruksi pembayaran?',
        a: 'Bisa, Anda dapat menambahkan nomor rekening bank, e-wallet, dan batas waktu pembayaran langsung di invoice.'
      }
    ]
  },
  {
    slug: 'invoice-untuk-kontraktor',
    breadcrumbName: 'Invoice Kontraktor',
    title: 'Software Invoice Kontraktor Bangunan & Renovasi Rumah Gratis | MyInvoice',
    description: 'Format invoice dan tagihan termin proyek kontraktor bangunan, renovasi rumah, dan desainer interior. Kelola progres fisik lapangan, retensi 5%, dan PPh Final konstruksi.',
    image: 'https://myinvoice.space/images/hero-invoice-showcase.png',
    faqs: [
      {
        q: 'Apa itu uang retensi dalam invoice kontraktor?',
        a: 'Retensi adalah bagian dana kontrak (biasanya 5%) yang ditahan sementara oleh pemilik proyek selama masa garansi pemeliharaan fisik.'
      },
      {
        q: 'Apakah ada pembagian termin pembayaran otomatis?',
        a: 'Ya, Anda dapat memisahkan tagihan termin 1, termin 2, dan pelunasan sesuai berita acara progres fisik lapangan.'
      }
    ]
  },
  {
    slug: 'invoice-untuk-fotografer',
    breadcrumbName: 'Invoice Fotografer',
    title: 'Software Invoice Fotografer Wedding & Studio Foto Gratis | MyInvoice',
    description: 'Aplikasi invoice dan kwitansi resmi fotografer pernikahan, studio foto, dan videografer. Buat invoice booking tanggal (DP), pelunasan hari H, dan link download file cloud.',
    image: 'https://myinvoice.space/images/hero-freelance-showcase.png',
    faqs: [
      {
        q: 'Apakah bisa membuat kwitansi tanda lunas setelah klien membayar?',
        a: 'Bisa, MyInvoice menyediakan fitur Kwitansi Digital gratis yang dilengkapi kalimat terbilang rupiah otomatis dan stempel lunas.'
      },
      {
        q: 'Berapa besaran DP yang lazim diminta fotografer wedding?',
        a: 'Standar industri wedding di Indonesia adalah DP 30% saat booking jadwal, 50% menjelang acara, dan pelunasan 20% saat penyerahan album.'
      }
    ]
  },
  {
    slug: 'aplikasi-kasir-laundry',
    breadcrumbName: 'Kasir Laundry',
    title: 'Aplikasi Kasir Laundry Kiloan & Satuan Gratis Cetak Struk Bluetooth | MyInvoice',
    description: 'Software kasir POS laundry kiloan dan dry clean gratis. Cetak nota struk Bluetooth 58mm, catat nomor rak cucian, estimasi tanggal ambil, dan kirim nota ke WhatsApp pelanggan.',
    image: 'https://myinvoice.space/images/hero-kasir-showcase.png',
    faqs: [
      {
        q: 'Apakah bisa mencetak struk kasir ke printer thermal Bluetooth portabel?',
        a: 'Sangat bisa. MyInvoice mendukung printer thermal Bluetooth ukuran 58mm dan 80mm standar tanpa instal driver rumit.'
      },
      {
        q: 'Apakah bisa digunakan untuk laundry kiloan dan satuan sekaligus?',
        a: 'Bisa. Anda bisa mengatur tarif per kilogram dengan desimal maupun tarif per satuan pakaian seperti bedcover dan jas.'
      }
    ]
  },
  {
    slug: 'aplikasi-kasir-barbershop',
    breadcrumbName: 'Kasir Barbershop',
    title: 'Aplikasi Kasir Barbershop & Pangkas Rambut Gratis Cetak Struk | MyInvoice',
    description: 'Aplikasi kasir POS modern untuk barbershop, pangkas rambut pria, dan salon. Cetak struk kasir Bluetooth thermal, bagi komisi kapster transparan, dan catat riwayat cukur member.',
    image: 'https://myinvoice.space/images/hero-kasir-showcase.png',
    faqs: [
      {
        q: 'Apakah bisa digunakan di tablet atau HP kasir Android murah?',
        a: 'Bisa. MyInvoice berjalan sangat ringan di browser Google Chrome pada HP atau tablet Android apa pun.'
      },
      {
        q: 'Apakah ada pencatatan komisi kapster pemotong rambut?',
        a: 'Setiap transaksi kasir mencatat nama kapster yang melayani sehingga laporan bagi hasil harian otomatis akurat.'
      }
    ]
  }
];

if (!fs.existsSync(baseHtmlPath)) {
  console.error('dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(baseHtmlPath, 'utf-8');

for (const route of SEO_ROUTES) {
  const url = `https://myinvoice.space/${route.slug}`;
  let html = baseHtml;

  // 1. Replace <title>
  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${route.title}</title>`
  );

  // 2. Replace meta description
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${route.description}" />`
  );

  // 3. Replace canonical URL
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${url}" />`
  );

  // 4. Replace Open Graph tags
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${url}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${route.title}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${route.description}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${route.image}" />`
  );

  // 5. Replace Twitter tags
  html = html.replace(
    /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:url" content="${url}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${route.title}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${route.description}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${route.image}" />`
  );

  // 6. Build Page-Specific BreadcrumbList JSON-LD
  const breadcrumbJson = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Beranda',
        'item': 'https://myinvoice.space/'
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': route.breadcrumbName || route.title,
        'item': url
      }
    ]
  };

  // 7. Build Page-Specific FAQPage JSON-LD
  const pageFaqs = route.faqs && route.faqs.length > 0 ? route.faqs : [];
  const faqJson = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': pageFaqs.map(f => ({
      '@type': 'Question',
      'name': f.q,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': f.a
      }
    }))
  };

  const breadcrumbTag = `<script type="application/ld+json">\n${JSON.stringify(breadcrumbJson, null, 2)}\n</script>`;
  const faqTag = pageFaqs.length > 0 ? `<script type="application/ld+json">\n${JSON.stringify(faqJson, null, 2)}\n</script>` : '';

  // Replace generic root FAQPage in baseHtml with this page's targeted FAQ + Breadcrumbs
  const genericFaqRegex = /<script\s+type="application\/ld\+json">[\s\S]*?"@type":\s*"FAQPage"[\s\S]*?<\/script>/i;
  if (genericFaqRegex.test(html)) {
    html = html.replace(genericFaqRegex, `${breadcrumbTag}\n  ${faqTag}`);
  } else {
    html = html.replace('</head>', `  ${breadcrumbTag}\n  ${faqTag}\n</head>`);
  }

  const routeDir = path.join(distDir, route.slug);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), html, 'utf-8');
}

console.log(`✓ Static SEO pre-rendered HTML generated with Page-Specific Schemas & Breadcrumbs for ${SEO_ROUTES.length} routes.`);
