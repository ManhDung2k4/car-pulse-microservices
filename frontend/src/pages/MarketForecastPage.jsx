import React, { useState, useEffect, useRef } from "react";
import { submitMarketDebate } from "../api/aiApi";
import "../MarketForecastPage.css";

const MarketForecastPage = () => {
  const [confidenceScore, setConfidenceScore] = useState(75);
  const [credibilityWeight, setCredibilityWeight] = useState(3);
  const [customArgument, setCustomArgument] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [history, setHistory] = useState([
    {
      id: 1,
      type: "system",
      title: "DỰ BÁO GỐC (HỆ THỐNG RAG)",
      content:
        "Trong ngắn hạn (2026 - 2028), xe Hybrid (HEV/PHEV) sẽ chiếm ưu thế về mức độ tăng trưởng doanh số so với xe thuần điện (BEV) ở phân khúc phổ thông và trung cấp tại Việt Nam. Thuần điện sẽ mất thêm thời gian để đồng bộ hạ tầng trạm sạc.",
      scoreAtTime: 75,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const historyEndRef = useRef(null);

  // Tự động cuộn xuống cuối khi có lịch sử mới
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const preSetEvents = [
    {
      id: "e1",
      title: "Đề xuất miễn 100% lệ phí trước bạ cho xe thuần điện",
      source: "VnExpress",
      date: "Hôm nay",
      text: "Chính phủ ban hành gói miễn 100% lệ phí trước bạ cho xe thuần điện (BEV)",
      image:
        "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=500",
    },
    {
      id: "e2",
      title: "Toyota xây dựng chuỗi trạm sạc Hybrid toàn quốc",
      source: "AutoPro",
      date: "Hôm qua",
      text: "Toyota công bố xây dựng chuỗi trạm sạc Hybrid tự sạc (PHEV) toàn quốc",
      image:
        "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?auto=format&fit=crop&q=80&w=500",
    },
  ];

  // Hàm xử lý gửi tranh biện chuẩn Senior (phòng thủ lỗi 100%)
  const handleDebateSubmit = async (
    overrideText = null,
    overrideWeight = null,
  ) => {
    const textToSubmit = overrideText || customArgument;
    const weightToSubmit = overrideWeight || credibilityWeight;

    if (!textToSubmit.trim()) return;
    setIsProcessing(true);

    try {
      const token = localStorage.getItem("token");

      // Bắt lỗi xác thực ngay từ Frontend
      if (!token || token === "undefined" || token === "null") {
        alert(
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất và đăng nhập lại!",
        );
        setIsProcessing(false);
        return;
      }

      // Đóng gói dữ liệu chuẩn khớp với cấu trúc DebateRequest Java
      const debateData = {
        scenario_id: 1,
        user_argument: textToSubmit,
        credibility_weight: Number(weightToSubmit),
        current_score: Number(confidenceScore),
        current_forecast:
          history[0]?.content || "HEV chiếm ưu thế ngắn hạn so với BEV",
      };

      // Gọi API sang Java Gateway
      const result = await submitMarketDebate(debateData, token);

      // Cập nhật biểu đồ điểm số UI (Phòng thủ trường hợp result.newScore undefined)
      const updatedScore = result?.newScore ?? confidenceScore;
      setConfidenceScore(updatedScore);

      // Lưu vết AI vào lịch sử (Phòng thủ trường hợp AI trả về rỗng)
      const aiResponse = {
        id: Date.now(),
        type: "ai",
        title: "KẾT QUẢ ĐIỀU CHỈNH TỪ AI",
        userArgument: textToSubmit.replace("[Phân tích bài báo]: ", ""),
        evaluation:
          result?.evaluation ||
          "Hệ thống đã ghi nhận lập luận nhưng chưa thể đưa ra đánh giá chi tiết.",
        evidence:
          result?.evidence ||
          "Không tìm thấy dữ kiện báo chí liên quan để đối chiếu.",
        impact: result?.impact || "Chưa xác định",
        adjustment: result?.adjustment || "N/A (0%)",
        scoreAtTime: updatedScore,
        timestamp: new Date().toLocaleTimeString(),
      };

      setHistory((prev) => [...prev, aiResponse]);

      // Xóa ô input nếu người dùng nhập tay
      if (!overrideText) setCustomArgument("");
    } catch (err) {
      console.error("Lỗi gọi API Debate:", err);
      // Hiển thị thông báo thân thiện hơn thay vì lỗi kỹ thuật
      alert(
        "Hệ thống AI đang quá tải hoặc kết nối bị gián đoạn. Vui lòng thử lại sau vài giây!",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Logic tô màu mượt mà cho Gauge Chart
  const getScoreColor = (score) => {
    if (score >= 70) return "#0f766e"; // Xanh Teal (Nghiêng về HEV)
    if (score >= 45) return "#f59e0b"; // Cam (Cân bằng)
    return "#0ea5e9"; // Xanh dương (Nghiêng về BEV)
  };

  const getBadgeClass = (adjustmentStr) => {
    if (!adjustmentStr) return "badge-neutral";
    const str = adjustmentStr.toUpperCase();
    if (str.includes("TĂNG")) return "badge-up";
    if (str.includes("GIẢM")) return "badge-down";
    return "badge-neutral";
  };

  return (
    <div className="forecast-page">
      <div className="forecast-container">
        <div className="forecast-header">
          <h1>Tình Báo Thị Trường: HEV vs BEV (2026-2028)</h1>
          <p>
            Hệ thống dự báo động (Bayesian RAG) tự động cập nhật xác suất dựa
            trên tin tức và phản biện của bạn.
          </p>
        </div>

        <div className="forecast-grid">
          {/* CỘT TRÁI: INPUT & DATA */}
          <div className="main-panel">
            {/* 1. Tin tức nạp vào */}
            <div className="dashboard-card">
              <h3 className="card-title">📡 Nạp dữ kiện thị trường</h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  marginBottom: "16px",
                }}
              >
                Chọn một tin tức báo chí để yêu cầu AI phân tích tác động và
                điều chỉnh lại biểu đồ dự báo.
              </p>
              <div className="news-grid">
                {preSetEvents.map((news) => (
                  <div
                    key={news.id}
                    className={`news-item ${isProcessing ? "disabled" : ""}`}
                    onClick={() => {
                      if (!isProcessing)
                        handleDebateSubmit(
                          `[Phân tích bài báo]: ${news.text}`,
                          4,
                        );
                    }}
                    style={{
                      opacity: isProcessing ? 0.6 : 1,
                      pointerEvents: isProcessing ? "none" : "auto",
                    }}
                  >
                    <img src={news.image} alt={news.title} />
                    <div className="news-content">
                      <div className="news-source">
                        {news.source} • {news.date}
                      </div>
                      <div className="news-title">{news.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Form Tranh biện */}
            <div className="dashboard-card">
              <h3 className="card-title">⚖️ Góc Tranh Biện Chuyên Gia</h3>
              <div className="debate-form-wrapper">
                <div className="slider-group">
                  <label>
                    Độ tin cậy nguồn tin:{" "}
                    <span style={{ color: "#0f766e" }}>
                      Mức {credibilityWeight}/5
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    className="slider-input"
                    value={credibilityWeight}
                    onChange={(e) =>
                      setCredibilityWeight(parseInt(e.target.value))
                    }
                    disabled={isProcessing}
                  />
                </div>
                <textarea
                  className="debate-textarea"
                  placeholder="Nhập góc nhìn, số liệu, hoặc luận điểm phản bác của bạn vào đây..."
                  value={customArgument}
                  onChange={(e) => setCustomArgument(e.target.value)}
                  disabled={isProcessing}
                />
                <button
                  className="btn-submit"
                  onClick={() => handleDebateSubmit()}
                  disabled={isProcessing || !customArgument.trim()}
                >
                  {isProcessing
                    ? "AI Đang Đối Chiếu & Tính Toán..."
                    : "Gửi Lập Luận Thay Đổi Dự Báo"}
                </button>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: KẾT QUẢ & LỊCH SỬ */}
          <div className="side-panel">
            {/* 1. Biểu đồ niềm tin (Gauge) */}
            <div
              className="dashboard-card"
              style={{ position: "sticky", top: "20px" }}
            >
              <h3 className="card-title">📊 Điểm Xác Suất (Confidence)</h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  textAlign: "center",
                }}
              >
                Khả năng Hybrid (HEV) chiếm lĩnh phân khúc phổ thông
              </p>

              <div className="gauge-wrapper">
                <div
                  className="gauge-number"
                  style={{ color: getScoreColor(confidenceScore) }}
                >
                  {confidenceScore}%
                </div>
                <div className="gauge-track">
                  <div
                    className="gauge-fill"
                    style={{
                      width: `${confidenceScore}%`,
                      backgroundColor: getScoreColor(confidenceScore),
                    }}
                  />
                </div>
                <div className="gauge-labels">
                  <span>← BEV Thắng Thế</span>
                  <span>HEV Thắng Thế →</span>
                </div>
              </div>

              {/* 2. Lịch sử thay đổi */}
              <div
                style={{
                  marginTop: "30px",
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "20px",
                }}
              >
                <h4 style={{ fontSize: "14px", marginBottom: "16px" }}>
                  Lịch sử cập nhật:
                </h4>
                <div className="history-stream">
                  {history.map((item) => (
                    <div key={item.id} className={`history-card ${item.type}`}>
                      <div className="history-header">
                        <strong>{item.title}</strong>
                        <span>{item.timestamp}</span>
                      </div>

                      {item.type === "system" ? (
                        <p
                          style={{
                            fontSize: "14px",
                            lineHeight: "1.5",
                            margin: 0,
                          }}
                        >
                          {item.content}
                        </p>
                      ) : (
                        <>
                          <div className="history-user-arg">
                            👤 Lập luận: "{item.userArgument}"
                          </div>
                          <div className="history-analysis">
                            <p>
                              <strong>Đánh giá:</strong> {item.evaluation}
                            </p>
                            <p>
                              <strong>Đối chiếu DB:</strong> {item.evidence}
                            </p>
                            <span
                              className={`badge ${getBadgeClass(item.adjustment)}`}
                            >
                              Điều chỉnh: {item.adjustment}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  <div ref={historyEndRef} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketForecastPage;
