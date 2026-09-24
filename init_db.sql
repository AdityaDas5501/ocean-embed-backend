-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table for Authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Seed default administrator account
-- Password: "OceanEmbed2024!" (bcrypt hash with cost factor 10)
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
    'admin@oceanembed.ai',
    '$2a$10$wE9hZ2RzV4vG1XjY7P4wce8Z8jQ7k4D2E5a5F6b7C8d9E0F1G2H3I',
    'OceanEmbed Administrator',
    'admin'
)
ON CONFLICT (email) DO NOTHING;

-- Ocean Forecast Catalog Index (NetCDF / Zarr / NPZ references)
CREATE TABLE IF NOT EXISTS ocean_forecast_index (
    id SERIAL PRIMARY KEY,
    forecast_date DATE UNIQUE NOT NULL,
    s3_key VARCHAR(255) NOT NULL,
    data_format VARCHAR(20) DEFAULT 'zarr',
    tensor_shape VARCHAR(50) DEFAULT '(7, 101, 241)',
    file_size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_forecast_date ON ocean_forecast_index(forecast_date);

-- Seed sample dates
INSERT INTO ocean_forecast_index (forecast_date, s3_key, data_format, tensor_shape, file_size_bytes)
VALUES 
    ('2024-06-01', 'datalake/2024/06/01/ocean_surface_subsurface.zarr', 'zarr', '(7, 101, 241)', 1420500),
    ('2024-06-02', 'datalake/2024/06/02/ocean_surface_subsurface.zarr', 'zarr', '(7, 101, 241)', 1420500),
    ('2024-06-15', 'datalake/2024/06/15/ocean_surface_subsurface.zarr', 'zarr', '(7, 101, 241)', 1420500)
ON CONFLICT (forecast_date) DO NOTHING;
