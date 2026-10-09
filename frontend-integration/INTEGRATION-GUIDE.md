# PANDUAN INTEGRASI FRONTEND — REST API PERMATA SAKINAH

Dokumen ini adalah acuan resmi bagi tim Frontend untuk mengintegrasikan antarmuka pengguna (React / Vite) dengan Backend REST API Permata Sakinah.

---

## 1. Arsitektur & Informasi Koneksi

* **Base URL Backend (Produksi - Vercel):** `https://kavling-permata-sakinah-api.vercel.app/api/v1`
* **Base URL Backend (Lokal):** `http://localhost:5000/api/v1`
* **Format Payload:** `application/json` (UTF-8)
* **Protokol:** HTTPS (Produksi) / HTTP (Lokal)
* **CORS:** Diizinkan untuk origin frontend (`*` atau domain frontend)
* **Koleksi Postman:** File siap pakai tersedia di `frontend-integration/collection.json`

---

## 2. Struktur Standar Response

Semua endpoint menghasilkan struktur JSON yang konsisten sesuai `docs/API-SPEC.md`.

### A. Response Berhasil (HTTP 200 / 201)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 16
  }
}
```

### B. Response Gagal (HTTP 400 / 401 / 403 / 404 / 409 / 422 / 500)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Pesan deskriptif untuk ditampilkan ke pengguna",
    "details": {
      "email": "Format email tidak valid"
    }
  }
}
```

---

## 3. Autentikasi & Manajemen Sesi

### Header Wajib untuk Rute Terproteksi
```http
Authorization: Bearer <TOKEN_JWT_DARI_LOGIN>
Content-Type: application/json
```

### Rekomendasi Sisi Frontend
1. Simpan token JWT yang diterima dari endpoint `/auth/login` ke dalam `localStorage` atau `sessionStorage`.
2. Jika API mengembalikan response status `401 Unauthorized` dengan kode `TOKEN_EXPIRED` atau `INVALID_TOKEN`, otomatis bersihkan token dan arahkan pengguna ke halaman `/login`.

---

## 4. Akun Demo Development untuk Pengujian

Gunakan password yang sama untuk seluruh akun demo: **`Password123!`**

| Role | Email Login | Password | Akses Halaman |
|---|---|---|---|
| **OWNER** | `owner@permatasakinah.test` | `Password123!` | Dashboard, Ringkasan Finansial, Laporan, Approval |
| **ADMIN** | `admin@permatasakinah.test` | `Password123!` | Kelola Proyek, Kavling, Customer, Verifikasi Pembayaran |
| **STAFF** | `staff1@permatasakinah.test` | `Password123!` | POS Penjualan, Input Booking, Follow-up Leads |
| **STAFF** | `staff2@permatasakinah.test` | `Password123!` | POS Penjualan, Input Booking, Follow-up Leads |
| **CUSTOMER** | `budi.portal@example.test` | `Password123!` | Portal Pelanggan (Customer ID: 1) |
| **CUSTOMER** | `ahmad.portal@example.test` | `Password123!` | Portal Pelanggan (Customer ID: 3) |

---

## 5. Katalog Lengkap Endpoint, Request, dan Response

### 5.1. Authentication

#### `POST /auth/login`
* **Deskripsi:** Autentikasi kredensial pengguna.
* **Header:** `Content-Type: application/json`
* **Body Request:**
  ```json
  {
    "email": "admin@permatasakinah.test",
    "password": "Password123!"
  }
  ```
* **Response Sukses (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 2,
        "name": "Siti Sarah",
        "email": "admin@permatasakinah.test",
        "phone": "081100000002",
        "role": "ADMIN",
        "customer_id": null,
        "is_active": true
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "Bearer",
      "expires_in": "1h"
    },
    "meta": {}
  }
  ```
* **Response Gagal (401 Unauthorized):**
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_CREDENTIALS",
      "message": "Email atau password tidak valid",
      "details": {}
    }
  }
  ```

