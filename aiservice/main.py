

import logging
import os
import time
import traceback

from fastapi.responses import JSONResponse
import numpy as np
import pandas as pd
import re
import threading
import json
from fastapi.exceptions import RequestValidationError

from kafka import KafkaConsumer

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from chat_models import ChatRequest,DebateRequest
from chat_service import chat_with_ai
from mlxtend.frequent_patterns import apriori, association_rules
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sqlalchemy import create_engine, text
from cachetools import TTLCache
from threading import Lock

# THÊM 3 IMPORT NÀY VÀO PHẦN TRÊN CÙNG
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from gemini_client import analyze_market_argument
# from bayesian_calculator import calculate_new_confidence
from bayes import calculate_new_confidence
# ─────────────────────────────────────────────
#  LOGGING
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("car_analytics")


# ─────────────────────────────────────────────
#  CONFIG — đọc từ biến môi trường, có fallback
# ─────────────────────────────────────────────


DB_URL = os.getenv("DATABASE_URL")

# Số giây giữ cache; sau thời gian này pipeline sẽ chạy lại
CACHE_TTL = int(os.getenv("CACHE_TTL_SECONDS", "300"))   # mặc định 5 phút

# Giới hạn số hàng load từ DB để tránh Out-Of-Memory
MAX_ROWS = int(os.getenv("MAX_ROWS", "50000"))

SEGMENT_LABELS = [
    "Phân khúc phổ thông",
    "Phân khúc trung cấp",
    "Phân khúc cao cấp",
]


engine = create_engine(
    DB_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=1800,
)


# ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):

    consumer_thread = threading.Thread(
        target=start_kafka_consumer,
        daemon=True
    )
    consumer_thread.start()

    logger.info("Service khởi động — warm-up cache...")

    try:
        get_clustered_df()
        logger.info("Cache warm-up thành công.")
    except Exception as exc:
        logger.warning(
            f"Warm-up thất bại (DB chưa sẵn sàng?): {exc}"
        )

    yield

    engine.dispose()
    logger.info("Engine đã đóng.")

app = FastAPI(title="AI Service - Car Analytics (Optimized)", lifespan=lifespan)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"❌ LỖI 422: Dữ liệu Java gửi sang bị sai cấu trúc!")
    logger.error(f"Chi tiết: {exc.errors()}")
    body = await request.body()
    logger.error(f"Payload thực tế nhận được: {body.decode('utf-8')}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(exc.body)},
    )

# ─────────────────────────────────────────────
#  CACHE — TTLCache thread-safe
#  Lưu 1 entry duy nhất ("clustered_df") với TTL
# ─────────────────────────────────────────────
# TTLCache(maxsize, ttl): maxsize=1 vì chỉ cần 1 bản clustered DF
_cache: TTLCache = TTLCache(maxsize=1, ttl=CACHE_TTL)
_cache_lock = Lock()   # tránh thundering herd (nhiều request cùng rebuild)




def save_chat(user_id, role, message):

    with engine.begin() as conn:

        conn.execute(
            text("""
                INSERT INTO chat_history
                (user_id, role, message)
                VALUES
                (:user_id, :role, :message)
            """),
            {
                "user_id": user_id,
                "role": role,
                "message": message
            }
        )
def get_chat_history(user_id, limit=20):

    with engine.begin() as conn:

        result = conn.execute(
            text("""
                SELECT role, message
                FROM chat_history
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT :limit
            """),
            {
                "user_id": user_id,
                "limit": limit
            }
        )

        rows = result.fetchall()

    rows.reverse()

    return rows
# ─────────────────────────────────────────────
#  HELPER — xử lý giá trị an toàn khi serialize
# ─────────────────────────────────────────────
def safe_val(val, default=""):
    """
    Trả về default nếu val là None hoặc NaN.
    Tránh nhầm lẫn: `val or ""` sẽ đổi 0 → "" (sai),
    còn hàm này chỉ đổi None/NaN → default.
    """
    if val is None:
        return default
    if isinstance(val, float) and np.isnan(val):
        return default
    return val


# ═════════════════════════════════════════════
#  PARSE DATA
# ═════════════════════════════════════════════

def parse_price_to_vnd(value) -> float:
    """
    Chuyển chuỗi giá tiền (VD: "500 triệu", "1.5 tỷ") sang số nguyên VND.
    Trả về np.nan nếu không parse được.
    """
    if value is None or pd.isna(value):
        return np.nan

    text_val = str(value).strip().lower().replace(",", ".")
    if not text_val:
        return np.nan

    nums = re.findall(r"\d+(?:\.\d+)?", text_val)
    if not nums:
        return np.nan

    number = float(nums[0])

    if any(k in text_val for k in ("tỷ", "ty", "tỉ", "ti")):
        return number * 1_000_000_000
    if any(k in text_val for k in ("triệu", "trieu")):
        return number * 1_000_000
    if any(k in text_val for k in ("nghìn", "nghin", "ngàn", "ngan")):
        return number * 1_000

    # Trường hợp đã là số thuần (không có đơn vị)
    digits = re.sub(r"[^\d]", "", text_val)
    return float(digits) if digits else number


