-- =====================================================
-- Housing Society Complaint Management System
-- Database Schema for Supabase PostgreSQL
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE subscription_plan AS ENUM ('FREE', 'BASIC', 'PREMIUM');
CREATE TYPE user_role AS ENUM ('RESIDENT', 'SECRETARY', 'ADMIN', 'STAFF', 'SUPER_ADMIN');
CREATE TYPE staff_specialization AS ENUM ('PLUMBER', 'ELECTRICIAN', 'CARPENTER', 'SECURITY', 'CLEANING', 'GENERAL');
CREATE TYPE flat_type AS ENUM ('1BHK', '2BHK', '3BHK', '4BHK', 'STUDIO', 'PENTHOUSE');
CREATE TYPE occupancy_status AS ENUM ('OCCUPIED', 'VACANT', 'UNDER_MAINTENANCE');
CREATE TYPE complaint_category AS ENUM ('PLUMBING', 'ELECTRICAL', 'CIVIL', 'PEST_CONTROL', 'SECURITY', 'CLEANING', 'PARKING', 'NOISE', 'OTHER');
CREATE TYPE complaint_scope AS ENUM ('FLAT', 'BUILDING', 'SOCIETY');
CREATE TYPE complaint_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE complaint_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');

-- =====================================================
-- TABLES
-- =====================================================

-- 1. Societies (Tenants)
CREATE TABLE societies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    subscription_plan subscription_plan DEFAULT 'FREE',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geo_fence_radius INT DEFAULT 500, -- meters
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_societies_code ON societies(code);

-- 2. Buildings
CREATE TABLE buildings (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(10) NOT NULL,
    total_floors INT DEFAULT 1,
    has_lift BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_buildings_society ON buildings(society_id);

-- 3. Flats
CREATE TABLE flats (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number INT NOT NULL,
    flat_number VARCHAR(20) NOT NULL,
    type flat_type DEFAULT '2BHK',
    occupancy_status occupancy_status DEFAULT 'VACANT',
    intercom_extension VARCHAR(10)
);

CREATE INDEX idx_flats_building ON flats(building_id);

-- 4. Common Areas
CREATE TABLE common_areas (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    building_id BIGINT REFERENCES buildings(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    floor_number INT
);

CREATE INDEX idx_common_areas_society ON common_areas(society_id);

-- 5. Users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT REFERENCES societies(id) ON DELETE SET NULL,
    flat_id BIGINT REFERENCES flats(id) ON DELETE SET NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'RESIDENT',
    staff_specialization staff_specialization,
    phone_number VARCHAR(15),
    profile_image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_society ON users(society_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 6. Complaints
CREATE TABLE complaints (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flat_id BIGINT REFERENCES flats(id) ON DELETE SET NULL,
    common_area_id BIGINT REFERENCES common_areas(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category complaint_category DEFAULT 'OTHER',
    scope complaint_scope DEFAULT 'FLAT',
    priority complaint_priority DEFAULT 'MEDIUM',
    status complaint_status DEFAULT 'OPEN',
    image_url VARCHAR(500),
    assigned_staff_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    expected_completion_date TIMESTAMP,
    resolved_at TIMESTAMP,
    upvote_count INT DEFAULT 0,
    parent_complaint_id BIGINT REFERENCES complaints(id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_complaints_society ON complaints(society_id);
CREATE INDEX idx_complaints_user ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_assigned ON complaints(assigned_staff_id);
CREATE INDEX idx_complaints_priority ON complaints(priority);

-- 7. Activity Logs
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    actor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_complaint ON activity_logs(complaint_id);

-- 8. Complaint Followers
CREATE TABLE complaint_followers (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(complaint_id, user_id)
);

CREATE INDEX idx_followers_complaint ON complaint_followers(complaint_id);
CREATE INDEX idx_followers_user ON complaint_followers(user_id);

-- =====================================================
-- TRIGGER: Auto-update updated_at on complaints
-- =====================================================
CREATE OR REPLACE FUNCTION update_complaints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_complaints_updated_at
    BEFORE UPDATE ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_complaints_updated_at();
