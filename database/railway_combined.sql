-- ==============================================================================
-- DATABASE SCHEMA & SEED DATA — PERMATA SAKINAH (RAILWAY / CLOUD DEPLOYMENT)
-- Kombinasi schema.sql + project_images.sql + bcrypt dev password hash
-- Target: MySQL 8.0+ / MariaDB 10.4+ / Railway MySQL
-- ==============================================================================
-- PENTING / PETUNJUK DEPLOY RAILWAY:
-- 1. Script ini dapat langsung di-import ke database default Railway (misal 'railway')
--    atau database 'permata_sakinah'.
-- 2. Tidak mengandung perintah DROP DATABASE atau DROP TABLE.
-- 3. Akun demo sudah dilengkapi hash bcrypt valid untuk password: 'Password123!'
-- ==============================================================================

-- Opsional: Jika menggunakan MySQL mandiri, aktifkan 2 baris di bawah ini:
-- CREATE DATABASE IF NOT EXISTS `permata_sakinah` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `permata_sakinah`;

-- ==============================================================================
-- 1. TABEL: customers
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `customers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `email` VARCHAR(190) NULL,
    `identity_number` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `lead_status` VARCHAR(30) NOT NULL DEFAULT 'NEW',
    `source` VARCHAR(50) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    INDEX `idx_customers_phone` (`phone`),
    INDEX `idx_customers_lead_status` (`lead_status`),
    INDEX `idx_customers_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 2. TABEL: users
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(190) NULL,
    `phone` VARCHAR(30) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(30) NOT NULL,
    `customer_id` BIGINT UNSIGNED NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `last_login_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    UNIQUE KEY `uq_users_email` (`email`),
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_is_active` (`is_active`),
    CONSTRAINT `fk_users_customer` FOREIGN KEY (`customer_id`) 
        REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 3. TABEL: projects
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `projects` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(180) NOT NULL,
    `slug` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `location_text` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `cover_image_url` VARCHAR(500) NULL,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    UNIQUE KEY `uq_projects_slug` (`slug`),
    INDEX `idx_projects_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 4. TABEL: plots
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `plots` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `project_id` BIGINT UNSIGNED NOT NULL,
    `plot_code` VARCHAR(50) NOT NULL,
    `block_name` VARCHAR(50) NULL,
    `area_sqm` DECIMAL(10,2) NOT NULL,
    `price` DECIMAL(18,2) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    `site_x` DECIMAL(8,5) NULL,
    `site_y` DECIMAL(8,5) NULL,
    `description` VARCHAR(500) NULL,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    UNIQUE KEY `uq_plots_project_plot_code` (`project_id`, `plot_code`),
    INDEX `idx_plots_project_status` (`project_id`, `status`),
    CONSTRAINT `fk_plots_project` FOREIGN KEY (`project_id`) 
        REFERENCES `projects` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `chk_plots_area` CHECK (`area_sqm` > 0),
    CONSTRAINT `chk_plots_price` CHECK (`price` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 5. TABEL: project_images (Galeri Foto Proyek)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `project_images` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `project_id` BIGINT UNSIGNED NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `caption` VARCHAR(255) NULL,
    `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
    `sort_order` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    INDEX `idx_project_images_project` (`project_id`),
    INDEX `idx_project_images_is_primary` (`is_primary`),
    CONSTRAINT `fk_project_images_project` FOREIGN KEY (`project_id`) 
        REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 6. TABEL: bookings
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `bookings` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `booking_number` VARCHAR(40) NOT NULL,
    `customer_id` BIGINT UNSIGNED NOT NULL,
    `plot_id` BIGINT UNSIGNED NOT NULL,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `booking_price` DECIMAL(18,2) NOT NULL,
    `booking_fee` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(30) NOT NULL,
    `expires_at` DATETIME NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    UNIQUE KEY `uq_bookings_booking_number` (`booking_number`),
    INDEX `idx_bookings_plot_status` (`plot_id`, `status`),
    INDEX `idx_bookings_customer_created` (`customer_id`, `created_at`),
    INDEX `idx_bookings_expires_at` (`expires_at`),
    CONSTRAINT `fk_bookings_customer` FOREIGN KEY (`customer_id`) 
        REFERENCES `customers` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_bookings_plot` FOREIGN KEY (`plot_id`) 
        REFERENCES `plots` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_bookings_created_by` FOREIGN KEY (`created_by`) 
        REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `chk_bookings_price` CHECK (`booking_price` >= 0),
    CONSTRAINT `chk_bookings_fee` CHECK (`booking_fee` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 7. TABEL: sales
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `sales` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `sale_number` VARCHAR(40) NOT NULL,
    `customer_id` BIGINT UNSIGNED NOT NULL,
    `plot_id` BIGINT UNSIGNED NOT NULL,
    `booking_id` BIGINT UNSIGNED NULL,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `sale_price` DECIMAL(18,2) NOT NULL,
    `discount_amount` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `total_amount` DECIMAL(18,2) NOT NULL,
    `status` VARCHAR(30) NOT NULL,
    `confirmed_at` DATETIME NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    UNIQUE KEY `uq_sales_sale_number` (`sale_number`),
    INDEX `idx_sales_plot_status` (`plot_id`, `status`),
    INDEX `idx_sales_customer_created` (`customer_id`, `created_at`),
    CONSTRAINT `fk_sales_customer` FOREIGN KEY (`customer_id`) 
        REFERENCES `customers` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_sales_plot` FOREIGN KEY (`plot_id`) 
        REFERENCES `plots` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_sales_booking` FOREIGN KEY (`booking_id`) 
        REFERENCES `bookings` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_sales_created_by` FOREIGN KEY (`created_by`) 
        REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `chk_sales_price` CHECK (`sale_price` >= 0),
    CONSTRAINT `chk_sales_discount` CHECK (`discount_amount` >= 0),
    CONSTRAINT `chk_sales_total` CHECK (`total_amount` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 8. TABEL: payments
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `payments` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `payment_number` VARCHAR(40) NOT NULL,
    `sale_id` BIGINT UNSIGNED NULL,
    `booking_id` BIGINT UNSIGNED NULL,
    `amount` DECIMAL(18,2) NOT NULL,
    `method` VARCHAR(30) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    `reference_number` VARCHAR(120) NULL,
    `proof_url` VARCHAR(500) NULL,
    `paid_at` DATETIME NULL,
    `verified_by` BIGINT UNSIGNED NULL,
    `verified_at` DATETIME NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    UNIQUE KEY `uq_payments_payment_number` (`payment_number`),
    INDEX `idx_payments_sale_status` (`sale_id`, `status`),
    INDEX `idx_payments_booking_status` (`booking_id`, `status`),
    INDEX `idx_payments_paid_at` (`paid_at`),
    CONSTRAINT `fk_payments_sale` FOREIGN KEY (`sale_id`) 
        REFERENCES `sales` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) 
        REFERENCES `bookings` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_payments_verified_by` FOREIGN KEY (`verified_by`) 
        REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `chk_payments_amount` CHECK (`amount` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 9. TABEL: audit_logs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `actor_user_id` BIGINT UNSIGNED NULL,
    `action` VARCHAR(80) NOT NULL,
    `entity_type` VARCHAR(80) NOT NULL,
    `entity_id` BIGINT UNSIGNED NULL,
    `summary` VARCHAR(500) NULL,
    `metadata_json` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` DATETIME NOT NULL,
    INDEX `idx_audit_logs_actor` (`actor_user_id`),
    INDEX `idx_audit_logs_entity` (`entity_type`, `entity_id`),
    INDEX `idx_audit_logs_created_at` (`created_at`),
    CONSTRAINT `fk_audit_logs_actor` FOREIGN KEY (`actor_user_id`) 
        REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 10. TABEL: lead_activities
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `lead_activities` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT UNSIGNED NOT NULL,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `activity_type` VARCHAR(40) NOT NULL,
    `description` TEXT NULL,
    `follow_up_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL,
    INDEX `idx_lead_activities_customer` (`customer_id`),
    INDEX `idx_lead_activities_created_by` (`created_by`),
    INDEX `idx_lead_activities_follow_up` (`follow_up_at`),
    CONSTRAINT `fk_lead_activities_customer` FOREIGN KEY (`customer_id`) 
        REFERENCES `customers` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_lead_activities_created_by` FOREIGN KEY (`created_by`) 
        REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- DATA DUMMY SEED LENGKAP
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- DUMMY: customers (7 data)
-- ------------------------------------------------------------------------------
INSERT INTO `customers` (`id`, `name`, `phone`, `email`, `identity_number`, `address`, `lead_status`, `source`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'Budi Santoso', '081234567801', 'budi.santoso@example.test', '3201010101900001', 'Jl. Merdeka No. 12, Bandung', 'CONVERTED', 'LANDING_PAGE', 'Customer pembeli kavling A-01 Permata Sakinah 1', '2026-01-05 09:00:00', '2026-01-20 10:00:00'),
(2, 'Siti Nurhaliza', '081234567802', 'siti.nurhaliza@example.test', '3201010202920002', 'Jl. Sukajadi No. 45, Bandung', 'INTERESTED', 'REFERRAL', 'Memiliki booking aktif untuk kavling A-02', '2026-02-01 10:30:00', '2026-02-05 14:00:00'),
(3, 'Ahmad Fauzi', '081234567803', 'ahmad.fauzi@example.test', '3201010303880003', 'Komplek Permata Indah B-3, Bandung Barat', 'CONVERTED', 'WALK_IN', 'Pembeli langsung kavling A-01 Permata Sakinah 2 Cilame', '2026-02-08 11:00:00', '2026-02-10 15:00:00'),
(4, 'Dewi Lestari', '081234567804', 'dewi.lestari@example.test', '3201010404950004', 'Jl. Cihampelas No. 88, Bandung', 'CONTACTED', 'WHATSAPP', 'Tertarik proyek Cilame, minta dikirimi pricelist', '2026-02-15 13:15:00', '2026-02-16 09:00:00'),
(5, 'Hendra Wijaya', '081234567805', 'hendra.wijaya@example.test', '3201010505850005', 'Jl. Pasteur No. 101, Bandung', 'CONVERTED', 'LANDING_PAGE', 'Pembeli kavling B-01 Permata Sakinah 1', '2026-03-01 08:45:00', '2026-03-05 13:30:00'),
(6, 'Rina Kusuma', '081234567806', 'rina.kusuma@example.test', '3201010606930006', 'Jl. Dago Asri No. 22, Bandung', 'INTERESTED', 'INSTAGRAM', 'Booking baru kavling B-04, menunggu konfirmasi transfer', '2026-03-10 16:00:00', '2026-03-10 16:30:00'),
(7, 'Eko Prasetyo', '081234567807', 'eko.prasetyo@example.test', '3201010707870007', 'Jl. Buah Batu No. 67, Bandung', 'CLOSED', 'WALK_IN', 'Pernah booking A-03 namun batal (expired)', '2026-01-12 14:00:00', '2026-02-02 10:00:00');

-- ------------------------------------------------------------------------------
-- DUMMY: users (6 data dengan bcrypt hash 'Password123!')
-- ------------------------------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `role`, `customer_id`, `is_active`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 'Bambang Soedirman', 'owner@permatasakinah.test', '081100000001', '$2b$10$mTB8wVsoofijlfKX77tw7eePcu4XaLLbnqn5fb0OnxY/KlF1693we', 'OWNER', NULL, 1, '2026-03-11 08:00:00', '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(2, 'Siti Sarah', 'admin@permatasakinah.test', '081100000002', '$2b$10$mTB8wVsoofijlfKX77tw7eePcu4XaLLbnqn5fb0OnxY/KlF1693we', 'ADMIN', NULL, 1, '2026-03-11 08:30:00', '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(3, 'Fajar Ramadhan', 'staff1@permatasakinah.test', '081100000003', '$2b$10$mTB8wVsoofijlfKX77tw7eePcu4XaLLbnqn5fb0OnxY/KlF1693we', 'STAFF', NULL, 1, '2026-03-11 09:00:00', '2026-01-02 08:00:00', '2026-01-02 08:00:00'),
(4, 'Nadia Putri', 'staff2@permatasakinah.test', '081100000004', '$2b$10$mTB8wVsoofijlfKX77tw7eePcu4XaLLbnqn5fb0OnxY/KlF1693we', 'STAFF', NULL, 1, '2026-03-10 17:00:00', '2026-01-02 08:00:00', '2026-01-02 08:00:00'),
(5, 'Budi Santoso (Portal)', 'budi.portal@example.test', '081234567801', '$2b$10$mTB8wVsoofijlfKX77tw7eePcu4XaLLbnqn5fb0OnxY/KlF1693we', 'CUSTOMER', 1, 1, '2026-01-25 19:00:00', '2026-01-20 11:00:00', '2026-01-20 11:00:00'),
(6, 'Ahmad Fauzi (Portal)', 'ahmad.portal@example.test', '081234567803', '$2b$10$mTB8wVsoofijlfKX77tw7eePcu4XaLLbnqn5fb0OnxY/KlF1693we', 'CUSTOMER', 3, 1, '2026-02-12 20:00:00', '2026-02-10 16:00:00', '2026-02-10 16:00:00');

-- ------------------------------------------------------------------------------
-- DUMMY: projects (2 project)
-- ------------------------------------------------------------------------------
INSERT INTO `projects` (`id`, `name`, `slug`, `description`, `location_text`, `address`, `status`, `cover_image_url`, `created_at`, `updated_at`) VALUES
(1, 'Permata Sakinah 1 - Cihanjuang', 'permata-sakinah-1-cihanjuang', 'Kawasan kavling hunian syariah asri dengan view perbukitan di Cihanjuang, Parongpong. Akses jalan aspal 6 meter, drainase siap bangun.', 'Cihanjuang, Parongpong, Bandung Barat', 'Jl. Cihanjuang Rahayu No. 88, Parongpong, Kab. Bandung Barat', 'ACTIVE', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef', '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(2, 'Permata Sakinah 2 - Cilame', 'permata-sakinah-2-cilame', 'Kavling strategis dekat pusat pemerintahan Kab. Bandung Barat dan akses tol Padalarang. Cocok untuk investasi dan hunian.', 'Cilame, Ngamprah, Bandung Barat', 'Jl. Cilame Indah Kav. 12, Ngamprah, Kab. Bandung Barat', 'ACTIVE', 'https://images.unsplash.com/photo-1524813686514-a57563d77d61', '2026-01-15 00:00:00', '2026-01-15 00:00:00');

-- ------------------------------------------------------------------------------
-- DUMMY: plots (16 kavling)
-- ------------------------------------------------------------------------------
INSERT INTO `plots` (`id`, `project_id`, `plot_code`, `block_name`, `area_sqm`, `price`, `status`, `site_x`, `site_y`, `description`, `created_at`, `updated_at`) VALUES
(1, 1, 'A-01', 'Blok A', 84.00, 252000000.00, 'SOLD', 0.12000, 0.25000, 'Kavling sudut hadap timur', '2026-01-02 00:00:00', '2026-01-20 10:00:00'),
(2, 1, 'A-02', 'Blok A', 84.00, 252000000.00, 'BOOKED', 0.22000, 0.25000, 'Kavling standar hadap timur (booking aktif)', '2026-01-02 00:00:00', '2026-02-02 14:00:00'),
(3, 1, 'A-03', 'Blok A', 90.00, 270000000.00, 'AVAILABLE', 0.32000, 0.25000, 'Kavling luas standar dekat gerbang (pernah expired, tersedia lagi)', '2026-01-02 00:00:00', '2026-02-03 00:00:00'),
(4, 1, 'A-04', 'Blok A', 96.00, 288000000.00, 'AVAILABLE', 0.42000, 0.25000, 'Kavling hook view taman', '2026-01-02 00:00:00', '2026-01-02 00:00:00'),
(5, 1, 'B-01', 'Blok B', 72.00, 216000000.00, 'SOLD', 0.12000, 0.55000, 'Kavling blok B dekat musholla', '2026-01-02 00:00:00', '2026-03-05 13:30:00'),
(6, 1, 'B-02', 'Blok B', 72.00, 216000000.00, 'AVAILABLE', 0.22000, 0.55000, 'Kavling blok B siap bangun', '2026-01-02 00:00:00', '2026-01-02 00:00:00'),
(7, 1, 'B-03', 'Blok B', 75.00, 225000000.00, 'AVAILABLE', 0.32000, 0.55000, 'Kavling kontur datar', '2026-01-02 00:00:00', '2026-01-02 00:00:00'),
(8, 1, 'B-04', 'Blok B', 80.00, 240000000.00, 'BOOKED', 0.42000, 0.55000, 'Kavling blok B (booking pending transfer)', '2026-01-02 00:00:00', '2026-03-10 16:30:00'),
(9, 1, 'C-01', 'Blok C', 105.00, 315000000.00, 'INACTIVE', 0.15000, 0.80000, 'Kavling dicadangkan untuk area fasilitas umum', '2026-01-02 00:00:00', '2026-01-10 09:00:00'),
(10, 1, 'C-02', 'Blok C', 100.00, 300000000.00, 'AVAILABLE', 0.28000, 0.80000, 'Kavling premium blok C', '2026-01-02 00:00:00', '2026-01-02 00:00:00'),
(11, 2, 'A-01', 'Blok A', 70.00, 175000000.00, 'SOLD', 0.15000, 0.30000, 'Kavling strategis dekat jalan utama Cilame', '2026-01-16 00:00:00', '2026-02-10 15:00:00'),
(12, 2, 'A-02', 'Blok A', 70.00, 175000000.00, 'AVAILABLE', 0.25000, 0.30000, 'Kavling hadap utara', '2026-01-16 00:00:00', '2026-01-16 00:00:00'),
(13, 2, 'A-03', 'Blok A', 72.00, 180000000.00, 'AVAILABLE', 0.35000, 0.30000, 'Kavling hadap utara siap bangun', '2026-01-16 00:00:00', '2026-01-16 00:00:00'),
(14, 2, 'B-01', 'Blok B', 84.00, 210000000.00, 'AVAILABLE', 0.15000, 0.65000, 'Kavling luas blok B', '2026-01-16 00:00:00', '2026-01-16 00:00:00'),
(15, 2, 'B-02', 'Blok B', 84.00, 210000000.00, 'AVAILABLE', 0.25000, 0.65000, 'Kavling blok B', '2026-01-16 00:00:00', '2026-01-16 00:00:00'),
(16, 2, 'B-03', 'Blok B', 90.00, 225000000.00, 'INACTIVE', 0.35000, 0.65000, 'Kavling fase peluncuran tahap 2 (belum dibuka)', '2026-01-16 00:00:00', '2026-01-16 00:00:00');

-- ------------------------------------------------------------------------------
-- DUMMY: project_images (7 data)
-- ------------------------------------------------------------------------------
INSERT INTO `project_images` (`id`, `project_id`, `image_url`, `caption`, `is_primary`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 1, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80', 'Foto Utama - Hamparan Kavling Asri Permata Sakinah 1', 1, 1, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(2, 1, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80', 'View Kavling Hadap Perbukitan & Udara Sejuk', 0, 2, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(3, 1, 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1000&q=80', 'Area Hijau Terbuka & Batas Lahan Siap Bangun', 0, 3, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(4, 1, 'https://images.unsplash.com/photo-1541888946425-d0fbb18f1568?auto=format&fit=crop&w=1000&q=80', 'Proses Pematangan Lahan & Akses Jalan Beton 6m', 0, 4, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(5, 2, 'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1000&q=80', 'Foto Utama - Gerbang Masuk & Kawasan Hijau Permata Sakinah 2', 1, 1, '2026-01-15 00:00:00', '2026-01-15 00:00:00'),
(6, 2, 'https://images.unsplash.com/photo-1524813686514-a57563d77d61?auto=format&fit=crop&w=1000&q=80', 'Kontur Tanah Darat Padat Siap Bangun Cilame', 0, 2, '2026-01-15 00:00:00', '2026-01-15 00:00:00'),
(7, 2, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80', 'Pemandangan Sekitar Kawasan Sukatani Hills', 0, 3, '2026-01-15 00:00:00', '2026-01-15 00:00:00');

-- ------------------------------------------------------------------------------
-- DUMMY: bookings (4 data)
-- ------------------------------------------------------------------------------
INSERT INTO `bookings` (`id`, `booking_number`, `customer_id`, `plot_id`, `created_by`, `booking_price`, `booking_fee`, `status`, `expires_at`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'BOOK-2026-0001', 1, 1, 3, 252000000.00, 5000000.00, 'CONVERTED', '2026-01-15 23:59:59', 'Booking awal oleh Budi Santoso, berhasil dikonversi ke penjualan SALE-2026-0001', '2026-01-08 10:00:00', '2026-01-20 09:30:00'),
(2, 'BOOK-2026-0002', 2, 2, 3, 252000000.00, 5000000.00, 'ACTIVE', '2026-11-15 23:59:59', 'Booking aktif oleh Siti Nurhaliza, fee 5jt telah diverifikasi', '2026-02-02 14:00:00', '2026-02-02 15:30:00'),
(3, 'BOOK-2026-0003', 7, 3, 4, 270000000.00, 5000000.00, 'EXPIRED', '2026-02-01 23:59:59', 'Booking oleh Eko Prasetyo kedaluwarsa tanpa tindak lanjut; plot A-03 dirilis kembali', '2026-01-15 11:00:00', '2026-02-02 08:00:00'),
(4, 'BOOK-2026-0004', 6, 8, 4, 240000000.00, 5000000.00, 'PENDING_PAYMENT', '2026-10-15 23:59:59', 'Booking oleh Rina Kusuma menunggu verifikasi transfer fee', '2026-03-10 16:30:00', '2026-03-10 16:30:00');

-- ------------------------------------------------------------------------------
-- DUMMY: sales (3 data)
-- ------------------------------------------------------------------------------
INSERT INTO `sales` (`id`, `sale_number`, `customer_id`, `plot_id`, `booking_id`, `created_by`, `sale_price`, `discount_amount`, `total_amount`, `status`, `confirmed_at`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'SALE-2026-0001', 1, 1, 1, 3, 252000000.00, 2000000.00, 250000000.00, 'CONFIRMED', '2026-01-20 10:00:00', 'Penjualan kavling A-01 kepada Budi Santoso; potongan promo 2jt disetujui Owner', '2026-01-20 09:30:00', '2026-01-22 10:15:00'),
(2, 'SALE-2026-0002', 3, 11, NULL, 3, 175000000.00, 0.00, 175000000.00, 'CONFIRMED', '2026-02-10 15:00:00', 'Penjualan tunai keras langsung kavling A-01 Cilame Ahmad Fauzi', '2026-02-10 14:00:00', '2026-02-10 15:30:00'),
(3, 'SALE-2026-0003', 5, 5, NULL, 4, 216000000.00, 1000000.00, 215000000.00, 'CONFIRMED', '2026-03-05 13:30:00', 'Penjualan kavling B-01 Cihanjuang kepada Hendra Wijaya', '2026-03-05 11:00:00', '2026-03-05 14:00:00');

-- ------------------------------------------------------------------------------
-- DUMMY: payments (6 data)
-- ------------------------------------------------------------------------------
INSERT INTO `payments` (`id`, `payment_number`, `sale_id`, `booking_id`, `amount`, `method`, `status`, `reference_number`, `proof_url`, `paid_at`, `verified_by`, `verified_at`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'PAY-2026-0001', NULL, 1, 5000000.00, 'BANK_TRANSFER', 'VERIFIED', 'TRF-BCA-889101', 'https://storage.example.test/proofs/pay-2026-0001.jpg', '2026-01-08 10:30:00', 2, '2026-01-08 11:00:00', 'Pembayaran booking fee kavling A-01 Budi Santoso', '2026-01-08 10:30:00', '2026-01-08 11:00:00'),
(2, 'PAY-2026-0002', NULL, 2, 5000000.00, 'BANK_TRANSFER', 'VERIFIED', 'TRF-MANDIRI-44120', 'https://storage.example.test/proofs/pay-2026-0002.jpg', '2026-02-02 14:30:00', 2, '2026-02-02 15:30:00', 'Pembayaran booking fee kavling A-02 Siti Nurhaliza', '2026-02-02 14:30:00', '2026-02-02 15:30:00'),
(3, 'PAY-2026-0003', NULL, 4, 5000000.00, 'BANK_TRANSFER', 'PENDING', 'TRF-BRI-99812', 'https://storage.example.test/proofs/pay-2026-0003.jpg', '2026-03-10 16:45:00', NULL, NULL, 'Bukti transfer diunggah Rina Kusuma, menunggu verifikasi Admin', '2026-03-10 16:45:00', '2026-03-10 16:45:00'),
(4, 'PAY-2026-0004', 1, NULL, 245000000.00, 'BANK_TRANSFER', 'VERIFIED', 'TRF-BCA-889450', 'https://storage.example.test/proofs/pay-2026-0004.jpg', '2026-01-22 09:30:00', 2, '2026-01-22 10:15:00', 'Pelunasan sisa tagihan penjualan SALE-2026-0001 (total 250jt - fee 5jt)', '2026-01-22 09:30:00', '2026-01-22 10:15:00'),
(5, 'PAY-2026-0005', 2, NULL, 175000000.00, 'BANK_TRANSFER', 'VERIFIED', 'TRF-BNI-123987', 'https://storage.example.test/proofs/pay-2026-0005.jpg', '2026-02-10 14:30:00', 2, '2026-02-10 15:00:00', 'Pelunasan tunai keras transaksi SALE-2026-0002 Ahmad Fauzi', '2026-02-10 14:30:00', '2026-02-10 15:00:00'),
(6, 'PAY-2026-0006', 3, NULL, 215000000.00, 'BANK_TRANSFER', 'VERIFIED', 'TRF-BCA-992341', 'https://storage.example.test/proofs/pay-2026-0006.jpg', '2026-03-05 13:00:00', 2, '2026-03-05 13:30:00', 'Pelunasan penjualan SALE-2026-0003 Hendra Wijaya', '2026-03-05 13:00:00', '2026-03-05 13:30:00');

-- ------------------------------------------------------------------------------
-- DUMMY: audit_logs (5 data)
-- ------------------------------------------------------------------------------
INSERT INTO `audit_logs` (`id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `summary`, `metadata_json`, `ip_address`, `created_at`) VALUES
(1, 3, 'CREATE_BOOKING', 'BOOKING', 2, 'Staff Fajar Ramadhan membuat booking kavling A-02 untuk Siti Nurhaliza', '{"booking_number": "BOOK-2026-0002", "plot_code": "A-02", "fee": 5000000}', '192.168.1.101', '2026-02-02 14:00:00'),
(2, 2, 'VERIFY_PAYMENT', 'PAYMENT', 2, 'Admin Siti Sarah memverifikasi pembayaran booking fee PAY-2026-0002', '{"payment_number": "PAY-2026-0002", "status": "VERIFIED", "amount": 5000000}', '192.168.1.100', '2026-02-02 15:30:00'),
(3, 3, 'CONVERT_BOOKING', 'BOOKING', 1, 'Booking BOOK-2026-0001 dikonversi menjadi penjualan SALE-2026-0001', '{"booking_id": 1, "sale_number": "SALE-2026-0001"}', '192.168.1.101', '2026-01-20 09:30:00'),
(4, 2, 'CONFIRM_SALE', 'SALE', 1, 'Admin mengonfirmasi transaksi SALE-2026-0001, status kavling A-01 menjadi SOLD', '{"sale_id": 1, "plot_id": 1, "plot_code": "A-01", "total_amount": 250000000}', '192.168.1.100', '2026-01-20 10:00:00'),
(5, 4, 'UPDATE_PLOT_STATUS', 'PLOT', 9, 'Staff Nadia Putri mengubah status plot C-01 menjadi INACTIVE untuk fasilitas umum', '{"plot_id": 9, "plot_code": "C-01", "previous_status": "AVAILABLE", "new_status": "INACTIVE"}', '192.168.1.102', '2026-01-10 09:00:00');

-- ------------------------------------------------------------------------------
-- DUMMY: lead_activities (4 data)
-- ------------------------------------------------------------------------------
INSERT INTO `lead_activities` (`id`, `customer_id`, `created_by`, `activity_type`, `description`, `follow_up_at`, `created_at`) VALUES
(1, 2, 3, 'PHONE_CALL', 'Telepon follow-up konfirmasi penerimaan bukti transfer booking fee kavling A-02', '2026-02-02 16:00:00', '2026-02-02 15:45:00'),
(2, 4, 4, 'WHATSAPP', 'Kirimkan e-brochure dan estimasi angsuran kavling Permata Sakinah 2 Cilame', '2026-02-18 10:00:00', '2026-02-16 09:15:00'),
(3, 6, 4, 'SITE_VISIT', 'Customer survey lokasi kavling B-04 didampingi staff, dilanjutkan pengajuan booking', '2026-03-12 10:00:00', '2026-03-10 17:00:00'),
(4, 7, 3, 'PHONE_CALL', 'Konfirmasi pembatalan otomatis booking A-03 karena tidak ada kelanjutan pembayaran fee', NULL, '2026-02-02 08:30:00');
