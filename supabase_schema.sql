-- =========================================================================
-- CIR PORTAL - SUPABASE POSTGRESQL SCHEMA MIGRATION
-- Execute this script in your Supabase SQL Editor
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'INITIATOR', 'CHECKER', 'APPROVER', 'ENGINEERING')),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. MASTER DATA TABLES
-- ==========================================
CREATE TABLE IF NOT EXISTS master_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_packaging (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_ppap_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ==========================================
-- 3. CORE WORKFLOW TABLES
-- ==========================================
CREATE TABLE IF NOT EXISTS cir_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cir_number VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'RETURNED', 'CHECKED', 'APPROVED', 'REJECTED', 'DEVELOPMENT_STARTED', 'DEVELOPMENT_COMPLETED')),
    initiator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    initiator_name VARCHAR(255),
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb, 
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb, 
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. DYNAMIC CONFIGURATION TABLES
-- ==========================================
CREATE TABLE IF NOT EXISTS form_config (
    id VARCHAR(50) PRIMARY KEY,
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(50) PRIMARY KEY,
    company_name VARCHAR(255),
    support_email VARCHAR(255),
    auto_save_interval INTEGER DEFAULT 60,
    notifications JSONB DEFAULT '{"submit": true, "approve": true, "reject": true}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS section_access_overrides (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255),
    user_role VARCHAR(50),
    overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_updated_by VARCHAR(255),
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. AUDITING AND LOGGING TABLES
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(255),
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS form_change_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    previous_value JSONB,
    new_value JSONB
);

-- ==========================================
-- 6. INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_cir_status ON cir_records(status);
CREATE INDEX IF NOT EXISTS idx_cir_initiator ON cir_records(initiator_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity);

-- ==========================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ==========================================
-- Allow all operations for authenticated users (internal-only system)
-- Note: If RLS is already disabled on tables, these policies are informational.

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

-- Policies: Allow authenticated users full access (internal system)
CREATE POLICY IF NOT EXISTS "Authenticated users full access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Authenticated users full access" ON master_customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Authenticated users full access" ON master_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Authenticated users full access" ON master_packaging FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Authenticated users full access" ON master_ppap_levels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Authenticated users full access" ON master_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Authenticated users full access" ON master_departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Authenticated users full access" ON cir_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Authenticated users full access" ON form_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Authenticated users full access" ON system_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Authenticated users full access" ON section_access_overrides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Authenticated users full access" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Authenticated users full access" ON form_change_logs FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 8. SEED SUPER ADMIN USER
-- ==========================================
INSERT INTO users (email, name, role, department, is_active)
VALUES ('nbd@emmforce.com', 'NBD Admin', 'SUPER_ADMIN', 'IT', true)
ON CONFLICT (email) DO NOTHING;
