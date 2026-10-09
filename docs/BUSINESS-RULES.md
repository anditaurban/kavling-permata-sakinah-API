# BUSINESS-RULES.md — Permata Sakinah

> Dokumen aturan bisnis tambahan untuk SOT Permata Sakinah. Dokumen ini melengkapi `PRD.md`, `USER-FLOW.md`, `UI-GUIDELINE.md`, dan `API-SPEC.md`; tidak menggantikan dokumen tersebut.
>
> **Prioritas fase:** frontend terlebih dahulu. Aturan di bawah menjadi acuan untuk mock data dan simulasi UI. Jangan membangun database, backend, autentikasi produksi, atau integrasi pembayaran sebelum frontend mendapat sign-off.

## 1. Tujuan dan prinsip

- Menetapkan aturan minimum untuk pemasaran dan penjualan tanah kavling.
- Menjaga konsistensi status kavling, booking, pembayaran, dan transaksi.
- Meminimalkan kompleksitas: implementasikan hanya aturan yang mendukung alur inti.
- Hindari menyamakan status UI/mock dengan transaksi nyata yang tersimpan di server.
- Backend nantinya menjadi sumber kebenaran untuk harga, status kavling, hak akses, dan status pembayaran.

## 2. Role dan batas akses

| Role | Akses minimum |
|---|---|
| Owner | Melihat ringkasan bisnis, seluruh proyek/kavling, transaksi, laporan, dan pengaturan yang disediakan dalam scope. |
| Admin | Mengelola data proyek/kavling, customer, booking, transaksi, serta akun operasional sesuai izin yang diberikan. |
| Staff | Melihat data yang diperlukan untuk penjualan, membuat lead/booking, dan memproses transaksi sesuai kewenangan. Tidak boleh mengubah pengaturan sensitif. |
| Customer | Melihat informasi proyek/kavling, data booking miliknya, serta riwayat/status pembayaran miliknya sendiri. |

Aturan:
- UI boleh menyembunyikan menu berdasarkan role, tetapi backend wajib memvalidasi izin setiap request.
- Customer hanya boleh mengakses data miliknya sendiri.
- Jangan mengandalkan `role` dari client sebagai bukti otorisasi.
- Untuk fase frontend, role switching/demo login hanya simulasi dan harus diberi label bila berpotensi disangka autentikasi nyata.

## 3. Aturan proyek dan kavling

- Setiap kavling berada di bawah satu proyek.
- Setiap kavling memiliki kode unik dalam proyeknya, misalnya `A-01`.
- Harga jual disimpan sebagai nilai numerik rupiah; jangan menyimpan angka yang sudah diformat sebagai teks.
- Luas kavling harus lebih besar dari nol.
- Harga jual tidak boleh negatif.
- Kavling hanya dapat dijual jika statusnya `AVAILABLE`.
- Status yang direkomendasikan:
  - `AVAILABLE`: tersedia untuk ditawarkan.
  - `BOOKED`: sedang ditahan oleh booking aktif.
  - `SOLD`: penjualan sudah dikonfirmasi sesuai kebijakan bisnis.
  - `INACTIVE`: tidak ditawarkan untuk sementara.
- Status visual pada site plan harus menggunakan sumber data yang sama dengan daftar kavling.
- Kavling `SOLD` tidak dapat di-booking atau dijual ulang melalui alur normal.
- Perubahan harga dan status sensitif perlu tercatat pada audit log saat backend dibangun.

## 4. Aturan customer dan lead

- Customer dapat dibuat dari form inquiry, booking, atau proses penjualan.
- Normalisasi nomor telepon dilakukan secara konsisten; validasi final dilakukan backend.
- Hindari membuat customer duplikat secara tidak sengaja. Gunakan nomor telepon yang dinormalisasi sebagai salah satu sinyal pencocokan, bukan asumsi identitas yang mutlak.
- Data customer hanya dikumpulkan sejauh dibutuhkan untuk follow-up dan transaksi.
- Jangan menampilkan data pribadi customer lain di customer portal.

