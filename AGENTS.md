# AGENTS.md — Permata Sakinah Backend

## 1. Tujuan

Dokumen ini mengatur AI coding agent saat membangun backend Permata Sakinah menggunakan **Node.js + Express.js REST API** dengan **MySQL 8+**.

Arsitektur wajib decoupled:
- Frontend: aplikasi yang sudah dibuat dan divalidasi secara terpisah.
- Backend: Node.js + Express.js REST API.
- Database: MySQL.
- Komunikasi frontend-backend hanya melalui HTTP API.
- Frontend tidak boleh terhubung langsung ke MySQL.

## 2. SOT adalah sumber kebenaran

Sebelum bekerja, baca:
- `docs/PRD.md`
- `docs/USER-FLOW.md`
- `docs/API-SPEC.md`
- `docs/BUSINESS-RULES.md`
- `docs/DATABASE-SPEC.md`
- `docs/IMPLEMENTATION-PLAN.md` jika tersedia
- `database/schema.sql`
- `AGENTS.md` yang sudah ada di root, bila dokumen ini ditempatkan pada direktori lain

Jika ada konflik:
1. Jangan mengarang keputusan.
2. Identifikasi file dan aturan yang bertentangan.
3. Laporkan dampaknya.
4. Minta konfirmasi untuk keputusan yang memengaruhi data, transaksi, atau kontrak API.

Jangan mengubah kontrak atau business rules secara diam-diam.

## 3. Aturan fase — database lebih dahulu

**Jangan membangun REST API sebelum database selesai, diuji, dan disetujui user.**

### Phase DB — Database setup
Fase ini dilakukan terlebih dahulu dan secara terpisah:
1. Audit `DATABASE-SPEC.md` dan `BUSINESS-RULES.md`.
2. Buat/finalisasi `database/schema.sql` yang mencakup schema dan dummy data development sesuai instruksi.
3. Pastikan target MySQL 8+, InnoDB, `utf8mb4`, dan `utf8mb4_unicode_ci`.
4. Validasi foreign key, unique constraint, index, relasi, dan konsistensi dummy data.
5. Uji pada database development kosong jika MySQL tersedia.
6. Dokumentasikan langkah import dan akun/data demo.
7. Berhenti dan tunggu persetujuan user.

Jangan membuat server Express, controller, route, service, repository, middleware, atau endpoint pada fase database.

### Phase API — Backend REST API
Fase ini baru boleh dimulai setelah user menyatakan database telah berhasil di-import dan disetujui.

Urutan:
1. Audit schema yang benar-benar terpasang.
2. Siapkan fondasi Node.js + Express.js.
3. Konfigurasi koneksi MySQL melalui environment variables.
4. Implementasikan API sesuai `API-SPEC.md`.
5. Implementasikan autentikasi dan otorisasi berdasarkan role.
6. Implementasikan business rules pada server.
7. Tambahkan error handling, validasi, logging, dan pengujian.
8. Dokumentasikan endpoint dan cara menjalankan.
9. Tunggu persetujuan sebelum integrasi ke frontend.

Kerjakan bertahap dan laporkan hasil tiap tahap. Jangan otomatis menjalankan fase berikutnya.

## 4. Stack dan batas arsitektur

- Runtime: Node.js versi LTS yang sesuai dengan lingkungan project.
- HTTP framework: Express.js.
- Database: MySQL 8+.
- Gunakan driver MySQL yang stabil (`mysql2` direkomendasikan) kecuali SOT atau user menentukan lain.
- Gunakan JavaScript modular atau TypeScript hanya jika project/SOT secara eksplisit memilihnya; jangan menambah migrasi teknologi tanpa persetujuan.
- REST API dengan JSON.
- Frontend dan backend tetap project/layer terpisah sesuai struktur repo yang ada.
- Jangan memperkenalkan microservices, message broker, Redis, GraphQL, Docker, ORM besar, atau arsitektur kompleks tanpa kebutuhan dan persetujuan eksplisit.
- Jangan mengubah stack frontend.

## 5. Struktur backend minimum

