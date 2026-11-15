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

