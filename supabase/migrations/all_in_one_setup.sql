-- ==============================================================================
-- TEA WITHERING & DRYING MONITORING SYSTEM
-- MIGRATION 01: Initial Schema (All 18 Domain Tables)
-- Compliant with TEA_WITHERING_MONITORING_SYSTEM_ANTIGRAVITY_GUIDE.md Section 7
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES & DOMAINS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE device_type AS ENUM ('TROUGH', 'DRYER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE operational_status AS ENUM ('NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE', 'SENSOR_FAULT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE alarm_event_type AS ENUM ('TRIGGERED', 'ACKNOWLEDGED', 'SNOOZED', 'UNSNOOZED', 'CLEARED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE configuration_status AS ENUM ('SAVED', 'PENDING', 'APPLIED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE remote_command_status AS ENUM ('PENDING', 'SENT', 'ACKNOWLEDGED', 'FAILED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 7.1 ORGANIZATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7.2 FACTORIES (NO Factory Floors; strictly Organization -> Factory)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS factories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  location TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Colombo',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_factories_org ON factories(organization_id);

-- ==============================================================================
-- 7.3 PROFILES (Linked to Supabase auth.users; NEVER store plaintext passwords)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7.4 MEMBERSHIPS (Multi-tenant user role bindings; strictly admin, manager, viewer)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_factory_membership UNIQUE (user_id, organization_id, factory_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_factory ON memberships(factory_id);

-- ==============================================================================
-- 7.5 GATEWAYS (Raspberry Pi industrial bridge nodes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL UNIQUE,
  firmware_version TEXT NOT NULL DEFAULT 'v1.0.0',
  ip_address TEXT,
  last_seen_at TIMESTAMPTZ,
  status operational_status NOT NULL DEFAULT 'OFFLINE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_gateways_factory ON gateways(factory_id);

-- ==============================================================================
-- 7.6 DEVICES (Troughs and Dryers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  gateway_id UUID REFERENCES gateways(id) ON DELETE SET NULL,
  device_code TEXT NOT NULL,
  name TEXT NOT NULL,
  type device_type NOT NULL,
  lora_address TEXT,
  hardware_serial TEXT,
  firmware_version TEXT DEFAULT 'v1.0.0',
  active BOOLEAN NOT NULL DEFAULT true,
  installed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_factory_device_code UNIQUE (factory_id, device_code)
);

CREATE INDEX IF NOT EXISTS idx_devices_factory ON devices(factory_id);
CREATE INDEX IF NOT EXISTS idx_devices_gateway ON devices(gateway_id);

-- ==============================================================================
-- 7.7 READINGS (Idempotent telemetry stream)
-- DRYER RULE: temp_wet and delta MUST BE NULL for dryers!
-- ==============================================================================
CREATE TABLE IF NOT EXISTS readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  gateway_id UUID REFERENCES gateways(id) ON DELETE SET NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  temp_dry NUMERIC(5, 2),
  temp_wet NUMERIC(5, 2),
  delta NUMERIC(5, 2),
  temperature NUMERIC(5, 2),
  sequence_no BIGINT NOT NULL,
  boot_id TEXT NOT NULL,
  sensor_fault_code TEXT,
  rssi INTEGER,
  snr NUMERIC(4, 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_idempotent_reading UNIQUE (device_id, boot_id, sequence_no)
);

CREATE INDEX IF NOT EXISTS idx_readings_device_captured ON readings(device_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_gateway_received ON readings(gateway_id, received_at DESC);

-- ==============================================================================
-- 7.8 ALARM_RULES (Threshold parameter configuration)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS alarm_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  device_type device_type NOT NULL,
  metric TEXT NOT NULL,
  min_value NUMERIC(6, 2),
  max_value NUMERIC(6, 2),
  duration_seconds INTEGER NOT NULL DEFAULT 60,
  hysteresis NUMERIC(4, 2) NOT NULL DEFAULT 0.5,
  severity TEXT NOT NULL DEFAULT 'WARNING' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_alarm_rules_factory ON alarm_rules(factory_id);

-- ==============================================================================
-- 7.9 ALARMS (Active alarm lifecycle state)
-- Snooze is NOT resolved.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS alarms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES alarm_rules(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (state IN ('ACTIVE', 'ACKNOWLEDGED', 'SNOOZED', 'CLEARED')),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  trigger_value NUMERIC(6, 2) NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  cleared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_alarms_device_state ON alarms(device_id, state);

-- ==============================================================================
-- 7.10 ALARM_EVENTS (Immutable audit history of alarm transitions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS alarm_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alarm_id UUID NOT NULL REFERENCES alarms(id) ON DELETE CASCADE,
  event_type alarm_event_type NOT NULL,
  event_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'SYSTEM',
  details JSONB
);

CREATE INDEX IF NOT EXISTS idx_alarm_events_alarm ON alarm_events(alarm_id);

-- ==============================================================================
-- 7.11 DEVICE_STATUS (Latest connection heartbeat cache)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS device_status (
  device_id UUID PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  gateway_id UUID REFERENCES gateways(id) ON DELETE SET NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  status operational_status NOT NULL DEFAULT 'OFFLINE',
  last_sequence_no BIGINT,
  battery_level NUMERIC(4, 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7.12 STATUS_EVENTS (Connectivity & sensor lifecycle transitions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  gateway_id UUID REFERENCES gateways(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('ONLINE', 'OFFLINE', 'BOOT', 'SENSOR_FAULT', 'SENSOR_RECOVERED')),
  event_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  detected_by TEXT NOT NULL DEFAULT 'GATEWAY_HEARTBEAT',
  details JSONB
);

CREATE INDEX IF NOT EXISTS idx_status_events_device ON status_events(device_id);

-- ==============================================================================
-- 7.13 CALIBRATIONS (Historical sensor calibration coefficients)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS calibrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  sensor_role TEXT NOT NULL CHECK (sensor_role IN ('DRY', 'WET', 'TEMPERATURE')),
  offset_value NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  multiplier NUMERIC(5, 3) NOT NULL DEFAULT 1.000,
  calibration_notes TEXT,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_calibrations_device ON calibrations(device_id);

-- ==============================================================================
-- 7.14 DEVICE_CONFIGURATIONS (Versioned OTA hardware parameters)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS device_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  configuration_version INTEGER NOT NULL DEFAULT 1,
  reading_interval_seconds INTEGER NOT NULL DEFAULT 30,
  configuration_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status configuration_status NOT NULL DEFAULT 'SAVED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  applied_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_device_configurations_device ON device_configurations(device_id);

-- ==============================================================================
-- 7.15 REMOTE_COMMANDS (Downlink commands to gateways; NO MACHINERY CONTROL)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS remote_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_id UUID NOT NULL REFERENCES gateways(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  command_type TEXT NOT NULL CHECK (command_type IN ('CONFIG_UPDATE', 'RESTART_NODE', 'PING', 'REQUEST_DIAGNOSTICS')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status remote_command_status NOT NULL DEFAULT 'PENDING',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  acknowledged_at TIMESTAMPTZ,
  result_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_remote_commands_gateway ON remote_commands(gateway_id, status);

-- ==============================================================================
-- 7.16 NOTIFICATION_RECIPIENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  severity_preferences TEXT[] NOT NULL DEFAULT ARRAY['WARNING', 'CRITICAL']::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notification_recipients_factory ON notification_recipients(factory_id);

-- ==============================================================================
-- 7.17 NOTIFICATION_LOG
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alarm_event_id UUID REFERENCES alarm_events(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('SMS', 'EMAIL', 'PUSH', 'WEBHOOK')),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SENT' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  response_details JSONB
);

-- ==============================================================================
-- 7.18 AUDIT_LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  factory_id UUID REFERENCES factories(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_factory_time ON audit_logs(factory_id, created_at DESC);

-- ==============================================================================
-- TEA WITHERING & DRYING MONITORING SYSTEM
-- MIGRATION 02: Row Level Security (RLS) & Multi-Tenant Access Policies
-- Strict role division: admin (full control), manager (operations), viewer (read-only)
-- ==============================================================================

-- 1. HELPER SECURITY DEFINER FUNCTIONS
CREATE OR REPLACE FUNCTION auth_user_has_factory_access(f_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND (m.factory_id = f_id OR m.factory_id IS NULL)
  );
$$;

CREATE OR REPLACE FUNCTION auth_user_has_role(f_id UUID, required_roles user_role[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND (m.factory_id = f_id OR m.factory_id IS NULL)
      AND m.role = ANY(required_roles)
  );
$$;

-- 2. ENABLE RLS ON ALL DOMAIN TABLES
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarm_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarm_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE remote_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. ORGANIZATIONS POLICIES
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.organization_id = organizations.id
        AND m.user_id = auth.uid()
    )
  );

-- 4. FACTORIES POLICIES
CREATE POLICY "Users can view factories they are member of"
  ON factories FOR SELECT
  USING (
    auth_user_has_factory_access(factories.id)
  );

CREATE POLICY "Admins can update their factories"
  ON factories FOR UPDATE
  USING (
    auth_user_has_role(factories.id, ARRAY['admin']::user_role[])
  );

-- 5. PROFILES POLICIES
CREATE POLICY "Users can view profiles in same organization"
  ON profiles FOR SELECT
  USING (
    auth.uid() = profiles.id OR
    EXISTS (
      SELECT 1 FROM memberships my_m
      JOIN memberships their_m ON my_m.organization_id = their_m.organization_id
      WHERE my_m.user_id = auth.uid()
        AND their_m.user_id = profiles.id
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = profiles.id);

-- 6. MEMBERSHIPS POLICIES
CREATE POLICY "Users can view memberships in their organization"
  ON memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships my_m
      WHERE my_m.user_id = auth.uid()
        AND my_m.organization_id = memberships.organization_id
    )
  );

CREATE POLICY "Admins can manage memberships"
  ON memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM memberships my_m
      WHERE my_m.user_id = auth.uid()
        AND my_m.organization_id = memberships.organization_id
        AND my_m.role = 'admin'
    )
  );

-- 7. GATEWAYS POLICIES
CREATE POLICY "Users can view gateways in their factory"
  ON gateways FOR SELECT
  USING (auth_user_has_factory_access(gateways.factory_id));

CREATE POLICY "Admins can manage gateways"
  ON gateways FOR ALL
  USING (auth_user_has_role(gateways.factory_id, ARRAY['admin']::user_role[]));

-- 8. DEVICES POLICIES
CREATE POLICY "Users can view devices in their factory"
  ON devices FOR SELECT
  USING (auth_user_has_factory_access(devices.factory_id));

CREATE POLICY "Admins can manage devices"
  ON devices FOR ALL
  USING (auth_user_has_role(devices.factory_id, ARRAY['admin']::user_role[]));

-- 9. READINGS POLICIES (Telemetry stream)
CREATE POLICY "Users can view readings for accessible devices"
  ON readings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM devices d
      WHERE d.id = readings.device_id
        AND auth_user_has_factory_access(d.factory_id)
    )
  );

-- Ingestion role or gateways insert telemetry
CREATE POLICY "Gateways or service role can insert readings"
  ON readings FOR INSERT
  WITH CHECK (true);

-- 10. ALARM RULES POLICIES
CREATE POLICY "Users can view alarm rules in their factory"
  ON alarm_rules FOR SELECT
  USING (auth_user_has_factory_access(alarm_rules.factory_id));

CREATE POLICY "Admins and Managers can edit alarm rules"
  ON alarm_rules FOR ALL
  USING (auth_user_has_role(alarm_rules.factory_id, ARRAY['admin', 'manager']::user_role[]));

-- 11. ALARMS & ALARM EVENTS POLICIES
CREATE POLICY "Users can view alarms in their factory"
  ON alarms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM devices d
      WHERE d.id = alarms.device_id
        AND auth_user_has_factory_access(d.factory_id)
    )
  );

CREATE POLICY "Admins and Managers can update alarm lifecycle"
  ON alarms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM devices d
      WHERE d.id = alarms.device_id
        AND auth_user_has_role(d.factory_id, ARRAY['admin', 'manager']::user_role[])
    )
  );

CREATE POLICY "Users can view alarm events"
  ON alarm_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM alarms a
      JOIN devices d ON a.device_id = d.id
      WHERE a.id = alarm_events.alarm_id
        AND auth_user_has_factory_access(d.factory_id)
    )
  );

CREATE POLICY "Admins and Managers can record alarm events"
  ON alarm_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM alarms a
      JOIN devices d ON a.device_id = d.id
      WHERE a.id = alarm_events.alarm_id
        AND auth_user_has_role(d.factory_id, ARRAY['admin', 'manager']::user_role[])
    )
  );

-- 12. DEVICE STATUS POLICIES
CREATE POLICY "Users can view device status"
  ON device_status FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM devices d
      WHERE d.id = device_status.device_id
        AND auth_user_has_factory_access(d.factory_id)
    )
  );

-- 13. AUDIT LOGS POLICIES
CREATE POLICY "Users can view audit logs in their factory"
  ON audit_logs FOR SELECT
  USING (
    audit_logs.factory_id IS NULL OR auth_user_has_factory_access(audit_logs.factory_id)
  );

CREATE POLICY "System can record audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

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
  'St. Clair Tea Estate',
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
  -- Withering Trough Depression Limits: Target band 3.5°C to 4.8°C
  ('22222222-2222-2222-2222-222222222222', 'TROUGH', 'WET_BULB_DEPRESSION', 3.5, 4.8, 120, 0.2, 'WARNING', true),
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

