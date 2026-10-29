import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    segments: [],
    associationRules: [],
    marketStats: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("segments");

  // ✅ AUTO-CLEAR ERRORS
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ✅ KIỂM TRA QUYỀN ADMIN
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (currentUser?.role !== "ADMIN") {
      navigate("/cars");
      return;
    }

    fetchAnalytics();
  }, [navigate]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");

      const [segmentsRes, rulesRes] = await Promise.all([
        axios.get("http://localhost:8080/api/ai/segments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:8080/api/ai/association-rules", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // ✅ HANDLE DIFFERENT RESPONSE FORMATS
      let segments = [];
      if (Array.isArray(segmentsRes.data)) {
        segments = segmentsRes.data;
      } else if (segmentsRes.data?.segments) {
        segments = segmentsRes.data.segments;
      } else if (segmentsRes.data?.data) {
        segments = segmentsRes.data.data;
      }

      let rules = [];
      if (Array.isArray(rulesRes.data)) {
        rules = rulesRes.data;
      } else if (rulesRes.data?.rules) {
        rules = rulesRes.data.rules;
      } else if (rulesRes.data?.data) {
        rules = rulesRes.data.data;
      }

      // ✅ TÍNH TOÁN THỐNG KÊ TỬ segments
      const marketStats = calculateMarketStats(segments);

      setAnalytics({
        segments,
        associationRules: rules,
        marketStats,
      });
      setError("");
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError("Lỗi tải phân tích: " + err.message);
      // ✅ LOAD DEMO DATA ON ERROR
      setAnalytics({
        segments: [],
        associationRules: [],
        marketStats: {
          budgetCount: 0,
          midCount: 0,
          premiumCount: 0,
          avgPrice: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ TÍNH TOÁN THỐNG KÊ THỊ TRƯỜNG
  const calculateMarketStats = (segments) => {
    if (!segments || segments.length === 0) {
      return {
        budgetCount: 0,
        midCount: 0,
        premiumCount: 0,
        avgPrice: 0,
      };
    }

    let stats = {
      budgetCount: 0,
      midCount: 0,
      premiumCount: 0,
      avgPrice: 0,
    };

    // Backend trả về 3 segments có segmentId 0, 1, 2 (ordered by avgPrice)
    segments.forEach((segment) => {
      if (segment.segmentId === 0) {
        stats.budgetCount = segment.count || 0;
      } else if (segment.segmentId === 1) {
        stats.midCount = segment.count || 0;
      } else if (segment.segmentId === 2) {
        stats.premiumCount = segment.count || 0;
      }
    });

    // Tính average price từ tất cả segments
    if (segments.length > 0) {
      const totalPrice = segments.reduce(
        (sum, seg) => sum + (seg.avgPrice || 0) * (seg.count || 0),
        0,
      );
      const totalCount = segments.reduce(
        (sum, seg) => sum + (seg.count || 0),
        0,
      );
      stats.avgPrice = totalCount > 0 ? Math.round(totalPrice / totalCount) : 0;
    }

    return stats;
  };

  // ✅ FORMAT PRICE
  function formatPrice(num) {
    if (!num) return "0 đ";
    const billions = num / 1_000_000_000;
    if (billions >= 1) {
      return billions % 1 === 0
        ? `${billions.toFixed(0)} tỷ`
        : `${billions.toFixed(1)} tỷ`;
    }
    const millions = num / 1_000_000;
    if (millions >= 1) {
      return millions % 1 === 0
        ? `${millions.toFixed(0)} triệu`
        : `${millions.toFixed(1)} triệu`;
    }
    const thousands = num / 1_000;
    if (thousands >= 1) {
      return thousands % 1 === 0
        ? `${thousands.toFixed(0)} nghìn`
        : `${thousands.toFixed(1)} nghìn`;
    }
    return `${num} đ`;
  }

  // ✅ LẤY BIỂU TƯỢNG PHÂN KHÚC
  const getSegmentIcon = (name) => {
    if (!name) return "🚗";
    const lowerName = name.toLowerCase();

    if (lowerName.includes("phổ") || lowerName.includes("thấp")) return "💰";
    if (lowerName.includes("trung")) return "⭐";
    if (lowerName.includes("cao") || lowerName.includes("premium")) return "👑";

    return "🚗";
  };

  // ✅ LẤY TÊN PHÂN KHÚC
  const getSegmentLabel = (segment) => {
    switch (segment?.toLowerCase()) {
      case "budget":
        return "Phân khúc giá thấp";
      case "mid-range":
        return "Phân khúc giá trung bình";
      case "premium":
        return "Phân khúc cao cấp";
      default:
        return segment;
    }
  };

  if (loading)
    return (
      <div className="admin-page">
        <div className="loading-spinner">Đang tải...</div>
      </div>
    );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <button
          onClick={() => navigate("/admin/dashboard")}
          class="stat-link"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-undo2-icon lucide-undo-2"
          >
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
          </svg>
          Quay lại trang admin
        </button>
        <h1>Phân tích thị trường</h1>
        <p>Thống kê và xu hướng thị trường ô tô</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ===== THỐNG KÊ CHUNG ===== */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div>
            <div className="stat-label">Phân khúc giá thấp</div>
            <div className="stat-value">
              {analytics.marketStats.budgetCount}
            </div>
            <div className="stat-desc">xe</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m9 7.5 3 4.5m0 0 3-4.5M12 12v5.25M15 12H9m6 3H9m12-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div>
            <div className="stat-label">Phân khúc giá trung bình</div>
            <div className="stat-value">{analytics.marketStats.midCount}</div>
            <div className="stat-desc">xe</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
              />
            </svg>
          </div>
          <div>
            <div className="stat-label">Phân khúc cao cấp</div>
            <div className="stat-value">
              {analytics.marketStats.premiumCount}
            </div>
            <div className="stat-desc">xe</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M14.25 7.756a4.5 4.5 0 1 0 0 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div>
            <div className="stat-label">Giá trung bình thị trường</div>
            <div className="stat-value">
              {formatPrice(analytics.marketStats.avgPrice)}
            </div>
            <div className="stat-desc">VNĐ</div>
          </div>
        </div>
      </div>

      {/* ===== TAB ĐIỀU HƯỚNG ===== */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === "segments" ? "active" : ""}`}
          onClick={() => setActiveTab("segments")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-car-icon lucide-car"
          >
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>{" "}
          Phân khúc xe
        </button>
        <button
          className={`tab-btn ${activeTab === "rules" ? "active" : ""}`}
          onClick={() => setActiveTab("rules")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-badge-dollar-sign-icon lucide-badge-dollar-sign"
          >
            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
            <path d="M12 18V6" />
          </svg>{" "}
          Quy luật thị trường
        </button>
      </div>

      {/* ===== TAB 1: PHÂN KHÚC XE ===== */}
      {activeTab === "segments" && (
        <div className="admin-content">
          <h2>Phân khúc ô tô theo giá</h2>
          <p className="tab-description">
            AI sử dụng K-Means Clustering để phân loại xe thành 3 phân khúc giá
          </p>

          {analytics.segments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>Chưa có dữ liệu phân khúc</p>
            </div>
          ) : (
            <div className="segments-grid">
              {analytics.segments.map((seg, idx) => (
                <div key={idx} className="segment-card">
                  <div className="segment-header">
                    <h3>
                      {getSegmentIcon(seg.name)} {seg.name}
                    </h3>
                    <span className="segment-count">{seg.count || 0} xe</span>
                  </div>

                  <div className="segment-stats">
                    <div className="stat-item">
                      <span className="stat-name">Giá thấp nhất:</span>
                      <span className="stat-value">
                        {formatPrice(seg.minPrice)}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-name">Giá cao nhất:</span>
                      <span className="stat-value">
                        {formatPrice(seg.maxPrice)}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-name">Giá trung bình:</span>
                      <span className="stat-value">
                        {formatPrice(seg.avgPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="segment-cars">
                    <p className="cars-label">Hãng xe phổ biến:</p>
                    <div className="cars-brands">
                      {(seg.topBrands || []).slice(0, 5).map((brand, i) => (
                        <span key={i} className="brand-tag">
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 2: QUY LUẬT THỊ TRƯỜNG ===== */}
      {activeTab === "rules" && (
        <div className="admin-content">
          <h2>Quy luật kết hợp thị trường</h2>
          <p className="tab-description">
            AI phát hiện các mẫu (pattern) về sự kết hợp giữa hãng, nhiên liệu,
            và giá
          </p>

          {analytics.associationRules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔗</div>
              <p>Chưa có dữ liệu quy luật</p>
            </div>
          ) : (
            <div className="rules-list">
              {analytics.associationRules.map((rule, idx) => (
                <div key={idx} className="rule-card">
                  {/* <div className="rule-antecedent">
                    <strong>Điều kiện:</strong>
                    <div className="rule-items">
                      {rule.antecedent?.split(",").map((item, i) => (
                        <span key={i} className="rule-item">
                          {item.trim()}
                        </span>
                      ))}
                    </div>
                  </div> */}
                  <div className="rule-antecedent">
                    <strong>Điều kiện:</strong>
                    <div className="rule-items">
                      {/* Lấy đúng biến antecedents (có 's') và bỏ hàm split() vì nó đã là mảng */}
                      {(rule.antecedents || []).map((item, i) => (
                        <span key={i} className="rule-item">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* <div className="rule-arrow">→</div>

                  <div className="rule-consequent">
                    <strong>Kết quả:</strong>
                    <div className="rule-items">
                      {rule.consequent?.split(",").map((item, i) => (
                        <span key={i} className="rule-item consequent">
                          {item.trim()}
                        </span>
                      ))}
                    </div>
                  </div> */}
                  <div className="rule-arrow">→</div>

                  <div className="rule-consequent">
                    <strong>Kết quả:</strong>
                    <div className="rule-items">
                      {/* Lấy đúng biến consequents (có 's') và bỏ hàm split() */}
                      {(rule.consequents || []).map((item, i) => (
                        <span key={i} className="rule-item consequent">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rule-metrics">
                    <div className="metric">
                      <span className="metric-label">Support:</span>
                      <span className="metric-value">
                        {(rule.support * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Confidence:</span>
                      <span className="metric-value">
                        {(rule.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Lift:</span>
                      <span className="metric-value">
                        {rule.lift?.toFixed(2) || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== GHI CHÚ ===== */}
      <div className="admin-notes">
        <h3>📌 Ghi chú cho Admin</h3>
        <ul>
          <li>
            <strong>K-Means Clustering:</strong> Phân chia xe vào 3 phân khúc
            dựa trên giá
          </li>
          <li>
            <strong>Apriori Algorithm:</strong> Tìm mối liên hệ giữa các thuộc
            tính của xe
          </li>
          <li>
            <strong>Support:</strong> Tỷ lệ giao dịch chứa cả điều kiện và kết
            quả
          </li>
          <li>
            <strong>Confidence:</strong> Xác suất xảy ra kết quả khi có điều
            kiện
          </li>
          <li>
            <strong>Lift:</strong> Độ mạnh của quy luật ( lớn hơn 1 là mối liên
            hệ tích cực)
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminAnalytics;