def parse_number(value) -> float:
    """Trích xuất phần số từ chuỗi bất kỳ (VD: "45.000 km" → 45000.0)."""
    if value is None or pd.isna(value):
        return np.nan
    digits = re.sub(r"[^\d]", "", str(value))
    return float(digits) if digits else np.nan


def extract_brand(title) -> str:
    """
    Lấy từ đầu tiên của tên xe làm thương hiệu.
    Có normalize khoảng trắng và capitalize để tránh trùng lặp
    do cách viết khác nhau (toyota vs Toyota).
    """
    if not title:
        return "Unknown"
    parts = str(title).strip().split()
    return parts[0].capitalize() if parts else "Unknown"


# ═════════════════════════════════════════════
#  LOAD DATA
# ═════════════════════════════════════════════

def load_cars() -> pd.DataFrame:
    """
    Query dữ liệu từ DB, giới hạn MAX_ROWS để tránh OOM.
    Dùng parameterized query (text + bindparams) để an toàn.
    """
    logger.info(f"Đang load dữ liệu từ DB (tối đa {MAX_ROWS} hàng)...")
    query = text("SELECT * FROM public.du_lieu_oto LIMIT :limit")
    df = pd.read_sql(query, engine, params={"limit": MAX_ROWS})
    logger.info(f"Đã load {len(df)} hàng.")
    return df


# ═════════════════════════════════════════════
#  PREPROCESS
# ═════════════════════════════════════════════

def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    """
    Parse các cột raw → numeric, thêm cột brand.
    Log số hàng bị drop để monitor chất lượng dữ liệu.
    """
    df = df.copy()
    if df.empty:
        return df

    df["brand"]         = df["tieu_de"].apply(extract_brand)
    df["price_value"]   = df["gia"].apply(parse_price_to_vnd)
    df["year_value"]    = df["nam_sx"].apply(parse_number)
    df["mileage_value"] = df["so_km_da_di"].apply(parse_number)

    before = len(df)
    df = df.dropna(subset=["price_value", "year_value", "mileage_value"])
    dropped = before - len(df)

    if dropped:
        logger.warning(
            f"Đã drop {dropped}/{before} hàng do thiếu price/year/mileage "
            f"({dropped/before:.1%} dữ liệu)."
        )

    return df


# ═════════════════════════════════════════════
#  CLUSTER
# ═════════════════════════════════════════════

def cluster_cars(df: pd.DataFrame, n_clusters: int = 3) -> pd.DataFrame:
    """
    Phân cụm xe theo giá bằng KMeans.
    Dùng log-scale + StandardScaler để giảm ảnh hưởng của outlier giá cao.

    Lý do chỉ cluster trên price_value:
      - Mục tiêu là phân khúc thị trường → giá là tiêu chí chính.
      - Cluster trên nhiều chiều (giá + km + năm) sẽ khó giải thích hơn.

    segment_id được gán theo thứ tự tăng dần của giá trung bình:
      0 = phổ thông (rẻ nhất), 1 = trung cấp, 2 = cao cấp.
    """
    df = preprocess(df)
    if df.empty:
        return df

    X = df[["price_value"]].replace([np.inf, -np.inf], np.nan).fillna(0)

    # Đảm bảo k không vượt quá số điểm dữ liệu thực tế
    unique_count = X.drop_duplicates().shape[0]
    k = min(n_clusters, len(df), unique_count)

    if k <= 1:
        df = df.copy()
        df["cluster"] = 0
        df["segment_id"] = 0
        return df

    # Log-transform: giảm skewness của phân phối giá (thường right-skewed mạnh)
    X_log = np.log1p(X)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_log)

    model = KMeans(n_clusters=k, random_state=42, n_init=10)
    df = df.copy()
    df["cluster"] = model.fit_predict(X_scaled)

    # Map cluster_id → segment_id theo thứ tự giá trung bình tăng dần
    # (cluster với avg_price thấp nhất → segment_id = 0)
    price_order = (
        df.groupby("cluster")["price_value"]
        .mean()
        .sort_values()
        .index
        .tolist()
    )
    cluster_to_segment = {old: new for new, old in enumerate(price_order)}
    df["segment_id"] = df["cluster"].map(cluster_to_segment).fillna(0).astype(int)

    return df


# ═════════════════════════════════════════════
#  CACHE ACCESSOR — điểm truy cập duy nhất
# ═════════════════════════════════════════════

