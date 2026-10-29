-- Bảng lưu trữ các kịch bản dự báo vĩ mô của thị trường ô tô
CREATE TABLE IF NOT EXISTS market_scenarios (
    id BIGSERIAL PRIMARY KEY,
    scenario_code VARCHAR(100) NOT NULL UNIQUE, -- VD: 'BEV_VS_HEV_2026'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    base_confidence_score NUMERIC(5,2) NOT NULL DEFAULT 75.00,
    current_confidence_score NUMERIC(5,2) NOT NULL DEFAULT 75.00,
    forecast_status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lưu vết lịch sử tranh biện phục vụ tính năng kiểm toán hệ thống (Tương tự audit_logs)
CREATE TABLE IF NOT EXISTS user_debates (
    id BIGSERIAL PRIMARY KEY,
    scenario_id BIGINT REFERENCES market_scenarios(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL, -- Định danh người dùng từ tầng Auth Token
    user_argument TEXT NOT NULL,
    credibility_weight INT NOT NULL,
    previous_score NUMERIC(5,2) NOT NULL,
    new_score NUMERIC(5,2) NOT NULL,
    ai_evaluation TEXT,
    ai_evidence TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo Chỉ mục (Index) tăng tốc độ truy vấn báo cáo thống kê cho Admin Analytics
CREATE INDEX idx_debates_user_id ON user_debates(user_id);
CREATE INDEX idx_debates_scenario_id ON user_debates(scenario_id);

-- Chèn dữ liệu kịch bản mặc định ban đầu
INSERT INTO market_scenarios (scenario_code, title, description, base_confidence_score, current_confidence_score)
VALUES ('BEV_VS_HEV_2026', 'Tốc độ chuyển dịch Xe Hybrid (HEV) và Xe Thuần Điện (BEV) giai đoạn 2026 - 2028', 
        'Dự báo xu hướng công nghệ động cơ chiếm lĩnh phân khúc xe phổ thông tại thị trường Việt Nam.', 75.0, 75.0)
ON CONFLICT (scenario_code) DO NOTHING;