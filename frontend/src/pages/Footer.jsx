import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-inner">
        {/* Cột 1: Thông tin thương hiệu */}
        <div className="footer-brand">
          <Link to="/" className="brand">
            <div className="brand-mark" style={{ background: "transparent" }}>
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <defs>
                  <linearGradient
                    id="gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#0f766e" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </linearGradient>
                </defs>
                <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
              </svg>
            </div>
            <div className="brand-text">
              <strong>Car Pulse</strong>
              <span>Nền tảng ô tô thông minh</span>
            </div>
          </Link>
          <p>
            Nền tảng mua bán và định giá ô tô thông minh, giúp bạn dễ dàng tìm
            kiếm, khảo sát giá và chọn được chiếc xe ưng ý nhất tại thị trường
            Việt Nam.
          </p>
        </div>

        {/* Cột 2: Các liên kết khám phá */}
        <div className="footer-links-group">
          <h4>Khám Phá</h4>
          <ul>
            <li>
              <Link to="/cars">Danh Sách Xe Đang Bán</Link>
            </li>
            <li>
              <Link to="/segments">Khảo Sát Giá Thị Trường</Link>
            </li>
            <li>
              <Link to="/similar">Gợi Ý Xe Phù Hợp</Link>
            </li>
            <li>
              <Link to="/association-rules">Xu Hướng & Thị Hiếu</Link>
            </li>
          </ul>
        </div>

        {/* Cột 3: Hỗ trợ người dùng */}
        <div className="footer-links-group">
          <h4>Liên Hệ & Hỗ Trợ</h4>
          <ul>
            <li>
              <a href="#">Kinh nghiệm mua bán</a>
            </li>
            <li>
              <a href="#">Chính sách bảo mật</a>
            </li>
            <li>
              <a href="mailto:support@carpulse.vn">
                Email: support@carpulse.vn
              </a>
            </li>
            <li>
              <a href="tel:0900000000">Hotline: (084) 900-000-000</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Dòng bản quyền */}
      <div className="footer-bottom">
        <span>&copy; {currentYear} Car Pulse. Đã đăng ký bản quyền.</span>
        <div style={{ display: "flex", gap: "16px" }}>
          <span>Phiên bản 1.1</span>
          <span>•</span>
          <strong>Phát triển bởi Nhóm 11 - SOA1</strong>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
