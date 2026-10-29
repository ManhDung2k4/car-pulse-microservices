import {
  Routes,
  Route,
  NavLink,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useMemo, useState, useRef } from "react";
import "./App.css";
import "./admin-styles.css";
import AIChat from "./pages/AIChat";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CarListPage from "./pages/CarListPage";
import CarDetailPage from "./pages/CarDetailPage";
import SegmentsPage from "./pages/SegmentsPage";
import UserProfilePage from "./pages/UserProfilePage";
import AssociationRulesPage from "./pages/AssociationRulesPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCars from "./pages/AdminCars";
import AdminUsers from "./pages/AdminUsers";
import AdminAnalytics from "./pages/AdminAnalytics";
import Footer from "./pages/Footer";

import MarketForecastPage from "./pages/MarketForecastPage";

function Navbar({ token, onLogout }) {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  const user = useMemo(() => {
    if (!token) return null;
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return null;
    }
  }, [token]);

  // Xử lý click ra ngoài để đóng menu dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsProfileOpen(false);
    onLogout();
    navigate("/login");
  };

  const displayName = user?.fullName || user?.email || "Tài khoản";
  const userString = localStorage.getItem("user");
  const users = userString ? JSON.parse(userString) : null;
  // Kiểm tra quyền (Tùy thuộc backend của bạn trả về "role" hay "roles", hãy chỉnh cho đúng)
  const isAdmin =
    users?.role === "ADMIN" || localStorage.getItem("role") === "ADMIN";

  // Lấy chữ cái đầu tiên làm Avatar
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* LOGO */}
        <NavLink className="brand" to={token ? "/" : "/"}>
          <div className="brand-mark" style={{ background: "transparent" }}>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth={2}
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
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
            </svg>
          </div>
          <div className="brand-text">
            <strong>Car Pulse</strong>
            <span>Analytics Platform</span>
          </div>
        </NavLink>

        {/* MENU */}
        <nav className="nav-links">
          <NavLink className={navClass} to="/">
            Trang chủ
          </NavLink>

          <NavLink className={navClass} to="/cars">
            Danh sách xe
          </NavLink>

          <NavLink className={navClass} to="/segments">
            Phân khúc xe
          </NavLink>

          {/* THÊM DÒNG NÀY */}
          <NavLink to="/forecast" className={navClass}>
            Dự báo & Thảo luận
          </NavLink>

          {/* ADMIN LINKS */}
          {token && isAdmin && (
            <>
              <NavLink className={navClass} to="/association-rules">
                Báo cáo xu hướng
              </NavLink>
              <NavLink className={navClass} to="/admin/dashboard">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "6px", marginBottom: "-4px" }}
                >
                  <path d="M12 9v1.258" />
                  <path d="M16 3v5.46" />
                  <path d="M21 9.118V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5.75" />
                  <path d="M22 17.5c0 2.499-1.75 3.749-3.83 4.474a.5.5 0 0 1-.335-.005c-2.085-.72-3.835-1.97-3.835-4.47V14a.5.5 0 0 1 .5-.499c1 0 2.25-.6 3.12-1.36a.6.6 0 0 1 .76-.001c.875.765 2.12 1.36 3.12 1.36a.5.5 0 0 1 .5.5z" />
                  <path d="M3 15h7" />
                  <path d="M3 9h12.142" />
                  <path d="M8 15v6" />
                  <path d="M8 3v6" />
                </svg>
                Admin
              </NavLink>
            </>
          )}
        </nav>

        {/* PROFILE DROPDOWN */}
        <div className="nav-actions">
          {token ? (
            <div className="profile-dropdown-container" ref={dropdownRef}>
              <button
                className={`profile-trigger ${isProfileOpen ? "active" : ""}`}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <span className="profile-trigger-name">{displayName}</span>
                <div className="premium-avatar">{initial}</div>
                <svg
                  className="chevron-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {/* Bảng menu thả xuống */}
              <div className={`profile-menu ${isProfileOpen ? "open" : ""}`}>
                <div className="profile-menu-header">
                  <span className="profile-name" title={displayName}>
                    {displayName}
                  </span>
                  <span className={`profile-role ${isAdmin ? "admin" : ""}`}>
                    {isAdmin ? "Quản trị viên" : "Thành viên"}
                  </span>
                </div>

                <div className="profile-menu-divider"></div>

                <NavLink
                  to="/profile"
                  className="profile-menu-item"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Tài khoản của tôi
                </NavLink>

                <div className="profile-menu-divider"></div>

                <button
                  className="profile-menu-item logout"
                  onClick={handleLogout}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            // <div className="premium-auth-group">
            //   <NavLink
            //     className="btn-ghost"
            //     to="/login"
            //     style={{ fontWeight: 600 }}
            //   >
            //     Đăng nhập
            //   </NavLink>
            //   <NavLink className="btn btn-primary" to="/register">
            //     Bắt đầu
            //   </NavLink>
            // </div>
            <div className="premium-auth-group">
              <NavLink className="btn btn-ghost" to="/login">
                Đăng nhập
              </NavLink>
              <NavLink className="btn btn-primary" to="/register">
                Bắt đầu
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function App() {
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem("token"));

  let userRole = null;
  try {
    const userString = localStorage.getItem("user");
    if (userString) {
      const currentUser = JSON.parse(userString);
      userRole = currentUser.role;
    }
  } catch (error) {
    console.error("Lỗi đọc thông tin user:", error);
  }

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setToken(null);
  };

  return (
    <div className="app-shell">
      <Navbar token={token} onLogout={handleLogout} />

      <main className="app-main">
        <div className="page-transition" key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/register"
              element={!token ? <RegisterPage /> : <Navigate to="/cars" />}
            />
            <Route
              path="/login"
              element={!token ? <LoginPage /> : <Navigate to="/" />}
            />
            <Route path="/cars" element={<CarListPage />} />
            <Route path="/cars/:id" element={<CarDetailPage />} />
            <Route path="/segments" element={<SegmentsPage />} />
            <Route path="/forecast" element={<MarketForecastPage />} />
            <Route
              path="/profile"
              element={token ? <UserProfilePage /> : <Navigate to="/login" />}
            />
            <Route path="/ai-chat" element={<AIChat />} />

            {/* ROUTE ADMIN */}
            <Route
              path="/association-rules"
              element={
                userRole === "ADMIN" ? (
                  <AssociationRulesPage />
                ) : (
                  <Navigate to="/cars" replace />
                )
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                userRole === "ADMIN" ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/cars" replace />
                )
              }
            />

            <Route
              path="/admin/cars"
              element={
                userRole === "ADMIN" ? (
                  <AdminCars />
                ) : (
                  <Navigate to="/cars" replace />
                )
              }
            />

            <Route
              path="/admin/users"
              element={
                userRole === "ADMIN" ? (
                  <AdminUsers />
                ) : (
                  <Navigate to="/cars" replace />
                )
              }
            />

            <Route
              path="/admin/analytics"
              element={
                userRole === "ADMIN" ? (
                  <AdminAnalytics />
                ) : (
                  <Navigate to="/cars" replace />
                )
              }
            />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