#### `GET /auth/me`
* **Deskripsi:** Mendapatkan data profil pengguna yang sedang login.
* **Header:** `Authorization: Bearer <token>`
* **Response Sukses (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 2,
        "name": "Siti Sarah",
        "email": "admin@permatasakinah.test",
        "phone": "081100000002",
        "role": "ADMIN",
        "customer_id": null,
        "is_active": true,
        "last_login_at": "2026-10-09 21:05:00",
        "created_at": "2026-01-01 00:00:00"
      }
    },
    "meta": {}
  }
  ```

---

### 5.2. Projects

#### `GET /projects`
* **Deskripsi:** Mengambil semua proyek untuk katalog publik atau manajemen.
* **Akses:** Publik
* **Response Sukses (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Permata Sakinah 1 - Cihanjuang",
        "slug": "permata-sakinah-1-cihanjuang",
        "description": "Kawasan kavling hunian syariah asri dengan view perbukitan di Cihanjuang...",
        "location_text": "Cihanjuang, Parongpong, Bandung Barat",
        "address": "Jl. Cihanjuang Rahayu No. 88, Parongpong, Kab. Bandung Barat",
        "status": "ACTIVE",
        "cover_image_url": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80",
        "total_plots": 10,
        "available_plots": 5,
        "images": [
          {
            "id": 1,
            "project_id": 1,
            "image_url": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80",
            "caption": "Foto Utama - Hamparan Kavling Asri Permata Sakinah 1",
            "is_primary": 1,
            "sort_order": 1
          }
        ]
      }
    ],
    "meta": {
      "total": 2
    }
  }
  ```

#### `GET /projects/:id` (bisa ID atau slug)
* **Deskripsi:** Detail satu proyek spesifik beserta galeri foto dan jumlah kavling tersedia.
* **Contoh:** `GET /projects/permata-sakinah-1-cihanjuang` atau `GET /projects/1`

---

### 5.3. Plots / Kavling

#### `GET /plots`
* **Deskripsi:** Daftar inventaris kavling dengan filter pencarian dan status.
* **Query Params:**
  * `projectId` (opsional): ID proyek
  * `status` (opsional): `AVAILABLE`, `BOOKED`, `SOLD`, `INACTIVE`
  * `block` (opsional): Nama blok, misal `Blok A`
  * `search` (opsional): Pencarian kode kavling
  * `min_price`, `max_price` (opsional): Rentang harga
* **Response Sukses (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "project_id": 1,
        "project_name": "Permata Sakinah 1 - Cihanjuang",
        "plot_code": "A-01",
        "code": "A-01",
        "block_name": "Blok A",
        "block": "Blok A",
        "area_sqm": 84,
        "area_m2": 84,
        "price": 252000000,
        "status": "SOLD",
        "site_x": 0.12,
        "site_y": 0.25,
        "description": "Kavling sudut hadap timur"
      }
    ],
    "meta": {
      "total": 1
    }
  }
  ```

#### `POST /plots`
* **Role:** `OWNER`, `ADMIN`
* **Body Request:**
  ```json
  {
    "project_id": 1,
    "plot_code": "A-05",
    "block_name": "Blok A",
    "area_sqm": 84,
    "price": 252000000,
    "status": "AVAILABLE",
    "site_x": 0.52,
    "site_y": 0.25,
    "description": "Kavling hadap timur siap bangun"
  }
  ```

---

### 5.4. Customers & Leads

#### `GET /customers`
* **Role:** `OWNER`, `ADMIN`, `STAFF`
* **Query Params:** `lead_status`, `search`
* **Response Sukses (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Budi Santoso",
        "phone": "081234567801",
        "email": "budi.santoso@example.test",
        "identity_number": "3201010101900001",
        "address": "Jl. Merdeka No. 12, Bandung",
        "lead_status": "CONVERTED",
        "source": "LANDING_PAGE",
        "notes": "Customer pembeli kavling A-01"
      }
    ],
    "meta": {
      "total": 7
    }
  }
  ```

#### `POST /customers`
* **Body Request:**
  ```json
  {
    "name": "Irvan Pratama",
    "phone": "081299887766",
    "email": "irvan@example.test",
    "address": "Jl. Riau No. 10, Bandung",
    "lead_status": "NEW",
    "source": "LANDING_PAGE",
    "notes": "Tertarik survei lokasi akhir pekan"
  }
  ```

