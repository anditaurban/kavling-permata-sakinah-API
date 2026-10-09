# DATABASE-SPEC.md — Permata Sakinah (MySQL)

> Spesifikasi konseptual database untuk tahap backend mendatang. Dokumen ini melengkapi SOT yang sudah ada dan tidak membuat atau menjalankan database.
>
> **Database target:** MySQL 8.0+  
> **Engine:** InnoDB  
> **Character set:** `utf8mb4`  
> **Collation:** `utf8mb4_unicode_ci`  
> **Arsitektur:** frontend dan backend terpisah; frontend mengakses data melalui API.
>
> Jangan mulai implementasi database/backend sebelum frontend memperoleh sign-off. Gunakan dokumen ini sebagai rancangan awal, lalu selaraskan dengan keputusan bisnis yang dikonfirmasi.

## 1. Prinsip desain

- Gunakan relasi yang sederhana dan normalisasi secukupnya.
- Primary key disarankan `BIGINT UNSIGNED AUTO_INCREMENT` untuk entitas transaksional.
- Nominal uang menggunakan `DECIMAL(15,2)` atau `DECIMAL(18,2)`, bukan `FLOAT`/`DOUBLE`.
- Tanggal dan waktu operasional menggunakan `DATETIME`/`TIMESTAMP` dengan kebijakan zona waktu yang konsisten.
- Semua tabel operasional menggunakan InnoDB.
- Gunakan foreign key untuk integritas relasi.
- Tambahkan `created_at` dan `updated_at` pada tabel yang sesuai.
- Data transaksi historis menyimpan snapshot harga/nilai, tidak hanya membaca harga katalog terbaru.
- Password disimpan sebagai hash kuat dari backend; tidak pernah disimpan sebagai plaintext.
- Jangan menyimpan data kartu pembayaran.
- Status disimpan sebagai kode konsisten yang ditentukan aplikasi. Pilih `VARCHAR` dengan validasi aplikasi atau tabel referensi bila status perlu dikelola dinamis; hindari status bebas tanpa validasi.
- Penghapusan data transaksi sebaiknya dibatasi; gunakan status pembatalan/arsip agar histori terjaga.

## 2. Entitas inti

| Tabel | Fungsi | Prioritas |
|---|---|---|
| `users` | Akun owner, admin, dan staff | Core |
| `customers` | Profil customer/lead | Core |
| `projects` | Informasi proyek tanah kavling | Core |
| `plots` | Unit kavling dan status ketersediaan | Core |
| `bookings` | Booking/penahanan kavling | Core |
| `sales` | Transaksi penjualan | Core |
| `payments` | Catatan pembayaran dan verifikasi | Core |
| `audit_logs` | Jejak aksi sensitif | Recommended |
| `lead_activities` | Riwayat follow-up lead | Optional |
| `project_images` | Galeri proyek terpisah dari tabel proyek | Optional; bisa mulai dari URL sederhana di `projects` |

Customer portal dapat menggunakan data `customers` yang dikaitkan dengan akun `users` melalui `users.customer_id` nullable atau tabel penghubung `customer_accounts`, jika satu customer bisa memiliki beberapa akun. Pilih satu pendekatan setelah alur autentikasi disepakati; jangan implementasikan keduanya tanpa kebutuhan.

## 3. Rancangan kolom yang disarankan

### 3.1 `users`

- `id` BIGINT UNSIGNED PK
- `name` VARCHAR(150) NOT NULL
- `email` VARCHAR(190) NULL
- `phone` VARCHAR(30) NULL
- `password_hash` VARCHAR(255) NOT NULL
- `role` VARCHAR(30) NOT NULL — `OWNER`, `ADMIN`, `STAFF`, atau `CUSTOMER`
- `customer_id` BIGINT UNSIGNED NULL — opsional jika akun customer terhubung langsung ke profil customer
- `is_active` TINYINT(1) NOT NULL DEFAULT 1
- `last_login_at` DATETIME NULL
- `created_at`, `updated_at` DATETIME NOT NULL

Indeks/aturan:
- Unique index pada email setelah kebijakan email nullable dipastikan.
- Nomor telepon dinormalisasi di aplikasi; tentukan apakah perlu unique berdasarkan aturan bisnis.
- Foreign key `customer_id` hanya jika model hubungan customer-account dipilih.

