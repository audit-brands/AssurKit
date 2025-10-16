-- AssurKit Initial Database Schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    ticker_symbol VARCHAR(10),
    industry VARCHAR(100),
    metadata JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Processes table
CREATE TABLE IF NOT EXISTS processes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subprocesses table
CREATE TABLE IF NOT EXISTS subprocesses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_email VARCHAR(255),
    assertions JSONB,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risks table
CREATE TABLE IF NOT EXISTS risks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subprocess_id UUID REFERENCES subprocesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    risk_type VARCHAR(50),
    likelihood VARCHAR(20),
    impact VARCHAR(20),
    risk_level VARCHAR(20),
    assertions JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Controls table
CREATE TABLE IF NOT EXISTS controls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    control_id VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    control_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    automation_level VARCHAR(50) NOT NULL,
    is_key_control BOOLEAN DEFAULT false,
    owner_email VARCHAR(255) NOT NULL,
    reviewer_email VARCHAR(255),
    evidence_requirements JSONB,
    metadata JSONB,
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk Control Matrix (many-to-many relationship)
CREATE TABLE IF NOT EXISTS risk_control_matrix (
    risk_id UUID REFERENCES risks(id) ON DELETE CASCADE,
    control_id UUID REFERENCES controls(id) ON DELETE CASCADE,
    effectiveness VARCHAR(50),
    rationale TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (risk_id, control_id)
);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    control_id UUID REFERENCES controls(id) ON DELETE CASCADE,
    period_start DATE,
    period_end DATE,
    plan_json JSONB,
    status VARCHAR(50) DEFAULT 'Planned',
    tester_user_id UUID REFERENCES users(id),
    reviewer_user_id UUID REFERENCES users(id),
    conclusion VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Evidence table
CREATE TABLE IF NOT EXISTS evidence (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    uploaded_by_user_id UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tags JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Issues table
CREATE TABLE IF NOT EXISTS issues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    test_id UUID REFERENCES tests(id),
    control_id UUID REFERENCES controls(id),
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(50),
    root_cause TEXT,
    action_plan TEXT,
    owner_user_id UUID REFERENCES users(id),
    target_date DATE,
    status VARCHAR(50) DEFAULT 'Open',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail table
CREATE TABLE IF NOT EXISTS audit_trails (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    actor_user_id UUID REFERENCES users(id),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    before_json JSONB,
    after_json JSONB,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    link TEXT,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_processes_company_id ON processes(company_id);
CREATE INDEX IF NOT EXISTS idx_processes_is_active ON processes(is_active);
CREATE INDEX IF NOT EXISTS idx_subprocesses_process_id ON subprocesses(process_id);
CREATE INDEX IF NOT EXISTS idx_subprocesses_is_active ON subprocesses(is_active);
CREATE INDEX IF NOT EXISTS idx_risks_subprocess_id ON risks(subprocess_id);
CREATE INDEX IF NOT EXISTS idx_controls_status ON controls(status);
CREATE INDEX IF NOT EXISTS idx_controls_control_type ON controls(control_type);
CREATE INDEX IF NOT EXISTS idx_controls_frequency ON controls(frequency);
CREATE INDEX IF NOT EXISTS idx_risk_control_matrix_risk_id ON risk_control_matrix(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_control_matrix_control_id ON risk_control_matrix(control_id);
CREATE INDEX IF NOT EXISTS idx_tests_control_id ON tests(control_id);
CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);
CREATE INDEX IF NOT EXISTS idx_evidence_test_id ON evidence(test_id);
CREATE INDEX IF NOT EXISTS idx_issues_test_id ON issues(test_id);
CREATE INDEX IF NOT EXISTS idx_issues_control_id ON issues(control_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_audit_trails_entity ON audit_trails(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('Admin', 'Full system access'),
    ('Manager', 'Can manage tests and assignments'),
    ('Tester', 'Can perform tests and upload evidence'),
    ('Viewer', 'Read-only access')
ON CONFLICT (name) DO NOTHING;
