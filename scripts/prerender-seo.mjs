import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const baseHtmlPath = path.join(distDir, 'index.html');

const SEO_ROUTES = [
  {
    slug: 'buat-invoice-gratis',
    title: 'Buat Invoice Online Gratis & Profesional Tanpa Login | MyInvoice',
    description: 'Buat invoice, faktur tagihan, dan PDF resmi langsung di browser tanpa login. Hitung PPN otomatis, stempel LUNAS, dan kirim tagihan via WhatsApp 100% gratis.',
    image: 'https://myinvoice.space/images/hero-invoice-showcase.png'
  },
  {
    slug: 'buat-kwitansi-gratis',
    title: 'Buat Kwitansi Pembayaran Online Gratis & Terbilang Otomatis | MyInvoice',
    description: 'Generator kwitansi pembayaran digital resmi dengan kalimat Terbilang Rupiah otomatis, stempel LUNAS, unduh PDF instan, dan kirim ke WhatsApp tanpa daftar.',
    image: 'https://myinvoice.space/images/hero-invoice-showcase.png'
  },
  {
    slug: 'kalkulator-hpp-gratis',
    title: 'Kalkulator HPP Makanan & Harga Jual GoFood Gratis | MyInvoice',
    description: 'Hitung Harga Pokok Penjualan (HPP) resep makanan & minuman per porsi, margin profit, serta simulasi komisi GoFood, GrabFood, dan ShopeeFood secara gratis.',
    image: 'https://myinvoice.space/images/cafe-pos-hero.png'
  },
  {
    slug: 'aplikasi-kasir-offline',
    title: 'Aplikasi Kasir Offline Gratis (Tanpa Kuota Internet) & Cetak Struk Bluetooth | MyInvoice',
    description: 'Aplikasi kasir POS toko dan warung yang tetap jalan 100% tanpa internet. Cetak struk thermal Bluetooth 58mm/80mm di HP Android & Laptop, sinkron otomatis saat online.',
    image: 'https://myinvoice.space/images/cafe-pos-hero.png'
  },
  {
    slug: 'aplikasi-kasir-kafe',
    title: 'Aplikasi Kasir Kafe, Coffee Shop & Warung Makan Gratis | MyInvoice',
    description: 'Sistem POS kasir F&B modern untuk coffee shop, kedai, dan resto mini. Cetak struk dapur/barista, potong stok bahan baku resep otomatis, dan dukung pembayaran QRIS.',
    image: 'https://myinvoice.space/images/cafe-pos-hero.png'
  },
  {
    slug: 'software-invoice-freelance',
    title: 'Aplikasi Invoice Freelance, Agensi & Jasa Profesional | MyInvoice',
    description: 'Kelola tagihan proyek bertahap (DP / Termin), Surat Penawaran Harga (SPH), Kwitansi, dan pengingat tagihan WhatsApp otomatis untuk freelancer dan agensi kreatif.',
    image: 'https://myinvoice.space/images/freelance-invoice-hero.png'
  },
  {
    slug: 'blog',
    title: 'Blog & Panduan Bisnis UMKM Indonesia | MyInvoice',
    description: 'Kumpulan tips manajemen keuangan, cara menghitung HPP kuliner, strategi menagih piutang klien, dan panduan kasir digital untuk UMKM Indonesia.',
    image: 'https://myinvoice.space/favicon.svg'
  },
  {
    slug: 'about',
    title: 'Tentang MyInvoice — Platform Kasir POS & Dokumen Bisnis UMKM Indonesia',
    description: 'Kenali visi MyInvoice dalam membantu jutaan UMKM, kafe, dan freelancer Indonesia mendigitalisasi kasir POS, faktur tagihan, dan pembukuan usaha.',
    image: 'https://myinvoice.space/favicon.svg'
  },
  {
    slug: 'contact',
    title: 'Hubungi Kami — Layanan Bantuan & Kemitraan MyInvoice',
    description: 'Butuh bantuan teknis atau konsultasi paket bisnis MyInvoice? Hubungi tim support kami melalui WhatsApp, email, atau formulir kontak resmi.',
    image: 'https://myinvoice.space/favicon.svg'
  },
  {
    slug: 'affiliate',
    title: 'Program Afiliasi MyInvoice — Komisi Menarik untuk Kreator & Partner UMKM',
    description: 'Gabung program afiliasi resmi MyInvoice. Dapatkan komisi berulang dengan merekomendasikan aplikasi kasir POS dan invoice terbaik untuk UMKM Indonesia.',
    image: 'https://myinvoice.space/favicon.svg'
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

  // Replace <title>
  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${route.title}</title>`
  );

  // Replace meta description
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${route.description}" />`
  );

  // Replace canonical URL
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${url}" />`
  );

  // Replace Open Graph tags
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

  // Replace Twitter tags
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

  const routeDir = path.join(distDir, route.slug);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), html, 'utf-8');
}

console.log(`✓ Static SEO pre-rendered HTML generated for ${SEO_ROUTES.length} routes.`);