### 3.2 `customers`

- `id` BIGINT UNSIGNED PK
- `name` VARCHAR(150) NOT NULL
- `phone` VARCHAR(30) NOT NULL
- `email` VARCHAR(190) NULL
- `identity_number` VARCHAR(50) NULL — kumpulkan hanya jika memang dibutuhkan dan kebijakan privasi disetujui
- `address` TEXT NULL
- `lead_status` VARCHAR(30) NOT NULL DEFAULT `NEW`
- `source` VARCHAR(50) NULL — misalnya landing page, referral, atau walk-in
- `notes` TEXT NULL
- `created_at`, `updated_at` DATETIME NOT NULL

Indeks:
- Index `phone`, `lead_status`, `created_at`.
- Hindari unique constraint nomor telepon sebelum aturan customer bersama/keluarga dan normalisasi disepakati.

### 3.3 `projects`

- `id` BIGINT UNSIGNED PK
- `name` VARCHAR(180) NOT NULL
- `slug` VARCHAR(200) NOT NULL
- `description` TEXT NULL
- `location_text` VARCHAR(255) NULL
- `address` TEXT NULL
- `status` VARCHAR(30) NOT NULL DEFAULT `ACTIVE`
- `cover_image_url` VARCHAR(500) NULL
- `created_at`, `updated_at` DATETIME NOT NULL

Indeks:
- Unique index `slug`.
- Index `status`.

### 3.4 `plots`

- `id` BIGINT UNSIGNED PK
- `project_id` BIGINT UNSIGNED NOT NULL FK → `projects.id`
- `plot_code` VARCHAR(50) NOT NULL
- `block_name` VARCHAR(50) NULL
- `area_sqm` DECIMAL(10,2) NOT NULL
- `price` DECIMAL(18,2) NOT NULL
- `status` VARCHAR(30) NOT NULL DEFAULT `AVAILABLE`
- `site_x` DECIMAL(8,5) NULL — koordinat relatif untuk visualisasi site plan, bukan GIS
- `site_y` DECIMAL(8,5) NULL
- `description` VARCHAR(500) NULL
- `created_at`, `updated_at` DATETIME NOT NULL

Indeks/aturan:
- Unique `(project_id, plot_code)`.
- Index `(project_id, status)`.
- Check `area_sqm > 0` dan `price >= 0` jika didukung oleh versi MySQL yang digunakan.
- `site_x`/`site_y` opsional untuk layout site plan 2D sederhana. Jangan menggunakannya sebagai koordinat geografis.

### 3.5 `bookings`

- `id` BIGINT UNSIGNED PK
- `booking_number` VARCHAR(40) NOT NULL UNIQUE
- `customer_id` BIGINT UNSIGNED NOT NULL FK → `customers.id`
- `plot_id` BIGINT UNSIGNED NOT NULL FK → `plots.id`
- `created_by` BIGINT UNSIGNED NOT NULL FK → `users.id`
- `booking_price` DECIMAL(18,2) NOT NULL — snapshot harga
- `booking_fee` DECIMAL(18,2) NOT NULL DEFAULT 0
- `status` VARCHAR(30) NOT NULL — `PENDING_PAYMENT`, `ACTIVE`, `EXPIRED`, `CANCELLED`, `CONVERTED`
- `expires_at` DATETIME NULL
- `notes` TEXT NULL
- `created_at`, `updated_at` DATETIME NOT NULL

Catatan penting:
- Aturan “satu kavling hanya punya satu booking aktif” perlu dijamin di backend/DB dengan strategi concurrency yang tepat. Unique index biasa pada `plot_id` tidak cukup karena booking historis tetap disimpan.
- Saat booking dibuat/diaktifkan, gunakan transaksi database dan lock/validasi kavling agar dua request bersamaan tidak berhasil.
- Jangan menghapus booking historis setelah expired/cancelled.

### 3.6 `sales`