Status lead minimum yang direkomendasikan:
- `NEW`
- `CONTACTED`
- `INTERESTED`
- `CONVERTED`
- `CLOSED`

Status lead tidak sama dengan status booking atau pembayaran.

## 5. Aturan booking kavling

- Booking harus terhubung ke satu customer dan satu kavling.
- Booking menyimpan snapshot harga saat booking dibuat agar perubahan harga katalog tidak mengubah kesepakatan historis.
- Satu kavling hanya boleh memiliki satu booking aktif pada satu waktu.
- Booking harus memiliki waktu dibuat dan, bila berlaku, waktu kedaluwarsa.
- Status booking yang direkomendasikan:
  - `PENDING_PAYMENT`: menunggu pembayaran awal.
  - `ACTIVE`: booking sudah dikonfirmasi sesuai kebijakan.
  - `EXPIRED`: melewati batas waktu tanpa pemenuhan syarat.
  - `CANCELLED`: dibatalkan secara sah.
  - `CONVERTED`: dilanjutkan menjadi penjualan.
- Booking yang `EXPIRED`, `CANCELLED`, atau `CONVERTED` bukan booking aktif.
- Kavling dapat kembali ke `AVAILABLE` setelah booking berakhir/dibatalkan hanya jika tidak ada booking aktif lain dan belum berstatus `SOLD`.
- Durasi booking dan besaran booking fee/DP adalah kebijakan bisnis yang harus dikonfirmasi owner; jangan menanam angka asumsi ke kode produksi.
- Pada implementasi frontend, simulasi booking tidak boleh mengklaim kavling terkunci secara global jika datanya hanya lokal.

## 6. Aturan POS dan penjualan

- POS digunakan staf yang berwenang untuk membuat transaksi penjualan kavling.
- Satu transaksi penjualan standar mengacu pada satu kavling; jika kebutuhan multi-kavling muncul, konfirmasi scope dan model data terlebih dahulu.
- Harga transaksi harus disalin sebagai snapshot dari harga yang disepakati saat transaksi dibuat.
- Total transaksi dihitung dari komponen transaksi di sisi server ketika backend tersedia. Client hanya menampilkan estimasi.
- Diskon hanya dapat diterapkan oleh role yang diizinkan dan harus memiliki alasan bila kebijakan bisnis memerlukannya.
- Total tidak boleh negatif.
- Transaksi tidak boleh diselesaikan jika kavling sudah terjual atau sedang terikat oleh booking aktif milik pihak lain.
- Cegah double-submit dan transaksi ganda dengan validasi server serta idempotency/unique request key bila diperlukan.
- Jangan mengubah transaksi final secara diam-diam. Koreksi harus menggunakan mekanisme pembatalan atau penyesuaian yang tercatat.
- Nomor transaksi dibuat oleh backend, bukan hanya oleh browser.

## 7. Aturan pembayaran

- Pembayaran harus terhubung ke booking atau transaksi penjualan yang valid.
- Catat nominal, tanggal, metode, referensi, dan status pembayaran.
- Status pembayaran yang direkomendasikan:
  - `PENDING`
  - `VERIFIED`
  - `REJECTED`
  - `REFUNDED` (hanya jika kebijakan refund disetujui dan proses refund memang didukung)
- Bukti transfer yang diunggah customer bukan bukti bahwa pembayaran sudah sah; pembayaran manual perlu diverifikasi oleh role berwenang.
- Jumlah pembayaran terverifikasi tidak boleh melebihi saldo tagihan kecuali kebijakan kelebihan bayar secara eksplisit didukung.
- Saldo = total kewajiban transaksi dikurangi pembayaran terverifikasi dan penyesuaian sah.
- Status `PAID` hanya jika saldo terutang nol berdasarkan data server.
- Jangan menampilkan pembayaran sebagai berhasil hanya karena tombol submit diklik.
- Payment gateway tidak termasuk scope awal kecuali diminta secara eksplisit.

## 8. Aturan status penjualan

