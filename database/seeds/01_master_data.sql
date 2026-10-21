-- Master Data Seeds

-- Ranks
INSERT IGNORE INTO `ranks` (`id`, `name`, `description`, `is_active`) VALUES
(1, 'Superintendent', 'Senior Executive / Supervisory Rank', 1),
(2, 'Deputy Superintendent', 'Supervisory Administrative Rank', 1),
(3, 'Inspector', 'Field / Station Incharge Rank', 1),
(4, 'Sub-Inspector', 'Investigative & Operations Rank', 1),
(5, 'Assistant Sub-Inspector', 'Operations & Beat Incharge Rank', 1),
(6, 'Head Constable', 'Supervisory Beat Officer Rank', 1),
(7, 'Constable', 'Frontline Beat Member Rank', 1),
(8, 'Senior Executive Officer', 'Departmental Executive Rank', 1),
(9, 'Junior Executive Member', 'Administrative Staff Member Rank', 1);

-- Zones
INSERT IGNORE INTO `zones` (`id`, `name`, `code`, `is_active`) VALUES
(1, 'North Zone', 'NZ-01', 1),
(2, 'South Zone', 'SZ-02', 1),
(3, 'East Zone', 'EZ-03', 1),
(4, 'West Zone', 'WZ-04', 1),
(5, 'Central Zone', 'CZ-05', 1),
(6, 'Motorway North', 'MW-N', 1),
(7, 'MC-I', 'MC-I', 1);

-- Sectors
INSERT IGNORE INTO `sectors` (`id`, `zone_id`, `name`, `code`, `is_active`) VALUES
(1, 1, 'Sector Alpha (North)', 'SEC-NZ-A', 1),
(2, 1, 'Sector Bravo (North)', 'SEC-NZ-B', 1),
(3, 2, 'Sector Charlie (South)', 'SEC-SZ-C', 1),
(4, 2, 'Sector Delta (South)', 'SEC-SZ-D', 1),
(5, 3, 'Sector Echo (East)', 'SEC-EZ-E', 1),
(6, 4, 'Sector Foxtrot (West)', 'SEC-WZ-F', 1),
(7, 5, 'Sector Central Core', 'SEC-CZ-G', 1);

-- Beats
INSERT IGNORE INTO `beats` (`id`, `sector_id`, `name`, `code`, `is_active`) VALUES
(1, 1, 'Beat 01 - Commercial Boulevard', 'BT-01', 1),
(2, 1, 'Beat 02 - Northern Heights', 'BT-02', 1),
(3, 2, 'Beat 03 - Industrial Enclave', 'BT-03', 1),
(4, 3, 'Beat 04 - Harbor & Port View', 'BT-04', 1),
(5, 4, 'Beat 05 - Southern District', 'BT-05', 1),
(6, 5, 'Beat 06 - Eastern Ring', 'BT-06', 1),
(7, 6, 'Beat 07 - Civic Centre', 'BT-07', 1),
(8, 7, 'Beat 08 - Secretariat Zone', 'BT-08', 1);

-- Support Areas for Welfare
INSERT IGNORE INTO `support_areas` (`id`, `name`, `description`, `is_active`) VALUES
(1, 'Medical Assistance', 'Healthcare, emergency hospitalization, medicine and surgical aid', 1),
(2, 'Family Support', 'Subsistence grant and household bereavement support for member families', 1),
(3, 'Emergency Assistance', 'Accident, disaster, or sudden crisis relief aid', 1),
(4, 'Education', 'Educational scholarships and children academic support', 1),
(5, 'Other', 'General welfare support and miscellaneous humanitarian aid', 1);

-- System Settings
INSERT IGNORE INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('organization_name', 'Membership & Welfare Institutional Authority', 'Official organizational title'),
('system_currency', 'PKR', 'Currency code for all monetary vouchers and reports'),
('org_fund_status', 'Not Configured', 'Organizational Fund Balance status (Not Configured or Active)'),
('allow_member_contact_update', '1', 'Allow regular members to update their contact and address (1=Yes, 0=No)'),
('session_timeout_minutes', '60', 'Automatic idle session logout timeout'),
('require_reversal_reason', '1', 'Enforce mandatory text justification when reversing posted transactions');
