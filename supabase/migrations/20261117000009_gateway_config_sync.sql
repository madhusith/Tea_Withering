-- ==============================================================================
-- TEA WITHERING & DRYING MONITORING SYSTEM
-- MIGRATION 09: Gateway Configuration Synchronization & Token Auth
-- Authoritative cloud configuration sync RPC for Raspberry Pi Master Gateway
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Gateways: Add token_hash and config_version
ALTER TABLE gateways ADD COLUMN IF NOT EXISTS token_hash TEXT;
ALTER TABLE gateways ADD COLUMN IF NOT EXISTS config_version INTEGER NOT NULL DEFAULT 1;

-- 2. Devices: Add lora_address_num and sort_order
ALTER TABLE devices ADD COLUMN IF NOT EXISTS lora_address_num INTEGER;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Backfill integer lora_address_num and sort_order for known hardware nodes
UPDATE devices SET lora_address_num = 1, sort_order = 1 WHERE device_code = 'TR-001';
UPDATE devices SET lora_address_num = 2, sort_order = 2 WHERE device_code = 'TR-002';
UPDATE devices SET lora_address_num = 3, sort_order = 3 WHERE device_code = 'TR-003';
UPDATE devices SET lora_address_num = 4, sort_order = 4 WHERE device_code = 'TR-004';
UPDATE devices SET lora_address_num = 5, sort_order = 5 WHERE device_code = 'DR-001';

-- Fallback for any other added devices: extract digit from code or default
UPDATE devices 
SET lora_address_num = COALESCE(NULLIF(regexp_replace(device_code, '\D', '', 'g'), '')::INTEGER, 1),
    sort_order = COALESCE(NULLIF(regexp_replace(device_code, '\D', '', 'g'), '')::INTEGER, 10)
WHERE lora_address_num IS NULL;

-- 3. Notification Recipients: Add role, sms_alarms, sms_offline
ALTER TABLE notification_recipients ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Factory Lead';
ALTER TABLE notification_recipients ADD COLUMN IF NOT EXISTS sms_alarms BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_recipients ADD COLUMN IF NOT EXISTS sms_offline BOOLEAN NOT NULL DEFAULT true;

-- Seed baseline factory contacts for St. Clair Tea Estate
INSERT INTO notification_recipients (factory_id, name, role, phone, email, enabled, sms_alarms, sms_offline)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'Kavinda Dissanayake', 'Factory Manager', '+94771234567', 'kavinda.d@stclairtea.lk', true, true, true),
  ('22222222-2222-2222-2222-222222222222', 'Priyantha Senanayake', 'Assistant Estate Manager', '+94772345678', 'priyantha.s@stclairtea.lk', true, true, true),
  ('22222222-2222-2222-2222-222222222222', 'Chaminda Silva', 'Lead Electrical Officer', '+94773456789', 'chaminda.s@stclairtea.lk', true, true, false)
ON CONFLICT DO NOTHING;

-- 4. Status Events: Allow CONFIG_APPLIED and CONFIG_REJECTED event types
ALTER TABLE status_events DROP CONSTRAINT IF EXISTS status_events_event_type_check;
ALTER TABLE status_events ADD CONSTRAINT status_events_event_type_check 
  CHECK (event_type IN ('ONLINE', 'OFFLINE', 'BOOT', 'SENSOR_FAULT', 'SENSOR_RECOVERED', 'CONFIG_APPLIED', 'CONFIG_REJECTED'));

-- 5. Seed Bcrypt Token Hash for Gateway GW-STCLAIR-01
-- Device Token: gw_tok_stclair_3f8d9b1a7e5c2460
UPDATE gateways 
SET token_hash = crypt('gw_tok_stclair_3f8d9b1a7e5c2460', gen_salt('bf', 10)),
    config_version = 1
WHERE serial_number = 'GW-STCLAIR-01';

-- 6. Trigger to automatically increment config_version on any config change
CREATE OR REPLACE FUNCTION bump_gateway_config_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_factory_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'devices' THEN
    v_factory_id := COALESCE(NEW.factory_id, OLD.factory_id);
  ELSIF TG_TABLE_NAME = 'alarm_rules' THEN
    v_factory_id := COALESCE(NEW.factory_id, OLD.factory_id);
  ELSIF TG_TABLE_NAME = 'notification_recipients' THEN
    v_factory_id := COALESCE(NEW.factory_id, OLD.factory_id);
  ELSIF TG_TABLE_NAME = 'factories' THEN
    v_factory_id := COALESCE(NEW.id, OLD.id);
  END IF;

  IF v_factory_id IS NOT NULL THEN
    UPDATE gateways
    SET config_version = config_version + 1,
        updated_at = now()
    WHERE factory_id = v_factory_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_gateway_on_device ON devices;
