import { scheduleMyInvoicePost } from './repliz_service.mjs';

const title = "SALDO KOSONG PADAHAL TOKO LARIS?";

const caption = `Pernah ngalamin barang di toko laku keras tiap hari, tapi pas akhir bulan dicek saldonya kok tipis banget? 🤔

Waspada, ini bukan karena dagangan sepi, tapi karena 3 "BOCOR HALUS" yang sering gak disadari pemilik usaha:

1️⃣ Ambil Barang Sendiri Gak Dicatat
"Ah cuma sebungkus rokok / sebotol teh". Kalau sehari 25 ribu, sebulan 750 ribu lenyap tanpa jejak.

2️⃣ Bon Kertas Kasbon Hilang / Lupa
Catat utang langganan di sobekan kertas, pas kertasnya basah atau keselip, bingung nagihnya berapa.

3️⃣ Uang Modal Campur Uang Jajan
Hasil penjualan langsung masuk kantong celana. Begitu mau kulakan barang baru, uang kas toko udah kepakai belanja pribadi.

💡 SOLUSI PRAKTIS:
Mulai sekarang, biasakan rapikan transaksi dan stok barang pakai sistem kasir otomatis.

Kabar baiknya, kamu gak perlu beli mesin kasir mahal jutaan rupiah:
✅ Pakai HP biasa udah bisa
✅ 100% KASIR OFFLINE (Tetap jalan normal meski mati lampu / tanpa kuota internet)
✅ Bisa cetak struk via printer Bluetooth kasir (58mm/80mm)
✅ Laporan omzet dan laba rugi otomatis rapi

Coba GRATIS sekarang tanpa kartu kredit di:
👉 https://myinvoice.space
(Bisa langsung dibuka di browser HP / Laptop tanpa ribet download)

#bisnisumkm #aplikasikasir #kelolabisnis #tipsusaha #tokokelontong #warungmadura #myinvoice #kasironline #kasiroffline #edukasibisnis #manajemenkeuangan`;

async function main() {
  console.log("=== SCHEDULING MYINVOICE SAMPLE POST TO IG & FB ===");
  const targetTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  console.log("Schedule Time (ISO):", targetTime.toISOString());
  console.log("Schedule Time (WIB):", targetTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));

  const res = await scheduleMyInvoicePost({
    title,
    caption,
    imageUrl: "https://d.uguu.se/piZaNyhF.jpg",
    scheduleAt: targetTime
  });

  console.log("\n=== REPLIZ API RESPONSE ===");
  console.log(JSON.stringify(res, null, 2));
}

main().catch(console.error);
