
"""
=============================================================
  SUPER CRAWLER: LẤY DỮ LIỆU OTO.COM.VN SIÊU TỐC
=============================================================
Chiến thuật: Cào trực tiếp thông tin từ các thẻ (card) ngoài 
trang danh sách. Tự động sinh ID. Nhanh gấp 100 lần cách cũ.
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import uuid
import time
import re
import json

# ==========================================
# 1. CẤU HÌNH THÔNG SỐ CƠ BẢN
# ==========================================
MAX_PAGES = 400              # Số trang tối đa muốn cào
OUTPUT_CSV = 'du_lieu_oto.csv'   # File xuất ra (Dành cho Database/Pandas)
OUTPUT_JSON = 'du_lieu_oto.json' # File xuất ra (Dành cho Backup)
BASE_URL = 'https://oto.com.vn/mua-ban-xe'

# Giả mạo trình duyệt (User-Agent) để tránh bị server nhận diện là Bot
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
}

# ==========================================
# 2. CÁC HÀM HỖ TRỢ (UTILITIES)
# ==========================================
def normalize_text(text):
    """Hàm dọn dẹp văn bản: Xóa khoảng trắng thừa, dấu tab, enter."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()

def get_html_with_retry(session, url, retries=3):
    """Hàm tải trang web, nếu lỗi mạng sẽ tự động thử lại (Retry)."""
    for attempt in range(retries):
        try:
            # Gửi request tải trang web
            response = session.get(url, headers=HEADERS, timeout=15)
            if response.status_code == 200:
                return response.text
            else:
                print(f"\n❌ Lỗi HTTP {response.status_code} tại {url}")
        except Exception as e:
            print(f"\n⚠️ Lỗi kết nối ở lần thử {attempt + 1}: {e}")
            time.sleep(2) # Nghỉ 2 giây rồi thử lại
    return None

# ==========================================
# 3. HÀM CÀO DỮ LIỆU TỪNG TRANG (LÕI XỬ LÝ)
# ==========================================
def crawl_page(session, page_num):
    """Hàm bóc tách dữ liệu của tất cả các xe trên 1 trang danh sách."""
    # Quy tắc URL: trang 1 không có /p, từ trang 2 trở đi có /p2, /p3...
    url = BASE_URL if page_num == 1 else f"{BASE_URL}/p{page_num}"
    
    html = get_html_with_retry(session, url)
    if not html:
        return [] # Nếu không tải được trang thì trả về mảng rỗng

    soup = BeautifulSoup(html, 'html.parser')
    page_cars = []
    
    # Tìm tất cả các ô chứa thông tin xe (Mỗi ô tương ứng 1 chiếc xe)
    car_items = soup.select('.item-car')
    
    for item in car_items:
        try:
            # 3.1. Lấy Link và Tiêu đề
            title_elem = item.select_one('.title-car a, .photo')
            if not title_elem:
                continue
            
            title = normalize_text(title_elem.text)
            car_url = "https://oto.com.vn" + title_elem.get('href', '')

            # 3.2. Lấy Giá xe
            price_elem = item.select_one('.price-car, .price')
            price = normalize_text(price_elem.text) if price_elem else ""

            # 3.3. Lấy Hình ảnh (Xử lý trường hợp load chậm bằng data-src)
            img_elem = item.select_one('img')
            img_url = ""
            if img_elem:
                img_url = img_elem.get('data-src') or img_elem.get('src', '')

            # 3.4. Lấy thông số kỹ thuật (Năm SX, KM, Xuất xứ, Tình trạng)
            # Thường nằm trong các thẻ <li> của khối info
            year, km, xuat_xu, tinh_trang = "", "", "", ""
            info_items = item.select('.info-car li, .list-info li')
            
            for info in info_items:
                text = normalize_text(info.text).lower()
                if "năm" in text or text.isdigit(): # Ví dụ: "2020"
                    year = text
                elif "km" in text: # Ví dụ: "20.000 km"
                    km = text
                elif "nhập" in text or "lắp ráp" in text or "trong nước" in text:
                    xuat_xu = text
                elif "cũ" in text or "mới" in text:
                    tinh_trang = text

            # 3.5. Lấy Địa điểm bán
            loc_elem = item.select_one('.location, .dia-diem')
            dia_diem = normalize_text(loc_elem.text) if loc_elem else ""

            # 3.6. Đóng gói dữ liệu thành 1 object
            # Dùng thư viện uuid để tự động tạo ID ngẫu nhiên không trùng lặp
            car_data = {
                "id": str(uuid.uuid4()),                     # ID duy nhất
                "ma_tin": str(uuid.uuid4())[:8].upper(),     # Mã tin giả lập (8 ký tự in hoa)
                "tieu_de": title.title(),                    # Tiêu đề viết hoa chữ cái đầu
                "gia": price,                                # Chuỗi giá (VD: 500 Triệu)
                "url_hinh_anh": img_url,
                "nam_sx": year.capitalize(),
                "so_km_da_di": km.capitalize(),
                "xuat_xu": xuat_xu.capitalize(),
                "tinh_trang": tinh_trang.capitalize(),
                "dia_diem": dia_diem.capitalize(),
                "url": car_url                               # Link gốc để xem chi tiết
            }
            
            page_cars.append(car_data)
            
        except Exception as e:
            # Nếu 1 xe bị lỗi, bỏ qua và chạy tiếp xe khác, không làm sập chương trình
            continue
            
    return page_cars

