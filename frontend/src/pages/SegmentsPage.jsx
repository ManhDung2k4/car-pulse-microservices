import { useEffect, useMemo, useState, useDeferredValue } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const IMAGE_FALLBACK = "/no-image.svg";

function parsePrice(value) {
  if (value == null) return null;
  if (typeof value === "number") return value;
  const text = String(value).trim().toLowerCase();
  if (!text) return null;
  const hasUnit = /(ty|tỷ|ti|tỉ|trieu|triệu|nghin|nghìn|ngan|ngàn)/.test(text);
  const match = text.replace(/,/g, ".").match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  let number = parseFloat(match[0]);
  if (hasUnit) {
    if (
      text.includes("ty") ||
      text.includes("tỷ") ||
      text.includes("ti") ||
      text.includes("tỉ")
    )
      number *= 1_000_000_000;
    else if (text.includes("trieu") || text.includes("triệu"))
      number *= 1_000_000;
    else if (
      text.includes("nghin") ||
      text.includes("nghìn") ||
      text.includes("ngan") ||
      text.includes("ngàn")
    )
      number *= 1_000;
    return number;
  }
  return Number(text.replace(/[^\d]/g, "")) || number;
}

function formatPrice(value) {
  let numeric = parsePrice(value);
  if (!numeric || Number.isNaN(numeric))
    return value ? String(value) : "Liên hệ";
  if (numeric > 100_000_000_000)
    numeric = Number(String(numeric).substring(0, 10));
  if (numeric >= 1_000_000_000)
    return (numeric / 1_000_000_000).toFixed(2).replace(/\.00$/, "") + " Tỷ";
  else if (numeric >= 1_000_000)
    return Math.round(numeric / 1_000_000) + " Triệu";
  return new Intl.NumberFormat("vi-VN").format(numeric) + " VNĐ";
}

