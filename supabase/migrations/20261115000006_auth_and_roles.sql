-- ==============================================================================
-- TEA WITHERING & DRYING MONITORING SYSTEM
-- MIGRATION 06: Auth Triggers & Role Permissions
-- Multi-tenant isolation: strictly admin, manager, viewer roles
-- ==============================================================================

-- 1. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role user_role := 'viewer';
  user_full_name TEXT;
  stclair_org_id UUID;
  stclair_factory_id UUID;
BEGIN
  -- Default name from metadata or email prefix
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Determine role from metadata or email domain pattern
  IF NEW.raw_user_meta_data->>'role' = 'admin' OR NEW.email ILIKE 'admin%' THEN
    assigned_role := 'admin'::user_role;
  ELSIF NEW.raw_user_meta_data->>'role' = 'manager' OR NEW.email ILIKE 'manager%' THEN
    assigned_role := 'manager'::user_role;
  ELSE
    assigned_role := 'viewer'::user_role;
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (id, full_name, email, status)
  VALUES (NEW.id, user_full_name, NEW.email, 'ACTIVE')
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

  -- Fetch default St. Clair Organization & Factory
  SELECT id INTO stclair_org_id FROM public.organizations WHERE slug = 'kelani-valley-plantations' LIMIT 1;
  IF stclair_org_id IS NULL THEN
    stclair_org_id := '11111111-1111-1111-1111-111111111111';
  END IF;

  SELECT id INTO stclair_factory_id FROM public.factories WHERE factory_code = 'STC-01' LIMIT 1;
  IF stclair_factory_id IS NULL THEN
    stclair_factory_id := '22222222-2222-2222-2222-222222222222';
  END IF;

  -- Create membership link
  INSERT INTO public.memberships (user_id, organization_id, factory_id, role)
  VALUES (NEW.id, stclair_org_id, stclair_factory_id, assigned_role)
  ON CONFLICT (user_id, organization_id, factory_id) DO UPDATE
    SET role = EXCLUDED.role;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 2. READ ACCESS FOR PROFILES AND MEMBERSHIPS
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to read profiles"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to read memberships" ON public.memberships;
CREATE POLICY "Allow authenticated users to read memberships"
  ON public.memberships FOR SELECT
  USING (true);

-- 3. ENABLE REALTIME ON PROFILES AND MEMBERSHIPS
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.memberships;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