def get_clustered_df() -> pd.DataFrame:
    """
    Trả về DataFrame đã cluster từ cache.
    Nếu cache miss (hết TTL hoặc lần đầu), rebuild toàn pipeline.
    Lock đảm bảo chỉ 1 thread rebuild cùng lúc (tránh thundering herd).
    """
    cache_key = "clustered_df"

    # Đọc không lock — nhanh, an toàn đọc
    if cache_key in _cache:
        return _cache[cache_key]

    # Cache miss → rebuild trong lock
    with _cache_lock:
        # Double-check: thread khác có thể đã rebuild trong lúc ta chờ lock
        if cache_key in _cache:
            return _cache[cache_key]

        logger.info("Cache miss — đang rebuild pipeline (load → preprocess → cluster)...")
        t0 = time.perf_counter()
        df = cluster_cars(load_cars())
        elapsed = time.perf_counter() - t0
        logger.info(f"Pipeline hoàn thành trong {elapsed:.2f}s, {len(df)} xe hợp lệ.")

        _cache[cache_key] = df
        return df


# ═════════════════════════════════════════════
#  ASSOCIATION RULES
# ═════════════════════════════════════════════

def get_price_range(price: float) -> str:
    """Phân loại xe vào bucket giá (dùng làm item trong transaction)."""
    if pd.isna(price) or price == 0:
        return "price_unknown"
    if price < 400_000_000:
        return "price_<400tr"
    if price <= 700_000_000:
        return "price_400-700tr"
    if price <= 1_000_000_000:
        return "price_700-1ty"
    return "price_>1ty"


def get_mileage_range(km: float) -> str:
    """Phân loại xe vào bucket số km (dùng làm item trong transaction)."""
    if pd.isna(km) or km == 0:
        return "km_unknown"
    if km <= 20_000:
        return "km_luot"
    if km <= 60_000:
        return "km_trungbinh"
    if km <= 100_000:
        return "km_cao"
    return "km_ratcao"


def build_transactions(df: pd.DataFrame) -> list[list[str]]:
    """
    Chuyển mỗi hàng xe thành một "transaction" — danh sách items.
    
    OPTIMIZATION: Dùng vectorized pandas thay vì iterrows().
    iterrows() chậm vì phải tạo Series mới cho mỗi hàng.
    Với 10k rows, vectorized nhanh hơn ~10–30x.

    Mỗi transaction gồm:
      brand_{tên hãng}  — VD: brand_Toyota
      fuel_{nhiên liệu} — VD: fuel_Xăng
      style_{kiểu dáng} — VD: style_SUV
      price_{bucket}    — VD: price_400-700tr
      km_{bucket}       — VD: km_trungbinh
    """
    # Tạo các cột item dạng string, xử lý NaN bằng fillna trước
    df = df.copy()
    df["_brand_item"]   = "brand_"   + df["brand"].fillna("Unknown")
    df["_fuel_item"]    = "fuel_"    + df["nhien_lieu"].fillna("unknown")
    df["_style_item"]   = "style_"   + df["kieu_dang"].fillna("unknown")
    df["_price_item"]   = df["price_value"].apply(get_price_range)
    df["_mileage_item"] = df["mileage_value"].apply(get_mileage_range)

    item_cols = ["_brand_item", "_fuel_item", "_style_item", "_price_item", "_mileage_item"]

    # Chuyển từng hàng thành list, bỏ qua giá trị rỗng/unknown
    transactions = df[item_cols].values.tolist()
    return transactions


def run_association_rules(df: pd.DataFrame) -> list[dict]:
    """
    Chạy thuật toán Apriori để tìm luật kết hợp.
    
    Tham số:
      min_support=0.015  → item set xuất hiện ít nhất 1.5% transactions
      min_threshold=0.5  → confidence ≥ 50% (nếu A thì B xảy ra ≥ 50%)
    
    Kết quả sort theo confidence giảm dần.
    """
    if df.empty:
        return []

    transactions = build_transactions(df)
    all_items = sorted({item for t in transactions for item in t})

    # One-hot encode: tạo boolean DataFrame (hàng=transaction, cột=item)
    # Dùng list comprehension dict thay vì vòng for 2 lớp — nhanh hơn
    df_encoded = pd.DataFrame(
        [{item: (item in set(t)) for item in all_items} for t in transactions]
    )

    freq = apriori(df_encoded, min_support=0.015, use_colnames=True)
    if freq.empty:
        logger.info("Không tìm thấy frequent itemset nào.")
        return []

    rules = association_rules(freq, metric="confidence", min_threshold=0.5)

    result = [
        {
            "antecedents": list(r["antecedents"]),
            "consequents": list(r["consequents"]),
            "support":     round(float(r["support"]),    4),
            "confidence":  round(float(r["confidence"]), 4),
            "lift":        round(float(r["lift"]),        4),
        }
        for _, r in rules.iterrows()
    ]

    logger.info(f"Tìm thấy {len(result)} luật kết hợp.")
    return sorted(result, key=lambda x: x["confidence"], reverse=True)