- `id` BIGINT UNSIGNED PK
- `sale_number` VARCHAR(40) NOT NULL UNIQUE
- `customer_id` BIGINT UNSIGNED NOT NULL FK → `customers.id`
- `plot_id` BIGINT UNSIGNED NOT NULL FK → `plots.id`
- `booking_id` BIGINT UNSIGNED NULL FK → `bookings.id`
- `created_by` BIGINT UNSIGNED NOT NULL FK → `users.id`
- `sale_price` DECIMAL(18,2) NOT NULL — snapshot harga transaksi
- `discount_amount` DECIMAL(18,2) NOT NULL DEFAULT 0
- `total_amount` DECIMAL(18,2) NOT NULL
- `status` VARCHAR(30) NOT NULL — `DRAFT`, `PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`
- `confirmed_at` DATETIME NULL
- `notes` TEXT NULL
- `created_at`, `updated_at` DATETIME NOT NULL

Indeks/aturan:
- Index `(customer_id, created_at)` dan `(plot_id, status)`.
- Validasi `discount_amount >= 0`, `total_amount >= 0`, dan total konsisten dengan harga serta diskon.
- Bila satu penjualan dapat mencakup banyak kavling, ubah desain menjadi `sales` + `sale_items`; jangan menambahkan kompleksitas ini sebelum kebutuhan dikonfirmasi.
- Pastikan tidak ada dua penjualan `CONFIRMED` untuk kavling yang sama melalui transaksi dan validasi backend.

### 3.7 `payments`

- `id` BIGINT UNSIGNED PK
- `payment_number` VARCHAR(40) NOT NULL UNIQUE
- `sale_id` BIGINT UNSIGNED NULL FK → `sales.id`
- `booking_id` BIGINT UNSIGNED NULL FK → `bookings.id`
- `amount` DECIMAL(18,2) NOT NULL
- `method` VARCHAR(30) NOT NULL — misalnya `CASH`, `BANK_TRANSFER`, `OTHER`
- `status` VARCHAR(30) NOT NULL DEFAULT `PENDING` — `PENDING`, `VERIFIED`, `REJECTED`, `REFUNDED`
- `reference_number` VARCHAR(120) NULL
- `proof_url` VARCHAR(500) NULL
- `paid_at` DATETIME NULL
- `verified_by` BIGINT UNSIGNED NULL FK → `users.id`
- `verified_at` DATETIME NULL
- `notes` TEXT NULL
- `created_at`, `updated_at` DATETIME NOT NULL

Aturan:
- Setiap payment harus terkait ke tepat satu objek yang dapat dibayar: booking atau sale. Terapkan validasi aplikasi; bila ingin jaminan DB yang lebih ketat, pertimbangkan pemisahan `booking_payments` dan `sale_payments`.
- `amount > 0`.
- Payment `PENDING` bukan pembayaran terverifikasi dan tidak mengurangi saldo resmi.
- Jangan menghapus payment yang sudah diverifikasi; koreksi melalui status dan proses yang diaudit.
- File bukti disimpan di object/file storage; database hanya menyimpan URL/path aman.

### 3.8 `audit_logs` (recommended)

- `id` BIGINT UNSIGNED PK
- `actor_user_id` BIGINT UNSIGNED NULL FK → `users.id`
- `action` VARCHAR(80) NOT NULL
- `entity_type` VARCHAR(80) NOT NULL
- `entity_id` BIGINT UNSIGNED NULL
- `summary` VARCHAR(500) NULL
- `metadata_json` JSON NULL
- `ip_address` VARCHAR(45) NULL
- `created_at` DATETIME NOT NULL

Jangan simpan password, access token, atau data sensitif berlebihan di metadata.

### 3.9 `lead_activities` (optional)

- `id` BIGINT UNSIGNED PK
- `customer_id` BIGINT UNSIGNED NOT NULL FK → `customers.id`
- `created_by` BIGINT UNSIGNED NOT NULL FK → `users.id`
- `activity_type` VARCHAR(40) NOT NULL
- `description` TEXT NULL
- `follow_up_at` DATETIME NULL
- `created_at` DATETIME NOT NULL

Tambahkan hanya jika UI memang membutuhkan histori follow-up lead.

## 4. Relasi inti

```text
projects 1 ─── N plots
customers 1 ─── N bookings
plots 1 ─── N bookings (riwayat)
customers 1 ─── N sales
plots 1 ─── N sales (riwayat)
bookings 0..1 ─── N? payments (sesuai model pembayaran)
sales 0..1 ─── N payments
users 1 ─── N bookings (created_by)
users 1 ─── N sales (created_by)
users 1 ─── N payments (verified_by)
```