#### `POST /customers/:id/activities`
* **Body Request:**
  ```json
  {
    "activity_type": "PHONE_CALL",
    "description": "Konfirmasi rencana survei hari Sabtu",
    "follow_up_at": "2026-10-14 10:00:00"
  }
  ```

---

### 5.5. Bookings

#### `POST /bookings`
* **Deskripsi:** Mengunci kavling sementara waktu. Menggunakan transaksi database agar aman dari booking ganda.
* **Body Request:**
  ```json
  {
    "customer_id": 2,
    "plot_id": 3,
    "booking_fee": 5000000,
    "expires_in_days": 7,
    "notes": "Booking diajukan via website/POS"
  }
  ```
* **Response Sukses (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": 5,
      "booking_number": "BOOK-20261009-4821",
      "customer_id": 2,
      "customer_name": "Siti Nurhaliza",
      "plot_id": 3,
      "plot_code": "A-03",
      "booking_price": 270000000,
      "booking_fee": 5000000,
      "status": "PENDING_PAYMENT",
      "expires_at": "2026-10-16 21:00:00"
    },
    "meta": {}
  }
  ```
* **Response Konflik (409 Conflict):**
  ```json
  {
    "success": false,
    "error": {
      "code": "PLOT_NOT_AVAILABLE",
      "message": "Kavling 'A-03' tidak tersedia (status: BOOKED)"
    }
  }
  ```

#### `PATCH /bookings/:id/cancel`
* **Body Request:**
  ```json
  {
    "reason": "Pembeli membatalkan rencana pembelian"
  }
  ```
* **Efek:** Booking menjadi `CANCELLED`, kavling otomatis dilepas kembali ke status `AVAILABLE`.

---

### 5.6. Sales / POS (Transaksi Penjualan)

#### `GET /sales` (atau `/transactions`)
* **Deskripsi:** Daftar penjualan untuk modul POS & manajemen transaksi.
* **Response Sukses (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "sale_number": "SALE-2026-0001",
        "customer_id": 1,
        "customer_name": "Budi Santoso",
        "plot_id": 1,
        "plot_code": "A-01",
        "project_name": "Permata Sakinah 1 - Cihanjuang",
        "sale_price": 252000000,
        "discount_amount": 2000000,
        "total_amount": 250000000,
        "total_paid": 250000000,
        "balance_remaining": 0,
        "status": "CONFIRMED"
      }
    ],
    "meta": {
      "total": 3
    }
  }
  ```

#### `POST /sales` (atau `/transactions`)
* **Role:** `OWNER`, `ADMIN`, `STAFF`
* **Body Request:**
  ```json
  {
    "customer_id": 2,
    "plot_id": 2,
    "booking_id": 2,
    "discount_amount": 2000000,
    "status": "PENDING_PAYMENT",
    "notes": "Transaksi penjualan dari POS"
  }
  ```

#### `PATCH /sales/:id/confirm`
* **Role:** `OWNER`, `ADMIN`
* **Efek:** Mengubah status transaksi menjadi `CONFIRMED` dan mengunci kavling menjadi `SOLD` secara permanen.

---

### 5.7. Payments (Pembayaran)

#### `POST /payments`
* **Deskripsi:** Mencatat bukti pembayaran transfer atau tunai untuk booking atau penjualan.
* **Body Request:**
  ```json
  {
    "booking_id": 2,
    "amount": 5000000,
    "method": "BANK_TRANSFER",
    "reference_number": "TRF-MANDIRI-554433",
    "proof_url": "https://storage.example.test/proofs/pay-001.jpg",
    "notes": "Pembayaran booking fee"
  }
  ```

#### `PATCH /payments/:id/verify`
* **Role:** `OWNER`, `ADMIN`
* **Deskripsi:** Memverifikasi pembayaran sah. Jika pembayaran adalah booking fee, booking otomatis aktif (`ACTIVE`).

---

### 5.8. Dashboard & Laporan

