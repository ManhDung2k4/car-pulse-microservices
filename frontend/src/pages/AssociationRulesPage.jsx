import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAssociationRules } from "../api/aiApi";
import "../App.css";
import "../admin-styles.css";

const AssociationRulesPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.role !== "ADMIN") navigate("/cars");

    const fetchRules = async () => {
      try {
        const data = await getAssociationRules();
        setRules(data.rules || []);
      } catch (err) {
        setError("Lỗi khi tải luật kết hợp.");
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, [navigate]);

  // HÀM DỊCH NHÃN (Format dữ liệu)
  const formatLabel = (str) => {
    if (!str) return str;
    const parts = str.split("_");
    const prefix = parts[0];
    const value = parts.slice(1).join(" ");

    const mapping = {
      style: "Loại xe",
      origin: "Xuất xứ",
      status: "Tình trạng",
      brand: "Hãng xe",
      price: "Giá",
      transmission: "Hộp số",
      fuel: "Nhiên liệu",
      color: "Màu",
    };

    return mapping[prefix] ? `${mapping[prefix]}: ${value}` : str;
  };

  const totalPages = Math.max(1, Math.ceil(rules.length / ITEMS_PER_PAGE));
  const currentRules = rules.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>
            Báo cáo xu hướng thị trường
          </h1>
          <p style={{ color: "#64748b" }}>
            Phân tích quy luật kết hợp từ dữ liệu khách hàng
          </p>
        </div>
      </div>

      <div className="admin-card">
        {loading && <p>Đang xử lý dữ liệu AI...</p>}
        {error && <p style={{ color: "#ef4444" }}>{error}</p>}

        {!loading && !error && rules.length > 0 && (
          <div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "20px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f1f5f9",
                    color: "#334155",
                    textAlign: "left",
                  }}
                >
                  <th
                    style={{
                      padding: "16px",
                      borderRadius: "8px 0 0 8px",
                      background: "#e0fefb",
                    }}
                  >
                    STT
                  </th>
                  <th style={{ padding: "16px", background: "#e0fefb" }}>
                    Điều kiện tìm kiếm
                  </th>
                  <th style={{ padding: "16px", background: "#e0fefb" }}>
                    Kết quả gợi ý
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      borderRadius: "0 8px 8px 0",
                      background: "#e0fefb",
                    }}
                  >
                    Độ tin cậy
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentRules.map((rule, index) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      background: "#ffffff",
                    }}
                  >
                    <td
                      style={{
                        padding: "20px",
                        fontSize: "15px",
                        fontWeight: "600",
                      }}
                    >
                      {page * ITEMS_PER_PAGE + index + 1}
                    </td>

                    <td style={{ padding: "20px" }}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        {(rule.antecedents || []).map((item, i) => (
                          <span
                            key={i}
                            style={{
                              background: "#e0f2fe",
                              color: "#0369a1",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "14px",
                              fontWeight: "500",
                            }}
                          >
                            {formatLabel(item)}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: "20px" }}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        {(rule.consequents || []).map((item, i) => (
                          <span
                            key={i}
                            style={{
                              background: "#fef3c7",
                              color: "#92400e",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "14px",
                              fontWeight: "500",
                            }}
                          >
                            {formatLabel(item)}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: "20px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "700",
                            color:
                              rule.confidence > 0.6 ? "#059669" : "#d97706",
                            fontSize: "15px",
                          }}
                        >
                          {(rule.confidence * 100).toFixed(0)}%
                        </span>
                        <div
                          style={{
                            width: "100px",
                            height: "8px",
                            background: "#e2e8f0",
                            borderRadius: "4px",
                          }}
                        >
                          <div
                            style={{
                              width: `${rule.confidence * 100}%`,
                              height: "100%",
                              background:
                                rule.confidence > 0.6 ? "#059669" : "#d97706",
                              borderRadius: "4px",
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* THANH ĐIỀU HƯỚNG PHÂN TRANG MỚI */}
            <div className="pagination-container">
              <span style={{ color: "#64748b" }}>
                Trang {page + 1} / {totalPages}
              </span>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                >
                  Trước
                </button>
                <select
                  className="pagination-select"
                  value={page}
                  onChange={(e) => setPage(Number(e.target.value))}
                >
                  {[...Array(totalPages)].map((_, i) => (
                    <option key={i} value={i}>
                      Trang {i + 1}
                    </option>
                  ))}
                </select>
                <button
                  className="pagination-btn"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssociationRulesPage;
