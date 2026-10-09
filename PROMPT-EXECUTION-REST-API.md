# PROMPT EXECUTION — BUILD REST API PERMATA SAKINAH

## ROLE

Bertindak sebagai Senior Backend Engineer, Node.js Engineer, MySQL Database Engineer, dan API Architect yang mengutamakan keamanan, maintainability, efisiensi, serta anti-overengineering.

## OBJECTIVE

Bangun backend REST API untuk aplikasi penjualan tanah kavling **Permata Sakinah** menggunakan:

* Node.js LTS
* Express.js
* MySQL 8+
* JavaScript modular
* REST API dengan JSON
* Driver database `mysql2`
* Arsitektur decoupled antara frontend dan backend

Frontend telah dibuat dan divalidasi secara terpisah. Backend harus mengikuti kontrak API dan kebutuhan frontend yang sudah disetujui.

**Jangan membangun ulang atau mengubah frontend.**

## 1. PRE-FLIGHT CHECK

Sebelum menulis kode, baca dokumen berikut:

1. `AGENTS.md`
2. `docs/PRD.md`
3. `docs/USER-FLOW.md`
4. `docs/API-SPEC.md`
5. `docs/BUSINESS-RULES.md`
6. `docs/DATABASE-SPEC.md`
7. `docs/IMPLEMENTATION-PLAN.md`, jika tersedia
8. `database/schema.sql`
9. `database/project_images.sql`

Periksa struktur repository dan database yang sudah dibuat.

Pastikan:

* Database `permata_sakinah` sudah berhasil di-import ke MySQL.
* Struktur tabel sesuai dengan `DATABASE-SPEC.md`.
* Dummy data development tersedia bila dibutuhkan untuk testing.
* Kontrak API dapat dipetakan ke tabel dan kolom aktual.

Jika database belum tersedia, belum disetujui, atau berbeda secara material dari SOT, **berhenti dan laporkan masalahnya**. Jangan otomatis membuat ulang schema atau mengubah database.

Jika ada konflik antardokumen, jangan mengarang keputusan. Laporkan konflik dan minta konfirmasi jika memengaruhi business rules, data, keamanan, atau kontrak API.

## 2. SCOPE IMPLEMENTASI

Bangun REST API untuk modul yang benar-benar tercantum dalam SOT dan dibutuhkan oleh frontend.

Cakupan awal:

1. Authentication dan user profile.
2. Role-based authorization.
3. Project management.
4. Plot/kavling management.
5. Customer dan lead management.
6. Booking management.
7. POS dan sales transactions.
8. Payment tracking dan verifikasi.
9. Dashboard summary.
10. Reports sederhana.
11. Health check dan error handling.

Jangan menambahkan modul yang tidak dibutuhkan oleh aplikasi.

Tidak termasuk dalam scope tanpa persetujuan:

* Payment gateway.
* Sistem cicilan kompleks.
* Akuntansi lengkap.
* Payroll.
* WhatsApp automation.
* GIS kompleks.
* Microservices.
* GraphQL.
* Redis.
* Message broker.
* AI recommendation.
* Multi-tenant.
* E-signature integration.

## 3. ARSITEKTUR BACKEND

Gunakan struktur modular sederhana berikut, disesuaikan dengan repository yang sudah ada:

```text
kavling-permata-sakinah-API/
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

Tanggung jawab setiap layer:

* `routes`: definisi endpoint dan middleware.
* `controllers`: memproses HTTP request/response.
* `services`: business rules dan orkestrasi proses bisnis.
* `repositories`: query MySQL.
* `middlewares`: autentikasi, otorisasi, dan error handling.
* `validators`: validasi request.
* `config`: konfigurasi aplikasi dan koneksi database.

Jangan membuat abstraksi generik yang tidak diperlukan.

Gunakan `mysql2/promise` dan connection pool. Gunakan parameterized queries untuk semua input yang masuk ke query SQL.

Jangan menggunakan ORM baru kecuali telah disetujui secara eksplisit.

## 4. ENVIRONMENT CONFIGURATION

Buat `.env.example` dengan variabel yang diperlukan, minimal:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=permata_sakinah
DB_USER=
DB_PASSWORD=

JWT_SECRET=
JWT_EXPIRES_IN=1h

CORS_ORIGIN=http://localhost:5173
```

