-- ==============================================================================
-- TEA WITHERING & DRYING MONITORING SYSTEM
-- MIGRATION 08: Universal Read Policy for Factories
-- Ensures all registered factories are visible in the factory switcher and dashboard
-- ==============================================================================

DROP POLICY IF EXISTS "Users can view factories in their organization" ON factories;
DROP POLICY IF EXISTS "Anyone can view active factories" ON factories;

CREATE POLICY "Anyone can view active factories"
  ON factories FOR SELECT
  USING (status = 'ACTIVE');

-- Grant select on factories to anon and authenticated
GRANT SELECT ON factories TO anon, authenticated;
