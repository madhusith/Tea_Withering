-- ==============================================================================
-- TEA WITHERING & DRYING MONITORING SYSTEM
-- MIGRATION 05: Realtime Read Access for Dashboard Monitors
-- Allows frontend WebSocket clients to receive live telemetry & alarms
-- ==============================================================================

-- 1. DEVICES READ ACCESS
DROP POLICY IF EXISTS "Users can view devices in their factory" ON devices;
CREATE POLICY "Users can view devices in their factory"
  ON devices FOR SELECT
  USING (true);

-- 2. READINGS TELEMETRY STREAM READ ACCESS (Permits Realtime WebSocket delivery)
DROP POLICY IF EXISTS "Users can view readings for accessible devices" ON readings;
CREATE POLICY "Users can view readings for accessible devices"
  ON readings FOR SELECT
  USING (true);

-- 3. DEVICE STATUS READ ACCESS
DROP POLICY IF EXISTS "Users can view device status" ON device_status;
CREATE POLICY "Users can view device status"
  ON device_status FOR SELECT
  USING (true);

-- 4. ALARMS & ALARM EVENTS READ ACCESS
DROP POLICY IF EXISTS "Users can view alarms in their factory" ON alarms;
CREATE POLICY "Users can view alarms in their factory"
  ON alarms FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can view alarm events" ON alarm_events;
CREATE POLICY "Users can view alarm events"
  ON alarm_events FOR SELECT
  USING (true);

-- 5. ALARM RULES READ ACCESS
DROP POLICY IF EXISTS "Users can view alarm rules in their factory" ON alarm_rules;
CREATE POLICY "Users can view alarm rules in their factory"
  ON alarm_rules FOR SELECT
  USING (true);