Sesuaikan konfigurasi token dengan strategi autentikasi yang dipilih dalam SOT.

Aturan:

* Jangan menyimpan secret asli di repository.
* Jangan mengisi `.env.example` dengan kredensial nyata.
* Tambahkan `.env` ke `.gitignore`.
* Validasi environment variables saat aplikasi dimulai.
* Jangan mengubah schema atau menjalankan DDL otomatis saat server startup.

## 5. AUTHENTICATION DAN AUTHORIZATION

Implementasikan autentikasi sesuai `API-SPEC.md`.

Jika SOT belum menentukan mekanisme autentikasi, gunakan JWT access token dengan masa berlaku terbatas sebagai pilihan awal, lalu dokumentasikan keputusan tersebut.

Ketentuan:

* Password harus di-hash menggunakan Argon2id atau bcrypt dengan konfigurasi yang layak.
* Jangan pernah menyimpan password plaintext.
* Jangan mengembalikan password atau password hash melalui API.
* Validasi kredensial pada server.
* Implementasikan middleware autentikasi.
* Implementasikan role-based authorization.
* Jangan mempercayai role yang dikirim dari frontend.
* Customer hanya boleh mengakses data yang menjadi miliknya.
* Endpoint sensitif harus memeriksa identitas dan izin setiap request.
* Terapkan rate limiting yang wajar pada endpoint autentikasi.
* Jangan menganggap password placeholder dari dummy data sebagai kredensial valid.

Role minimum:

* `OWNER`
* `ADMIN`
* `STAFF`
* `CUSTOMER`

Hak akses harus mengikuti SOT, bukan sekadar menyembunyikan tombol atau menu pada frontend.

## 6. REST API ENDPOINTS

Gunakan `docs/API-SPEC.md` sebagai kontrak utama.

Jika API-SPEC sudah mendefinisikan endpoint, method, request, response, dan status code, ikuti definisi tersebut. Jangan membuat kontrak kedua yang berbeda.

Jika spesifikasi belum lengkap, identifikasi kebutuhan frontend dan lengkapi endpoint minimum berikut dengan konsisten.

### Authentication

* `POST /api/v1/auth/login`
* `POST /api/v1/auth/logout`, jika diperlukan oleh strategi token
* `GET /api/v1/auth/me`

### Projects

* `GET /api/v1/projects`
* `GET /api/v1/projects/:id`
* `POST /api/v1/projects`
* `PATCH /api/v1/projects/:id`
* `DELETE /api/v1/projects/:id`, hanya jika penghapusan aman dan diizinkan SOT

### Plots

* `GET /api/v1/plots`
* `GET /api/v1/plots/:id`
* `POST /api/v1/plots`
* `PATCH /api/v1/plots/:id`

Dukung filter yang diperlukan frontend, seperti project, status, block, atau pencarian kode kavling.

Jangan izinkan perubahan status sensitif melalui endpoint generik jika status tersebut harus berubah melalui proses booking atau penjualan.

### Customers dan leads

* `GET /api/v1/customers`
* `GET /api/v1/customers/:id`
* `POST /api/v1/customers`
* `PATCH /api/v1/customers/:id`
* `GET /api/v1/customers/:id/activities`, jika lead activities termasuk scope
* `POST /api/v1/customers/:id/activities`, jika diperlukan frontend

### Bookings

* `GET /api/v1/bookings`
* `GET /api/v1/bookings/:id`
* `POST /api/v1/bookings`
* `PATCH /api/v1/bookings/:id/cancel`, atau endpoint aksi setara yang ditetapkan API-SPEC

### Sales / POS

* `GET /api/v1/sales`
* `GET /api/v1/sales/:id`
* `POST /api/v1/sales`
* `PATCH /api/v1/sales/:id/confirm`, atau endpoint aksi setara sesuai API-SPEC
* Endpoint pembatalan hanya jika business rules mengizinkannya.

### Payments

* `GET /api/v1/payments`
* `GET /api/v1/payments/:id`
* `POST /api/v1/payments`
* `PATCH /api/v1/payments/:id/verify`
* Endpoint penolakan pembayaran jika dibutuhkan dalam alur.

### Dashboard dan reports

* `GET /api/v1/dashboard/summary`
* Endpoint laporan penjualan dan pembayaran sesuai kebutuhan yang sudah didefinisikan.

### Health check