Gunakan struktur sederhana yang mudah dipelihara, disesuaikan dengan repo yang ada. Rekomendasi:

```text
backend/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── middlewares/
│   ├── validators/
│   └── utils/
├── tests/
├── .env.example
├── .gitignore
└── package.json
```

Jangan membuat lapisan kosong yang tidak digunakan. Untuk setiap fitur, gunakan separation of concerns yang proporsional:
- Routes: definisi endpoint.
- Controllers: HTTP request/response.
- Services: business rules dan orkestrasi.
- Repositories: query database.
- Validators: validasi payload.
- Middleware: autentikasi, otorisasi, dan penanganan lintas request.

## 6. Database dan SQL

- Gunakan parameterized queries; jangan menggabungkan input pengguna langsung ke string SQL.
- Jangan membuat ulang schema berbeda dari `database/schema.sql` tanpa persetujuan.
- Jangan menjalankan operasi destructive terhadap database.
- Jangan memasukkan password, token, atau secret ke repository.
- Sediakan `.env.example` tanpa nilai rahasia.
- Konfigurasi minimal: `PORT`, `NODE_ENV`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, dan konfigurasi CORS yang diperlukan.
- Gunakan connection pool yang dikonfigurasi dengan wajar.
- Gunakan transaksi database untuk operasi multi-tabel yang harus atomik.
- Jangan melakukan DDL otomatis ketika server mulai berjalan.
- Jangan mengubah struktur database diam-diam dari endpoint aplikasi.
- Hindari `SELECT *` pada endpoint produksi bila proyeksi kolom eksplisit meningkatkan keamanan/kejelasan.

## 7. Keamanan wajib

- Password diproses dengan algoritma password hashing yang sesuai, misalnya Argon2id atau bcrypt dengan parameter yang layak.
- Jangan menyimpan atau mengembalikan password maupun password hash melalui API.
- Jangan menganggap placeholder hash dari data dummy sebagai kredensial login yang valid.
- Validasi payload di server; validasi frontend bukan kontrol keamanan.
- Gunakan authentication middleware dan role-based authorization.
- Terapkan akses data customer agar customer hanya dapat membaca data miliknya sendiri.
- Gunakan CORS dengan origin frontend yang dikonfigurasi secara eksplisit; hindari membuka origin sembarang di produksi.
- Gunakan rate limiting yang wajar untuk endpoint autentikasi jika sesuai kebutuhan.
- Jangan mengirim stack trace atau detail internal ke client pada production.
- Jangan log password, token, atau data pribadi yang tidak diperlukan.
- Validasi file upload bila ada; jangan menyimpan file berbahaya tanpa pemeriksaan.
- HTTPS diwajibkan saat deployment produksi.

## 8. Business rules inti

Backend harus menegakkan, bukan sekadar menampilkan, aturan berikut:
- Role: `OWNER`, `ADMIN`, `STAFF`, `CUSTOMER` sesuai SOT.
- Kavling harus tersedia sebelum booking atau penjualan.
- Satu kavling tidak boleh memiliki lebih dari satu booking aktif.
- Kavling tidak boleh memiliki lebih dari satu penjualan terkonfirmasi.
- Snapshot harga disimpan pada booking/transaksi.
- Status booking, sales, plot, dan payment harus berpindah melalui transisi yang valid.
- Pembayaran `PENDING` bukan pembayaran terverifikasi.
- Perubahan status pembayaran dan kavling harus dilakukan oleh role yang berwenang.
- Nomor booking, sale, dan payment harus unik.
- Perhitungan harga, diskon, saldo, dan status final dilakukan atau diverifikasi di server.
- Booking expiry tidak boleh bergantung pada jam browser.
- Gunakan transaction dan locking/strategi concurrency untuk mencegah dua request bersamaan mem-booking atau menjual kavling yang sama.
- Pertahankan histori transaksi dan pembayaran; jangan menghapus histori finansial untuk “memperbaiki” data.
- Jangan mengimplementasikan aturan booking fee, durasi booking, cicilan, atau refund yang belum disepakati. Tandai sebagai keputusan TBD dan minta konfirmasi.

## 9. API design

