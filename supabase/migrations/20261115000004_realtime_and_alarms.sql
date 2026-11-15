-- ==============================================================================
-- TEA WITHERING & DRYING MONITORING SYSTEM
-- MIGRATION 04: Supabase Realtime Publication & Automated Alarm Engine
-- Enables WebSockets for live telemetry & threshold violation detection
-- ==============================================================================

-- 1. ENABLE SUPABASE REALTIME ON TELEMETRY & ALARM TABLES
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE readings;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE device_status;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE alarms;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE alarm_events;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. AUTOMATED ALARM EVALUATION TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION evaluate_reading_alarms()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_device devices%ROWTYPE;
  v_rule alarm_rules%ROWTYPE;
  v_val NUMERIC(6, 2);
  v_alarm_id UUID;
  v_is_violating BOOLEAN;
BEGIN
  -- Lookup device to verify factory and type
  SELECT * INTO v_device FROM devices WHERE id = NEW.device_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Loop through active alarm rules applicable to this factory and device type
  FOR v_rule IN
    SELECT * FROM alarm_rules
    WHERE factory_id = v_device.factory_id
      AND device_type = v_device.type
      AND enabled = true
      AND (device_id IS NULL OR device_id = v_device.id)
  LOOP
    v_is_violating := false;
    v_val := NULL;

    -- Evaluate Trough metrics
    IF v_device.type = 'TROUGH' THEN
      IF v_rule.metric = 'WET_BULB_DEPRESSION' AND NEW.delta IS NOT NULL THEN
        v_val := NEW.delta;
        IF (v_rule.max_value IS NOT NULL AND v_val > v_rule.max_value) OR
           (v_rule.min_value IS NOT NULL AND v_val < v_rule.min_value) THEN
          v_is_violating := true;
        END IF;
      ELSIF v_rule.metric = 'DRY_BULB_TEMPERATURE' AND NEW.temp_dry IS NOT NULL THEN
        v_val := NEW.temp_dry;
        IF (v_rule.max_value IS NOT NULL AND v_val > v_rule.max_value) OR
           (v_rule.min_value IS NOT NULL AND v_val < v_rule.min_value) THEN
          v_is_violating := true;
        END IF;
      ELSIF v_rule.metric = 'WET_BULB_TEMPERATURE' AND NEW.temp_wet IS NOT NULL THEN
        v_val := NEW.temp_wet;
        IF (v_rule.max_value IS NOT NULL AND v_val > v_rule.max_value) OR
           (v_rule.min_value IS NOT NULL AND v_val < v_rule.min_value) THEN
          v_is_violating := true;
        END IF;
      END IF;

    -- Evaluate Dryer metrics (Single Temperature only!)
    ELSIF v_device.type = 'DRYER' THEN
      IF v_rule.metric = 'SUPPLY_AIR_TEMPERATURE' AND NEW.temperature IS NOT NULL THEN
        v_val := NEW.temperature;
        IF (v_rule.max_value IS NOT NULL AND v_val > v_rule.max_value) OR
           (v_rule.min_value IS NOT NULL AND v_val < v_rule.min_value) THEN
          v_is_violating := true;
        END IF;
      END IF;
    END IF;

    -- Check if an active/acknowledged/snoozed alarm already exists for this rule & device
    SELECT id INTO v_alarm_id
    FROM alarms
    WHERE device_id = NEW.device_id
      AND rule_id = v_rule.id
      AND state IN ('ACTIVE', 'ACKNOWLEDGED', 'SNOOZED')
    LIMIT 1;

    -- CASE A: Metric violates threshold
    IF v_is_violating THEN
      IF v_alarm_id IS NULL THEN
        -- Create new active alarm
        INSERT INTO alarms (device_id, rule_id, state, triggered_at, trigger_value)
        VALUES (NEW.device_id, v_rule.id, 'ACTIVE', NEW.captured_at, v_val)
        RETURNING id INTO v_alarm_id;

        -- Record audit alarm event
        INSERT INTO alarm_events (alarm_id, event_type, event_at, source, details)
        VALUES (
          v_alarm_id,
          'TRIGGERED',
          NEW.captured_at,
          'TELEMETRY_ENGINE',
          jsonb_build_object(
            'metric', v_rule.metric,
            'trigger_value', v_val,
            'min_value', v_rule.min_value,
            'max_value', v_rule.max_value,
            'severity', v_rule.severity
          )
        );
      END IF;

    -- CASE B: Metric has returned to normal (clear existing alarm)
    ELSE
      IF v_alarm_id IS NOT NULL THEN
        UPDATE alarms
        SET state = 'CLEARED', cleared_at = NEW.captured_at
        WHERE id = v_alarm_id;

        INSERT INTO alarm_events (alarm_id, event_type, event_at, source, details)
        VALUES (
          v_alarm_id,
          'CLEARED',
          NEW.captured_at,
          'TELEMETRY_ENGINE',
          jsonb_build_object(
            'recovered_value', v_val,
            'metric', v_rule.metric
          )
        );
      END IF;
    END IF;

  END LOOP;

  RETURN NEW;
END;
$$;

-- 3. BIND TRIGGER TO READINGS TABLE
DROP TRIGGER IF EXISTS trg_evaluate_reading_alarms ON readings;
CREATE TRIGGER trg_evaluate_reading_alarms
  AFTER INSERT ON readings
  FOR EACH ROW
  EXECUTE FUNCTION evaluate_reading_alarms();

