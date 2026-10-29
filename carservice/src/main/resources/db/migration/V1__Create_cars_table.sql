-- Create Cars Table (du_lieu_oto)
CREATE TABLE IF NOT EXISTS du_lieu_oto (
    id BIGSERIAL PRIMARY KEY,
    ma_tin VARCHAR(100) UNIQUE,
    tieu_de TEXT,
    url TEXT,
    url_hinh_anh TEXT,
    ngay_dang VARCHAR(50),
    nam_sx VARCHAR(20),
    xuat_xu VARCHAR(100),
    dia_diem VARCHAR(255),
    kieu_dang VARCHAR(100),
    so_km_da_di VARCHAR(50),
    hop_so VARCHAR(50),
    tinh_trang VARCHAR(100),
    nhien_lieu VARCHAR(50),
    gia VARCHAR(50),
    ten_nguoi_ban VARCHAR(255),
    sdt_nguoi_ban VARCHAR(20),
    salon_showroom VARCHAR(255),
    loai_nguoi_ban VARCHAR(100),
    dia_chi_nguoi_ban TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for frequently searched fields
CREATE INDEX idx_cars_ma_tin ON du_lieu_oto(ma_tin);
CREATE INDEX idx_cars_tieu_de ON du_lieu_oto USING GIN(to_tsvector('vietnamese', tieu_de));
CREATE INDEX idx_cars_gia ON du_lieu_oto(gia);
CREATE INDEX idx_cars_nam_sx ON du_lieu_oto(nam_sx);
CREATE INDEX idx_cars_xuat_xu ON du_lieu_oto(xuat_xu);
CREATE INDEX idx_cars_kieu_dang ON du_lieu_oto(kieu_dang);
CREATE INDEX idx_cars_nhien_lieu ON du_lieu_oto(nhien_lieu);
CREATE INDEX idx_cars_hop_so ON du_lieu_oto(hop_so);
CREATE INDEX idx_cars_created_at ON du_lieu_oto(created_at DESC);

-- Create view for valid cars (used by filtering logic)
CREATE OR REPLACE VIEW valid_cars AS
SELECT * FROM du_lieu_oto
WHERE tieu_de IS NOT NULL 
  AND tieu_de != ''
  AND gia IS NOT NULL
  AND gia != ''
  AND nam_sx IS NOT NULL
  AND nam_sx != '';
