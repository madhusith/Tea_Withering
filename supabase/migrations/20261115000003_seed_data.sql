-- ==============================================================================
-- TEA WITHERING & DRYING MONITORING SYSTEM
-- MIGRATION 03: Initial Seed Data
-- St. Clair Tea Estate (Kelani Valley Plantations PLC / Hayleys)
-- ==============================================================================

-- 1. Insert Organization
INSERT INTO organizations (id, name, code)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Kelani Valley Plantations PLC',
  'KVPL'
) ON CONFLICT (code) DO NOTHING;

-- 2. Insert Factory (NO Factory Floors; strictly Organization -> Factory)
INSERT INTO factories (id, organization_id, name, code, location, timezone, status)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Ingestre Tea Factory KVPL',
  'STCLAIR',
  'Talawakelle, Central Province, Sri Lanka',
  'Asia/Colombo',
  'ACTIVE'
) ON CONFLICT (code) DO NOTHING;

-- 3. Insert Gateway
INSERT INTO gateways (id, factory_id, serial_number, firmware_version, ip_address, status, last_seen_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  'GW-STCLAIR-01',
  'v2.4.1-industrial',
  '192.168.10.1',
  'NORMAL',
  now()
) ON CONFLICT (serial_number) DO NOTHING;

-- 4. Insert Devices (4 Withering Troughs + 1 Dryer Machine)
-- Withering Troughs: TROUGH
INSERT INTO devices (id, factory_id, gateway_id, device_code, name, type, lora_address, hardware_serial, firmware_version, active)
VALUES
  ('44444444-4444-4444-4444-000000000001', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'TR-001', 'Bay 01', 'TROUGH', '0x101', 'ESP32-S3-TR001', 'v1.2.0', true),
  ('44444444-4444-4444-4444-000000000002', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'TR-002', 'Bay 02', 'TROUGH', '0x102', 'ESP32-S3-TR002', 'v1.2.0', true),
  ('44444444-4444-4444-4444-000000000003', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'TR-003', 'Bay 03', 'TROUGH', '0x103', 'ESP32-S3-TR003', 'v1.2.0', true),
  ('44444444-4444-4444-4444-000000000004', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'TR-004', 'Bay 04', 'TROUGH', '0x104', 'ESP32-S3-TR004', 'v1.2.0', true)
ON CONFLICT (factory_id, device_code) DO NOTHING;

-- Dryer Machine (Biomass Heating Bay): DRYER (Single temperature only!)
INSERT INTO devices (id, factory_id, gateway_id, device_code, name, type, lora_address, hardware_serial, firmware_version, active)
VALUES
  ('44444444-4444-4444-4444-000000000005', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'DR-001', 'Biomass Heating Bay', 'DRYER', '0x201', 'ESP32-S3-DR001', 'v1.2.0', true)
ON CONFLICT (factory_id, device_code) DO NOTHING;

-- 5. Insert Default Alarm Rules (Parameters)
INSERT INTO alarm_rules (factory_id, device_type, metric, min_value, max_value, duration_seconds, hysteresis, severity, enabled)
VALUES
  -- Withering Trough Depression Limits: Target band 0.0°C to 8.0°C
  ('22222222-2222-2222-2222-222222222222', 'TROUGH', 'WET_BULB_DEPRESSION', 0.0, 8.0, 120, 0.2, 'WARNING', true),
  -- Withering Trough Dry Bulb Ambient Upper Limit: 38.0°C
  ('22222222-2222-2222-2222-222222222222', 'TROUGH', 'DRY_BULB_TEMPERATURE', 18.0, 38.0, 60, 0.5, 'WARNING', true),
  -- Withering Trough Wet Bulb Ambient Upper Limit: 28.0°C
  ('22222222-2222-2222-2222-222222222222', 'TROUGH', 'WET_BULB_TEMPERATURE', 14.0, 28.0, 60, 0.5, 'WARNING', true),
  -- Biomass Heating Bay (Dryer) Supply Air Temperature: 80.0°C to 90.0°C (Target: 85.0°C)
  ('22222222-2222-2222-2222-222222222222', 'DRYER', 'SUPPLY_AIR_TEMPERATURE', 80.0, 90.0, 30, 1.0, 'CRITICAL', true);

-- 6. Insert Initial Device Status Records
INSERT INTO device_status (device_id, gateway_id, last_seen_at, status, last_sequence_no, battery_level)
VALUES
  ('44444444-4444-4444-4444-000000000001', '33333333-3333-3333-3333-333333333333', now(), 'NORMAL', 1420, 98.5),
  ('44444444-4444-4444-4444-000000000002', '33333333-3333-3333-3333-333333333333', now(), 'WARNING', 1419, 96.2),
  ('44444444-4444-4444-4444-000000000003', '33333333-3333-3333-3333-333333333333', now(), 'NORMAL', 1421, 99.1),
  ('44444444-4444-4444-4444-000000000004', '33333333-3333-3333-3333-333333333333', now(), 'NORMAL', 1418, 97.4),
  ('44444444-4444-4444-4444-000000000005', '33333333-3333-3333-3333-333333333333', now(), 'NORMAL', 890, 99.8)
ON CONFLICT (device_id) DO NOTHING;

-- 7. Insert Initial Readings (Compliant with Trough vs Dryer rules)
INSERT INTO readings (device_id, gateway_id, captured_at, received_at, temp_dry, temp_wet, delta, temperature, sequence_no, boot_id)
VALUES
  -- Troughs: have temp_dry, temp_wet, delta
  ('44444444-4444-4444-4444-000000000001', '33333333-3333-3333-3333-333333333333', now(), now(), 28.4, 24.1, 4.3, NULL, 1420, 'BOOT-2026-A1'),
  ('44444444-4444-4444-4444-000000000002', '33333333-3333-3333-3333-333333333333', now(), now(), 31.8, 26.2, 5.6, NULL, 1419, 'BOOT-2026-A2'),
  ('44444444-4444-4444-4444-000000000003', '33333333-3333-3333-3333-333333333333', now(), now(), 29.5, 25.4, 4.1, NULL, 1421, 'BOOT-2026-A3'),
  ('44444444-4444-4444-4444-000000000004', '33333333-3333-3333-3333-333333333333', now(), now(), 27.9, 23.9, 4.0, NULL, 1418, 'BOOT-2026-A4'),
  -- Dryer: ONLY temperature; temp_wet and delta MUST BE NULL!
  ('44444444-4444-4444-4444-000000000005', '33333333-3333-3333-3333-333333333333', now(), now(), NULL, NULL, NULL, 84.5, 890, 'BOOT-2026-D1')
ON CONFLICT (device_id, boot_id, sequence_no) DO NOTHING;

