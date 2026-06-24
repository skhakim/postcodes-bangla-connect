-- =============================================================
-- Bangladesh Post Office Postcode System (IPMS)
-- PostgreSQL / Supabase Schema (Updated for SRS Compliance)
-- =============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis; -- Required for spatial queries (FR-06)

-- =============================================================
-- 1. GEOGRAPHIC HIERARCHY
-- =============================================================

CREATE TABLE divisions (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR(100) NOT NULL,
    name_bn VARCHAR(100)
);

-- -------------------------------------------------------------

CREATE TABLE districts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id         UUID NOT NULL REFERENCES divisions(id) ON DELETE RESTRICT,
    name                VARCHAR(100) NOT NULL,
    name_bn             VARCHAR(100),
    is_active_for_pilot BOOLEAN NOT NULL DEFAULT false -- Controls geographic rollout (FR-28)
);

CREATE INDEX idx_districts_division_id ON districts(division_id);

-- -------------------------------------------------------------

CREATE TABLE upazillas (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
    name        VARCHAR(100) NOT NULL,
    name_bn     VARCHAR(100)
);

CREATE INDEX idx_upazillas_district_id ON upazillas(district_id);

-- -------------------------------------------------------------

CREATE TABLE post_offices (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upazilla_id UUID NOT NULL REFERENCES upazillas(id) ON DELETE RESTRICT,
    name        VARCHAR(150) NOT NULL,
    name_bn     VARCHAR(150),
    post_code   VARCHAR(10) NOT NULL,
    branch_type VARCHAR(50),
    address     TEXT,
    location    GEOMETRY(Point, 4326), -- PostGIS spatial point for mapping
    is_active   BOOLEAN NOT NULL DEFAULT true -- Soft delete (FR-19)
);

CREATE INDEX idx_post_offices_upazilla_id ON post_offices(upazilla_id);
CREATE INDEX idx_post_offices_post_code ON post_offices(post_code);
CREATE INDEX idx_post_offices_location ON post_offices USING GIST (location); -- Spatial Index

-- -------------------------------------------------------------

CREATE TABLE post_boundaries (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_office_id UUID NOT NULL UNIQUE REFERENCES post_offices(id) ON DELETE CASCADE,
    boundary_geom  GEOMETRY(Polygon, 4326) NOT NULL, -- PostGIS polygon for exact postcode area
    version        INTEGER NOT NULL DEFAULT 1,
    is_active      BOOLEAN NOT NULL DEFAULT true, -- Soft delete to maintain history
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_boundaries_post_office_id ON post_boundaries(post_office_id);
CREATE INDEX idx_post_boundaries_geom ON post_boundaries USING GIST (boundary_geom); -- Spatial Index


-- =============================================================
-- 2. USERS & API PARTNERS
-- =============================================================

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(80) NOT NULL UNIQUE,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(30) NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT true
);

-- -------------------------------------------------------------

CREATE TABLE api_keys (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_name  VARCHAR(150) NOT NULL,
    api_key       VARCHAR(255) NOT NULL UNIQUE,
    rate_limit    INTEGER NOT NULL DEFAULT 1000, -- Rate limiting for external requests (FR-24)
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    last_used_at  TIMESTAMP
);

CREATE INDEX idx_api_keys_key ON api_keys(api_key);


-- =============================================================
-- 3. LOGGING & ANALYTICS
-- =============================================================

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    change_type VARCHAR(30) NOT NULL,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  INET,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_change_type ON audit_logs(change_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- -------------------------------------------------------------

CREATE TABLE search_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_method   VARCHAR(50) NOT NULL, -- e.g., 'GPS', 'MANUAL_TEXT', 'API'
    query_text      VARCHAR(255),
    search_location GEOMETRY(Point, 4326), -- For generating analytics heatmaps (FR-26)
    result_found    BOOLEAN NOT NULL, -- Identifying data gaps (FR-26)
    platform        VARCHAR(20), -- 'WEB', 'MOBILE', 'API'
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_logs_method ON search_logs(search_method);
CREATE INDEX idx_search_logs_location ON search_logs USING GIST (search_location);
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at);


-- =============================================================
-- 4. FEEDBACKS
-- =============================================================

CREATE TABLE feedbacks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_type VARCHAR(50) NOT NULL,
    description   TEXT,
    location      GEOMETRY(Point, 4326), -- PostGIS point indicating where the user reported an issue
    status        VARCHAR(30) NOT NULL DEFAULT 'open',
    reviewed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    reviewed_at   TIMESTAMP
);

CREATE INDEX idx_feedbacks_status ON feedbacks(status);
CREATE INDEX idx_feedbacks_reviewed_by ON feedbacks(reviewed_by);
CREATE INDEX idx_feedbacks_created_at ON feedbacks(created_at);

-- =============================================================
-- END OF SCHEMA
-- =============================================================