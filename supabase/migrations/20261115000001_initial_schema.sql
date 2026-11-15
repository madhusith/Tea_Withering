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