- Status penjualan minimum yang direkomendasikan:
  - `DRAFT`
  - `PENDING_PAYMENT`
  - `CONFIRMED`
  - `CANCELLED`
- `CONFIRMED` hanya dapat dicapai setelah pemeriksaan ketersediaan kavling dan syarat konfirmasi yang disepakati.
- Kavling menjadi `SOLD` ketika penjualan dikonfirmasi sesuai kebijakan owner, bukan sekadar ketika form transaksi dibuat.
- Pembatalan setelah pembayaran memerlukan keputusan refund/penyesuaian yang jelas; jangan otomatis menghapus riwayat pembayaran.
- Booking dan penjualan adalah entitas/status berbeda dan tidak boleh dicampur dalam satu kolom status.

## 9. Aturan laporan

- Dashboard dan laporan harus menjelaskan rentang waktu yang digunakan.
- Bedakan nilai transaksi, pembayaran terverifikasi, dan saldo piutang; ketiganya bukan metrik yang sama.
- Penjualan dihitung berdasarkan transaksi yang memenuhi definisi penjualan terkonfirmasi.
- Pembayaran masuk dihitung berdasarkan pembayaran berstatus `VERIFIED`, berdasarkan tanggal pembayaran yang disepakati untuk pelaporan.
- Data demo/mock harus diberi label dan tidak dicampur dengan data produksi.
- Filter tanggal menggunakan zona waktu operasional yang ditetapkan; simpan timestamp backend secara konsisten dan tampilkan sesuai zona waktu aplikasi.

## 10. Aturan validasi dan error

- Validasi input dilakukan di UI untuk pengalaman pengguna dan di backend untuk integritas data.
- Pesan error harus jelas dan tidak membocorkan detail internal.
- Jika dua staf mencoba mem-booking kavling yang sama, backend harus menerima paling banyak satu booking aktif.
- Jika status kavling berubah selama form terbuka, backend harus menolak aksi yang sudah tidak valid dan UI meminta pengguna memuat ulang data.
- Gunakan transaksi database untuk perubahan multi-tabel yang harus berhasil atau gagal bersama.
- Semua waktu kedaluwarsa booking harus diputuskan backend, bukan jam browser.

## 11. Audit dan keamanan

Saat backend dikembangkan, catat minimal:
- perubahan status kavling;
- pembuatan, pembatalan, dan konversi booking;
- pembuatan serta perubahan transaksi;
- verifikasi/rejeksi pembayaran;
- perubahan harga, diskon, dan akses role.

Audit record sebaiknya mencakup aktor, aksi, entitas, waktu, dan ringkasan perubahan yang relevan. Jangan menyimpan password, token, atau data rahasia ke log.

## 12. Di luar scope awal

Jangan membangun fitur berikut tanpa persetujuan eksplisit:
- akuntansi/GL lengkap;
- cicilan otomatis dan amortisasi kompleks;
- tanda tangan elektronik;
- integrasi payment gateway;
- WhatsApp API otomatis;
- GIS atau peta geospasial kompleks;
- multi-tenant;
- approval bertingkat;
- payroll;
- rekomendasi AI;
- integrasi legal/notaris otomatis.

## 13. Keputusan bisnis yang perlu dikonfirmasi

Sebelum backend final dibuat, owner perlu menetapkan:
1. Besaran booking fee/DP dan apakah dapat dikembalikan.
2. Masa berlaku booking.
3. Kapan kavling berubah menjadi `SOLD`.
4. Apakah pembayaran dicatat manual dan siapa yang memverifikasi.
5. Apakah diskon diizinkan, siapa yang berwenang, dan batasnya.
6. Apakah penjualan dapat dibatalkan setelah konfirmasi dan bagaimana refund ditangani.
7. Apakah satu transaksi boleh mencakup lebih dari satu kavling.
8. Format nomor transaksi dan zona waktu pelaporan.

Jika keputusan belum tersedia, gunakan konfigurasi eksplisit atau tandai sebagai TBD; jangan mengarang aturan finansial di kode.