#### `GET /dashboard/summary`
* **Role:** `OWNER`, `ADMIN`, `STAFF`
* **Response Sukses (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "revenue": {
        "total_sales_revenue": 635000000,
        "total_booking_fees": 10000000,
        "total_verified_income": 645000000,
        "pending_verification_amount": 5000000
      },
      "plots": {
        "total": 16,
        "available": 9,
        "booked": 2,
        "sold": 3,
        "inactive": 2
      },
      "counts": {
        "confirmed_sales": 3,
        "active_bookings": 1,
        "active_leads": 4,
        "total_customers": 7
      }
    }
  }
  ```

#### `GET /reports/sales`
* **Role:** `OWNER`, `ADMIN`
* **Response:** Rekapitulasi transaksi penjualan terkonfirmasi untuk pembukuan.

#### `GET /reports/payments`
* **Role:** `OWNER`, `ADMIN`
* **Response:** Rekapitulasi mutasi kas masuk terverifikasi.

#### `GET /reports/plots`
* **Role:** `OWNER`, `ADMIN`
* **Response:** Laporan ketersediaan dan valuasi tanah kavling per proyek.

---

## 6. Pemetaan Komponen Frontend ke REST API

| Halaman Frontend | File Komponen | Endpoint Backend yang Digunakan |
|---|---|---|
| **Beranda Publik** | `HomePage.jsx` | `GET /projects`<br>`GET /plots?status=AVAILABLE` |
| **Katalog Proyek** | `ProjectsPage.jsx` | `GET /projects` |
| **Detail Proyek & Site Plan** | `ProjectDetailPage.jsx` | `GET /projects/:id`<br>`GET /projects/:id/plots` |
| **Login Pengguna** | `LoginPage.jsx` | `POST /auth/login` |
| **POS Penjualan** | `PosPage.jsx` | `GET /projects`<br>`GET /plots?status=AVAILABLE`<br>`GET /customers`<br>`POST /sales`<br>`POST /payments` |
| **Manajemen Kavling** | `LotsManagementPage.jsx` | `GET /plots`<br>`POST /plots`<br>`PATCH /plots/:id` |
| **Manajemen Customer** | `CustomersManagementPage.jsx` | `GET /customers`<br>`POST /customers`<br>`GET/POST /customers/:id/activities` |
| **Manajemen Transaksi** | `TransactionsManagementPage.jsx`| `GET /sales`<br>`PATCH /sales/:id/confirm` |
| **Verifikasi Pembayaran** | `PaymentsManagementPage.jsx` | `GET /payments`<br>`PATCH /payments/:id/verify`<br>`PATCH /payments/:id/reject` |
| **Dashboard Internal** | `DashboardPage.jsx` | `GET /dashboard/summary`<br>`GET /dashboard/lot-status`<br>`GET /dashboard/recent-transactions` |
| **Laporan Eksekutif** | `ReportsPage.jsx` | `GET /reports/sales`<br>`GET /reports/payments`<br>`GET /reports/plots` |
| **Customer Portal** | `CustomerDashboardPage.jsx`<br>`CustomerLotsPage.jsx`<br>`CustomerPaymentsPage.jsx` | `GET /auth/me`<br>`GET /bookings`<br>`GET /sales`<br>`GET /payments` |

---

## 7. Contoh Implementasi API Client (Axios / Fetch)

Untuk menggantikan `adapter.js` mock pada frontend, gunakan helper sederhana berikut:

```javascript
// src/services/api/client.js
// Disarankan menggunakan environment variable Vite: import.meta.env.VITE_API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://kavling-permata-sakinah-api.vercel.app/api/v1';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error(data.error?.message || 'Terjadi kesalahan sistem');
  }

  return data;
}

// Contoh implementasi pemanggilan:
export const api = {
  getProjects: () => apiRequest('/projects'),
  getProjectById: (id) => apiRequest(`/projects/${id}`),
  getLots: (projectId, filters = {}) => {
    const params = new URLSearchParams({ ...filters, ...(projectId ? { projectId } : {}) });
    return apiRequest(`/plots?${params}`);
  },
  login: (email, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  createSale: (payload) => apiRequest('/sales', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getDashboardSummary: () => apiRequest('/dashboard/summary'),
};
```