# ═════════════════════════════════════════════
#  API ENDPOINTS
# ═════════════════════════════════════════════

@app.get("/")
def home():
    return {"message": "AI Service is running (optimized)"}


@app.get("/segments")
def get_segments():
    """
    Trả về danh sách phân khúc xe với thống kê giá và top brands.
    Dùng cache — không query DB nếu cache còn hạn.
    """
    df = get_clustered_df()
    segments = []

    for seg_id, group in df.groupby("segment_id"):
        valid_prices = group["price_value"].dropna()
        # Lọc brand "Unknown" khỏi top brands để kết quả có ý nghĩa hơn
        valid_brands = group["brand"].replace("Unknown", np.nan).dropna()

        seg_int = int(seg_id)
        segments.append({
            "segmentId": seg_int,
            "name":      SEGMENT_LABELS[seg_int] if seg_int < len(SEGMENT_LABELS) else f"Phân khúc {seg_int}",
            "avgPrice":  float(valid_prices.mean()) if not valid_prices.empty else 0.0,
            "minPrice":  float(valid_prices.min())  if not valid_prices.empty else 0.0,
            "maxPrice":  float(valid_prices.max())  if not valid_prices.empty else 0.0,
            "count":     len(group),
            "topBrands": valid_brands.value_counts().head(3).index.tolist(),
        })

    return sorted(segments, key=lambda x: x["avgPrice"])


@app.get("/segments/{segment_id}/cars")
def get_cars_by_segment(segment_id: int):
    """
    Trả về danh sách xe thuộc phân khúc segment_id.
    Dùng safe_val để serialize an toàn, tránh nhầm 0 với NaN.
    """
    df = get_clustered_df()
    if df.empty:
        return []

    filtered = df[df["segment_id"] == segment_id]
    if filtered.empty:
        return []

    result = []
    for _, row in filtered.iterrows():
        result.append({
            "id":          int(row["id"]),
            "maTin":       safe_val(row["ma_tin"]),
            "tieuDe":      safe_val(row["tieu_de"]),
            "url":         safe_val(row["url"]),
            "urlHinhAnh":  safe_val(row["url_hinh_anh"]),
            "ngayDang":    safe_val(row["ngay_dang"]),
            "namSX":       safe_val(row["nam_sx"]),
            "xuatXu":      safe_val(row["xuat_xu"]),
            "diaDiem":     safe_val(row["dia_diem"]),
            "kieuDang":    safe_val(row["kieu_dang"]),
            "soKmDaDi":    safe_val(row["so_km_da_di"]),
            "hopSo":       safe_val(row["hop_so"]),
            "tinhTrang":   safe_val(row["tinh_trang"]),
            "nhienLieu":   safe_val(row["nhien_lieu"]),
            "gia":         safe_val(row["gia"]),
            "segmentId":   int(safe_val(row["segment_id"], 0)),
            "priceValue":  float(safe_val(row["price_value"],   0.0)),
            "yearValue":   float(safe_val(row["year_value"],    0.0)),
            "mileageValue":float(safe_val(row["mileage_value"], 0.0)),
        })

    return result


@app.get("/recommendations/similar/{car_id}")
def recommend(car_id: int):
    """
    Gợi ý 6 xe tương tự dựa trên khoảng cách Euclidean
    (price, year, mileage) trong không gian 3 chiều.

    Ưu tiên xe cùng phân khúc trước; nếu không đủ thì mở rộng
    sang toàn bộ dataset.
    """
    df = get_clustered_df()

    current = df[df["id"] == car_id]
    if current.empty:
        raise HTTPException(status_code=404, detail="Không tìm thấy xe")

    current_car     = current.iloc[0]
    current_segment = current_car["segment_id"]

    # Ưu tiên cùng phân khúc, fallback toàn bộ
    candidates = df[(df["segment_id"] == current_segment) & (df["id"] != car_id)].copy()
    if candidates.empty:
        candidates = df[df["id"] != car_id].copy()

    # Vector đặc trưng của xe hiện tại
    ref_vec = np.array([
        current_car["price_value"],
        current_car["year_value"],
        current_car["mileage_value"],
    ], dtype=float)

    # OPTIMIZATION: tính distance vectorized thay vì apply(lambda)
    # np.linalg.norm trên matrix → O(N) thay vì O(N) Python calls
    feature_matrix = candidates[["price_value", "year_value", "mileage_value"]].to_numpy(dtype=float)
    distances      = np.linalg.norm(feature_matrix - ref_vec, axis=1)
    candidates     = candidates.copy()
    candidates["distance"] = distances

    top6 = candidates.nsmallest(6, "distance")

    recommended_cars = [
        {
            "id":         int(row["id"]),
            "tieuDe":     safe_val(row["tieu_de"]),
            "gia":        safe_val(row["gia"]),
            "urlHinhAnh": safe_val(row["url_hinh_anh"]),
            "namSX":      safe_val(row["nam_sx"]),
            "soKmDaDi":   safe_val(row["so_km_da_di"]),
            "nhienLieu":  safe_val(row["nhien_lieu"]),
            "hopSo":      safe_val(row["hop_so"]),
            "segmentId":  int(safe_val(row["segment_id"], 0)),
        }
        for _, row in top6.iterrows()
    ]

    return {
        "currentCar": {
            "id":        int(current_car["id"]),
            "tieuDe":    safe_val(current_car["tieu_de"]),
            "gia":       safe_val(current_car["gia"]),
            "segmentId": int(safe_val(current_car["segment_id"], 0)),
        },
        "recommendedCars": recommended_cars,
    }


