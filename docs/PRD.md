# PRD — Permata Sakinah

## 1. Product Overview
Permata Sakinah adalah website aplikasi penjualan tanah kavling yang terdiri dari:
1. Landing Page publik untuk pemasaran dan edukasi calon pembeli.
2. POS penjualan kavling untuk proses transaksi oleh tim internal.
3. Dashboard management untuk Owner, Admin, Staff, dan Customer/Kavling User.

Produk dibangun dengan pendekatan frontend-first. Pada fase awal tidak ada implementasi database atau backend nyata. Semua data untuk UI menggunakan mock/local data yang mudah diganti dengan API pada fase berikutnya.

## 2. Architecture
- Decoupled architecture.
- Frontend dan backend berdiri terpisah.
- Komunikasi melalui REST API.
- Frontend: HTML responsive, React + Vite, Tailwind CSS.
- State/data layer harus dibuat API-ready, tetapi jangan membuat backend/API nyata pada fase frontend.
- Hindari framework/library tambahan jika kebutuhan dapat diselesaikan dengan React + Tailwind + browser APIs.

## 3. Goals
- Menampilkan brand Permata Sakinah secara profesional dan terpercaya.
- Memudahkan calon customer menemukan project, kavling, harga, lokasi, dan CTA pembelian.
- Memudahkan staff melakukan proses penjualan melalui POS.
- Memberikan owner/admin ringkasan operasional dan penjualan.
- Memberikan customer portal sederhana untuk melihat kavling dan status pembelian.
- Menghasilkan UI yang siap divalidasi sebelum database/backend dibuat.

## 4. Roles
### Owner
Melihat dashboard, penjualan, project/kavling, customer, pembayaran, laporan ringkas, dan user internal.

### Admin
Mengelola data operasional: project, kavling, customer, transaksi, pembayaran, konten tertentu, dan staff sesuai permission.

### Staff
Mengelola lead/customer, membantu penjualan, membuat transaksi, memperbarui follow-up, dan melihat data yang diperlukan untuk tugasnya.

### Customer
Melihat project/kavling, detail kavling miliknya, status transaksi, pembayaran, dan dokumen/informasi pembelian yang tersedia.

## 5. Scope — Phase Frontend
### A. Landing Page
- Navbar dan CTA.
- Hero.
- Keunggulan Permata Sakinah.
- Daftar project.
- Ringkasan lokasi/project.
- Kavling unggulan/tersedia.
- Cara membeli.
- Simulasi/estimasi sederhana jika diperlukan.
- FAQ.
- Testimonial hanya jika data tersedia.
- CTA WhatsApp/contact.
- Footer.

### B. Public Project & Kavling
- Project listing.
- Project detail.
- Site-plan/kavling map visual.
- Filter status: tersedia, booking, terjual.
- Detail kavling: kode, luas, harga, status, fasilitas/keunggulan.
- CTA inquiry/booking.

### C. POS Penjualan
- Pilih project.
- Pilih kavling.
- Cari/pilih customer.
- Ringkasan harga.
- Booking/DP/pembayaran awal.
- Metode pembayaran.
- Cetak/preview receipt.
- Status transaksi.
- Riwayat transaksi.
- Follow-up sederhana.

### D. Management Dashboard
- Overview KPI.
- Project management.
- Kavling management.
- Customer/lead management.
- Transaction management.
- Payment management.
- Staff/user management.
- Reports sederhana.
- Activity/recent transactions.

### E. Customer Portal
- Dashboard customer.
- Kavling yang dimiliki/dipesan.
- Status transaksi.
- Timeline pembayaran.
- Ringkasan tagihan.
- Dokumen/info pembelian bila tersedia.

## 6. Recommended Features — Not Over-engineered
Prioritas tinggi:
- Project/kavling inventory dengan status real-time setelah backend tersedia.
- Site-plan interaktif sederhana.
- Customer/lead CRM ringan.
- Booking/DP.
- Payment schedule sederhana.
- Sales pipeline sederhana.
- WhatsApp CTA.
- Audit/activity log ringan untuk aksi penting.
- Export laporan CSV pada fase backend.

Prioritas rendah / jangan dibuat sekarang:
- GIS/map engine kompleks.
- Akuntansi penuh.
- Payroll.
- Notification microservice.
- Chat internal.
- Real-time websocket.
- E-signature kompleks.
- Workflow approval bertingkat.
- AI recommendation.
- Multi-company/multi-tenant.

## 7. Non-Goals
- Database production.
- Backend API production.
- Payment gateway integration.
- WhatsApp API integration.
- Real-time synchronization.
- Advanced accounting.
- Legal/notarial workflow automation.

## 8. UX Principles
- Trust first: informasi harga, status, lokasi, dan proses harus jelas.
- Conversion first untuk landing page.
- Task first untuk dashboard/POS.
- Minimalkan form dan modal.
- Gunakan status badges yang konsisten.
- Mobile-first untuk public page; desktop-first untuk POS/dashboard tetapi tetap responsive.
- Jangan membuat UI dekoratif yang tidak membantu task.

## 9. Frontend Acceptance Criteria
- Semua halaman utama dapat dinavigasi.
- Responsive desktop/tablet/mobile.
- Mock data realistis.
- Empty/loading/error states tersedia untuk screen utama.
- Role-based navigation dapat disimulasikan.
- Komponen konsisten.
- Tidak ada halaman placeholder kosong.
- Semua action utama memiliki feedback UI.
- Tidak ada API/database nyata pada fase ini.

## 10. Definition of Done — Frontend
Frontend dianggap siap lanjut ke database/backend apabila:
1. Landing page disetujui.
2. Project/kavling flow disetujui.
3. POS flow disetujui.
4. Dashboard role disetujui.
5. Customer portal disetujui.
6. Responsive layout disetujui.
7. User mengonfirmasi UI/UX final.
