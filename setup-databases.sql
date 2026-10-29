-- Run this script in PostgreSQL to create required databases

-- Create auth database if not exists
CREATE DATABASE auth
    WITH
    ENCODING 'UTF8'
    LOCALE 'C';

-- Create car_db database if not exists  
CREATE DATABASE car_db
    WITH
    ENCODING 'UTF8'
    LOCALE 'C';

-- Grant permissions (if using postgres user)
-- These are optional but recommended
-- GRANT ALL PRIVILEGES ON DATABASE auth TO postgres;
-- GRANT ALL PRIVILEGES ON DATABASE car_db TO postgres;

-- Test connection
\c auth
SELECT 'Auth database connected' as status;

\c car_db
SELECT 'Car database connected' as status;

-- Tạo Database riêng cho AI Service
CREATE DATABASE ai_car_db
    WITH
    ENCODING 'UTF8'
    LOCALE 'C';

\c ai_car_db
SELECT 'AI Car database connected' as status;
--Chạy script tạo bảng du_lieu_oto (cấu trúc giống hệt bên car_db) cho ai_car_db 
-- bằng pgAdmin hoặc tool DB bạn đang dùng để AI Service có chỗ lưu dữ liệu.