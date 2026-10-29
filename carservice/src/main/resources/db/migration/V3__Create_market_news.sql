-- Bảng lưu trữ bài báo thị trường tự động Crawl
CREATE TABLE IF NOT EXISTS market_news (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    link VARCHAR(500) UNIQUE NOT NULL, -- Chống lưu trùng bài báo
    pub_date VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);