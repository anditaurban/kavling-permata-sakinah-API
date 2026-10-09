# USER FLOW — Permata Sakinah

## 1. Public Visitor
Landing Page
→ Lihat project
→ Pilih project
→ Lihat detail project
→ Lihat site-plan
→ Pilih kavling
→ Lihat detail kavling
→ CTA Inquiry / Booking
→ Form customer / WhatsApp CTA

## 2. Customer
Login
→ Customer Dashboard
→ Lihat kavling
→ Lihat status transaksi
→ Lihat payment schedule
→ Lihat riwayat pembayaran
→ Lihat dokumen/informasi pembelian

## 3. Staff — Sales Flow
Login
→ Dashboard
→ Leads/Customers
→ Pilih customer
→ Pilih project
→ Pilih kavling
→ Review harga
→ Buat booking/transaksi
→ Input DP/pembayaran awal
→ Konfirmasi
→ Receipt
→ Follow-up

## 4. Staff — Kavling Flow
Dashboard
→ Project
→ Pilih project
→ Kavling inventory
→ Filter status
→ Lihat detail
→ Update status melalui action yang tersedia

## 5. Admin — Operational Flow
Login
→ Dashboard
→ Projects
→ Kavling
→ Customers
→ Transactions
→ Payments
→ Staff/Users
→ Reports

## 6. Owner — Monitoring Flow
Login
→ Dashboard
→ KPI penjualan
→ Revenue/DP summary
→ Kavling availability
→ Recent transactions
→ Sales performance
→ Project performance
→ Reports

## 7. POS Flow
POS
→ Select project
→ Select available kavling
→ Select/create customer
→ Review price
→ Select transaction type
→ Input payment
→ Review summary
→ Confirm
→ Receipt
→ Transaction detail

## 8. States
Kavling:
- AVAILABLE
- BOOKED
- SOLD
- INACTIVE

Transaction:
- DRAFT
- BOOKED
- ACTIVE
- COMPLETED
- CANCELLED

Payment:
- UNPAID
- PARTIAL
- PAID
- OVERDUE

## 9. Navigation Principle
Public:
Home / Projects / About / FAQ / Contact

Internal:
Dashboard / POS / Projects / Kavling / Customers / Transactions / Payments / Reports / Users

Customer:
Dashboard / My Kavling / Payments / Documents / Profile

Menu harus role-aware, tetapi frontend hanya mensimulasikan permission menggunakan mock session.