@app.get("/association-rules")
def association_rules_api():
    """
    Chạy Apriori trên toàn bộ dataset đã cluster.
    Kết quả chưa được cache riêng vì tốn RAM; nếu cần
    có thể thêm cache với TTL dài hơn CACHE_TTL chính.
    """
    try:
        df    = get_clustered_df()
        rules = run_association_rules(df)
        return {"count": len(rules), "rules": rules}
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc))

@app.get("/chat/history/{user_id}")
def chat_history(user_id: int):

    with engine.begin() as conn:

        result = conn.execute(
            text("""
                SELECT role,
                       message,
                       created_at
                FROM chat_history
                WHERE user_id = :user_id
                ORDER BY created_at ASC
            """),
            {
                "user_id": user_id
            }
        )

        rows = result.fetchall()

    return [
        {
            "role": row.role,
            "message": row.message,
            "createdAt": row.created_at
        }
        for row in rows
    ]
def start_kafka_consumer():
    try:
        # Lấy thông tin từ biến môi trường (nếu không có sẽ mặc định dùng localhost)
        kafka_server = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "127.0.0.1:9092")
        kafka_user = os.getenv("KAFKA_USERNAME")
        kafka_password = os.getenv("KAFKA_PASSWORD")

        # 1. Cấu hình cơ bản cho Consumer
        consumer_kwargs = {
            'bootstrap_servers': [kafka_server],
            'auto_offset_reset': 'latest',
            'enable_auto_commit': True,
            'group_id': 'ai-service-group',
            'value_deserializer': lambda m: json.loads(m.decode('utf-8')) if m is not None else None
        }

        # 2. Cấu hình bảo mật nâng cao (Dành cho Aiven Kafka trên Cloud)
        if kafka_user and kafka_password:
            consumer_kwargs['security_protocol'] = 'SASL_SSL'
            consumer_kwargs['sasl_mechanism'] = 'PLAIN'
            consumer_kwargs['sasl_plain_username'] = kafka_user
            consumer_kwargs['sasl_plain_password'] = kafka_password
            consumer_kwargs['ssl_cafile'] = 'ca.pem'
        # 3. Khởi tạo Consumer với cấu hình đã thiết lập
        consumer = KafkaConsumer('car_events', **consumer_kwargs)
        
        logger.info(f"🎧 AI Service đang lắng nghe Kafka topic: car_events trên {kafka_server}...")
        
        # 4. Lắng nghe và xử lý tin nhắn
        for message in consumer:
            # BỌC TRY-EXCEPT Ở ĐÂY: Nếu 1 tin nhắn lỗi, nó chỉ báo lỗi tin đó rồi chạy tiếp tin sau
            try:
                event = message.value
                
                # 1. Kiểm tra nếu event hoàn toàn rỗng (Tombstone message)
                if not event:
                    logger.warning(f"⚠️ Bỏ qua bản tin Kafka rỗng: {message}")
                    continue

                action = event.get("action")
                # 2. Gán {} mặc định nếu không có key "data" để tránh lỗi car_data.get('id')
                car_data = event.get("data") or {} 
                
                logger.info(f"📥 Nhận event từ Kafka: {action} - Xe ID: {car_data.get('id')}")
                logger.info("================================")
                logger.info(f"RAW MESSAGE: {message}")
                logger.info(f"VALUE: {event}")
                logger.info("================================")
                
                # Nếu không có car_data hợp lệ thì không làm gì thêm
                if not car_data:
                    logger.warning("⚠️ Bản tin không chứa dữ liệu xe (key 'data' rỗng). Bỏ qua thao tác DB.")
                    continue

                # XỬ LÝ DATABASE TƯƠNG ỨNG VỚI HÀNH ĐỘNG (CREATE/UPDATE/DELETE)
                if action == "CREATE":
                    with engine.begin() as conn:
                        query = text("""
                            INSERT INTO du_lieu_oto 
                            (id, ma_tin, tieu_de, gia, url_hinh_anh, nam_sx, xuat_xu, dia_diem, kieu_dang, so_km_da_di, hop_so, tinh_trang, nhien_lieu) 
                            VALUES (:id, :ma_tin, :tieu_de, :gia, :url_hinh_anh, :nam_sx, :xuat_xu, :dia_diem, :kieu_dang, :so_km_da_di, :hop_so, :tinh_trang, :nhien_lieu)
                            ON CONFLICT (id) DO NOTHING
                        """)
                        conn.execute(query, {
                            "id": car_data.get("id"),
                            "ma_tin": car_data.get("maTin", ""),
                            "tieu_de": car_data.get("tieuDe", ""),
                            "gia": car_data.get("gia", ""),
                            "url_hinh_anh": car_data.get("urlHinhAnh", ""),
                            "nam_sx": car_data.get("namSX", ""),
                            "xuat_xu": car_data.get("xuatXu", ""),
                            "dia_diem": car_data.get("diaDiem", ""),
                            "kieu_dang": car_data.get("kieuDang", ""),
                            "so_km_da_di": car_data.get("soKmDaDi", ""),
                            "hop_so": car_data.get("hopSo", ""),
                            "tinh_trang": car_data.get("tinhTrang", ""),
                            "nhien_lieu": car_data.get("nhienLieu", "")
                        })
                        # CHÈN THÊM ĐOẠN CODE DƯỚI ĐÂY để đồng bộ lại Sequence của Postgres
                        sync_seq_query = text("""
                            SELECT setval('du_lieu_oto_id_seq', COALESCE((SELECT MAX(id) FROM du_lieu_oto), 1), true);
                            """)
                        conn.execute(sync_seq_query)
                elif action == "DELETE":
                    with engine.begin() as conn:
                        query = text("""
                            DELETE FROM du_lieu_oto
                            WHERE id = :id
                        """)
                        conn.execute(query, {"id": car_data.get("id")})
                    logger.info(f"🗑️ Đã xóa xe ID {car_data.get('id')} khỏi AI Database")
                    
                elif action == "UPDATE":
                    with engine.begin() as conn:
                        query = text("""
                            UPDATE du_lieu_oto
                            SET
                                tieu_de = :tieu_de,
                                gia = :gia,
                                nam_sx = :nam_sx,
                                dia_diem = :dia_diem,
                                so_km_da_di = :so_km_da_di,
                                nhien_lieu = :nhien_lieu
                            WHERE id = :id
                        """)
                        conn.execute(query, {
                            "id": car_data.get("id"),
                            "tieu_de": car_data.get("tieuDe", ""),
                            "gia": car_data.get("gia", ""),
                            "nam_sx": car_data.get("namSX", ""),
                            "dia_diem": car_data.get("diaDiem", ""),
                            "so_km_da_di": car_data.get("soKmDaDi", ""),
                            "nhien_lieu": car_data.get("nhienLieu", "")
                        })
                    logger.info(f"✏️ Đã cập nhật xe ID {car_data.get('id')}")

                # Bất kể Create/Update/Delete, đều xóa cache để AI bắt buộc tính lại k-means và apriori
                with _cache_lock:
                    if "clustered_df" in _cache:
                        del _cache["clustered_df"]
                        logger.info("🗑️ Đã xóa cache clustered_df do có cập nhật dữ liệu từ Kafka.")
                        
            except Exception as inner_e:
                # Bắt lỗi tại đây giúp ứng dụng không bị crash hoàn toàn
                logger.error(f"❌ Lỗi khi xử lý 1 tin nhắn cụ thể: {inner_e}")
                
    except Exception as e:
        logger.error(f"❌ Lỗi thiết lập Kafka Consumer (mất kết nối Kafka hoàn toàn): {e}")
