-- =========================================================================
-- CIR PORTAL - SUPABASE RLS SECURITY HARDENING
-- Run this in Supabase SQL Editor to secure all tables
-- =========================================================================

-- Step 1: Drop existing overly-permissive policies
DO $$ 
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'users', 'master_customers', 'master_categories', 'master_packaging',
    'master_ppap_levels', 'master_materials', 'master_departments',
    'cir_records', 'form_config', 'system_settings',
    'section_access_overrides', 'audit_logs', 'form_change_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users full access" ON %I', tbl);
  END LOOP;
END $$;

-- Step 2: Enable RLS on all tables (idempotent)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_packaging ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_ppap_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cir_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_access_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_change_logs ENABLE ROW LEVEL SECURITY;

-- Step 3: Create proper authenticated-only RLS policies
-- These policies only allow authenticated (logged-in) users to access data
-- Anonymous/unauthenticated requests will be BLOCKED

CREATE POLICY "auth_users_select" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_users_insert" ON users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_users_update" ON users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_users_delete" ON users FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select" ON master_customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON master_customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON master_customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON master_customers FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select" ON master_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON master_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON master_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON master_categories FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select" ON master_packaging FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON master_packaging FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON master_packaging FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON master_packaging FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select" ON master_ppap_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON master_ppap_levels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON master_ppap_levels FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON master_ppap_levels FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select" ON master_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON master_materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON master_materials FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON master_materials FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select" ON master_departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON master_departments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON master_departments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON master_departments FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select" ON cir_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON cir_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON cir_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON cir_records FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select" ON form_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON form_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON form_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON form_config FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select" ON system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON system_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON system_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON system_settings FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select" ON section_access_overrides FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON section_access_overrides FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON section_access_overrides FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON section_access_overrides FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON audit_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON audit_logs FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select" ON form_change_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON form_change_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON form_change_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete" ON form_change_logs FOR DELETE TO authenticated USING (true);

-- =========================================================================
-- DONE! All tables now require authentication.
-- Anonymous users will be BLOCKED from all operations.
-- =========================================================================