* `GET /api/v1/health`

Daftar di atas merupakan usulan endpoint minimum apabila API-SPEC belum lengkap. Jangan membuat endpoint yang tidak relevan hanya karena tercantum di sini.

## 7. BUSINESS RULES WAJIB

Tegakkan aturan dalam `BUSINESS-RULES.md`.

Minimal:

### Kavling

* Kavling harus tersedia sebelum booking atau penjualan.
* Kavling `SOLD` tidak dapat dijual kembali melalui alur normal.
* Kode kavling unik dalam satu project.
* Harga transaksi harus menggunakan snapshot harga yang disepakati.

### Booking

* Satu kavling hanya boleh memiliki satu booking aktif.
* Booking harus memiliki customer, kavling, dan staf pembuat yang valid.
* Status booking harus mengikuti transisi yang diizinkan.
* Booking expired tidak boleh terus menahan kavling.
* Keputusan expiry dilakukan server, bukan browser.

### Sales

* Nomor transaksi harus unik.
* Jangan mengizinkan dua penjualan terkonfirmasi untuk kavling yang sama.
* Harga, diskon, dan total dihitung atau diverifikasi oleh server.
* Penjualan hanya dapat dikonfirmasi jika syarat bisnis terpenuhi.

### Payments

* Pembayaran pending tidak dianggap terverifikasi.
* Verifikasi pembayaran hanya boleh dilakukan oleh role yang berwenang.
* Pembayaran yang diverifikasi tidak boleh melampaui saldo terutang, kecuali kebijakan eksplisit mengizinkan.
* Perubahan status pembayaran harus tercatat.
* Riwayat pembayaran tidak boleh dihapus untuk memperbaiki transaksi.

### Concurrency

Gunakan transaksi database dan row-level locking yang sesuai untuk operasi kritis, khususnya:

1. Membuat booking.
2. Mengonfirmasi booking.
3. Mengonfirmasi penjualan.
4. Memverifikasi pembayaran.
5. Membatalkan booking dan melepaskan kavling.

Pastikan request bersamaan tidak menghasilkan booking aktif atau penjualan terkonfirmasi ganda.

Jangan mengandalkan validasi frontend atau pemeriksaan awal tanpa locking sebagai perlindungan concurrency.

## 8. VALIDATION DAN ERROR HANDLING

Validasi seluruh request di backend:

* Request body.
* Route parameters.
* Query parameters.
* Tipe data.
* Required fields.
* Status transitions.
* Hak akses.
* Relasi entitas.
* Nilai numerik dan nominal transaksi.

Gunakan centralized error-handling middleware.

Response error harus konsisten, misalnya:

```json
{
  "success": false,
  "message": "Request tidak dapat diproses",
  "errors": []
}
```

Sesuaikan bentuk response dengan `API-SPEC.md` apabila formatnya sudah ditentukan.

Gunakan status HTTP yang tepat, antara lain:

* `200`: berhasil.
* `201`: resource berhasil dibuat.
* `400`: request tidak valid.
* `401`: belum terautentikasi.
* `403`: tidak memiliki izin.
* `404`: resource tidak ditemukan.
* `409`: konflik status atau resource.
* `422`: validasi bisnis gagal, jika sesuai konvensi API.
* `500`: kesalahan internal.

Jangan mengirim SQL error, stack trace, password, token, atau detail internal kepada client.

## 9. KEAMANAN DAN KUALITAS

* Gunakan parameterized queries.
* Validasi dan sanitasi input sesuai konteks.
* Konfigurasikan CORS berdasarkan origin frontend yang disetujui.
* Gunakan security headers yang sesuai.
* Batasi payload request dan file upload jika ada.
* Jangan mengembalikan data sensitif yang tidak dibutuhkan.
* Terapkan pagination pada endpoint list yang membutuhkannya.
* Batasi kolom sort/filter pada daftar yang tersedia.
* Jangan menganggap ID yang sulit ditebak sebagai pengganti otorisasi.
* Jangan log password, token, atau data sensitif.
* Gunakan transaksi SQL untuk proses multi-tabel yang atomik.

## 10. TESTING

Buat pengujian proporsional untuk endpoint dan business rules.

Minimal uji:

1. Database connection dan health check.
2. Login berhasil dan gagal.
3. Akses endpoint tanpa autentikasi.
4. Pembatasan akses berdasarkan role.
5. Customer tidak dapat membaca data customer lain.
6. CRUD project dan kavling.
7. Validasi status kavling.
8. Booking pada kavling tersedia.
9. Penolakan booking ganda.
10. Penolakan penjualan ganda.
11. Validasi nominal dan status pembayaran.
12. Verifikasi pembayaran oleh role yang berwenang.
13. Rollback jika proses transaksi gagal.
14. Error response dan not-found handling.

Gunakan database testing terpisah. Jangan menjalankan tes yang mengubah atau menghapus data produksi.

Jangan menyatakan tes berhasil jika belum benar-benar dijalankan.

## 11. API DOCUMENTATION

Dokumentasikan:

* Endpoint dan HTTP method.
* Authentication requirement.
* Role yang diperbolehkan.
* Query parameters.
* Request body.
* Response sukses.
* Response error.
* Status HTTP.
* Business rules yang berlaku.

Simpan dokumentasi sesuai struktur project. Jika OpenAPI/Swagger belum dibutuhkan, dokumentasi Markdown sudah cukup. Jangan menambahkan tool dokumentasi besar tanpa kebutuhan.

## 12. EXECUTION PHASES

Kerjakan secara bertahap dan jangan melompat fase.

### Phase 1 — Backend Foundation

* Setup package Node.js dan Express.
* Setup environment configuration.
* Setup koneksi pool MySQL.
* Setup middleware dasar.
* Setup health check.
* Verifikasi koneksi database.

Berhenti dan laporkan hasil untuk approval.

### Phase 2 — Authentication dan Authorization

* Implementasikan login.
* Implementasikan password hashing dan token.
* Implementasikan middleware autentikasi dan role.
* Uji akses sesuai role.

Berhenti dan laporkan hasil untuk approval.

### Phase 3 — Master Data

* Projects.
* Plots.
* Customers dan leads.

Berhenti dan laporkan hasil untuk approval.

### Phase 4 — Core Transactions

* Bookings.
* Sales/POS.
* Payments.

Prioritaskan transaksi database dan concurrency safety.

Berhenti dan laporkan hasil untuk approval.

### Phase 5 — Dashboard, Reports, dan Testing

* Dashboard summary.
* Reports sederhana.
* Integrasi seluruh test suite.
* Dokumentasi endpoint dan setup.

Berhenti untuk approval sebelum integrasi frontend.

## 13. LARANGAN

Jangan:

* Mengubah frontend yang sudah disetujui.
* Mengubah database schema secara diam-diam.
* Menghapus atau membuat ulang database.
* Menambahkan fitur di luar SOT tanpa persetujuan.
* Mengganti teknologi yang telah ditetapkan.
* Membuat microservices.
* Membuat payment gateway.
* Menggunakan kredensial produksi untuk testing.
* Membuat endpoint dummy yang mengembalikan data hardcoded seolah-olah data database nyata.
* Menjalankan semua fase sekaligus tanpa approval.
* Melanjutkan fase berikutnya sebelum user menyetujuinya.

## 14. FINAL REPORT SETIAP PHASE

Setelah menyelesaikan satu fase, laporkan:

1. Fase yang selesai.
2. File yang dibuat atau diubah.
3. Endpoint yang tersedia.
4. Database tables yang digunakan.
5. Pengujian yang benar-benar dijalankan beserta hasilnya.
6. Kendala atau keputusan yang masih menunggu konfirmasi.
7. Instruksi untuk menjalankan dan menguji fase tersebut.

Jangan melanjutkan ke fase berikutnya secara otomatis.

## SUCCESS CRITERIA

Backend dianggap siap untuk integrasi apabila:

* REST API berjalan dengan Node.js dan Express.js.
* Koneksi MySQL berfungsi.
* Endpoint sesuai kontrak API.
* Authentication dan role authorization diterapkan.
* Business rules ditegakkan di server.
* Transaksi kritis aman dari konflik request bersamaan.
* Error handling dan validasi konsisten.
* Pengujian penting telah dijalankan dan hasilnya dilaporkan.
* Dokumentasi setup dan API tersedia.
* Frontend tetap tidak berubah.

**Mulai dari Phase 1 saja. Audit SOT dan database terlebih dahulu, implementasikan backend foundation, jalankan pengujian, lalu berhenti menunggu approval.**