# ─────────────────────────────────────────────
#  ENTRY POINT
# ─────────────────────────────────────────────
if __name__ == "__main__":
    
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5003, reload=False)

@app.post("/chat")
def chat(req: ChatRequest):

    answer = chat_with_ai(
        req.userId,
        req.message
    )

    return {
        "answer": answer
    }

# ========================================================
# TÍNH NĂNG MỚI: MARKET FORECAST & RAG SYSTEM
# ========================================================
# 1. Đưa Vectorizer ra phạm vi toàn cục (Global Scope) để tránh fit lại dữ liệu trên mỗi Request
vectorizer = TfidfVectorizer()
tfidf_matrix = None
KNOWLEDGE_BASE = []
# def load_knowledge_base_from_news():
#     global KNOWLEDGE_BASE, tfidf_matrix, vectorizer
#     try:
#         # Đọc dữ liệu động từ tệp tin do news_crawler.py sinh ra
#         news_file = "market_news.json"
#         if os.path.exists(news_file):
#             with open(news_file, "r", encoding="utf-8") as f:
#                 news_data = json.load(f)
#                 # Gộp Tiêu đề và Mô tả làm ngữ cảnh cho RAG
#                 KNOWLEDGE_BASE = [f"{item['title']}. {item['description']}" for item in news_data]
        
