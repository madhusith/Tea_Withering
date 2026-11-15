-- ==============================================================================
-- TEA WITHERING & DRYING MONITORING SYSTEM
-- MIGRATION 07: Gateway Ingestion Functions & Anon Access
-- Provides idempotent RPC endpoints for the Raspberry Pi Master Gateway
-- ==============================================================================

-- 1. RPC: Ingest Telemetry Records (Readings & Device Status)
CREATE OR REPLACE FUNCTION ingest_records(records JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  v_inserted_count INT := 0;
  v_skipped_count INT := 0;
  v_device_id UUID;
  v_gateway_id UUID;
  v_factory_id UUID;
  v_device_type device_type;
  v_dry NUMERIC(5,2);
  v_wet NUMERIC(5,2);
  v_delta NUMERIC(5,2);
  v_temp NUMERIC(5,2);
BEGIN
  FOR rec IN SELECT * FROM jsonb_to_recordset(records) AS x(
    record_id UUID,
    factory_id UUID,
    gateway_serial TEXT,
    device_code TEXT,
    device_id UUID,
    captured_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    temp_dry NUMERIC(5,2),
    temp_wet NUMERIC(5,2),
    diff_c NUMERIC(5,2),
    temperature NUMERIC(5,2),
    sequence_no BIGINT,
    boot_id TEXT,
    sensor_fault_code TEXT,
    rssi INT,
    snr NUMERIC(4,1),
    battery_level NUMERIC(4,1)
  )
  LOOP
    -- Resolve Device ID
    v_device_id := rec.device_id;
    IF v_device_id IS NULL AND rec.device_code IS NOT NULL THEN
      SELECT id, type, factory_id INTO v_device_id, v_device_type, v_factory_id
      FROM devices
      WHERE device_code = rec.device_code
      LIMIT 1;
    ELSE
      SELECT type, factory_id INTO v_device_type, v_factory_id
      FROM devices
      WHERE id = v_device_id;
    END IF;

    -- Resolve Gateway ID
    IF rec.gateway_serial IS NOT NULL THEN
      SELECT id INTO v_gateway_id
      FROM gateways
      WHERE serial_number = rec.gateway_serial
      LIMIT 1;
    END IF;

    IF v_device_id IS NOT NULL THEN
      -- Dryers: Single temperature only! temp_wet and delta MUST BE NULL!
      IF v_device_type = 'DRYER' THEN
        v_temp := COALESCE(rec.temperature, rec.temp_dry);
        v_dry := NULL;
        v_wet := NULL;
        v_delta := NULL;
      ELSE
        -- Troughs: calculate delta if diff_c not passed
        v_dry := rec.temp_dry;
        v_wet := rec.temp_wet;
        v_delta := COALESCE(rec.diff_c, (v_dry - v_wet));
        v_temp := NULL;
      END IF;

      -- Insert into readings (Idempotent: UNIQUE (device_id, boot_id, sequence_no))
      INSERT INTO readings (
        id,
        device_id,
        gateway_id,
        captured_at,
        received_at,
        temp_dry,
        temp_wet,
        delta,
        temperature,
        sequence_no,
        boot_id,
        sensor_fault_code,
        rssi,
        snr
      )
      VALUES (
        COALESCE(rec.record_id, gen_random_uuid()),
        v_device_id,
        v_gateway_id,
        COALESCE(rec.captured_at, now()),
        COALESCE(rec.received_at, now()),
        v_dry,
        v_wet,
        v_delta,
        v_temp,
        rec.sequence_no,
        COALESCE(rec.boot_id, 'BOOT-DEFAULT'),
        rec.sensor_fault_code,
        rec.rssi,
        rec.snr
      )
      ON CONFLICT (device_id, boot_id, sequence_no) DO NOTHING;

      IF FOUND THEN
        v_inserted_count := v_inserted_count + 1;
      ELSE
        v_skipped_count := v_skipped_count + 1;
      END IF;

      -- Update device_status cache
      INSERT INTO device_status (
        device_id,
        gateway_id,
        last_seen_at,
        status,
        last_sequence_no,
        battery_level,
        updated_at
      )
      VALUES (
        v_device_id,
        v_gateway_id,
        COALESCE(rec.captured_at, now()),
        CASE WHEN rec.sensor_fault_code IS NOT NULL THEN 'SENSOR_FAULT'::operational_status ELSE 'NORMAL'::operational_status END,
        rec.sequence_no,
        COALESCE(rec.battery_level, 98.0),
        now()
      )
      ON CONFLICT (device_id) DO UPDATE SET
        gateway_id = EXCLUDED.gateway_id,
        last_seen_at = EXCLUDED.last_seen_at,
        status = EXCLUDED.status,
        last_sequence_no = EXCLUDED.last_sequence_no,
        battery_level = EXCLUDED.battery_level,
        updated_at = EXCLUDED.updated_at;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'success',
    'inserted', v_inserted_count,
    'skipped', v_skipped_count
  );
END;
$$;

-- 2. RPC: Ingest Status/Alarms Events
CREATE OR REPLACE FUNCTION ingest_events(events JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  evt RECORD;
  v_inserted_count INT := 0;
  v_device_id UUID;
  v_gateway_id UUID;
BEGIN
  FOR evt IN SELECT * FROM jsonb_to_recordset(events) AS x(
    event_id UUID,
    device_code TEXT,
    gateway_serial TEXT,
    event_type TEXT,
    event_ts TIMESTAMPTZ,
    detected_by TEXT,
    details JSONB
  )
  LOOP
    IF evt.device_code IS NOT NULL THEN
      SELECT id INTO v_device_id FROM devices WHERE device_code = evt.device_code LIMIT 1;
    END IF;

    IF evt.gateway_serial IS NOT NULL THEN
      SELECT id INTO v_gateway_id FROM gateways WHERE serial_number = evt.gateway_serial LIMIT 1;
    END IF;

    INSERT INTO status_events (
      id,
      device_id,
      gateway_id,
      event_type,
      event_at,
      detected_by,
      details
    )
    VALUES (
      COALESCE(evt.event_id, gen_random_uuid()),
      v_device_id,
      v_gateway_id,
      COALESCE(evt.event_type, 'ONLINE'),
      COALESCE(evt.event_ts, now()),
      COALESCE(evt.detected_by, 'RASPBERRY_PI_MASTER'),
      evt.details
    );
    v_inserted_count := v_inserted_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'success',
    'inserted', v_inserted_count
  );
END;
$$;

-- Grant execution to anon and authenticated roles
GRANT EXECUTE ON FUNCTION ingest_records(JSONB) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION ingest_events(JSONB) TO anon, authenticated, service_role;

-- Grant direct insert to anon if Pi wants to write directly to readings or device_status
DROP POLICY IF EXISTS "Anon can insert readings" ON readings;
CREATE POLICY "Anon can insert readings" ON readings FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can insert status_events" ON status_events;
CREATE POLICY "Anon can insert status_events" ON status_events FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can insert device_status" ON device_status;
CREATE POLICY "Anon can insert device_status" ON device_status FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can update device_status" ON device_status;
CREATE POLICY "Anon can update device_status" ON device_status FOR UPDATE TO anon USING (true);