function SegmentsPage() {
  const [segments, setSegments] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carQuery, setCarQuery] = useState("");
  const deferredCarQuery = useDeferredValue(carQuery);
  const [page, setPage] = useState(0);
  const size = 12;
  const navigate = useNavigate();

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8080/api/ai/segments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSegments(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setSegments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCarsBySegment = async (segmentId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:8080/api/ai/segments/${segmentId}/cars`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSelectedSegment(segmentId);
      setCars(Array.isArray(res.data) ? res.data : []);
      setPage(0);
      setTimeout(() => window.scrollBy({ top: 600, behavior: "smooth" }), 300);
    } catch (e) {
      setCars([]);
    }
  };

  const filteredCars = useMemo(() => {
    const kw = deferredCarQuery.trim().toLowerCase();
    if (!kw) return cars;
    return cars.filter((c) =>
      `${c.tieuDe || ""} ${c.nhienLieu || ""} ${c.hopSo || ""} ${c.kieuDang || ""}`
        .toLowerCase()
        .includes(kw),
    );
  }, [deferredCarQuery, cars]);
  useEffect(() => {
    setPage(0);
  }, [deferredCarQuery]);

  const paginatedCars = useMemo(
    () => filteredCars.slice(page * size, (page + 1) * size),
    [filteredCars, page, size],
  );
  const totalPages = Math.ceil(filteredCars.length / size);

  return (
    <div className="page-transition">
      <div className="container">
        <div
          className="page-header section-padding"
          style={{ textAlign: "center", paddingBottom: "30px" }}
        >
          <div className="hero-badge" style={{ margin: "0 auto 15px" }}>
            <span className="pulse-dot"></span> Báo giá cập nhật tự động
          </div>
          <h1 className="hero-title">
            Khảo Sát <span>Giá Thị Trường</span>
          </h1>
          <p className="hero-desc" style={{ margin: "10px auto" }}>
            Hệ thống AI tự động tổng hợp và chia mặt bằng giá chung thành các
            phân khúc dễ hiểu nhất.
          </p>
        </div>

        {loading ? (
          <div className="loading-state">Đang tính toán mặt bằng giá...</div>
        ) : (
          <div
            className="modern-feature-grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              marginBottom: "60px",
            }}
          >
            {segments.map((segment) => (
              <div
                key={segment.segmentId}
                className="modern-feature-card"
                style={{
                  borderTop: `4px solid ${segment.segmentId === 0 ? "#10b981" : segment.segmentId === 1 ? "#0ea5e9" : "#8b5cf6"}`,
                }}
              >
                <h3 style={{ fontSize: "22px" }}>{segment.name}</h3>
                <div
                  style={{
                    margin: "20px 0",
                    padding: "15px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                    Giá giao dịch trung bình
                  </p>
                  <p
                    style={{
                      margin: "5px 0 0",
                      fontSize: "28px",
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                  >
                    {formatPrice(segment.avgPrice)}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#64748b" }}>Khoảng giá:</span>
                  <strong style={{ color: "#0f172a" }}>
                    {formatPrice(segment.minPrice)} -{" "}
                    {formatPrice(segment.maxPrice)}
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "25px",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#64748b" }}>Số xe trong rổ:</span>
                  <strong style={{ color: "#0ea5e9" }}>
                    {segment.count} xe
                  </strong>
                </div>
                <button
                  className="hero-btn-outline"
                  style={{ width: "100%", padding: "12px" }}
                  onClick={() => fetchCarsBySegment(segment.segmentId)}
                >
                  Xem xe tầm giá này
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedSegment !== null && (
          <div
            className="features-section section-padding"
            style={{ paddingTop: 0 }}
          >
            <div className="features-header">
              <h2>
                Xe Trong{" "}
                {segments.find((s) => s.segmentId === selectedSegment)?.name ||
                  "Phân Khúc"}
              </h2>
            </div>

            {/* <input
              className="filter-control"
              type="text"
              placeholder="Tìm kiếm nhanh trong nhóm này..."
              value={carQuery}
              onChange={(e) => setCarQuery(e.target.value)}
              style={{
                maxWidth: "400px",
                margin: "0 auto 30px",
                display: "block",
              }}
            /> */}
            {/* PHẦN TÌM KIẾM NHANH ĐÃ ĐƯỢC CHUYÊN NGHIỆP HÓA */}
            <div className="search-box-modern">
              <svg
                className="search-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
              <input
                type="text"
                placeholder="Nhập tên xe để tìm nhanh trong nhóm..."
                value={carQuery}
                onChange={(e) => setCarQuery(e.target.value)}
              />
            </div>

            {filteredCars.length === 0 ? (
              <div className="empty-state">Không có xe phù hợp.</div>
            ) : (
              <>
                <div className="car-grid">
                  {paginatedCars.map((car) => (
                    <div
                      key={car.id}
                      className="car-card"
                      onClick={() => navigate(`/cars/${car.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="car-image-wrap">
                        <img
                          src={car.urlHinhAnh || IMAGE_FALLBACK}
                          alt={car.tieuDe}
                          className="car-image"
                          onError={(e) => {
                            e.currentTarget.src = IMAGE_FALLBACK;
                          }}
                        />
                      </div>
                      <div className="car-card-body">
                        <div className="car-title-row">
                          <h3
                            title={
                              car.tieuDe
                            } /* Hiển thị tooltip full tên xe khi hover chuột */
                            style={{
                              fontSize: "16px",
                              color: "#0f172a",
                              fontWeight: 700,
                              margin: 0,
                              whiteSpace:
                                "nowrap" /* Ép chữ chỉ nằm trên 1 dòng */,
                              overflow: "hidden" /* Giấu đi phần chữ bị tràn */,
                              textOverflow:
                                "ellipsis" /* Thêm dấu ... ở cuối */,
                              flex: 1 /* Chiếm không gian còn lại */,
                              paddingRight:
                                "10px" /* Tránh dính sát vào năm sản xuất */,
                            }}
                          >
                            {car.tieuDe || "Chưa cập nhật"}
                          </h3>
                        </div>
                        <p
                          className="car-price"
                          style={{
                            fontSize: "18px",
                            color: "#0ea5e9",
                            fontWeight: 800,
                          }}
                        >
                          {formatPrice(car.gia)}
                        </p>
                        <div
                          className="car-meta-grid"
                          style={{ fontSize: "12px" }}
                        >
                          <div>
                            <span>soKM:</span>
                            <strong>{car.soKmDaDi || "-"}</strong>
                          </div>
                          <div>
                            <span>Nhiên liệu:</span>
                            <strong>{car.nhienLieu || "-"}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="pagination" style={{ marginTop: "40px" }}>
                    <button
                      disabled={page === 0}
                      onClick={() => setPage(page - 1)}
                    >
                      {"<"}
                    </button>
                    {[...Array(totalPages)].map((_, i) =>
                      i === 0 ||
                      i === totalPages - 1 ||
                      (i >= page - 2 && i <= page + 2) ? (
                        <button
                          key={i}
                          className={i === page ? "active-page" : ""}
                          onClick={() => setPage(i)}
                        >
                          {i + 1}
                        </button>
                      ) : i === page - 3 || i === page + 3 ? (
                        <span key={i}>...</span>
                      ) : null,
                    )}
                    <button
                      disabled={page + 1 >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      {">"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default SegmentsPage;
