import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { getAssociationRules } from "../api/aiApi";

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
  const digitsOnly = text.replace(/[^\d]/g, "");
  return digitsOnly ? Number(digitsOnly) : number;
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

function CarDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [relatedCars, setRelatedCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insightMessage, setInsightMessage] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCarDetail();
    fetchRelatedCars();
  }, [id]);

  const fetchCarDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:8080/api/cars/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const carData = res.data;
      setCar(carData);
      try {
        const rulesData = await getAssociationRules();
        const rules = rulesData.rules || [];
        const b = carData.tieuDe
          ? carData.tieuDe.split(" ")[0].toLowerCase()
          : "";
        const traits = [
          `brand_${b}`,
          `fuel_${carData.nhienLieu?.toLowerCase()}`,
          `style_${carData.kieuDang?.toLowerCase()}`,
        ];
        const p = parsePrice(carData.gia) || 0;
        if (p > 0) {
          if (p < 400000000) traits.push("price_<400tr");
          else if (p <= 700000000) traits.push("price_400-700tr");
          else if (p <= 1000000000) traits.push("price_700-1ty");
          else traits.push("price_>1ty");
        }

        const matchRule = rules.find(
          (r) =>
            r.antecedents.every((a) => traits.includes(a.toLowerCase())) &&
            !r.consequents.every((c) => traits.includes(c.toLowerCase())),
        );
        if (matchRule) {
          const fmt = (t) => {
            const v = t.split("_")[1];
            if (t.startsWith("brand_")) return `xe hãng ${v.toUpperCase()}`;
            if (t.startsWith("style_")) return `dáng ${v.toUpperCase()}`;
            if (t.startsWith("fuel_")) return `máy ${v.toLowerCase()}`;
            if (t.startsWith("trans_")) return `số ${v.toLowerCase()}`;
            if (t.startsWith("price_")) return `tầm giá ${v}`;
            return v;
          };
          const cons = matchRule.consequents.map(fmt).join(" và ");
          setInsightMessage(
            `Thống kê: Khoảng ${(matchRule.confidence * 100).toFixed(0)}% người tìm cấu hình này sẽ chốt mua ${cons}.`,
          );
        }
      } catch (e) {}
    } catch (e) {
      setCar(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedCars = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:8080/api/ai/recommendations/similar/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRelatedCars(res.data?.recommendedCars || []);
    } catch (e) {
      setRelatedCars([]);
    }
  };

  const tags = useMemo(() => {
    if (!car) return [];
    return [car.kieuDang, car.xuatXu, car.tinhTrang].filter(Boolean);
  }, [car]);

  if (loading)
    return (
      <div className="page-transition container">
        <div className="loading-state">Đang tải thông tin xe...</div>
      </div>
    );
  if (!car)
    return (
      <div className="page-transition container">
        <div className="empty-state">Xe không tồn tại hoặc đã bị xóa.</div>
        <button className="hero-btn-primary" onClick={() => navigate("/cars")}>
          Quay lại kho xe
        </button>
      </div>
    );

  return (
    <div className="page-transition">
      <div className="container" style={{ paddingTop: "20px" }}>
        <button
          className="hero-btn-outline"
          style={{ padding: "8px 16px", marginBottom: "30px" }}
          onClick={() => navigate("/cars")}
        >
          ← Quay lại danh sách
        </button>

        <div
          // className="hero-wrapper"
          // style={{
          //   minHeight: "auto",
          //   background: "#fff",
          //   borderRadius: "30px",
          //   padding: "40px",
          //   boxShadow: "0 20px 40px -10px rgba(0,0,0,0.05)",
          //   gridTemplateColumns: "1fr 1fr",
          //   alignItems: "start",
          // }}
          className="premium-detail-wrapper hero-wrapper"
          style={{
            gridTemplateColumns: "1fr 1fr",
            alignItems: "start",
          }}
        >
          <div className="detail-image-panel" style={{ position: "relative" }}>
            <img
              src={car.urlHinhAnh || IMAGE_FALLBACK}
              alt={car.tieuDe}
              className="hero-main-img"
              style={{
                borderRadius: "20px",
                width: "100%",
                aspectRatio: "4/3",
                objectFit: "cover",
              }}
              onError={(e) => {
                e.currentTarget.src = IMAGE_FALLBACK;
              }}
            />
            <div
              className="tag-row"
              style={{
                position: "absolute",
                bottom: "20px",
                left: "20px",
                gap: "10px",
              }}
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="hero-badge"
                  style={{
                    background: "rgba(0,0,0,0.7)",
                    color: "#fff",
                    margin: 0,
                    padding: "6px 12px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div
            className="detail-info-panel"
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div>
              <span
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  fontWeight: 600,
                }}
              >
                Mã xe: #{car.id}
              </span>
              <h1
                style={{
                  fontSize: "32px",
                  color: "#0f172a",
                  margin: "10px 0",
                  fontWeight: 800,
                  lineHeight: 1.3,
                }}
              >
                {car.tieuDe}
              </h1>
              <p
                style={{
                  fontSize: "36px",
                  color: "#0ea5e9",
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                {formatPrice(car.gia)}
              </p>
            </div>

            {insightMessage && (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "12px",
                  padding: "16px",
                  color: "#166534",
                  fontSize: "14px",
                  fontWeight: 600,
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                <span>💡</span> <span>{insightMessage}</span>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                background: "#f8fafc",
                padding: "24px",
                borderRadius: "16px",
              }}
            >
              <div>
                <span style={{ color: "#64748b", fontSize: "13px" }}>
                  Năm sản xuất
                </span>
                <p
                  style={{
                    margin: "5px 0 0",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {car.namSX || "-"}
                </p>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "13px" }}>
                  ODO (Số km)
                </span>
                <p
                  style={{
                    margin: "5px 0 0",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {car.soKmDaDi || "-"}
                </p>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "13px" }}>
                  Nhiên liệu
                </span>
                <p
                  style={{
                    margin: "5px 0 0",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {car.nhienLieu || "-"}
                </p>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "13px" }}>
                  Hộp số
                </span>
                <p
                  style={{
                    margin: "5px 0 0",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {car.hopSo || "-"}
                </p>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "13px" }}>
                  Nơi bán
                </span>
                <p
                  style={{
                    margin: "5px 0 0",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {car.diaDiem || "-"}
                </p>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "13px" }}>
                  Ngày đăng
                </span>
                <p
                  style={{
                    margin: "5px 0 0",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {car.ngayDang || "-"}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px", marginTop: "10px" }}>
              <a
                href={car.url || "#"}
                target="_blank"
                rel="noreferrer"
                style={{ flex: 1 }}
              >
                <button
                  className="hero-btn-primary"
                  style={{ width: "100%", padding: "16px", fontSize: "16px" }}
                >
                  Liên Hệ Người Bán
                </button>
              </a>
            </div>
          </div>
        </div>

        <section className="features-section section-padding">
          {/* <div className="features-header">
            <h2>Gợi Ý Xe Cùng Tầm Giá</h2>
            <p>
              Tham khảo thêm các lựa chọn thay thế tốt nhất trên thị trường.
            </p>
          </div> */}
          {/* XÓA KHỐI CŨ VÀ THAY BẰNG KHỐI NÀY */}
          <div className="premium-section-header">
            <h2>Gợi Ý Cùng Phân Khúc</h2>
            <p>
              Khám phá thêm những tuyệt tác xe hơi mang giá trị và đẳng cấp
              tương xứng đang có mặt trên thị trường.
            </p>
          </div>

          {relatedCars.length === 0 ? (
            <div className="empty-state">Đang cập nhật thêm xe gợi ý...</div>
          ) : (
            <div
              className="modern-feature-grid"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              }}
            >
              {relatedCars.map((item) => (
                <div
                  key={item.id}
                  className="car-card"
                  onClick={() => navigate(`/cars/${item.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="car-image-wrap">
                    <img
                      src={item.urlHinhAnh || IMAGE_FALLBACK}
                      alt={item.tieuDe}
                      className="car-image"
                      onError={(e) => {
                        e.currentTarget.src = IMAGE_FALLBACK;
                      }}
                    />
                  </div>
                  <div className="car-card-body">
                    <div className="car-title-row">
                      <h3 style={{ fontSize: "15px", color: "#0f172a" }}>
                        {item.tieuDe}
                      </h3>
                    </div>
                    <p
                      className="car-price"
                      style={{
                        color: "#0ea5e9",
                        fontSize: "18px",
                        fontWeight: 800,
                        margin: "8px 0",
                      }}
                    >
                      {formatPrice(item.gia)}
                    </p>
                    <div className="car-meta-grid" style={{ fontSize: "12px" }}>
                      <div>
                        <span>soKM: </span>
                        <strong>{item.soKmDaDi || "-"}</strong>
                      </div>
                      <div>
                        <span>Hộp số:</span>
                        <strong>{item.hopSo || "-"}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default CarDetailPage;
