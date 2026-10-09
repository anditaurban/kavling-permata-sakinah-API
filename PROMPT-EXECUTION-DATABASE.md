# PROMPT-EXECUTION — FINALIZE `database/schema.sql` WITH DUMMY DATA
## Project: Permata Sakinah

### ROLE
Bertindak sebagai Senior MySQL Database Engineer. Kerjakan secara hemat, konsisten terhadap SOT, dan tanpa over-engineering.

### OBJECTIVE
Perbarui atau buat `database/schema.sql` untuk MySQL 8.0+ yang berisi **struktur database sekaligus data dummy untuk development**. Database harus disiapkan terlebih dahulu sebelum implementasi REST API.

### READ FIRST
Baca dokumen berikut:
- `AGENTS.md`
- `docs/PRD.md`
- `docs/USER-FLOW.md`
- `docs/API-SPEC.md`
- `docs/BUSINESS-RULES.md`
- `docs/DATABASE-SPEC.md`

Jika dokumen tidak ada atau terdapat konflik, laporkan. Jangan mengarang aturan bisnis finansial yang belum diputuskan.

### DATABASE REQUIREMENTS
- Database: `permata_sakinah`
- MySQL 8.0+
- Engine: InnoDB
- Charset: `utf8mb4`
- Collation: `utf8mb4_unicode_ci`
- Sertakan `CREATE DATABASE IF NOT EXISTS` dan `USE permata_sakinah`.
- Gunakan urutan CREATE TABLE yang aman terhadap foreign key.
- Gunakan primary key, foreign key, unique constraint, index, serta tipe data sesuai `DATABASE-SPEC.md`.
- Nominal uang harus menggunakan `DECIMAL`, bukan `FLOAT`/`DOUBLE`.
- Jangan gunakan `DROP DATABASE` atau `DROP TABLE`.
- Jangan membuat trigger, stored procedure, atau tabel tambahan yang tidak dibutuhkan SOT.

### DUMMY DATA REQUIREMENTS
Tambahkan data dummy yang realistis dan saling terhubung untuk development:
- 1 akun demo owner
- 1 akun demo admin
- 2 akun demo staff
- 5–8 customer demo
- 1–2 project kavling
- 12–20 kavling dengan kombinasi status `AVAILABLE`, `BOOKED`, `SOLD`, dan `INACTIVE`
- 3–5 booking historis/aktif
- 2–4 sales dengan status berbeda yang valid
- pembayaran yang terhubung secara benar dengan booking atau sales
- audit logs dan lead activities hanya jika tabel tersebut memang dibuat sesuai SOT.

Buat data cukup untuk menguji dashboard, filter status kavling, detail project, booking, POS/penjualan, payment tracking, dan laporan ringkas.

### DUMMY DATA SAFETY
- Gunakan nama, email, nomor telepon, alamat, dan referensi yang sepenuhnya fiktif.
- Jangan memakai data pribadi orang nyata.
- Jika data akun demo menyertakan password untuk pengujian, dokumentasikan dengan jelas bahwa password tersebut hanya placeholder development. Jangan simpan password plaintext ke kolom `password_hash`.
- Lebih aman gunakan nilai hash placeholder yang jelas bukan kredensial produksi, misalnya `REPLACE_WITH_VALID_DEV_PASSWORD_HASH`; backend tidak boleh menganggap placeholder itu sebagai hash autentikasi yang valid.
- Jangan membuat klaim bahwa akun demo dapat login sampai backend menggunakan hash yang sesuai.
- Nomor transaksi/booking/payment harus unik.
- Semua foreign key harus menunjuk data yang benar-benar ada.
- Jangan membuat dua booking aktif untuk kavling yang sama.
- Jangan membuat dua sales `CONFIRMED` untuk kavling yang sama.
- Status kavling, booking, sales, dan payments harus konsisten satu sama lain.
- Jumlah payment terverifikasi jangan melampaui total tagihan, kecuali SOT secara eksplisit mengizinkannya.
- Jangan mengarang besaran DP, booking fee, masa booking, atau kebijakan refund. Jika nilai bisnis belum ditetapkan, gunakan nilai dummy yang diberi label development dan jangan jadikan default kebijakan produksi.

### REPEATABILITY
Targetnya database kosong. Script harus dapat dijalankan dari awal pada database kosong.

Jangan menjanjikan bahwa semua INSERT aman dijalankan berulang kali kecuali memang dibuat idempotent dengan strategi yang benar. Hindari `REPLACE INTO` jika dapat menghapus lalu memasukkan ulang baris dan mengganggu relasi. Dokumentasikan bahwa untuk reset total development, gunakan database kosong yang baru, bukan perintah DROP di dalam script.

### VALIDATION
Periksa:
1. Sintaks kompatibel MySQL 8.0+.
2. Urutan tabel sesuai dependensi foreign key.
3. Semua foreign key valid.
4. Semua nomor unik.
5. Tidak ada status yang saling bertentangan.
6. Data dummy mendukung relasi dan business rules.
7. Script tidak mengandung perintah DROP.
8. Dummy data berada di file `schema.sql` sesuai permintaan.
9. Jika MySQL lokal tersedia, uji pada database development kosong. Jika tidak, lakukan static review dan nyatakan belum diuji secara langsung.

### SCOPE BOUNDARY
Task ini hanya mengerjakan `database/schema.sql`.

Jangan:
- Membuat REST API.
- Membuat server Node.js/Express.
- Membuat `.env`.
- Mengubah frontend.
- Menambah ORM atau library.
- Membuat file backend.
- Mengubah SOT selain jika diminta.
- Menggunakan kredensial produksi.

### FINAL REPORT
Laporkan:
- File yang dibuat/diubah.
- Daftar tabel dan jumlah data dummy per tabel.
- Cara menjalankan melalui MySQL CLI atau phpMyAdmin.
- Hasil validasi, termasuk apakah benar-benar diuji dengan MySQL.
- Placeholder atau keputusan bisnis yang masih perlu dikonfirmasi.

**Kerjakan database terlebih dahulu. Jangan mulai REST API sampai ada instruksi eksplisit setelah database selesai dan disetujui.**