# ==========================================
# 4. HÀM CHẠY CHÍNH (MAIN WORKFLOW)
# ==========================================
def main():
    print("🌟 BẮT ĐẦU CÀO DỮ LIỆU SIÊU TỐC (Từ Danh Sách)...")
    print("-" * 60)
    
    # Dùng Session để giữ kết nối mạng (nhanh hơn request rời rạc)
    session = requests.Session()
    all_clean_cars = []
    
    # Chạy vòng lặp từ trang 1 đến MAX_PAGES
    for p in range(1, MAX_PAGES + 1):
        # end='\r' giúp in đè lên dòng cũ, terminal nhìn gọn gàng
        print(f"🔄 Đang xử lý trang {p}/{MAX_PAGES} (Đã thu thập: {len(all_clean_cars)} xe)...", end="\r")
        
        cars_from_page = crawl_page(session, p)
        
        # Nếu trang không có xe nào, có thể đã cào hết dữ liệu web
        if not cars_from_page:
            print(f"\n⚠️ Trang {p} trống. Có thể đã hết dữ liệu. Dừng thu thập.")
            break
            
        all_clean_cars.extend(cars_from_page)
        
        # Nghỉ 0.5s giữa các trang để chống bị hệ thống oto.com.vn block IP
        time.sleep(0.5)

    print(f"\n\n✅ HOÀN TẤT THU THẬP: {len(all_clean_cars)} chiếc xe!")
    
    # ==========================================
    # 5. XUẤT DỮ LIỆU RA FILE
    # ==========================================
    if all_clean_cars:
        # Xuất ra file JSON (Giữ nguyên cấu trúc Dict)
        with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
            json.dump(all_clean_cars, f, ensure_ascii=False, indent=4)
        print(f"📁 Đã lưu file JSON: {OUTPUT_JSON}")
        
        # Xuất ra file CSV (Phục vụ cho Backend Pandas / AI K-Means)
        df = pd.DataFrame(all_clean_cars)
        
        # Cố gắng loại bỏ các xe trùng lặp (dựa trên url gốc) nếu có
        original_count = len(df)
        df.drop_duplicates(subset=['url'], inplace=True)
        df.reset_index(drop=True, inplace=True)
        print(f"🧹 Đã lọc {original_count - len(df)} xe trùng lặp. Cập nhật: {len(df)} xe.")

        # Lưu CSV với utf-8-sig để đọc bằng Excel không bị lỗi font Tiếng Việt
        df.to_csv(OUTPUT_CSV, index=False, encoding='utf-8-sig')
        print(f"📊 Đã lưu file CSV: {OUTPUT_CSV}")

if __name__ == "__main__":
    main()