CREATE TRIGGER trg_bump_gateway_on_device
AFTER INSERT OR UPDATE OR DELETE ON devices
FOR EACH ROW EXECUTE FUNCTION bump_gateway_config_version();

DROP TRIGGER IF EXISTS trg_bump_gateway_on_alarm_rule ON alarm_rules;
CREATE TRIGGER trg_bump_gateway_on_alarm_rule
AFTER INSERT OR UPDATE OR DELETE ON alarm_rules
FOR EACH ROW EXECUTE FUNCTION bump_gateway_config_version();

DROP TRIGGER IF EXISTS trg_bump_gateway_on_recipient ON notification_recipients;
CREATE TRIGGER trg_bump_gateway_on_recipient
AFTER INSERT OR UPDATE OR DELETE ON notification_recipients
FOR EACH ROW EXECUTE FUNCTION bump_gateway_config_version();

DROP TRIGGER IF EXISTS trg_bump_gateway_on_factory ON factories;
CREATE TRIGGER trg_bump_gateway_on_factory
AFTER UPDATE ON factories
FOR EACH ROW EXECUTE FUNCTION bump_gateway_config_version();

-- 7. RPC: gateway_config(p_gateway_serial TEXT, p_device_token TEXT)
CREATE OR REPLACE FUNCTION gateway_config(p_gateway_serial TEXT, p_device_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_gateway RECORD;
  v_factory RECORD;
  v_devices JSONB;
  v_contacts JSONB;
BEGIN
  -- Authenticate Gateway via serial and bcrypt token verification
  SELECT * INTO v_gateway
  FROM gateways
  WHERE serial_number = p_gateway_serial;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized: Gateway not found' USING ERRCODE = '28000';
  END IF;

  IF v_gateway.token_hash IS NULL OR crypt(p_device_token, v_gateway.token_hash) <> v_gateway.token_hash THEN
    RAISE EXCEPTION 'Unauthorized: Invalid gateway token' USING ERRCODE = '28000';
  END IF;

  -- Update gateway heartbeat timestamp
  UPDATE gateways
  SET last_seen_at = now()
  WHERE id = v_gateway.id;

  -- Fetch Factory Details
  SELECT code, name, timezone INTO v_factory
  FROM factories
  WHERE id = v_gateway.factory_id;

  -- Fetch Devices with Effective Alarm Limits
  -- (Device-specific override in alarm_rules takes precedence, falls back to factory default)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'device_code', d.device_code,
        'lora_address', COALESCE(d.lora_address_num, 1),
        'type', LOWER(d.type::TEXT),
        'name', SUBSTRING(d.name FROM 1 FOR 32),
        'active', d.active,
        'sort_order', d.sort_order,
        'alarm_min', COALESCE(r_dev.min_value, r_def.min_value),
        'alarm_max', COALESCE(r_dev.max_value, r_def.max_value)
      )
      ORDER BY d.sort_order ASC, d.device_code ASC
    ),
    '[]'::jsonb
  ) INTO v_devices
  FROM devices d
  LEFT JOIN alarm_rules r_dev 
    ON r_dev.device_id = d.id 
    AND r_dev.enabled = true
  LEFT JOIN alarm_rules r_def 
    ON r_def.factory_id = d.factory_id 
    AND r_def.device_id IS NULL 
    AND r_def.device_type = d.type 
    AND r_def.metric = (CASE WHEN d.type = 'DRYER' THEN 'SUPPLY_AIR_TEMPERATURE' ELSE 'WET_BULB_DEPRESSION' END)
    AND r_def.enabled = true
  WHERE d.gateway_id = v_gateway.id OR d.factory_id = v_gateway.factory_id;

  -- Fetch Contacts (notification recipients)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'name', nr.name,
        'role', COALESCE(nr.role, 'Factory Lead'),
        'phone', COALESCE(nr.phone, ''),
        'sms_alarms', nr.sms_alarms,
        'sms_offline', nr.sms_offline,
        'active', nr.enabled
      )
      ORDER BY nr.created_at ASC
    ),
    '[]'::jsonb
  ) INTO v_contacts
  FROM notification_recipients nr
  WHERE nr.factory_id = v_gateway.factory_id;

  -- Return consolidated configuration payload
  RETURN jsonb_build_object(
    'factory', jsonb_build_object(
      'code', v_factory.code,
      'name', v_factory.name,
      'timezone', v_factory.timezone
    ),
    'devices', v_devices,
    'contacts', v_contacts,
    'config_version', v_gateway.config_version
  );
END;
$$;

-- Grant execution to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION gateway_config(TEXT, TEXT) TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
