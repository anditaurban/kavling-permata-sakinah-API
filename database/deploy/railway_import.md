# Panduan Import Database SQL ke Railway

Dokumen ini berisi panduan cepat mengimpor struktur skema dan data awal (*seed data*) ke layanan MySQL di Railway menggunakan skrip otomatis proyek.

---

## Solusi Terbaik & Paling Cepat: Eksekusi 1 Perintah dari Komputer Anda

Anda tidak perlu mengutak-atik MySQL di Windows atau menginstal aplikasi database lain. Cukup gunakan skrip otomatis yang sudah terpasang di proyek ini:

### Langkah 1: Buka Akses Publik di Railway
Secara default, MySQL di Railway terkunci di jaringan internal Railway. Agar bisa diisi data dari luar:
1. Di dashboard Railway, klik kartu/kotak layanan **MySQL**.
2. Buka tab **Settings**.
3. Cari bagian **Networking** (atau **Public Networking**), lalu klik tombol **Generate Domain** atau **Enable Public Networking**.

---

### Langkah 2: Salin URL Koneksi
1. Masih di layanan MySQL, buka tab **Connect** (atau tab **Variables**).
2. Salin nilai yang bernama **`DATABASE_PUBLIC_URL`** (atau **`MYSQL_URL`** / **`DATABASE_URL`**).
3. Bentuk URL koneksi adalah seperti berikut:
   ```text
   mysql://root:passwordacak@viaduct.proxy.rlwy.net:12345/railway
   ```
   *(atau dengan nama database `/permata_sakinah`)*

---

### Langkah 3: Jalankan Perintah Import
Buka terminal PowerShell di VS Code / root direktori proyek ini, lalu jalankan perintah berikut:

```powershell
$env:DATABASE_URL="TEMPEL_URL_DARI_RAILWAY_DI_SINI"
npm run db:import-railway
```
*(Ganti `TEMPEL_URL_DARI_RAILWAY_DI_SINI` dengan URL yang Anda salin pada Langkah 2).*

#### Contoh Nyata:
```powershell
$env:DATABASE_URL="mysql://root:AbCdEf123@viaduct.proxy.rlwy.net:45678/railway"
npm run db:import-railway
```

---

### Apa yang Terjadi Saat Perintah Dijalankan?
Skrip Node.js (`scripts/importToRailway.js`) akan otomatis:
1. Membuka koneksi aman (SSL/TLS) ke server database Railway Anda.
2. Memeriksa dan otomatis membuat database target (misalnya `permata_sakinah`) jika belum tersedia.
3. Membaca berkas skema gabungan `database/railway_combined.sql`.
4. Membuat ke-10 tabel secara otomatis:
   - `users`
   - `customers`
   - `projects`
   - `project_images`
   - `plots`
   - `bookings`
   - `sales`
   - `payments`
   - `lead_activities`
   - `audit_logs`
5. Memasukkan seluruh data dummy development (termasuk galeri foto proyek, akun demo, serta snapshot harga).
6. Menampilkan log verifikasi jumlah tabel yang berhasil dibuat di Railway.

Setelah proses impor selesai, kredensial host, port, user, password, dan database tersebut siap dikonfigurasikan pada **Environment Variables** di platform deployment backend Anda (seperti Vercel).
