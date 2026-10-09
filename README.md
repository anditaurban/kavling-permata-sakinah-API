# Kavling Permata Sakinah — Backend REST API

REST API backend untuk aplikasi pemasaran dan penjualan tanah kavling syariah **Permata Sakinah**. Dibangun menggunakan **Node.js LTS**, **Express.js**, dan **MySQL 8+** dengan arsitektur decoupled.

---

## 🚀 Fitur Utama

- **Authentication & Authorization**: Login JWT, hashing kata sandi dengan bcrypt, rate limiting, dan role-based access control (`OWNER`, `ADMIN`, `STAFF`, `CUSTOMER`).
- **Master Data**:
  - Manajemen Proyek Kavling beserta galeri foto (`project_images`).
  - Inventaris Kavling (`plots`) dengan filter status, blok, harga, dan kode kavling.
  - CRM Pelanggan & Lead tracking beserta riwayat follow-up (`lead_activities`).
- **Transaksi & POS**:
  - Modul Booking dengan **concurrency locking** (`SELECT ... FOR UPDATE`) untuk mencegah double-booking.
  - Modul Penjualan POS dengan snapshot harga historis dan validasi diskon.
  - Modul Pembayaran (tanda jadi booking & pelunasan penjualan) dengan alur verifikasi multi-role.
- **Observabilitas & Laporan**:
  - Dashboard KPI ringkasan omzet, status kavling, dan transaksi terkini.
  - Laporan penjualan, pembayaran masuk, dan inventaris kavling.
  - Audit logging untuk setiap aksi transaksi penting.

---

## 🛠️ Tech Stack

* **Runtime:** Node.js (v20+ LTS)
* **Framework:** Express.js (Modular JavaScript / ES Modules)
* **Database:** MySQL 8.0+ / MariaDB 10.4+ (InnoDB, UTF8mb4)
* **Driver:** `mysql2/promise` (Connection Pooling & Parameterized Queries)
* **Security:** `helmet`, `cors`, `bcryptjs`, `jsonwebtoken`, `express-rate-limit`

---

## 📋 Persyaratan Sistem

* Node.js v20.x atau lebih baru
* MySQL 8.0+ atau MariaDB 10.4+ (misal via XAMPP)
* npm atau yarn

---

## ⚡ Instalasi & Setup

### 1. Clone Repository
```bash
git clone https://github.com/anditaurban/kavling-permata-sakinah-API.git
cd kavling-permata-sakinah-API
```

### 2. Pasang Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment
Salin berkas `.env.example` menjadi `.env` dan sesuaikan kredensial database Anda:
```bash
cp .env.example .env
```

Isi variabel di `.env`:
```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=permata_sakinah
DB_USER=root
DB_PASSWORD=

JWT_SECRET=rahasia_jwt_anda_disini
JWT_EXPIRES_IN=1h

CORS_ORIGIN=http://localhost:5173
```

### 4. Setup Database
Impor schema dan dummy data development ke database MySQL Anda:
```bash
# Melalui CLI:
mysql -u root -p < database/schema.sql
mysql -u root -p < database/project_images.sql
```
*(Atau lakukan impor via phpMyAdmin pada database `permata_sakinah`).*

### 5. Seed Password Akun Demo
Setel hash password akun demo development (`Password123!`):
```bash
npm run seed:passwords
```

---

## 🏃 Menjalankan Aplikasi

### Mode Development (Auto-reload)
```bash
npm run dev
```

### Mode Production
```bash
npm start
```

### Menjalankan Pengujian Otomatis
```bash
npm test
```

Server akan aktif di: `http://localhost:5000/`  
Health check endpoint: `http://localhost:5000/api/v1/health`

---

## 👥 Akun Demo Development (Password: `Password123!`)

| Role | Email Login | Hak Akses |
|---|---|---|
| **Owner** | `owner@permatasakinah.test` | Akses penuh finansial, laporan, dan konfirmasi penjualan |
| **Admin** | `admin@permatasakinah.test` | Kelola master data, verifikasi pembayaran, staf |
| **Staff** | `staff1@permatasakinah.test` | POS penjualan, input booking, follow-up leads |
| **Staff** | `staff2@permatasakinah.test` | POS penjualan, input booking, follow-up leads |
| **Customer** | `budi.portal@example.test` | Portal pelanggan (ID: 1, hanya data sendiri) |
| **Customer** | `ahmad.portal@example.test` | Portal pelanggan (ID: 3, hanya data sendiri) |

---

## 📖 Dokumentasi & Integrasi Frontend

* **Dokumentasi Endpoint Lengkap:** [docs/API-DOCUMENTATION.md](docs/API-DOCUMENTATION.md)
* **Panduan Integrasi Frontend:** [frontend-integration/INTEGRATION-GUIDE.md](frontend-integration/INTEGRATION-GUIDE.md)
* **Koleksi Postman Siap Pakai:** [frontend-integration/collection.json](frontend-integration/collection.json)

---

## 📄 Lisensi
Hak Cipta © 2026 Permata Sakinah. Semua hak dilindungi.
