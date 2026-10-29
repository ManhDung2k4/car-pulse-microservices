import React, { useEffect } from "react";
import { Link } from "react-router-dom";

function HomePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="home-page page-transition">
      <div className="home-bg-pattern"></div>

      <div className="container">
        {/* HERO SECTION */}
        <section className="hero-wrapper section-padding">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="pulse-dot"></span> Nền tảng mua bán ô tô thông
              minh
            </div>
            <h1 className="hero-title">
              Tìm Chiếc Xe Ưng Ý <br />
              <span>Với Giá Tốt Nhất</span>
            </h1>
            <p className="hero-desc">
              Hàng ngàn lựa chọn xe ô tô cũ và mới đang chờ đón bạn. Hệ thống
              thông minh của Car Pulse giúp bạn tìm xe nhanh chóng, tham khảo
              giá chuẩn xác và an tâm giao dịch.
            </p>
            <div className="hero-actions">
              <Link to="/cars">
                <button className="hero-btn-primary">Tìm xe ngay</button>
              </Link>
              <Link to="/segments">
                <button className="hero-btn-outline">Tham khảo giá</button>
              </Link>
            </div>
          </div>

          <div className="hero-visuals">
            <div className="glow-orb"></div>

            <div className="glass-card float-1">
              <div className="icon-box">
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
                </svg>
              </div>
              <div>
                <h4>Đa dạng lựa chọn</h4>
                <p>+5,000 Mẫu xe</p>
              </div>
            </div>

            <div className="glass-card float-2">
              <div className="icon-box">
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
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
              </div>
              <div>
                <h4>Cập nhật mới</h4>
                <p>Mỗi ngày</p>
              </div>
            </div>

            <img
              src="https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1000&auto=format&fit=crop"
              alt="Car Showroom"
              className="hero-main-img"
            />
          </div>
        </section>

        {/* TRUST BANNER */}
        <section className="trust-banner">
          <div className="trust-item">
            <h3>5,000+</h3>
            <p>Xe Đang Bán</p>
          </div>
          <div className="trust-item">
            <h3>100%</h3>
            <p>Thông Tin Minh Bạch</p>
          </div>
          <div className="trust-item">
            <h3>24/7</h3>
            <p>Liên Tục Cập Nhật</p>
          </div>
          <div className="trust-item">
            <h3>Top 1</h3>
            <p>Gợi Ý Mua Bán</p>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="features-section section-padding">
          <div className="features-header">
            <h2>Mọi Thứ Bạn Cần Để Tìm Mua Xe</h2>
            <p>
              Từ việc tìm kiếm đến tham khảo giá, chúng tôi cung cấp đầy đủ công
              cụ để bạn có thể tự tin đưa ra quyết định mua chiếc xe tiếp theo.
            </p>
          </div>

          <div className="modern-feature-grid">
            <div
              className="modern-feature-card"
              style={{
                animationDelay: "0.1s",
                animation: "slideUpFade 0.6s ease-out forwards",
              }}
            >
              <div className="feature-icon-wrapper">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <h3>Tìm Kiếm Xe Dễ Dàng</h3>
              <p>
                Bộ lọc thông minh giúp bạn nhanh chóng khoanh vùng chiếc xe mơ
                ước theo mức giá, hãng xe, đời xe và tình trạng sử dụng.
              </p>
              <Link to="/cars" className="feature-link">
                Xem danh sách xe <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div
              className="modern-feature-card"
              style={{
                animationDelay: "0.2s",
                animation: "slideUpFade 0.6s ease-out forwards",
              }}
            >
              <div className="feature-icon-wrapper">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                  <path d="M22 12A10 10 0 0 0 12 2v10z" />
                </svg>
              </div>
              <h3>Gợi Ý & Định Giá Chuẩn</h3>
              <p>
                Hệ thống tự động phân loại và so sánh mặt bằng giá chung của thị
                trường, giúp bạn biết xe nào đang có mức giá "hời" nhất.
              </p>
              <Link to="/segments" className="feature-link">
                Khảo sát giá thị trường <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div
              className="modern-feature-card"
              style={{
                animationDelay: "0.3s",
                animation: "slideUpFade 0.6s ease-out forwards",
              }}
            >
              <div className="feature-icon-wrapper">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
              <h3>Cập Nhật Xu Hướng Mới Nhất</h3>
              <p>
                Nắm bắt ngay "cấu hình quốc dân" mà nhiều người săn đón. Xem
                dòng xe, màu sắc hay hộp số nào đang hot nhất hiện nay.
              </p>
              <Link to="/association-rules" className="feature-link">
                Xem xu hướng thị trường <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Bạn Đã Sẵn Sàng Tìm Chiếc Xe Của Mình?</h2>
            <p>
              Tham gia cùng hàng ngàn khách hàng khác đang sử dụng Car Pulse để
              kết nối với chiếc xe mơ ước mỗi ngày.
            </p>
            <Link to="/cars">
              <button className="btn-white">Bắt Đầu Khám Phá Ngay</button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HomePage;