- Ikuti `docs/API-SPEC.md`.
- Gunakan resource naming yang konsisten dan HTTP method/status code yang sesuai.
- Response JSON harus konsisten.
- Validasi query parameters, route parameters, dan body.
- Terapkan pagination untuk daftar yang dapat bertambah besar bila API-SPEC membutuhkannya.
- Filter/sort hanya dari kolom yang diizinkan; jangan memasukkan input sort mentah ke SQL.
- Jangan mengirim data sensitif yang tidak diperlukan.
- Jangan mengubah bentuk response yang digunakan frontend tanpa memperbarui API-SPEC dan mendapat persetujuan.
- Jangan menambahkan endpoint di luar kebutuhan tanpa alasan yang jelas.

## 10. Error handling dan observability

- Gunakan centralized error-handling middleware.
- Pisahkan validation errors, authentication/authorization errors, not-found errors, conflict errors, dan server errors.
- Response error tidak boleh membocorkan SQL, credentials, atau stack trace.
- Gunakan logging secukupnya untuk debugging dan audit.
- Catat aksi sensitif seperti perubahan status kavling, booking, sales, dan verifikasi payment bila audit logging termasuk scope.
- Hindari menambah platform monitoring eksternal tanpa persetujuan.

## 11. Testing

Tambahkan pengujian proporsional untuk:
- koneksi database dan health check;
- autentikasi serta akses role;
- customer hanya dapat mengakses data miliknya;
- validasi input;
- CRUD resource inti sesuai API-SPEC;
- status transition booking/sales/payment;
- konflik dua booking atau penjualan untuk kavling yang sama;
- rollback saat transaksi gagal;
- response error yang aman.

Jangan menyatakan tes berhasil jika belum dijalankan. Jika lingkungan tidak memiliki MySQL, jelaskan batas validasi dan jangan mengarang hasil.

## 12. Batas scope anti-overengineering

Jangan menambahkan hal berikut tanpa persetujuan eksplisit:
- microservices;
- event bus/message broker;
- GraphQL;
- Redis/cache layer;
- sistem akuntansi penuh;
- payment gateway;
- cicilan kompleks;
- e-signature/notaris integration;
- WhatsApp automation;
- GIS kompleks;
- multi-tenant;
- workflow approval bertingkat;
- AI recommendation;
- payroll;
- deployment/cloud infrastructure yang mengubah biaya atau arsitektur.

Jangan membuat abstraksi generik sebelum ada kebutuhan nyata.

## 13. Workflow setiap eksekusi

Sebelum coding:
1. Nyatakan fase yang sedang dikerjakan.
2. Baca file SOT terkait.
3. Periksa struktur project dan file yang sudah ada.
4. Buat daftar pekerjaan minimal dan acceptance criteria.
5. Jangan mengubah file di luar scope.

Sesudah coding:
1. Ringkas file yang berubah.
2. Jelaskan keputusan teknis yang penting.
3. Jalankan tes/lint yang tersedia.
4. Laporkan hasil nyata, termasuk tes yang gagal atau tidak dapat dijalankan.
5. Sebutkan keputusan yang masih menunggu user.
6. Berhenti dan minta approval sebelum fase berikutnya.

## 14. Kondisi selesai

### Database phase selesai bila:
- `database/schema.sql` berisi struktur dan dummy data development yang konsisten.
- Script sudah ditinjau dan, bila memungkinkan, diuji di MySQL development kosong.
- Import instructions tersedia.
- Tidak ada backend API yang dibuat.
- User telah menyetujui hasil database.

### API phase selesai bila:
- Endpoint sesuai API-SPEC.
- Business rules dan akses role ditegakkan di server.
- Operasi kritis menggunakan transaksi dan menangani concurrency.
- Tes penting dijalankan dan hasilnya dilaporkan.
- Cara setup/run terdokumentasi.
- Belum ada integrasi frontend kecuali diminta dan disetujui.

**Aturan terakhir: selesaikan database dahulu dan berhenti untuk approval. Jangan mulai REST API sampai user secara eksplisit menyatakan database siap dan meminta fase backend dimulai.**
