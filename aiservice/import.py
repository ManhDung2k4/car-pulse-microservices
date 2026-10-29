

"""
=============================================================
  SCRIPT IMPORT DỮ LIỆU JSON VÀO POSTGRESQL (AUTO-MAPPING)
=============================================================
- Đọc file JSON từ Super Crawler.
- Dùng hàm .get() để lấy dữ liệu (chống crash nếu thiếu cột).
- Có thanh đếm tiến độ và báo cáo lỗi rõ ràng.
"""

import json
import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# ==========================================
# 1. CẤU HÌNH KẾT NỐI DATABASE
# ==========================================
# Đảm bảo mật khẩu và tên DB (car_db) chính xác với máy của bạn
DB_URL = os.getenv("DATABASE_URL")
# # Khởi tạo engine kết nối (Tắt echo để terminal không bị rối)
engine = create_engine(DB_URL, echo=False)

def import_json_to_db():
    # File JSON được sinh ra từ bước cào dữ liệu (Super Crawler)
    file_name = 'du_lieu_oto.json'
    
    # ==========================================
    # 2. ĐỌC DỮ LIỆU TỪ FILE
    # ==========================================
    try:
        with open(file_name, 'r', encoding='utf-8') as f:
            cars = json.load(f)
    except FileNotFoundError:
        print(f"❌ Không tìm thấy file {file_name}. Vui lòng chạy crawler trước!")
        return
    except json.JSONDecodeError:
        print(f"❌ File {file_name} bị lỗi định dạng. Hãy xóa đi và crawl lại!")
        return

    print(f"🔄 Đã đọc thành công {len(cars)} xe. Bắt đầu đẩy vào Database...")

    success_count = 0
    error_count = 0

    # ==========================================
    # 3. KẾT NỐI VÀ CHÈN DỮ LIỆU
    # ==========================================
    with engine.connect() as connection:
        for car in cars:
            # Dùng SQL chuẩn, khai báo biến bằng :ten_bien
            query = text("""
                INSERT INTO du_lieu_oto 
                (ma_tin, tieu_de, gia, url_hinh_anh, nam_sx, so_km_da_di, url, 
                 hop_so, nhien_lieu, kieu_dang, xuat_xu, tinh_trang, dia_diem)
                VALUES 
                (:ma_tin, :tieu_de, :gia, :url_hinh_anh, :nam_sx, :so_km_da_di, :url, 
                 :hop_so, :nhien_lieu, :kieu_dang, :xuat_xu, :tinh_trang, :dia_diem)
            """)
            
            # ĐÓNG GÓI PARAMETERS: 
            # Dùng hàm car.get("tên_key", "") -> Nếu key không tồn tại, tự gán giá trị ""
            # Kỹ thuật này giúp script KHÔNG BAO GIỜ BỊ CRASH dù dữ liệu web có bị thiếu cột
            params = {
                "ma_tin": car.get("ma_tin", ""),
                "tieu_de": car.get("tieu_de", ""),
                "gia": car.get("gia", ""),
                "url_hinh_anh": car.get("url_hinh_anh", ""),
                "nam_sx": car.get("nam_sx", ""),
                "so_km_da_di": car.get("so_km_da_di", ""),
                "url": car.get("url", ""),
                "hop_so": car.get("hop_so", ""),         
                "nhien_lieu": car.get("nhien_lieu", ""), 
                "kieu_dang": car.get("kieu_dang", ""),   
                "xuat_xu": car.get("xuat_xu", ""),       
                "tinh_trang": car.get("tinh_trang", ""), 
                "dia_diem": car.get("dia_diem", "")      
            }

            try:
                # Thực thi câu lệnh Insert
                connection.execute(query, params)
                success_count += 1
                
                # In trạng thái tiến độ theo thời gian thực (đè dòng)
                print(f"⏳ Đang import: {success_count}/{len(cars)}", end="\r")
                
            except SQLAlchemyError as e:
                # Nếu lỗi (Ví dụ: Trùng URL nếu set Unique, hoặc thiếu field Not Null)
                error_count += 1
                # Bạn có thể bật dòng dưới để debug lỗi chi tiết nếu cần
                # print(f"Lỗi bản ghi {car.get('tieu_de')}: {e}")
                pass

        # 🔥 QUAN TRỌNG: Phải gọi lệnh commit() thì dữ liệu mới thực sự được ghi vào đĩa
        connection.commit()

    # ==========================================
    # 4. TỔNG KẾT
    # ==========================================
    print("\n" + "="*45)
    print("✅ QUÁ TRÌNH IMPORT KẾT THÚC!")
    print(f"   - 🟢 Thêm thành công: {success_count} xe")
    print(f"   - 🔴 Thất bại / Trùng lặp: {error_count} xe")
    print("="*45)

if __name__ == "__main__":
    import_json_to_db()