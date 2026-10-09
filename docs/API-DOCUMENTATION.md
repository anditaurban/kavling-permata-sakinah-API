# API DOCUMENTATION — Permata Sakinah REST API

Dokumentasi teknis REST API backend Permata Sakinah (Node.js + Express.js + MySQL 8+).

Base URL: `http://localhost:5000/api/v1`

---

## 1. Standar Request & Response

### Format Response Sukses
```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

### Format Response Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Pesan deskriptif aman untuk klien",
    "details": {}
  }
}
```

---

## 2. Autentikasi & Akun Demo

Autentikasi menggunakan **JWT Bearer Token** pada header:
`Authorization: Bearer <token>`

### Akun Demo Development (Password: `Password123!`)
* **Owner:** `owner@permatasakinah.test`
* **Admin:** `admin@permatasakinah.test`
* **Staff:** `staff1@permatasakinah.test`, `staff2@permatasakinah.test`
* **Customer:** `budi.portal@example.test`, `ahmad.portal@example.test`

---

## 3. Daftar Endpoint Lengkap

### A. Health Check & Root
| Method | Endpoint | Auth | Role | Deskripsi |
|---|---|---|---|---|
| `GET` | `/` | Publik | Semua | Info server & versi API |
| `GET` | `/api/v1/health` | Publik | Semua | Health check uptime & live MySQL connection ping |

### B. Authentication (`/api/v1/auth`)
| Method | Endpoint | Auth | Role | Deskripsi |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Publik (Rate-limited) | Semua | Login dengan email & password, mengembalikan JWT token |
| `GET` | `/api/v1/auth/me` | Bearer Token | Semua | Mendapatkan profil pengguna yang sedang terautentikasi |
| `POST` | `/api/v1/auth/logout` | Bearer Token | Semua | Mengakhiri sesi pengguna |

### C. Projects (`/api/v1/projects`)
| Method | Endpoint | Auth | Role | Deskripsi |
|---|---|---|---|---|
| `GET` | `/api/v1/projects` | Publik | Semua | Daftar semua proyek aktif dengan galeri gambar & statistik kavling |
| `GET` | `/api/v1/projects/:id` | Publik | Semua | Detail proyek (bisa menggunakan ID numerik atau `slug`) |
| `POST` | `/api/v1/projects` | Bearer Token | `OWNER`, `ADMIN` | Tambah proyek baru |
| `PATCH` | `/api/v1/projects/:id` | Bearer Token | `OWNER`, `ADMIN` | Perbarui informasi proyek |
| `DELETE` | `/api/v1/projects/:id` | Bearer Token | `OWNER`, `ADMIN` | Hapus proyek (hanya jika belum memiliki kavling) |

### D. Plots / Kavling (`/api/v1/plots` & `/api/v1/lots`)
| Method | Endpoint | Auth | Role | Deskripsi |
|---|---|---|---|---|
| `GET` | `/api/v1/plots` | Publik | Semua | Filter: `projectId`, `status`, `block`, `search`, `min_price`, `max_price` |
| `GET` | `/api/v1/projects/:projectId/plots` | Publik | Semua | Daftar kavling khusus di dalam proyek tertentu |
| `GET` | `/api/v1/plots/:id` | Publik | Semua | Detail kavling spesifik |
| `POST` | `/api/v1/plots` | Bearer Token | `OWNER`, `ADMIN` | Tambah kavling baru (luas > 0, harga >= 0, kode unik per proyek) |
| `PATCH` | `/api/v1/plots/:id` | Bearer Token | `OWNER`, `ADMIN`, `STAFF` | Edit data kavling (perubahan ke `BOOKED`/`SOLD` dilindungi) |

### E. Customers & Leads (`/api/v1/customers`)
| Method | Endpoint | Auth | Role | Deskripsi |
|---|---|---|---|---|
| `GET` | `/api/v1/customers` | Bearer Token | `OWNER`, `ADMIN`, `STAFF` | Daftar customer/leads dengan filter status lead & pencarian |
| `GET` | `/api/v1/customers/:id` | Bearer Token | `OWNER`, `ADMIN`, `STAFF`, `CUSTOMER` | Detail profil customer (Customer diisolasi hanya untuk ID miliknya) |
| `POST` | `/api/v1/customers` | Bearer Token | `OWNER`, `ADMIN`, `STAFF` | Tambah customer/lead baru (nomor telepon dinormalisasi) |
| `PATCH` | `/api/v1/customers/:id` | Bearer Token | `OWNER`, `ADMIN`, `STAFF` | Perbarui data customer |
| `GET` | `/api/v1/customers/:id/activities` | Bearer Token | `OWNER`, `ADMIN`, `STAFF` | Riwayat aktivitas interaksi sales & follow-up |
| `POST` | `/api/v1/customers/:id/activities` | Bearer Token | `OWNER`, `ADMIN`, `STAFF` | Catat aktivitas baru (telepon, WhatsApp, survey lokasi) |