Satu kavling dapat memiliki banyak catatan booking/penjualan historis, tetapi paling banyak satu booking aktif dan satu penjualan terkonfirmasi pada waktu yang relevan. Integritas temporal ini perlu dijaga dengan transaksi, locking, dan validasi backend; foreign key saja tidak cukup.

## 5. Indeks dan integritas

Indeks minimum:
- `users`: unique email sesuai kebijakan, index role/active.
- `customers`: phone, lead_status, created_at.
- `projects`: unique slug, status.
- `plots`: unique `(project_id, plot_code)`, `(project_id, status)`.
- `bookings`: unique booking_number, `(plot_id, status)`, `(customer_id, created_at)`, expires_at.
- `sales`: unique sale_number, `(plot_id, status)`, `(customer_id, created_at)`.
- `payments`: unique payment_number, `(sale_id, status)`, `(booking_id, status)`, paid_at.

Tambahkan indeks setelah memeriksa query API nyata; hindari indeks berlebihan. Pastikan foreign key menggunakan tipe, signedness, dan panjang yang cocok.

## 6. Transaksi dan concurrency

Operasi berikut harus memakai transaksi database saat backend dibuat:
1. Membuat booking dan mengubah status kavling.
2. Mengonfirmasi penjualan dan mengubah status kavling menjadi `SOLD`.
3. Memverifikasi pembayaran dan menghitung ulang saldo/status yang bergantung padanya.
4. Membatalkan booking serta melepas kavling jika semua syarat terpenuhi.

Gunakan row-level locking/strategi concurrency agar request paralel tidak menahan atau menjual kavling yang sama. Bila transaksi gagal, seluruh perubahan yang terkait harus rollback.

## 7. API dan batas frontend

- Frontend tidak mengakses MySQL secara langsung.
- Frontend berkomunikasi hanya melalui backend API.
- API memvalidasi role, input, status transisi, ketersediaan kavling, serta nilai uang.
- Harga final, nomor transaksi, status pembayaran, dan status kavling ditentukan server.
- Mock data untuk frontend sebaiknya mengikuti nama field dan enum yang didefinisikan di API-SPEC, tetapi dapat disimpan lokal selama fase UI.
- Hindari membuat database schema berdasarkan implementasi mock yang belum disetujui; lakukan rekonsiliasi SOT setelah frontend sign-off.

## 8. Keamanan dan privasi

- Password hanya berupa hash hasil algoritma password hashing yang sesuai.
- Batasi akses customer pada data miliknya.
- Validasi upload bukti pembayaran di backend: tipe file, ukuran, dan akses.
- Jangan menyimpan secret di repository.
- Gunakan backup dan kebijakan retensi sebelum produksi.
- Batasi pengumpulan nomor identitas dan data pribadi hanya pada kebutuhan legal/operasional yang telah disetujui.
- Gunakan HTTPS di deployment.

## 9. Di luar scope database awal

Jangan menambahkan tabel untuk payroll, general ledger, cicilan kompleks, notaris/e-signature, payment gateway, WhatsApp automation, GIS, multi-tenant, atau rekomendasi AI tanpa persetujuan scope.

## 10. Sebelum membuat `schema.sql`

Konfirmasikan:
1. MySQL target pasti versi 8.0 atau lebih baru.
2. Customer portal memakai akun login atau hanya akses berbasis tautan/kode.
3. Satu transaksi untuk satu kavling atau multi-kavling.
4. Booking fee/DP, masa booking, dan kebijakan refund.
5. Definisi final kapan kavling menjadi `SOLD`.
6. Metode pembayaran dan proses verifikasi.
7. Apakah nomor telepon/email harus unik dan bagaimana duplikasi customer ditangani.
8. Apakah identitas resmi customer memang perlu disimpan.

**Deliverable berikutnya setelah frontend sign-off:** `schema.sql` untuk MySQL 8+ dan, jika diperlukan, seed/dummy data terpisah. Jangan membuat tabel atau endpoint tambahan di luar keputusan yang disetujui.