#         # Nếu tệp rỗng hoặc không tồn tại, sử dụng cơ sở dữ liệu mặc định làm Fallback
#         if not KNOWLEDGE_BASE:
#             KNOWLEDGE_BASE = [
#                 "Chính phủ ban hành gói miễn 100% lệ phí trước bạ cho xe thuần điện (BEV)...",
#                 "Toyota công bố xây dựng chuỗi trạm sạc Hybrid tự sạc (PHEV) toàn quốc..."
#             ]
            
#         # Huấn luyện (Fit) Vectorizer một lần duy nhất khi khởi động ứng dụng hoặc khi cập nhật dữ liệu
#         tfidf_matrix = vectorizer.fit_transform(KNOWLEDGE_BASE)
#         logger.info(f"📊 Hệ thống RAG đã nạp thành công {len(KNOWLEDGE_BASE)} ngữ cảnh thị trường.")
#     except Exception as e:
#         logger.error(f"❌ Lỗi nạp cơ sở dữ liệu tin tức: {e}")


def load_knowledge_base_from_news():
    global KNOWLEDGE_BASE, tfidf_matrix, vectorizer
    try:
        # Thay vì đọc file JSON, chúng ta query thẳng vào DB để lấy tin mới nhất
        with engine.connect() as conn:
            query = text("SELECT title, description FROM market_news ORDER BY created_at DESC LIMIT 50")
            result = conn.execute(query)
            news_data = result.fetchall()

        # Tổ hợp Tiêu đề + Nội dung làm ngữ cảnh (Context)
        KNOWLEDGE_BASE = [f"{row[0]}. {row[1]}" for row in news_data]

        # Fallback nếu DB chưa có dữ liệu
        if not KNOWLEDGE_BASE:
            logger.warning("Cảnh báo: Bảng market_news trống. Đang dùng dữ liệu dự phòng.")
            KNOWLEDGE_BASE = [
                "Chính phủ ban hành gói miễn 100% lệ phí trước bạ cho xe thuần điện (BEV)...",
                "Toyota công bố xây dựng chuỗi trạm sạc Hybrid tự sạc (PHEV)..."
            ]

        # Fit Vectorizer
        tfidf_matrix = vectorizer.fit_transform(KNOWLEDGE_BASE)
        logger.info(f"📊 Hệ thống RAG đã nạp thành công {len(KNOWLEDGE_BASE)} tin tức từ Database.")

    except Exception as e:
        logger.error(f"❌ Lỗi nạp RAG Database: {e}")

# KNOWLEDGE_BASE: Kho dữ liệu giả lập (Sau này em có thể crawl từ DB lên đây)
KNOWLEDGE_BASE = [
    "Chính phủ ban hành gói miễn 100% lệ phí trước bạ cho xe thuần điện (BEV), tạo cú hích lớn cho xe điện.",
    "Toyota công bố xây dựng chuỗi trạm sạc Hybrid tự sạc (PHEV) toàn quốc, củng cố vị thế xe Hybrid.",
    "VinFast tung dòng xe điện phổ thông mới dưới 300 triệu kèm pin thể rắn, giải quyết bài toán sạc nhanh.",
    "Hạ tầng trạm sạc tại các tỉnh lẻ Việt Nam vẫn thiếu hụt, khiến người dùng e ngại khi mua xe thuần điện.",
    "Thống kê thị trường xe cũ cho thấy xe Hybrid giữ giá tốt hơn xe điện do người dùng lo ngại chi phí thay pin."
]

# Tạo thêm 1 Lock chuyên biệt ở phạm vi toàn cục (gần vị trí khai báo _cache_lock)
_rag_lock = Lock()

