-- ==============================================================================
-- TABEL & DUMMY DATA: project_images — PERMATA SAKINAH
-- SOT Compliance: DATABASE-SPEC.md, PRD.md, API-SPEC.md
-- Target: MySQL 8.0+ / MariaDB 10.4+ (InnoDB, utf8mb4, utf8mb4_unicode_ci)
-- ==============================================================================
-- PENTING / SAFETY NOTICE:
-- 1. Script ini TIDAK menggunakan perintah DROP DATABASE atau DROP TABLE.
-- 2. Dirancang untuk dijalankan pada database `permata_sakinah`.
-- 3. Data URL gambar disinkronkan dengan aset gambar pada proyek kavling-permata-sakinah.
-- ==============================================================================

USE `permata_sakinah`;

-- ==============================================================================
-- TABEL: project_images
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
-- DATA DUMMY: project_images
-- Sumber URL: Sesuai cover_image & aset galeri dari proyek frontend kavling-permata-sakinah
-- ==============================================================================
INSERT INTO `project_images` (`id`, `project_id`, `image_url`, `caption`, `is_primary`, `sort_order`, `created_at`, `updated_at`) VALUES
-- Project 1: Permata Sakinah 1 - Cihanjuang (Cover & Galeri)
(1, 1, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80', 'Foto Utama - Hamparan Kavling Asri Permata Sakinah 1', 1, 1, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(2, 1, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80', 'View Kavling Hadap Perbukitan & Udara Sejuk', 0, 2, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(3, 1, 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1000&q=80', 'Area Hijau Terbuka & Batas Lahan Siap Bangun', 0, 3, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
(4, 1, 'https://images.unsplash.com/photo-1541888946425-d0fbb18f1568?auto=format&fit=crop&w=1000&q=80', 'Proses Pematangan Lahan & Akses Jalan Beton 6m', 0, 4, '2026-01-01 00:00:00', '2026-01-01 00:00:00'),

-- Project 2: Permata Sakinah 2 - Cilame (Cover & Galeri)
(5, 2, 'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1000&q=80', 'Foto Utama - Gerbang Masuk & Kawasan Hijau Permata Sakinah 2', 1, 1, '2026-01-15 00:00:00', '2026-01-15 00:00:00'),
(6, 2, 'https://images.unsplash.com/photo-1524813686514-a57563d77d61?auto=format&fit=crop&w=1000&q=80', 'Kontur Tanah Darat Padat Siap Bangun Cilame', 0, 2, '2026-01-15 00:00:00', '2026-01-15 00:00:00'),
(7, 2, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80', 'Pemandangan Sekitar Kawasan Sukatani Hills', 0, 3, '2026-01-15 00:00:00', '2026-01-15 00:00:00');