### F. Bookings (`/api/v1/bookings`)
| Method | Endpoint | Auth | Role | Deskripsi |
|---|---|---|---|---|
| `GET` | `/api/v1/bookings` | Bearer Token | Semua | Daftar booking (Customer hanya melihat booking miliknya) |
| `GET` | `/api/v1/bookings/:id` | Bearer Token | Semua | Detail booking dan histori pembayarannya |
| `POST` | `/api/v1/bookings` | Bearer Token | Semua | Buat booking dengan **row-level locking** transaksi database. Kavling berubah ke `BOOKED` |
| `PATCH` | `/api/v1/bookings/:id/cancel` | Bearer Token | `OWNER`, `ADMIN`, `STAFF` | Batalkan booking dan lepaskan kavling kembali ke `AVAILABLE` |

### G. Sales / POS (`/api/v1/sales` & `/api/v1/transactions`)
| Method | Endpoint | Auth | Role | Deskripsi |
|---|---|---|---|---|
| `GET` | `/api/v1/sales` | Bearer Token | Semua | Daftar transaksi penjualan (Customer hanya melihat miliknya) |
| `GET` | `/api/v1/sales/:id` | Bearer Token | Semua | Detail transaksi, kalkulasi saldo sisa, dan list pembayaran |
| `POST` | `/api/v1/sales` | Bearer Token | `OWNER`, `ADMIN`, `STAFF` | Buat transaksi penjualan dengan snapshot harga dan verifikasi diskon |
| `PATCH` | `/api/v1/sales/:id/confirm` | Bearer Token | `OWNER`, `ADMIN` | Konfirmasi transaksi penjualan, kavling resmi berubah status ke `SOLD` |

### H. Payments (`/api/v1/payments`)
| Method | Endpoint | Auth | Role | Deskripsi |
|---|---|---|---|---|
| `GET` | `/api/v1/payments` | Bearer Token | Semua | Daftar pembayaran dengan filter `sale_id`, `booking_id`, `status` |
| `GET` | `/api/v1/payments/:id` | Bearer Token | Semua | Detail pembayaran |
| `POST` | `/api/v1/payments` | Bearer Token | Semua | Catat pembayaran (terhubung eksklusif ke booking atau sale) |
| `PATCH` | `/api/v1/payments/:id/verify` | Bearer Token | `OWNER`, `ADMIN` | Verifikasi pembayaran via transaksi database |
| `PATCH` | `/api/v1/payments/:id/reject` | Bearer Token | `OWNER`, `ADMIN` | Tolak pembayaran |

### I. Dashboard Management (`/api/v1/dashboard`)
| Method | Endpoint | Auth | Role | Deskripsi |
|---|---|---|---|---|
| `GET` | `/api/v1/dashboard/summary` | Bearer Token | `OWNER`, `ADMIN`, `STAFF` | Ringkasan KPI pendapatan, booking fee, breakdown kavling, & leads |
| `GET` | `/api/v1/dashboard/lot-status` | Bearer Token | `OWNER`, `ADMIN`, `STAFF` | Statistik ketersediaan kavling (`AVAILABLE`, `BOOKED`, `SOLD`, `INACTIVE`) |
| `GET` | `/api/v1/dashboard/recent-transactions`| Bearer Token | `OWNER`, `ADMIN`, `STAFF` | Daftar 5 transaksi terkini |

### J. Reports (`/api/v1/reports`)
| Method | Endpoint | Auth | Role | Deskripsi |
|---|---|---|---|---|
| `GET` | `/api/v1/reports/sales` | Bearer Token | `OWNER`, `ADMIN` | Laporan transaksi penjualan terkonfirmasi |
| `GET` | `/api/v1/reports/payments` | Bearer Token | `OWNER`, `ADMIN` | Laporan penerimaan kas pembayaran terverifikasi |
| `GET` | `/api/v1/reports/plots` | Bearer Token | `OWNER`, `ADMIN` | Laporan inventaris tanah kavling per proyek |

---

## 4. Cara Menjalankan Server & Pengujian

```bash
# 1. Jalankan test otomatis (Phase 1 s/d Phase 5):
npm test

# 2. Reset/re-seed password akun development (Password123!):
npm run seed:passwords

# 3. Jalankan server mode development (auto-reload):
npm run dev

# 4. Jalankan server mode production:
npm start
```