@app.post("/debate")
def process_debate(req: DebateRequest):
    try:
        global KNOWLEDGE_BASE, tfidf_matrix, vectorizer
        if tfidf_matrix is None or len(KNOWLEDGE_BASE) == 0:
            with _rag_lock:
               # Double-check để đảm bảo luồng trước đó chưa nạp xong
                if tfidf_matrix is None or len(KNOWLEDGE_BASE) == 0: 
                    load_knowledge_base_from_news()

        # Biến đổi câu lập luận của người dùng thành Vector toán học
        user_vector = vectorizer.transform([req.user_argument])
        
        # Tính toán độ tương đồng Cosine giữa lập luận của người dùng với kho tri thức báo chí
        similarities = cosine_similarity(user_vector, tfidf_matrix).flatten()
        best_idx = similarities.argmax()
        relevance_score = float(similarities[best_idx]) # Điểm tương đồng thực tế (0.0 đến 1.0)

        context = KNOWLEDGE_BASE[best_idx] if relevance_score > 0.1 else "Không có dữ liệu báo chí cụ thể, dựa vào logic thị trường chung."

        
        ai_analysis = analyze_market_argument(
            context=context,
            current_forecast=req.current_forecast,
            current_score=req.current_score,
            user_argument=req.user_argument
        )
        
        new_score, adjustment_str = calculate_new_confidence(
            current_score=req.current_score,
            impact_direction=ai_analysis.get("impact_direction", 0),
            impact_magnitude=ai_analysis.get("impact_magnitude", 1),
            credibility_weight=req.credibility_weight,
            relevance_score=relevance_score # Biến số mới đưa vào phương trình toán học
        )
    
        try:
            with engine.connect() as conn:
                # Tạo bảng user_debates nếu chưa có (Hoặc bạn có thể dùng Flyway bên Java)
                create_table_query = text("""
                        CREATE TABLE IF NOT EXISTS user_debates (
                            id BIGSERIAL PRIMARY KEY,
                            scenario_id BIGINT, -- Bổ sung trường này
                            user_id BIGINT NOT NULL,
                            user_argument TEXT,
                            credibility_weight INT,
                            previous_score NUMERIC(5,2),
                            new_score NUMERIC(5,2),
                            ai_evaluation TEXT,
                            ai_evidence TEXT, -- Bổ sung trường này
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """)
                conn.execute(create_table_query)
                
                # Lưu lịch sử
                insert_query = text("""INSERT INTO user_debates 
                    (scenario_id, user_id, user_argument, credibility_weight, previous_score, new_score, ai_evaluation, ai_evidence) 
                    VALUES (:scenario_id, :uid, :arg, :weight, :old_score, :new_score, :eval, :evidence)
                    """)
                conn.execute(insert_query, {
                   "scenario_id": req.scenario_id if hasattr(req, 'scenario_id') else 1, # Gán nhãn kịch bản phù hợp
                    "uid": req.userId,
                    "arg": req.user_argument,
                    "weight": req.credibility_weight,
                    "old_score": req.current_score,
                    "new_score": new_score,
                    "eval": ai_analysis.get("evaluation", ""),
                    "evidence": ai_analysis.get("evidence", "") # Lưu bằng chứng đối chiếu từ hệ thống RAG vào DB
                })
                conn.commit()
        except Exception as db_err:
            logger.error(f"Lỗi không thể lưu lịch sử tranh biện xuống DB: {db_err}")
        
        return {
            "evaluation": ai_analysis.get("evaluation", "Đã ghi nhận lập luận."),
            "evidence": ai_analysis.get("evidence", "Không tìm thấy dữ kiện đối chiếu."),
            "impact": ai_analysis.get("impact", "Chưa thể đánh giá tác động."),
            "relevance": round(relevance_score * 100, 1), # Trả về % tương đồng để Frontend hiển thị độ minh bạch
            "adjustment": adjustment_str,
            "newScore": new_score
        }
    except Exception as e:
        logger.error(f"Lỗi AI Debate: {e}")
        raise HTTPException(status_code=500, detail="Hệ thống phân tích đang bận, vui lòng thử lại.")

# Thêm cấu hình lắng nghe sự kiện thị trường vào luồng start_kafka_consumer() sẵn có của bạn
# Hoặc tạo một hàm consumer riêng biệt chạy song song:
def listen_market_events():
    try:
        # consumer = KafkaConsumer(
        #     'market_events',
        #     bootstrap_servers=['localhost:9092'],
        #     group_id='ai-market-group',
        # Lấy thông tin từ biến môi trường tương tự consumer chính
        kafka_server = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
        consumer = KafkaConsumer(
            'market_events',
            bootstrap_servers=[kafka_server],
            group_id='ai-market-group',
            value_deserializer=lambda m: json.loads(m.decode('utf-8')) if m is not None else None
        )
        for message in consumer:
            event = message.value
            if event and event.get("action") == "REFRESH_RAG_KNOWLEDGE":
                logger.info("📥 Nhận tín hiệu từ Kafka: Tiến hành làm mới bộ nhớ đệm hệ thống RAG...")
                load_knowledge_base_from_news()
    except Exception as e:
        logger.error(f"Lỗi hệ thống lắng nghe sự kiện Kafka Market: {e}")
        
# venv\Scripts\activate
# py main.py