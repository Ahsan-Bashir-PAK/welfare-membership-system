-- Membership, Payments, Welfare & Transfer Management System Schema

-- 1. Users Table (Authentication and Account Role)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cnic` VARCHAR(13) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('Super Admin', 'Focal Person', 'User') NOT NULL DEFAULT 'User',
  `status` ENUM('Active', 'Disable') NOT NULL DEFAULT 'Active',
  `must_change_password` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_cnic` (`cnic`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Master Data Tables: Ranks, Zones, Sectors, Beats, Support Areas
CREATE TABLE IF NOT EXISTS `ranks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ranks_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `zones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_zones_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sectors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `zone_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_zone_sector` (`zone_id`, `name`),
  FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX `idx_sectors_zone` (`zone_id`),
  INDEX `idx_sectors_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `beats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sector_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_sector_beat` (`sector_id`, `name`),
  FOREIGN KEY (`sector_id`) REFERENCES `sectors`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX `idx_beats_sector` (`sector_id`),
  INDEX `idx_beats_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `support_areas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_support_areas_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Member Profiles Table
CREATE TABLE IF NOT EXISTS `member_profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `member_id` VARCHAR(30) NOT NULL UNIQUE,
  `cnic` VARCHAR(13) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `father_name` VARCHAR(150) NOT NULL,
  `rank_id` INT NULL,
  `rank_name` VARCHAR(100) NOT NULL,
  `posting` VARCHAR(200) NOT NULL,
  `address` TEXT NOT NULL,
  `zone_id` INT NULL,
  `zone_name` VARCHAR(100) NOT NULL,
  `sector_id` INT NULL,
  `sector_name` VARCHAR(100) NOT NULL,
  `beat_id` INT NULL,
  `beat_name` VARCHAR(100) NOT NULL,
  `contact` VARCHAR(30) NOT NULL,
  `date_of_birth` DATE NOT NULL,
  `membership_date` DATE NOT NULL,
  `membership_status` ENUM('Active', 'Disable') NOT NULL DEFAULT 'Active',
  `created_by` INT NOT NULL,
  `updated_by` INT NULL,
  `archived_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (`rank_id`) REFERENCES `ranks`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (`sector_id`) REFERENCES `sectors`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (`beat_id`) REFERENCES `beats`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX `idx_members_cnic` (`cnic`),
  INDEX `idx_members_name` (`name`),
  INDEX `idx_members_status` (`membership_status`),
  INDEX `idx_members_date` (`membership_date`),
  INDEX `idx_members_zone` (`zone_id`),
  INDEX `idx_members_sector` (`sector_id`),
  INDEX `idx_members_rank` (`rank_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Membership Status History
CREATE TABLE IF NOT EXISTS `membership_status_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `previous_status` ENUM('Active', 'Disable') NOT NULL,
  `new_status` ENUM('Active', 'Disable') NOT NULL,
  `changed_by` INT NOT NULL,
  `reason` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`member_id`) REFERENCES `member_profiles`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX `idx_status_hist_member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Payments Table (Money received from members)
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_number` VARCHAR(30) NOT NULL UNIQUE,
  `member_id` INT NOT NULL,
  `member_cnic` VARCHAR(13) NOT NULL,
  `member_name` VARCHAR(150) NOT NULL,
  `payment_date` DATE NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `payment_type` ENUM('Membership Fee', 'Monthly Contribution', 'Donation', 'Other') NOT NULL,
  `payment_method` ENUM('Cash', 'Bank Transfer', 'Other') NOT NULL,
  `reference_number` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `status` ENUM('Draft', 'Posted', 'Reversed') NOT NULL DEFAULT 'Posted',
  `added_by` INT NOT NULL,
  `posted_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `reversed_at` TIMESTAMP NULL DEFAULT NULL,
  `reversed_by` INT NULL,
  `reversal_reason` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`member_id`) REFERENCES `member_profiles`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (`reversed_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX `idx_payments_number` (`payment_number`),
  INDEX `idx_payments_cnic` (`member_cnic`),
  INDEX `idx_payments_date` (`payment_date`),
  INDEX `idx_payments_status` (`status`),
  INDEX `idx_payments_type` (`payment_type`),
  INDEX `idx_payments_added_by` (`added_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Welfare Support Table (Money paid out to members)
CREATE TABLE IF NOT EXISTS `welfare_support` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `support_number` VARCHAR(30) NOT NULL UNIQUE,
  `member_id` INT NOT NULL,
  `member_cnic` VARCHAR(13) NOT NULL,
  `member_name` VARCHAR(150) NOT NULL,
  `payment_date` DATE NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `support_area_id` INT NULL,
  `support_area` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `payment_method` ENUM('Cash', 'Bank Transfer', 'Other') NOT NULL,
  `reference_number` VARCHAR(100) NULL,
  `status` ENUM('Draft', 'Posted', 'Reversed') NOT NULL DEFAULT 'Posted',
  `added_by` INT NOT NULL,
  `posted_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `reversed_at` TIMESTAMP NULL DEFAULT NULL,
  `reversed_by` INT NULL,
  `reversal_reason` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`member_id`) REFERENCES `member_profiles`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (`support_area_id`) REFERENCES `support_areas`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (`reversed_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX `idx_welfare_number` (`support_number`),
  INDEX `idx_welfare_cnic` (`member_cnic`),
  INDEX `idx_welfare_date` (`payment_date`),
  INDEX `idx_welfare_status` (`status`),
  INDEX `idx_welfare_area` (`support_area`),
  INDEX `idx_welfare_added_by` (`added_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Member-to-Member Transfers Table (Register ONLY, NO wallets)
CREATE TABLE IF NOT EXISTS `fund_transfers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transfer_number` VARCHAR(30) NOT NULL UNIQUE,
  `transfer_date` DATE NOT NULL,
  `sender_id` INT NOT NULL,
  `sender_cnic` VARCHAR(13) NOT NULL,
  `sender_name` VARCHAR(150) NOT NULL,
  `receiver_id` INT NOT NULL,
  `receiver_cnic` VARCHAR(13) NOT NULL,
  `receiver_name` VARCHAR(150) NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `transfer_purpose` VARCHAR(255) NOT NULL,
  `payment_method` ENUM('Cash', 'Bank Transfer', 'Other') NOT NULL,
  `reference_number` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `status` ENUM('Draft', 'Posted', 'Reversed') NOT NULL DEFAULT 'Posted',
  `added_by` INT NOT NULL,
  `posted_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `reversed_at` TIMESTAMP NULL DEFAULT NULL,
  `reversed_by` INT NULL,
  `reversal_reason` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sender_id`) REFERENCES `member_profiles`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (`receiver_id`) REFERENCES `member_profiles`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (`reversed_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX `idx_transfers_number` (`transfer_number`),
  INDEX `idx_transfers_sender` (`sender_cnic`),
  INDEX `idx_transfers_receiver` (`receiver_cnic`),
  INDEX `idx_transfers_date` (`transfer_date`),
  INDEX `idx_transfers_status` (`status`),
  INDEX `idx_transfers_added_by` (`added_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `actor_id` INT NOT NULL,
  `actor_role` ENUM('Super Admin', 'Focal Person', 'User') NOT NULL,
  `action_type` VARCHAR(50) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(50) NOT NULL,
  `previous_value` JSON NULL,
  `new_value` JSON NULL,
  `reason` TEXT NULL,
  `ip_address` VARCHAR(50) NULL,
  `user_agent` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX `idx_audit_actor` (`actor_id`),
  INDEX `idx_audit_role` (`actor_role`),
  INDEX `idx_audit_action` (`action_type`),
  INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Password Reset Logs Table
CREATE TABLE IF NOT EXISTS `password_reset_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cnic` VARCHAR(13) NOT NULL,
  `success` TINYINT(1) NOT NULL,
  `ip_address` VARCHAR(50) NULL,
  `user_agent` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pw_reset_cnic` (`cnic`),
  INDEX `idx_pw_reset_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. System Settings Table
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) NULL,
  `updated_by` INT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX `idx_settings_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
