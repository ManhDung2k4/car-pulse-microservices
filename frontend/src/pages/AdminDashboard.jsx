import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalCars: 0,
    totalUsers: 0,
    totalSegments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ AUTO-CLEAR ERRORS AFTER 5 SECONDS
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    // ✅ KIỂM TRA QUYỀN ADMIN
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (currentUser?.role !== "ADMIN") {
      navigate("/cars");
      return;
    }
    setUser(currentUser);

    // ✅ TẢI DỮ LIỆU THỐNG KÊ
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const [carsRes, segmentsRes, usersRes] = await Promise.all([
          axios.get("http://localhost:8080/api/cars?page=0&size=1", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:8080/api/auth/users?page=0&size=1", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          // ✅ TRY TO GET USERS COUNT
          axios
            .get("http://localhost:8080/api/auth/users?page=0&size=1", {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({ data: { totalElements: 0 } })),
        ]);

        // Backend trả về array trực tiếp hoặc object với segments field
        const segmentsData = Array.isArray(segmentsRes.data)
          ? segmentsRes.data
          : segmentsRes.data.segments || [];

        setStats({
          totalCars: carsRes.data.totalElements || 0,
          totalUsers: usersRes.data.totalElements || 0, // ✅ NOW TRY TO GET FROM BACKEND
          totalSegments: segmentsData.length || 0,
        });
      } catch (err) {
        setError("Không thể tải thống kê: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  if (loading)
    return (
      <div className="admin-page">
        <div className="loading-spinner">Đang tải...</div>
      </div>
    );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Bảng điều khiển Admin</h1>
        <p>Chào mừng, {user?.fullName || user?.email}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">
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
          <div className="stat-content">
            <div className="stat-label">Tổng số xe</div>
            <div className="stat-value">{stats.totalCars}</div>
          </div>
          <button
            className="stat-link"
            onClick={() => navigate("/admin/cars")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Quản lý →
          </button>
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
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
              />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Người dùng</div>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
          <button
            className="stat-link"
            onClick={() => navigate("/admin/users")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Quản lý →
          </button>
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
                d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Phân khúc giá</div>
            <div className="stat-value">{stats.totalSegments}</div>
          </div>
          <button
            className="stat-link"
            onClick={() => navigate("/admin/analytics")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Xem chi tiết →
          </button>
        </div>
      </div>

      <div className="admin-actions">
        <div className="action-card">
          <h3>Quản lý xe</h3>
          <p>Thêm, sửa, xóa thông tin xe</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/admin/cars")}
          >
            Quản lý xe
          </button>
        </div>

        <div className="action-card">
          <h3>Quản lý người dùng</h3>
          <p>Kiểm soát tài khoản người dùng</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/admin/users")}
          >
            Quản lý người dùng
          </button>
        </div>

        <div className="action-card">
          <h3>Phân tích dữ liệu</h3>
          <p>Xem báo cáo và phân khúc thị trường</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/admin/analytics")}
          >
            Xem phân tích
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
