import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    fullName: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState(""); // "email" | "phone" | ""

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    setErrorField("");
    try {
      const res = await registerUser(formData);

      localStorage.setItem("token", res.data.accessToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMessage("Đăng ký thành công");
      setTimeout(() => navigate("/cars"), 800);
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
      setErrorField(err.response?.data?.field || "");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <div className="auth-left">
          <span className="pill">Car Pulse Analytics</span>
          <h1>Tạo tài khoản mới</h1>
          <p>
            Đăng ký để sử dụng hệ thống quản lý xe, xem phân khúc giá và khám
            phá các đề xuất xe phù hợp.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">Đăng ký nhanh chóng</div>
            <div className="auth-feature-item">Quản lý dữ liệu xe</div>
            <div className="auth-feature-item">
              Phân tích và gợi ý thông minh
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2>Đăng ký tài khoản</h2>
              <p>Điền đầy đủ thông tin để tạo tài khoản mới</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  className={`form-control ${errorField === "Email" ? "input-error" : ""}`}
                  type="email"
                  name="email"
                  placeholder="Nhập email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  className={`form-control ${errorField === "Số điện thoại" ? "input-error" : ""}`}
                  type="text"
                  name="phone"
                  placeholder="Nhập số điện thoại"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Họ và tên</label>
                <input
                  className="form-control"
                  type="text"
                  name="fullName"
                  placeholder="Nhập họ tên"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mật khẩu</label>
                <input
                  className="form-control"
                  type="password"
                  name="password"
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading}
              >
                {loading ? "Đang đăng ký..." : "Đăng ký"}
              </button>
            </form>

            {message && <p className="success">{message}</p>}
            {error && <p className="error">{error}</p>}

            <p className="switch-text">
              Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
